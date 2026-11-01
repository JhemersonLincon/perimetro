from typing import List, Optional, Set, Tuple
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session, joinedload

from app.models.timeline_event import TimelineEvent, EventEntity


class EventRepository:
    def __init__(self, db: Session):
        self.db = db

    def _apply_visibility(self, query, is_gm: bool, accessible_ids: Set[str], visibility_filter: Optional[str] = None):
        if not is_gm:
            if accessible_ids:
                query = query.filter(
                    or_(
                        TimelineEvent.visibility == "public",
                        and_(TimelineEvent.visibility == "restricted", TimelineEvent.id.in_(accessible_ids)),
                    )
                )
            else:
                query = query.filter(TimelineEvent.visibility == "public")

        if visibility_filter:
            query = query.filter(TimelineEvent.visibility == visibility_filter)
        return query

    def get_by_id(self, event_id: str) -> Optional[TimelineEvent]:
        return (
            self.db.query(TimelineEvent)
            .options(
                joinedload(TimelineEvent.session),
                joinedload(TimelineEvent.entity_links).joinedload(EventEntity.entity),
            )
            .filter(TimelineEvent.id == event_id)
            .first()
        )

    def list_for_campaign(
        self,
        campaign_id: str,
        is_gm: bool,
        accessible_ids: Set[str],
        search: Optional[str] = None,
        category: Optional[str] = None,
        session_id: Optional[str] = None,
        entity_ids: Optional[List[str]] = None,
        visibility: Optional[str] = None,
        year_from: Optional[int] = None,
        year_to: Optional[int] = None,
        order: str = "asc",
        page: int = 1,
        page_size: int = 100,
    ) -> Tuple[List[TimelineEvent], List[TimelineEvent], int]:
        base_query = (
            self.db.query(TimelineEvent)
            .options(
                joinedload(TimelineEvent.session),
                joinedload(TimelineEvent.entity_links).joinedload(EventEntity.entity),
            )
            .filter(TimelineEvent.campaign_id == campaign_id)
        )
        base_query = self._apply_visibility(base_query, is_gm, accessible_ids, visibility)

        if search:
            term = f"%{search.strip()}%"
            base_query = base_query.filter(
                or_(
                    TimelineEvent.title.ilike(term),
                    TimelineEvent.description.ilike(term),
                    TimelineEvent.narrative_date.ilike(term),
                )
            )
        if category:
            base_query = base_query.filter(TimelineEvent.category == category)
        if session_id:
            if session_id == "none":
                base_query = base_query.filter(TimelineEvent.session_id.is_(None))
            else:
                base_query = base_query.filter(TimelineEvent.session_id == session_id)

        if entity_ids:
            for eid in entity_ids:
                if eid:
                    sub = (
                        self.db.query(EventEntity.event_id)
                        .filter(EventEntity.entity_id == eid)
                        .scalar_subquery()
                    )
                    base_query = base_query.filter(TimelineEvent.id.in_(sub))

        if year_from is not None:
            base_query = base_query.filter(TimelineEvent.narrative_year >= year_from)
        if year_to is not None:
            base_query = base_query.filter(TimelineEvent.narrative_year <= year_to)

        # Dated events vs undated events (Section 8.7)
        dated_query = base_query.filter(TimelineEvent.date_is_unknown.is_(False))
        undated_query = base_query.filter(TimelineEvent.date_is_unknown.is_(True))

        total_dated = dated_query.count()
        total_undated = undated_query.count()
        total = total_dated + total_undated

        if order == "desc":
            dated_query = dated_query.order_by(
                TimelineEvent.sort_key.desc().nullslast(),
                TimelineEvent.created_at.desc(),
            )
            undated_query = undated_query.order_by(TimelineEvent.created_at.desc())
        else:
            dated_query = dated_query.order_by(
                TimelineEvent.sort_key.asc().nullslast(),
                TimelineEvent.created_at.asc(),
            )
            undated_query = undated_query.order_by(TimelineEvent.created_at.asc())

        dated_items = (
            dated_query.offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        undated_items = undated_query.all()
        return dated_items, undated_items, total

    def set_event_entities(self, event_id: str, entity_ids: List[str]) -> None:
        self.db.query(EventEntity).filter(EventEntity.event_id == event_id).delete(synchronize_session=False)
        unique_ids = list(dict.fromkeys([eid for eid in entity_ids if eid]))
        for eid in unique_ids:
            self.db.add(EventEntity(event_id=event_id, entity_id=eid))
        self.db.commit()

    def create(self, event: TimelineEvent) -> TimelineEvent:
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def update(self, event: TimelineEvent) -> TimelineEvent:
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def delete(self, event: TimelineEvent) -> None:
        self.db.delete(event)
        self.db.commit()
