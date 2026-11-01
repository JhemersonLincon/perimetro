import math
from typing import List, Optional, Set
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.database.base import utc_now
from app.models.campaign import Campaign, CampaignMember
from app.models.timeline_event import TimelineEvent
from app.repositories.campaign_repo import CampaignRepository
from app.repositories.entity_repo import EntityRepository
from app.repositories.event_repo import EventRepository
from app.repositories.permission_repo import PermissionRepository
from app.repositories.session_repo import SessionRepository
from app.schemas.entity import EntitySummary
from app.schemas.session import SessionSummary
from app.schemas.timeline_event import (
    EventCreate,
    EventResponse,
    EventUpdate,
    PaginatedEventsResponse,
)
from app.services.calendar_utils import compute_narrative_sort_and_display


class EventService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = EventRepository(db)
        self.ent_repo = EntityRepository(db)
        self.sess_repo = SessionRepository(db)
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

    def _validate_entities_belong_to_campaign(
        self,
        campaign_id: str,
        entity_ids: List[str],
    ) -> List[str]:
        unique_ids = list(dict.fromkeys([eid for eid in entity_ids if eid]))
        if not unique_ids:
            return []
        found = self.ent_repo.get_by_ids_in_campaign(campaign_id, unique_ids)
        if len(found) != len(unique_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Violação de integridade: uma ou mais entidades informadas não pertencem a esta campanha.",
            )
        return unique_ids

    def _validate_session_belongs_to_campaign(
        self,
        campaign_id: str,
        session_id: Optional[str],
    ) -> Optional[str]:
        if not session_id:
            return None
        sess = self.sess_repo.get_by_id(session_id)
        if not sess or sess.campaign_id != campaign_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Violação de integridade: a sessão informada não pertence a esta campanha.",
            )
        return sess.id

    def _can_user_view_event(self, event: TimelineEvent, user_id: str, is_gm: bool) -> bool:
        if is_gm:
            return True
        if event.visibility == "public":
            return True
        if event.visibility == "private":
            return False
        allowed = self.perm_repo.get_allowed_user_ids("event", event.id)
        return user_id in allowed

    def _to_response(
        self,
        event: TimelineEvent,
        user_id: str,
        is_gm: bool,
        acc_entities: Optional[Set[str]] = None,
        acc_sessions: Optional[Set[str]] = None,
    ) -> EventResponse:
        if acc_entities is None and not is_gm:
            acc_entities = self.perm_repo.get_accessible_record_ids_for_user("entity", user_id)
        if acc_sessions is None and not is_gm:
            acc_sessions = self.perm_repo.get_accessible_record_ids_for_user("session", user_id)

        entities_list: List[EntitySummary] = []
        for link in event.entity_links:
            ent = link.entity
            if not ent:
                continue
            if is_gm or ent.visibility == "public" or (
                ent.visibility == "restricted" and acc_entities and ent.id in acc_entities
            ):
                entities_list.append(EntitySummary.model_validate(ent))

        session_summary: Optional[SessionSummary] = None
        if event.session:
            s = event.session
            if is_gm or s.visibility == "public" or (
                s.visibility == "restricted" and acc_sessions and s.id in acc_sessions
            ):
                session_summary = SessionSummary.model_validate(s)

        allowed_ids = (
            self.perm_repo.get_allowed_user_ids("event", event.id) if is_gm else []
        )

        return EventResponse(
            id=event.id,
            campaign_id=event.campaign_id,
            title=event.title,
            description=event.description,
            calendar_type=event.calendar_type,
            narrative_date=event.narrative_date,
            narrative_year=event.narrative_year,
            narrative_month=event.narrative_month,
            narrative_day=event.narrative_day,
            narrative_time=event.narrative_time,
            sort_key=event.sort_key,
            date_is_unknown=event.date_is_unknown,
            category=event.category,
            session_id=event.session_id if session_summary else None,
            session=session_summary,
            visibility=event.visibility,
            entities=entities_list,
            allowed_user_ids=allowed_ids,
            created_at=event.created_at,
            updated_at=event.updated_at,
        )

    def list_events(
        self,
        campaign: Campaign,
        member: CampaignMember,
        search: Optional[str] = None,
        category: Optional[str] = None,
        session_id: Optional[str] = None,
        entity_id: Optional[str] = None,
        character_id: Optional[str] = None,
        npc_id: Optional[str] = None,
        location_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        visibility: Optional[str] = None,
        year_from: Optional[int] = None,
        year_to: Optional[int] = None,
        order: str = "asc",
        page: int = 1,
        page_size: int = 100,
    ) -> PaginatedEventsResponse:
        is_gm = member.role == "gm" or campaign.owner_id == member.user_id
        user_id = member.user_id

        acc_events = (
            set()
            if is_gm
            else self.perm_repo.get_accessible_record_ids_for_user("event", user_id)
        )
        acc_entities = (
            set()
            if is_gm
            else self.perm_repo.get_accessible_record_ids_for_user("entity", user_id)
        )
        acc_sessions = (
            set()
            if is_gm
            else self.perm_repo.get_accessible_record_ids_for_user("session", user_id)
        )

        entity_filters = [
            eid
            for eid in [entity_id, character_id, npc_id, location_id, organization_id]
            if eid
        ]

        dated_items, undated_items, total = self.repo.list_for_campaign(
            campaign_id=campaign.id,
            is_gm=is_gm,
            accessible_ids=acc_events,
            search=search,
            category=category,
            session_id=session_id,
            entity_ids=entity_filters,
            visibility=visibility,
            year_from=year_from,
            year_to=year_to,
            order=order,
            page=page,
            page_size=page_size,
        )
        total_pages = max(1, math.ceil(total / page_size)) if page_size > 0 else 1

        return PaginatedEventsResponse(
            items=[
                self._to_response(e, user_id, is_gm, acc_entities, acc_sessions)
                for e in dated_items
            ],
            undated_items=[
                self._to_response(e, user_id, is_gm, acc_entities, acc_sessions)
                for e in undated_items
            ],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def create_event(
        self,
        campaign: Campaign,
        member: CampaignMember,
        data: EventCreate,
    ) -> EventResponse:
        valid_entities = self._validate_entities_belong_to_campaign(campaign.id, data.entity_ids)
        valid_session_id = self._validate_session_belongs_to_campaign(campaign.id, data.session_id)
        valid_users = self._validate_allowed_users(campaign.id, data.allowed_user_ids)

        (
            cal_type,
            disp_date,
            year,
            month,
            day,
            clean_time,
            sort_key,
        ) = compute_narrative_sort_and_display(
            calendar_config=campaign.calendar_config,
            date_is_unknown=data.date_is_unknown,
            calendar_type=data.calendar_type,
            narrative_date=data.narrative_date,
            narrative_year=data.narrative_year,
            narrative_month=data.narrative_month,
            narrative_day=data.narrative_day,
            narrative_time=data.narrative_time,
        )

        event = TimelineEvent(
            campaign_id=campaign.id,
            title=data.title.strip(),
            description=data.description.strip(),
            calendar_type=cal_type,
            narrative_date=disp_date,
            narrative_year=year,
            narrative_month=month,
            narrative_day=day,
            narrative_time=clean_time,
            sort_key=sort_key,
            date_is_unknown=data.date_is_unknown,
            category=data.category,
            session_id=valid_session_id,
            visibility=data.visibility,
        )
        event = self.repo.create(event)
        if valid_entities:
            self.repo.set_event_entities(event.id, valid_entities)
        if data.visibility == "restricted":
            self.perm_repo.set_permissions("event", event.id, valid_users)

        campaign.updated_at = utc_now()
        self.camp_repo.update(campaign)

        refreshed = self.repo.get_by_id(event.id)
        return self._to_response(refreshed, member.user_id, True)

    def get_event_detail(self, event_id: str, user_id: str) -> EventResponse:
        event = self.repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Acontecimento não encontrado.",
            )
        campaign = self.camp_repo.get_by_id(event.campaign_id)
        member = self.camp_repo.get_member(event.campaign_id, user_id)
        if not campaign or not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado: você não participa desta campanha.",
            )
        is_gm = member.role == "gm" or campaign.owner_id == user_id
        if not self._can_user_view_event(event, user_id, is_gm):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para visualizar este acontecimento.",
            )
        return self._to_response(event, user_id, is_gm)

    def update_event(
        self,
        event_id: str,
        user_id: str,
        data: EventUpdate,
    ) -> EventResponse:
        event = self.repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Acontecimento não encontrado.",
            )
        campaign = self.camp_repo.get_by_id(event.campaign_id)
        member = self.camp_repo.get_member(event.campaign_id, user_id)
        if not campaign or not member or (member.role != "gm" and campaign.owner_id != user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o Mestre da campanha pode editar acontecimentos.",
            )

        if data.title is not None:
            event.title = data.title.strip()
        if data.description is not None:
            event.description = data.description.strip()
        if data.category is not None:
            event.category = data.category
        if data.visibility is not None:
            event.visibility = data.visibility

        if "session_id" in data.model_fields_set:
            event.session_id = self._validate_session_belongs_to_campaign(
                campaign.id, data.session_id
            )

        date_fields = {
            "date_is_unknown",
            "calendar_type",
            "narrative_date",
            "narrative_year",
            "narrative_month",
            "narrative_day",
            "narrative_time",
        }
        if date_fields.intersection(data.model_fields_set):
            new_unknown = (
                data.date_is_unknown
                if data.date_is_unknown is not None
                else event.date_is_unknown
            )
            new_cal_type = (
                data.calendar_type
                if data.calendar_type is not None
                else event.calendar_type
            )
            new_date_str = (
                data.narrative_date
                if "narrative_date" in data.model_fields_set
                else event.narrative_date
            )
            new_year = (
                data.narrative_year
                if "narrative_year" in data.model_fields_set
                else event.narrative_year
            )
            new_month = (
                data.narrative_month
                if "narrative_month" in data.model_fields_set
                else event.narrative_month
            )
            new_day = (
                data.narrative_day
                if "narrative_day" in data.model_fields_set
                else event.narrative_day
            )
            new_time = (
                data.narrative_time
                if "narrative_time" in data.model_fields_set
                else event.narrative_time
            )

            (
                cal_type,
                disp_date,
                year,
                month,
                day,
                clean_time,
                sort_key,
            ) = compute_narrative_sort_and_display(
                calendar_config=campaign.calendar_config,
                date_is_unknown=new_unknown,
                calendar_type=new_cal_type,
                narrative_date=new_date_str,
                narrative_year=new_year,
                narrative_month=new_month,
                narrative_day=new_day,
                narrative_time=new_time,
            )
            event.date_is_unknown = new_unknown
            event.calendar_type = cal_type
            event.narrative_date = disp_date
            event.narrative_year = year
            event.narrative_month = month
            event.narrative_day = day
            event.narrative_time = clean_time
            event.sort_key = sort_key

        if data.entity_ids is not None:
            valid_entities = self._validate_entities_belong_to_campaign(
                campaign.id, data.entity_ids
            )
            self.repo.set_event_entities(event.id, valid_entities)

        if data.allowed_user_ids is not None or data.visibility is not None:
            if event.visibility == "restricted":
                users_to_set = (
                    self._validate_allowed_users(campaign.id, data.allowed_user_ids)
                    if data.allowed_user_ids is not None
                    else self.perm_repo.get_allowed_user_ids("event", event.id)
                )
                self.perm_repo.set_permissions("event", event.id, users_to_set)
            else:
                self.perm_repo.delete_for_record("event", event.id)

        event.updated_at = utc_now()
        self.repo.update(event)
        campaign.updated_at = utc_now()
        self.camp_repo.update(campaign)

        refreshed = self.repo.get_by_id(event.id)
        return self._to_response(refreshed, user_id, True)

    def delete_event(self, event_id: str, user_id: str) -> None:
        event = self.repo.get_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Acontecimento não encontrado.",
            )
        campaign = self.camp_repo.get_by_id(event.campaign_id)
        member = self.camp_repo.get_member(event.campaign_id, user_id)
        if not campaign or not member or (member.role != "gm" and campaign.owner_id != user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o Mestre da campanha pode excluir acontecimentos.",
            )
        self.perm_repo.delete_for_record("event", event.id)
        self.repo.delete(event)
        campaign.updated_at = utc_now()
        self.camp_repo.update(campaign)
