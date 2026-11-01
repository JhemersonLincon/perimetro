from typing import List, Optional, Set, Tuple
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from app.models.entity import Entity


class EntityRepository:
    def __init__(self, db: Session):
        self.db = db

    def _apply_visibility(self, query, is_gm: bool, accessible_ids: Set[str], visibility_filter: Optional[str] = None):
        if not is_gm:
            if accessible_ids:
                query = query.filter(
                    or_(
                        Entity.visibility == "public",
                        and_(Entity.visibility == "restricted", Entity.id.in_(accessible_ids)),
                    )
                )
            else:
                query = query.filter(Entity.visibility == "public")

        if visibility_filter:
            query = query.filter(Entity.visibility == visibility_filter)
        return query

    def get_by_id(self, entity_id: str) -> Optional[Entity]:
        return self.db.query(Entity).filter(Entity.id == entity_id).first()

    def get_by_ids_in_campaign(self, campaign_id: str, entity_ids: List[str]) -> List[Entity]:
        if not entity_ids:
            return []
        return (
            self.db.query(Entity)
            .filter(Entity.campaign_id == campaign_id, Entity.id.in_(entity_ids))
            .all()
        )

    def list_for_campaign(
        self,
        campaign_id: str,
        is_gm: bool,
        accessible_ids: Set[str],
        search: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        visibility: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[Entity], int]:
        query = self.db.query(Entity).filter(Entity.campaign_id == campaign_id)
        query = self._apply_visibility(query, is_gm, accessible_ids, visibility)

        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Entity.name.ilike(term),
                    Entity.description.ilike(term),
                )
            )
        if category:
            query = query.filter(Entity.category == category)
        if status:
            query = query.filter(Entity.status == status)

        total = query.count()
        items = (
            query.order_by(Entity.name.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def create(self, entity: Entity) -> Entity:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def update(self, entity: Entity) -> Entity:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def delete(self, entity: Entity) -> None:
        self.db.delete(entity)
        self.db.commit()
