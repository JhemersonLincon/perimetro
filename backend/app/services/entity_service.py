import math
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from app.database.base import utc_now
from app.models.campaign import Campaign, CampaignMember
from app.models.entity import Entity
from app.models.session import GameSession
from app.models.timeline_event import EventEntity, TimelineEvent
from app.repositories.campaign_repo import CampaignRepository
from app.repositories.entity_repo import EntityRepository
from app.repositories.permission_repo import PermissionRepository
from app.schemas.entity import (
    EntityCreate,
    EntityDetailResponse,
    EntityResponse,
    EntityUpdate,
    PaginatedEntitiesResponse,
)


class EntityService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = EntityRepository(db)
        self.perm_repo = PermissionRepository(db)
        self.camp_repo = CampaignRepository(db)

    def _validate_allowed_users(self, campaign_id: str, user_ids: List[str]) -> List[str]:
        if not user_ids:
            return []
        valid_members = {
            m.user_id for m in self.camp_repo.list_members(campaign_id)
        }
        invalid = [uid for uid in user_ids if uid not in valid_members]
        if invalid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Um ou mais usuários autorizados não pertencem a esta campanha.",
            )
        return list(dict.fromkeys(user_ids))

    def _can_user_view_entity(self, entity: Entity, user_id: str, is_gm: bool) -> bool:
        if is_gm:
            return True
        if entity.visibility == "public":
            return True
        if entity.visibility == "private":
            return False
        allowed = self.perm_repo.get_allowed_user_ids("entity", entity.id)
        return user_id in allowed

    def _to_response(self, entity: Entity, user_id: str, is_gm: bool) -> EntityResponse:
        allowed_ids = (
            self.perm_repo.get_allowed_user_ids("entity", entity.id)
            if is_gm
            else []
        )
        evt_query = (
            self.db.query(TimelineEvent)
            .join(EventEntity, EventEntity.event_id == TimelineEvent.id)
            .filter(EventEntity.entity_id == entity.id)
        )
        if not is_gm:
            acc_evt = self.perm_repo.get_accessible_record_ids_for_user("event", user_id)
            evt_query = evt_query.filter(
                or_(
                    TimelineEvent.visibility == "public",
                    and_(TimelineEvent.visibility == "restricted", TimelineEvent.id.in_(acc_evt)),
                )
            )
        events_count = evt_query.count()

        return EntityResponse(
            id=entity.id,
            campaign_id=entity.campaign_id,
            name=entity.name,
            category=entity.category,
            description=entity.description,
            extra_info=entity.extra_info,
            image_url=entity.image_url,
            status=entity.status,
            visibility=entity.visibility,
            allowed_user_ids=allowed_ids,
            events_count=events_count,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )

    def list_entities(
        self,
        campaign: Campaign,
        member: CampaignMember,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status_filter: Optional[str] = None,
        visibility: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> PaginatedEntitiesResponse:
        is_gm = member.role == "gm" or campaign.owner_id == member.user_id
        accessible_ids = (
            set()
            if is_gm
            else self.perm_repo.get_accessible_record_ids_for_user("entity", member.user_id)
        )
        items, total = self.repo.list_for_campaign(
            campaign_id=campaign.id,
            is_gm=is_gm,
            accessible_ids=accessible_ids,
            search=search,
            category=category,
            status=status_filter,
            visibility=visibility,
            page=page,
            page_size=page_size,
        )
        total_pages = max(1, math.ceil(total / page_size)) if page_size > 0 else 1
        return PaginatedEntitiesResponse(
            items=[self._to_response(e, member.user_id, is_gm) for e in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def create_entity(
        self,
        campaign: Campaign,
        member: CampaignMember,
        data: EntityCreate,
    ) -> EntityResponse:
        valid_users = self._validate_allowed_users(campaign.id, data.allowed_user_ids)
        entity = Entity(
            campaign_id=campaign.id,
            name=data.name.strip(),
            category=data.category,
            description=data.description.strip(),
            extra_info=data.extra_info.strip() if data.extra_info else None,
            image_url=data.image_url.strip() if data.image_url else None,
            status=data.status.strip(),
            visibility=data.visibility,
        )
        entity = self.repo.create(entity)
        if data.visibility == "restricted":
            self.perm_repo.set_permissions("entity", entity.id, valid_users)

        campaign.updated_at = utc_now()
        self.camp_repo.update(campaign)
        return self._to_response(entity, member.user_id, True)

    def get_entity_detail(
        self,
        entity_id: str,
        user_id: str,
    ) -> EntityDetailResponse:
        entity = self.repo.get_by_id(entity_id)
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entidade não encontrada.",
            )
        campaign = self.camp_repo.get_by_id(entity.campaign_id)
        member = self.camp_repo.get_member(entity.campaign_id, user_id)
        if not campaign or not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: você não participa desta campanha.",
            )
        is_gm = member.role == "gm" or campaign.owner_id == user_id
        if not self._can_user_view_entity(entity, user_id, is_gm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para visualizar esta entidade.",
            )

        evt_query = (
            self.db.query(TimelineEvent)
            .join(EventEntity, EventEntity.event_id == TimelineEvent.id)
            .filter(EventEntity.entity_id == entity.id)
        )
        if not is_gm:
            acc_evt = self.perm_repo.get_accessible_record_ids_for_user("event", user_id)
            evt_query = evt_query.filter(
                or_(
                    TimelineEvent.visibility == "public",
                    and_(TimelineEvent.visibility == "restricted", TimelineEvent.id.in_(acc_evt)),
                )
            )
        events = evt_query.order_by(
            TimelineEvent.sort_key.asc().nullslast(),
            TimelineEvent.created_at.asc(),
        ).all()

        related_events = [
            {
                "id": e.id,
                "title": e.title,
                "description": e.description,
                "category": e.category,
                "narrative_date": e.narrative_date,
                "narrative_time": e.narrative_time,
                "date_is_unknown": e.date_is_unknown,
                "visibility": e.visibility,
                "session_id": e.session_id,
            }
            for e in events
        ]

        # Sessões relacionadas aos acontecimentos dessa entidade (respeitando visibilidade da sessão)
        session_ids = list({e.session_id for e in events if e.session_id})
        related_sessions = []
        if session_ids:
            sess_query = self.db.query(GameSession).filter(GameSession.id.in_(session_ids))
            if not is_gm:
                acc_sess = self.perm_repo.get_accessible_record_ids_for_user("session", user_id)
                sess_query = sess_query.filter(
                    or_(
                        GameSession.visibility == "public",
                        and_(GameSession.visibility == "restricted", GameSession.id.in_(acc_sess)),
                    )
                )
            sessions = sess_query.order_by(GameSession.session_number.asc()).all()
            related_sessions = [
                {
                    "id": s.id,
                    "session_number": s.session_number,
                    "title": s.title,
                    "real_date": s.real_date,
                    "status": s.status,
                }
                for s in sessions
            ]

        base_resp = self._to_response(entity, user_id, is_gm)
        return EntityDetailResponse(
            **base_resp.model_dump(),
            related_events=related_events,
            related_sessions=related_sessions,
        )

    def update_entity(
        self,
        entity_id: str,
        user_id: str,
        data: EntityUpdate,
    ) -> EntityResponse:
        entity = self.repo.get_by_id(entity_id)
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entidade não encontrada.",
            )
        campaign = self.camp_repo.get_by_id(entity.campaign_id)
        member = self.camp_repo.get_member(entity.campaign_id, user_id)
        if not campaign or not member or (member.role != "gm" and campaign.owner_id != user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o Mestre da campanha pode editar entidades.",
            )

        if data.name is not None:
            entity.name = data.name.strip()
        if data.category is not None:
            entity.category = data.category
        if data.description is not None:
            entity.description = data.description.strip()
        if data.extra_info is not None:
            entity.extra_info = data.extra_info.strip() or None
        if data.image_url is not None:
            entity.image_url = data.image_url.strip() or None
        if data.status is not None:
            entity.status = data.status.strip()
        if data.visibility is not None:
            entity.visibility = data.visibility

        if data.allowed_user_ids is not None or data.visibility is not None:
            if entity.visibility == "restricted":
                users_to_set = (
                    self._validate_allowed_users(campaign.id, data.allowed_user_ids)
                    if data.allowed_user_ids is not None
                    else self.perm_repo.get_allowed_user_ids("entity", entity.id)
                )
                self.perm_repo.set_permissions("entity", entity.id, users_to_set)
            else:
                self.perm_repo.delete_for_record("entity", entity.id)

        entity.updated_at = utc_now()
        entity = self.repo.update(entity)
        campaign.updated_at = utc_now()
        self.camp_repo.update(campaign)
        return self._to_response(entity, user_id, True)

    def delete_entity(self, entity_id: str, user_id: str) -> None:
        entity = self.repo.get_by_id(entity_id)
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entidade não encontrada.",
            )
        campaign = self.camp_repo.get_by_id(entity.campaign_id)
        member = self.camp_repo.get_member(entity.campaign_id, user_id)
        if not campaign or not member or (member.role != "gm" and campaign.owner_id != user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o Mestre da campanha pode excluir entidades.",
            )
        self.perm_repo.delete_for_record("entity", entity.id)
        self.repo.delete(entity)
        campaign.updated_at = utc_now()
        self.camp_repo.update(campaign)
