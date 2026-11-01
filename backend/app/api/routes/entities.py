from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_campaign_and_member, get_current_user
from app.models.user import User
from app.schemas.entity import (
    EntityCreate,
    EntityDetailResponse,
    EntityResponse,
    EntityUpdate,
    PaginatedEntitiesResponse,
)
from app.services.entity_service import EntityService

router = APIRouter(tags=["Entidades"])


@router.get("/campaigns/{campaign_id}/entities", response_model=PaginatedEntitiesResponse)
def list_entities(
    campaign_id: str,
    search: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    visibility: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista entidades de uma campanha respeitando filtros e permissões de visibilidade."""
    campaign, member = get_campaign_and_member(campaign_id, current_user, db, require_gm=False)
    return EntityService(db).list_entities(
        campaign=campaign,
        member=member,
        search=search,
        category=category,
        status_filter=status_filter,
        visibility=visibility,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/campaigns/{campaign_id}/entities",
    response_model=EntityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_entity(
    campaign_id: str,
    data: EntityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cadastra uma nova entidade (Personagem, NPC, Localidade ou Organização) na campanha."""
    campaign, member = get_campaign_and_member(campaign_id, current_user, db, require_gm=True)
    return EntityService(db).create_entity(campaign, member, data)


@router.get("/entities/{entity_id}", response_model=EntityDetailResponse)
def get_entity(
    entity_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna os detalhes completos de uma entidade, incluindo acontecimentos e sessões relacionadas."""
    return EntityService(db).get_entity_detail(entity_id, current_user.id)


@router.patch("/entities/{entity_id}", response_model=EntityResponse)
def update_entity(
    entity_id: str,
    data: EntityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualiza os dados de uma entidade (exclusivo para o Mestre)."""
    return EntityService(db).update_entity(entity_id, current_user.id, data)


@router.delete("/entities/{entity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entity(
    entity_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Exclui uma entidade (exclusivo para o Mestre)."""
    EntityService(db).delete_entity(entity_id, current_user.id)
    return None
