from typing import List, Optional, Set, Tuple
from sqlalchemy import or_, and_, func
from sqlalchemy.orm import Session, joinedload

from app.models.timeline_event import TimelineEvent, EventEntity


class EventRepository:
    def __init__(self, db: Session):
        self.db = db

    def _apply_visibility(
        self,
        query,
        user_id: str,
        is_gm: bool,
        accessible_ids: Set[str],
        visibility_filter: Optional[str] = None,
    ):
        """
        Regra de Visibilidade Colaborativa:
        - Mestre (is_gm=True): Visualiza todos os eventos (públicos, privados do mestre, restritos e notas de jogadores).
        - Jogador (is_gm=False): Visualiza apenas eventos públicos, eventos com permissão explícita (restricted)
          e os próprios registros criados por ele (created_by_id == user_id).
        """
        if not is_gm:
            conditions = [
                TimelineEvent.visibility == "public",
                TimelineEvent.created_by_id == user_id,
            ]
            if accessible_ids:
                conditions.append(
                    and_(
                        TimelineEvent.visibility == "restricted",
                        TimelineEvent.id.in_(accessible_ids),
                    )
                )
            query = query.filter(or_(*conditions))

        if visibility_filter:
            query = query.filter(TimelineEvent.visibility == visibility_filter)
        return query

    def get_by_id(self, event_id: str) -> Optional[TimelineEvent]:
        return (
            self.db.query(TimelineEvent)
            .options(
                joinedload(TimelineEvent.created_by),
                joinedload(TimelineEvent.session),
                joinedload(TimelineEvent.entity_links).joinedload(EventEntity.entity),
            )
            .filter(TimelineEvent.id == event_id)
            .first()
        )

    def list_for_campaign(
        self,
        campaign_id: str,
        user_id: str,
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
                joinedload(TimelineEvent.created_by),
                joinedload(TimelineEvent.session),
                joinedload(TimelineEvent.entity_links).joinedload(EventEntity.entity),
            )
            .filter(TimelineEvent.campaign_id == campaign_id)
        )
        base_query = self._apply_visibility(base_query, user_id, is_gm, accessible_ids, visibility)

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

        effective_year = func.coalesce(TimelineEvent.year, TimelineEvent.narrative_year)
        if year_from is not None:
            base_query = base_query.filter(effective_year >= year_from)
        if year_to is not None:
            base_query = base_query.filter(effective_year <= year_to)

        # Eventos datados vs sem data definida
        dated_query = base_query.filter(TimelineEvent.date_is_unknown.is_(False))
        undated_query = base_query.filter(TimelineEvent.date_is_unknown.is_(True))

        total_dated = dated_query.count()
        total_undated = undated_query.count()
        total = total_dated + total_undated

        # Ordenação Cronológica Determinística Multinível com tratamento de Nulos:
        # year ASC, month ASC NULLS FIRST, day ASC NULLS FIRST, sort_order ASC
        if order == "desc":
            dated_query = dated_query.order_by(
                TimelineEvent.year.desc().nullslast(),
                TimelineEvent.month.desc().nullslast(),
                TimelineEvent.day.desc().nullslast(),
                TimelineEvent.sort_order.desc(),
                TimelineEvent.created_at.desc(),
            )
            undated_query = undated_query.order_by(TimelineEvent.created_at.desc())
        else:
            dated_query = dated_query.order_by(
                TimelineEvent.year.asc().nullsfirst(),
                TimelineEvent.month.asc().nullsfirst(),
                TimelineEvent.day.asc().nullsfirst(),
                TimelineEvent.sort_order.asc(),
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
