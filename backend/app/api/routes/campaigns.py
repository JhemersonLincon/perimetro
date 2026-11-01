from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import get_campaign_and_member, get_current_user
from app.models.user import User
from app.schemas.campaign import (
    CampaignCreate,
    CampaignDashboardResponse,
    CampaignMemberResponse,
    CampaignResponse,
    CampaignUpdate,
    InvitationCreate,
    InvitationResponse,
)
from app.services.campaign_service import CampaignService

router = APIRouter(tags=["Campanhas e Participantes"])


@router.get("/campaigns", response_model=List[CampaignResponse])
def list_campaigns(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todas as campanhas das quais o usuário autenticado participa."""
    return CampaignService(db).list_user_campaigns(current_user, status_filter=status_filter)


@router.post("/campaigns", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    data: CampaignCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cria uma nova campanha tendo o usuário autenticado como Mestre (GM)."""
    return CampaignService(db).create_campaign(current_user, data)


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtém detalhes e contadores de uma campanha."""
    campaign, member = get_campaign_and_member(campaign_id, current_user, db, require_gm=False)
    return CampaignService(db).get_campaign_detail(campaign, member)


@router.get("/campaigns/{campaign_id}/dashboard", response_model=CampaignDashboardResponse)
def get_campaign_dashboard(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna os indicadores e atividades recentes do dashboard da campanha."""
    campaign, member = get_campaign_and_member(campaign_id, current_user, db, require_gm=False)
    return CampaignService(db).get_dashboard(campaign, member)


@router.patch("/campaigns/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: str,
    data: CampaignUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualiza as configurações de uma campanha (exclusivo para o Mestre)."""
    campaign, member = get_campaign_and_member(campaign_id, current_user, db, require_gm=True)
    return CampaignService(db).update_campaign(campaign, member, data)


@router.delete("/campaigns/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Exclui uma campanha e todos os seus registros dependentes (exclusivo para o Mestre)."""
    campaign, _ = get_campaign_and_member(campaign_id, current_user, db, require_gm=True)
    CampaignService(db).delete_campaign(campaign)
    return None


@router.get("/campaigns/{campaign_id}/members", response_model=List[CampaignMemberResponse])
def list_campaign_members(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista os participantes de uma campanha."""
    campaign, _ = get_campaign_and_member(campaign_id, current_user, db, require_gm=False)
    return CampaignService(db).list_members(campaign)


@router.delete(
    "/campaigns/{campaign_id}/members/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_campaign_member(
    campaign_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove um participante da campanha (exclusivo para o Mestre)."""
    campaign, _ = get_campaign_and_member(campaign_id, current_user, db, require_gm=True)
    CampaignService(db).remove_member(campaign, user_id)
    return None


@router.post(
    "/campaigns/{campaign_id}/invitations",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_campaign_invitation(
    campaign_id: str,
    data: InvitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Gera um convite para participação na campanha (exclusivo para o Mestre)."""
    campaign, _ = get_campaign_and_member(campaign_id, current_user, db, require_gm=True)
    return CampaignService(db).create_invitation(campaign, data)


@router.get(
    "/campaigns/{campaign_id}/invitations",
    response_model=List[InvitationResponse],
)
def list_campaign_invitations(
    campaign_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista os convites gerados na campanha (exclusivo para o Mestre)."""
    campaign, _ = get_campaign_and_member(campaign_id, current_user, db, require_gm=True)
    return CampaignService(db).list_invitations(campaign)


@router.post("/invitations/{token}/accept", response_model=CampaignResponse)
def accept_campaign_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aceita um convite de campanha utilizando o token de convite."""
    return CampaignService(db).accept_invitation(current_user, token)
