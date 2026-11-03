from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_campaign_and_member, get_current_user
from app.models.user import User
from app.schemas.timeline_event import (
    EventCreate,
    EventResponse,
    EventUpdate,
    PaginatedEventsResponse,
    TimelineYearGroup,
)
from app.services.event_service import EventService

router = APIRouter(tags=["Linha do Tempo e Acontecimentos"])


@router.get("/campaigns/{campaign_id}/events", response_model=PaginatedEventsResponse)
def list_events(
    campaign_id: str,
    search: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    session_id: Optional[str] = Query(default=None),
    entity_id: Optional[str] = Query(default=None),
    character_id: Optional[str] = Query(default=None),
    npc_id: Optional[str] = Query(default=None),
    location_id: Optional[str] = Query(default=None),
    organization_id: Optional[str] = Query(default=None),
    visibility: Optional[str] = Query(default=None),
    year_from: Optional[int] = Query(default=None),
    year_to: Optional[int] = Query(default=None),
    order: str = Query(default="asc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lista acontecimentos da linha do tempo com suporte a granularidade multinível,
    ordenação cronológica determinística, controle de permissões e árvore de zoom semântico.
    """
    campaign, member = get_campaign_and_member(campaign_id, current_user, db, require_gm=False)
    return EventService(db).list_events(
        campaign=campaign,
        member=member,
        search=search,
        category=category,
        session_id=session_id,
        entity_id=entity_id,
        character_id=character_id,
        npc_id=npc_id,
        location_id=location_id,
        organization_id=organization_id,
        visibility=visibility,
        year_from=year_from,
        year_to=year_to,
        order=order,
        page=page,
        page_size=page_size,
    )


@router.get("/campaigns/{campaign_id}/timeline-tree", response_model=List[TimelineYearGroup])
def get_timeline_tree(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retorna a hierarquia semântica otimizada de eventos agrupados por Ano -> Mês -> Dia
    para renderização fluida com Zoom Semântico (Macro, Médio, Micro).
    """
    campaign, member = get_campaign_and_member(campaign_id, current_user, db, require_gm=False)
    resp = EventService(db).list_events(
        campaign=campaign,
        member=member,
        page=1,
        page_size=500,
    )
    return resp.timeline_tree


@router.post(
    "/campaigns/{campaign_id}/events",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_event(
    campaign_id: str,
    data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cadastra um novo acontecimento na linha do tempo colaborativa.
    Permite criação pelo Mestre (fatos canônicos) e por Jogadores (diários, antecedentes, hipóteses).
    """
    campaign, member = get_campaign_and_member(campaign_id, current_user, db, require_gm=False)
    return EventService(db).create_event(campaign, member, data)


@router.get("/events/{event_id}", response_model=EventResponse)
def get_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna os detalhes de um acontecimento respeitando o nível de visibilidade."""
    return EventService(db).get_event_detail(event_id, current_user.id)


@router.patch("/events/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str,
    data: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Edita um acontecimento e seus relacionamentos (autor ou Mestre da campanha)."""
    return EventService(db).update_event(event_id, current_user.id, data)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Exclui um acontecimento da linha do tempo (autor ou Mestre da campanha)."""
    EventService(db).delete_event(event_id, current_user.id)
    return None
