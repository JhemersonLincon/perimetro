from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_campaign_and_member, get_current_user
from app.models.user import User
from app.schemas.session import (
    PaginatedSessionsResponse,
    SessionCreate,
    SessionDetailResponse,
    SessionUpdate,
)
from app.services.session_service import SessionService

router = APIRouter(tags=["Sessões de Jogo"])


@router.get("/campaigns/{campaign_id}/sessions", response_model=PaginatedSessionsResponse)
def list_sessions(
    campaign_id: str,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    visibility: Optional[str] = Query(default=None),
    order: str = Query(default="asc", pattern="^(asc|desc)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista as sessões de uma campanha em ordem cronológica."""
    campaign, member = get_campaign_and_member(campaign_id, current_user, db, require_gm=False)
    return SessionService(db).list_sessions(
        campaign=campaign,
        member=member,
        status_filter=status_filter,
        visibility=visibility,
        order=order,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/campaigns/{campaign_id}/sessions",
    response_model=SessionDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    campaign_id: str,
    data: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Registra uma nova sessão na campanha (exclusivo para o Mestre)."""
    campaign, member = get_campaign_and_member(campaign_id, current_user, db, require_gm=True)
    return SessionService(db).create_session(campaign, member, data)


@router.get("/sessions/{session_id}", response_model=SessionDetailResponse)
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna os detalhes de uma sessão e seus acontecimentos associados."""
    return SessionService(db).get_session_detail(session_id, current_user.id)


@router.patch("/sessions/{session_id}", response_model=SessionDetailResponse)
def update_session(
    session_id: str,
    data: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualiza uma sessão e seus acontecimentos associados (exclusivo para o Mestre)."""
    return SessionService(db).update_session(session_id, current_user.id, data)


@router.post("/sessions/{session_id}/events/{event_id}", response_model=SessionDetailResponse)
def link_event_to_session(
    session_id: str,
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Associa um acontecimento existente a uma sessão (exclusivo para o Mestre)."""
    return SessionService(db).link_event_to_session(session_id, event_id, current_user.id)


@router.delete("/sessions/{session_id}/events/{event_id}", response_model=SessionDetailResponse)
def unlink_event_from_session(
    session_id: str,
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a associação de um acontecimento com uma sessão (exclusivo para o Mestre)."""
    return SessionService(db).unlink_event_from_session(session_id, event_id, current_user.id)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Exclui uma sessão da campanha (exclusivo para o Mestre)."""
    SessionService(db).delete_session(session_id, current_user.id)
    return None
