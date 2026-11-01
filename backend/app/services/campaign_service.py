from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from app.core.security import generate_invitation_token, hash_token
from app.database.base import utc_now
from app.models.campaign import (
    Campaign,
    CampaignInvitation,
    CampaignMember,
    default_calendar_config,
)
from app.models.entity import Entity
from app.models.session import GameSession
from app.models.timeline_event import TimelineEvent
from app.models.user import User
from app.repositories.campaign_repo import CampaignRepository
from app.repositories.permission_repo import PermissionRepository
from app.schemas.campaign import (
    CampaignCreate,
    CampaignDashboardResponse,
    CampaignMemberResponse,
    CampaignResponse,
    CampaignUpdate,
    DashboardIndicators,
    InvitationCreate,
    InvitationResponse,
)
from app.services.calendar_utils import compute_narrative_sort_and_display


class CampaignService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CampaignRepository(db)
        self.perm_repo = PermissionRepository(db)

    def _normalize_calendar_config(self, config_schema) -> dict:
        base = default_calendar_config()
        if not config_schema:
            return base
        data = config_schema.model_dump() if hasattr(config_schema, "model_dump") else dict(config_schema)
        cal_type = data.get("type", "gregorian")
        era_name = data.get("era_name") or ("Era" if cal_type == "fictional" else "d.C.")
        months = data.get("months") or []
        if not months:
            months = base["months"]
        return {
            "type": cal_type,
            "era_name": era_name,
            "months": months,
        }

    def _build_campaign_response(
        self,
        campaign: Campaign,
        user_id: str,
        role: str,
    ) -> CampaignResponse:
        is_gm = role == "gm" or campaign.owner_id == user_id
        ent_query = self.db.query(Entity).filter(Entity.campaign_id == campaign.id)
        sess_query = self.db.query(GameSession).filter(GameSession.campaign_id == campaign.id)
        evt_query = self.db.query(TimelineEvent).filter(TimelineEvent.campaign_id == campaign.id)

        if not is_gm:
            acc_ent = self.perm_repo.get_accessible_record_ids_for_user("entity", user_id)
            acc_sess = self.perm_repo.get_accessible_record_ids_for_user("session", user_id)
            acc_evt = self.perm_repo.get_accessible_record_ids_for_user("event", user_id)

            ent_query = ent_query.filter(
                or_(
                    Entity.visibility == "public",
                    and_(Entity.visibility == "restricted", Entity.id.in_(acc_ent)),
                )
            )
            sess_query = sess_query.filter(
                or_(
                    GameSession.visibility == "public",
                    and_(GameSession.visibility == "restricted", GameSession.id.in_(acc_sess)),
                )
            )
            evt_query = evt_query.filter(
                or_(
                    TimelineEvent.visibility == "public",
                    and_(TimelineEvent.visibility == "restricted", TimelineEvent.id.in_(acc_evt)),
                )
            )

        members_count = (
            self.db.query(CampaignMember)
            .filter(CampaignMember.campaign_id == campaign.id)
            .count()
        )

        return CampaignResponse(
            id=campaign.id,
            name=campaign.name,
            description=campaign.description,
            cover_url=campaign.cover_url,
            rpg_system=campaign.rpg_system,
            start_date=campaign.start_date,
            calendar_config=campaign.calendar_config or default_calendar_config(),
            status=campaign.status,
            owner_id=campaign.owner_id,
            created_at=campaign.created_at,
            updated_at=campaign.updated_at,
            user_role="gm" if is_gm else "player",
            entities_count=ent_query.count(),
            sessions_count=sess_query.count(),
            events_count=evt_query.count(),
            members_count=members_count,
        )

    def create_campaign(self, current_user: User, data: CampaignCreate) -> CampaignResponse:
        calendar_cfg = self._normalize_calendar_config(data.calendar_config)
        campaign = Campaign(
            name=data.name.strip(),
            description=data.description.strip(),
            cover_url=data.cover_url.strip() if data.cover_url else None,
            rpg_system=data.rpg_system.strip(),
            start_date=data.start_date,
            calendar_config=calendar_cfg,
            status=data.status,
            owner_id=current_user.id,
        )
        owner_member = CampaignMember(
            campaign_id=campaign.id,
            user_id=current_user.id,
            role="gm",
        )
        campaign = self.repo.create(campaign, owner_member)
        return self._build_campaign_response(campaign, current_user.id, "gm")

    def list_user_campaigns(
        self,
        current_user: User,
        status_filter: Optional[str] = None,
    ) -> List[CampaignResponse]:
        campaigns = self.repo.list_for_user(current_user.id, status=status_filter)
        results: List[CampaignResponse] = []
        for camp in campaigns:
            member = self.repo.get_member(camp.id, current_user.id)
            role = member.role if member else ("gm" if camp.owner_id == current_user.id else "player")
            results.append(self._build_campaign_response(camp, current_user.id, role))
        return results

    def get_campaign_detail(
        self,
        campaign: Campaign,
        member: CampaignMember,
    ) -> CampaignResponse:
        return self._build_campaign_response(campaign, member.user_id, member.role)

    def get_dashboard(
        self,
        campaign: Campaign,
        member: CampaignMember,
    ) -> CampaignDashboardResponse:
        is_gm = member.role == "gm" or campaign.owner_id == member.user_id
        user_id = member.user_id

        acc_ent = self.perm_repo.get_accessible_record_ids_for_user("entity", user_id)
        acc_sess = self.perm_repo.get_accessible_record_ids_for_user("session", user_id)
        acc_evt = self.perm_repo.get_accessible_record_ids_for_user("event", user_id)

        ent_base = self.db.query(Entity).filter(Entity.campaign_id == campaign.id)
        sess_base = self.db.query(GameSession).filter(GameSession.campaign_id == campaign.id)
        evt_base = self.db.query(TimelineEvent).filter(TimelineEvent.campaign_id == campaign.id)

        if not is_gm:
            ent_base = ent_base.filter(
                or_(
                    Entity.visibility == "public",
                    and_(Entity.visibility == "restricted", Entity.id.in_(acc_ent)),
                )
            )
            sess_base = sess_base.filter(
                or_(
                    GameSession.visibility == "public",
                    and_(GameSession.visibility == "restricted", GameSession.id.in_(acc_sess)),
                )
            )
            evt_base = evt_base.filter(
                or_(
                    TimelineEvent.visibility == "public",
                    and_(TimelineEvent.visibility == "restricted", TimelineEvent.id.in_(acc_evt)),
                )
            )

        characters_count = ent_base.filter(Entity.category == "character").count()
        npcs_count = ent_base.filter(Entity.category == "npc").count()
        locations_count = ent_base.filter(Entity.category == "location").count()
        organizations_count = ent_base.filter(Entity.category == "organization").count()
        events_count = evt_base.count()
        sessions_count = sess_base.count()
        members_count = (
            self.db.query(CampaignMember)
            .filter(CampaignMember.campaign_id == campaign.id)
            .count()
        )

        recent_events_rows = (
            evt_base.order_by(TimelineEvent.created_at.desc()).limit(6).all()
        )
        recent_sessions_rows = (
            sess_base.order_by(GameSession.session_number.desc()).limit(5).all()
        )

        recent_events = [
            {
                "id": e.id,
                "title": e.title,
                "category": e.category,
                "narrative_date": e.narrative_date,
                "date_is_unknown": e.date_is_unknown,
                "visibility": e.visibility,
                "created_at": e.created_at,
            }
            for e in recent_events_rows
        ]
        recent_sessions = [
            {
                "id": s.id,
                "session_number": s.session_number,
                "title": s.title,
                "real_date": s.real_date,
                "status": s.status,
                "visibility": s.visibility,
                "created_at": s.created_at,
            }
            for s in recent_sessions_rows
        ]

        camp_resp = self._build_campaign_response(campaign, user_id, member.role)
        indicators = DashboardIndicators(
            events_count=events_count,
            characters_and_npcs_count=characters_count + npcs_count,
            characters_count=characters_count,
            npcs_count=npcs_count,
            locations_count=locations_count,
            organizations_count=organizations_count,
            sessions_count=sessions_count,
            members_count=members_count,
        )
        return CampaignDashboardResponse(
            campaign=camp_resp,
            indicators=indicators,
            recent_events=recent_events,
            recent_sessions=recent_sessions,
        )

    def update_campaign(
        self,
        campaign: Campaign,
        member: CampaignMember,
        data: CampaignUpdate,
    ) -> CampaignResponse:
        if data.name is not None:
            campaign.name = data.name.strip()
        if data.description is not None:
            campaign.description = data.description.strip()
        if data.cover_url is not None:
            campaign.cover_url = data.cover_url.strip() or None
        if data.rpg_system is not None:
            campaign.rpg_system = data.rpg_system.strip()
        if data.start_date is not None:
            campaign.start_date = data.start_date
        if data.status is not None:
            campaign.status = data.status

        if data.calendar_config is not None:
            campaign.calendar_config = self._normalize_calendar_config(data.calendar_config)
            # Recalcula sort_key dos eventos da campanha para refletir o calendário atualizado
            events = (
                self.db.query(TimelineEvent)
                .filter(TimelineEvent.campaign_id == campaign.id)
                .all()
            )
            for evt in events:
                (
                    cal_type,
                    disp_date,
                    y,
                    m,
                    d,
                    t,
                    s_key,
                ) = compute_narrative_sort_and_display(
                    calendar_config=campaign.calendar_config,
                    date_is_unknown=evt.date_is_unknown,
                    calendar_type=campaign.calendar_config.get("type", "gregorian"),
                    narrative_date=None,
                    narrative_year=evt.narrative_year,
                    narrative_month=evt.narrative_month,
                    narrative_day=evt.narrative_day,
                    narrative_time=evt.narrative_time,
                )
                evt.calendar_type = cal_type
                evt.narrative_date = disp_date
                evt.sort_key = s_key

        campaign.updated_at = utc_now()
        campaign = self.repo.update(campaign)
        return self._build_campaign_response(campaign, member.user_id, member.role)

    def delete_campaign(self, campaign: Campaign) -> None:
        self.repo.delete(campaign)

    def list_members(self, campaign: Campaign) -> List[CampaignMemberResponse]:
        members = self.repo.list_members(campaign.id)
        return [CampaignMemberResponse.model_validate(m) for m in members]

    def remove_member(self, campaign: Campaign, target_user_id: str) -> None:
        if target_user_id == campaign.owner_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O proprietário (Mestre) da campanha não pode ser removido.",
            )
        member = self.repo.get_member(campaign.id, target_user_id)
        if not member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Participante não encontrado nesta campanha.",
            )
        self.repo.remove_member(member)

    def create_invitation(
        self,
        campaign: Campaign,
        data: InvitationCreate,
    ) -> InvitationResponse:
        raw_token, token_hash = generate_invitation_token()
        expires_at = utc_now() + timedelta(days=data.expires_in_days)
        email_clean = data.email.strip().lower() if data.email else None

        invitation = CampaignInvitation(
            campaign_id=campaign.id,
            email=email_clean,
            invitation_token_hash=token_hash,
            status="pending",
            expires_at=expires_at,
        )
        invitation = self.repo.create_invitation(invitation)
        campaign.updated_at = utc_now()
        self.repo.update(campaign)

        return InvitationResponse(
            id=invitation.id,
            campaign_id=invitation.campaign_id,
            campaign_name=campaign.name,
            email=invitation.email,
            status=invitation.status,
            expires_at=invitation.expires_at,
            created_at=invitation.created_at,
            token=raw_token,
        )

    def list_invitations(self, campaign: Campaign) -> List[InvitationResponse]:
        invitations = self.repo.list_invitations(campaign.id)
        return [
            InvitationResponse(
                id=inv.id,
                campaign_id=inv.campaign_id,
                campaign_name=campaign.name,
                email=inv.email,
                status=inv.status,
                expires_at=inv.expires_at,
                created_at=inv.created_at,
                token=None,
            )
            for inv in invitations
        ]

    def accept_invitation(self, current_user: User, raw_token: str) -> CampaignResponse:
        token_hash = hash_token(raw_token.strip())
        invitation = self.repo.get_invitation_by_hash(token_hash)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Convite não encontrado ou código inválido.",
            )
        if invitation.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Este convite já foi utilizado ou cancelado (status: {invitation.status}).",
            )
        now = utc_now()
        exp = invitation.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if now > exp:
            invitation.status = "expired"
            self.repo.update_invitation(invitation)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este convite expirou.",
            )

        if invitation.email and invitation.email.lower() != current_user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Este convite foi destinado especificamente a outro endereço de e-mail.",
            )

        existing_member = self.repo.get_member(invitation.campaign_id, current_user.id)
        if not existing_member:
            new_member = CampaignMember(
                campaign_id=invitation.campaign_id,
                user_id=current_user.id,
                role="player",
            )
            self.repo.add_member(new_member)
            role = "player"
        else:
            role = existing_member.role

        invitation.status = "accepted"
        self.repo.update_invitation(invitation)

        campaign = self.repo.get_by_id(invitation.campaign_id)
        return self._build_campaign_response(campaign, current_user.id, role)
