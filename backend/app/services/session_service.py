import math
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from app.database.base import utc_now
from app.models.campaign import Campaign, CampaignMember
from app.models.session import GameSession
from app.models.timeline_event import TimelineEvent
from app.repositories.campaign_repo import CampaignRepository
from app.repositories.permission_repo import PermissionRepository
from app.repositories.session_repo import SessionRepository
from app.schemas.session import (
    PaginatedSessionsResponse,
    SessionCreate,
    SessionDetailResponse,
    SessionResponse,
    SessionUpdate,
)


class SessionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SessionRepository(db)
        self.perm_repo = PermissionRepository(db)
        self.camp_repo = CampaignRepository(db)

    def _validate_allowed_users(self, campaign_id: str, user_ids: List[str]) -> List[str]:
        if not user_ids:
            return []
        valid_members = {m.user_id for m in self.camp_repo.list_members(campaign_id)}
        invalid = [uid for uid in user_ids if uid not in valid_members]
        if invalid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Um ou mais usuários autorizados não pertencem a esta campanha.",
            )
        return list(dict.fromkeys(user_ids))

    def _can_user_view_session(self, game_session: GameSession, user_id: str, is_gm: bool) -> bool:
        if is_gm:
            return True
        if game_session.visibility == "public":
            return True
        if game_session.visibility == "private":
            return False
        allowed = self.perm_repo.get_allowed_user_ids("session", game_session.id)
        return user_id in allowed

    def _sync_session_events(self, campaign_id: str, session_id: str, event_ids: List[str]) -> None:
        unique_ids = list(dict.fromkeys([eid for eid in event_ids if eid]))
        if unique_ids:
            events = (
                self.db.query(TimelineEvent)
                .filter(
                    TimelineEvent.campaign_id == campaign_id,
                    TimelineEvent.id.in_(unique_ids),
                )
                .all()
            )
            if len(events) != len(unique_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Violação de integridade: um ou mais acontecimentos informados não pertencem a esta campanha.",
                )

        # Desvincula acontecimentos anteriormente ligados a esta sessão que não estão mais na lista
        self.db.query(TimelineEvent).filter(
            TimelineEvent.campaign_id == campaign_id,
            TimelineEvent.session_id == session_id,
        ).update({TimelineEvent.session_id: None}, synchronize_session=False)

        if unique_ids:
            self.db.query(TimelineEvent).filter(
                TimelineEvent.campaign_id == campaign_id,
                TimelineEvent.id.in_(unique_ids),
            ).update({TimelineEvent.session_id: session_id}, synchronize_session=False)
        self.db.commit()

    def _to_response(self, game_session: GameSession, user_id: str, is_gm: bool) -> SessionResponse:
        allowed_ids = (
            self.perm_repo.get_allowed_user_ids("session", game_session.id)
            if is_gm
            else []
        )
        evt_query = self.db.query(TimelineEvent).filter(
            TimelineEvent.session_id == game_session.id
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

        return SessionResponse(
            id=game_session.id,
            campaign_id=game_session.campaign_id,
            session_number=game_session.session_number,
            title=game_session.title,
            real_date=game_session.real_date,
            summary=game_session.summary,
            status=game_session.status,
            notes=game_session.notes if is_gm else (game_session.notes if game_session.visibility == "public" else None),
            visibility=game_session.visibility,
            allowed_user_ids=allowed_ids,
            events_count=events_count,
            created_at=game_session.created_at,
            updated_at=game_session.updated_at,
        )

    def list_sessions(
        self,
        campaign: Campaign,
        member: CampaignMember,
        status_filter: Optional[str] = None,
        visibility: Optional[str] = None,
        order: str = "asc",
        page: int = 1,
        page_size: int = 50,
    ) -> PaginatedSessionsResponse:
        is_gm = member.role == "gm" or campaign.owner_id == member.user_id
        acc_sessions = (
            set()
            if is_gm
            else self.perm_repo.get_accessible_record_ids_for_user("session", member.user_id)
        )
        items, total = self.repo.list_for_campaign(
            campaign_id=campaign.id,
            is_gm=is_gm,
            accessible_ids=acc_sessions,
            status=status_filter,
            visibility=visibility,
            order=order,
            page=page,
            page_size=page_size,
        )
        total_pages = max(1, math.ceil(total / page_size)) if page_size > 0 else 1
        return PaginatedSessionsResponse(
            items=[self._to_response(s, member.user_id, is_gm) for s in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def create_session(
        self,
        campaign: Campaign,
        member: CampaignMember,
        data: SessionCreate,
    ) -> SessionDetailResponse:
        existing = self.repo.get_by_number(campaign.id, data.session_number)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Já existe uma sessão de número {data.session_number} cadastrada nesta campanha.",
            )
        valid_users = self._validate_allowed_users(campaign.id, data.allowed_user_ids)

        game_session = GameSession(
            campaign_id=campaign.id,
            session_number=data.session_number,
            title=data.title.strip(),
            real_date=data.real_date,
            summary=data.summary.strip(),
            status=data.status,
            notes=data.notes.strip() if data.notes else None,
            visibility=data.visibility,
        )
        game_session = self.repo.create(game_session)

        if data.event_ids:
            self._sync_session_events(campaign.id, game_session.id, data.event_ids)
        if data.visibility == "restricted":
            self.perm_repo.set_permissions("session", game_session.id, valid_users)

        campaign.updated_at = utc_now()
        self.camp_repo.update(campaign)
        return self.get_session_detail(game_session.id, member.user_id)

    def get_session_detail(self, session_id: str, user_id: str) -> SessionDetailResponse:
        game_session = self.repo.get_by_id(session_id)
        if not game_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sessão não encontrada.",
            )
        campaign = self.camp_repo.get_by_id(game_session.campaign_id)
        member = self.camp_repo.get_member(game_session.campaign_id, user_id)
        if not campaign or not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: você não participa desta campanha.",
            )
        is_gm = member.role == "gm" or campaign.owner_id == user_id
        if not self._can_user_view_session(game_session, user_id, is_gm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para visualizar esta sessão.",
            )

        evt_query = self.db.query(TimelineEvent).filter(
            TimelineEvent.session_id == game_session.id
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

        events_data = [
            {
                "id": e.id,
                "title": e.title,
                "description": e.description,
                "category": e.category,
                "narrative_date": e.narrative_date,
                "narrative_time": e.narrative_time,
                "date_is_unknown": e.date_is_unknown,
                "visibility": e.visibility,
            }
            for e in events
        ]

        base_resp = self._to_response(game_session, user_id, is_gm)
        return SessionDetailResponse(
            **base_resp.model_dump(),
            events=events_data,
        )

    def update_session(
        self,
        session_id: str,
        user_id: str,
        data: SessionUpdate,
    ) -> SessionDetailResponse:
        game_session = self.repo.get_by_id(session_id)
        if not game_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sessão não encontrada.",
            )
        campaign = self.camp_repo.get_by_id(game_session.campaign_id)
        member = self.camp_repo.get_member(game_session.campaign_id, user_id)
        if not campaign or not member or (member.role != "gm" and campaign.owner_id != user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o Mestre da campanha pode editar sessões.",
            )

        if data.session_number is not None and data.session_number != game_session.session_number:
            dup = self.repo.get_by_number(campaign.id, data.session_number)
            if dup and dup.id != game_session.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Já existe uma sessão de número {data.session_number} cadastrada nesta campanha.",
                )
            game_session.session_number = data.session_number

        if data.title is not None:
            game_session.title = data.title.strip()
        if "real_date" in data.model_fields_set:
            game_session.real_date = data.real_date
        if data.summary is not None:
            game_session.summary = data.summary.strip()
        if data.status is not None:
            game_session.status = data.status
        if "notes" in data.model_fields_set:
            game_session.notes = data.notes.strip() if data.notes else None
        if data.visibility is not None:
            game_session.visibility = data.visibility

        if data.event_ids is not None:
            self._sync_session_events(campaign.id, game_session.id, data.event_ids)

        if data.allowed_user_ids is not None or data.visibility is not None:
            if game_session.visibility == "restricted":
                users_to_set = (
                    self._validate_allowed_users(campaign.id, data.allowed_user_ids)
                    if data.allowed_user_ids is not None
                    else self.perm_repo.get_allowed_user_ids("session", game_session.id)
                )
                self.perm_repo.set_permissions("session", game_session.id, users_to_set)
            else:
                self.perm_repo.delete_for_record("session", game_session.id)

        game_session.updated_at = utc_now()
        self.repo.update(game_session)
        campaign.updated_at = utc_now()
        self.camp_repo.update(campaign)
        return self.get_session_detail(game_session.id, user_id)

    def link_event_to_session(self, session_id: str, event_id: str, user_id: str) -> SessionDetailResponse:
        game_session = self.repo.get_by_id(session_id)
        if not game_session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")
        campaign = self.camp_repo.get_by_id(game_session.campaign_id)
        member = self.camp_repo.get_member(game_session.campaign_id, user_id)
        if not campaign or not member or (member.role != "gm" and campaign.owner_id != user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o Mestre pode associar acontecimentos a uma sessão.",
            )
        event = self.db.query(TimelineEvent).filter(TimelineEvent.id == event_id).first()
        if not event or event.campaign_id != campaign.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O acontecimento informado não existe ou pertence a outra campanha.",
            )
        event.session_id = game_session.id
        event.updated_at = utc_now()
        self.db.add(event)
        self.db.commit()
        return self.get_session_detail(game_session.id, user_id)

    def unlink_event_from_session(self, session_id: str, event_id: str, user_id: str) -> SessionDetailResponse:
        game_session = self.repo.get_by_id(session_id)
        if not game_session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")
        campaign = self.camp_repo.get_by_id(game_session.campaign_id)
        member = self.camp_repo.get_member(game_session.campaign_id, user_id)
        if not campaign or not member or (member.role != "gm" and campaign.owner_id != user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o Mestre pode desassociar acontecimentos de uma sessão.",
            )
        event = (
            self.db.query(TimelineEvent)
            .filter(
                TimelineEvent.id == event_id,
                TimelineEvent.session_id == game_session.id,
            )
            .first()
        )
        if event:
            event.session_id = None
            event.updated_at = utc_now()
            self.db.add(event)
            self.db.commit()
        return self.get_session_detail(game_session.id, user_id)

    def delete_session(self, session_id: str, user_id: str) -> None:
        game_session = self.repo.get_by_id(session_id)
        if not game_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sessão não encontrada.",
            )
        campaign = self.camp_repo.get_by_id(game_session.campaign_id)
        member = self.camp_repo.get_member(game_session.campaign_id, user_id)
        if not campaign or not member or (member.role != "gm" and campaign.owner_id != user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o Mestre da campanha pode excluir sessões.",
            )
        # Limpa referências session_id dos eventos antes de excluir
        self.db.query(TimelineEvent).filter(
            TimelineEvent.session_id == game_session.id
        ).update({TimelineEvent.session_id: None}, synchronize_session=False)
        self.perm_repo.delete_for_record("session", game_session.id)
        self.repo.delete(game_session)
        campaign.updated_at = utc_now()
        self.camp_repo.update(campaign)
