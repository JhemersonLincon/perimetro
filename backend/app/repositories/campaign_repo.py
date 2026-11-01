from typing import List, Optional
from sqlalchemy.orm import Session, joinedload

from app.models.campaign import Campaign, CampaignMember, CampaignInvitation


class CampaignRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, campaign_id: str) -> Optional[Campaign]:
        return self.db.query(Campaign).filter(Campaign.id == campaign_id).first()

    def list_for_user(self, user_id: str, status: Optional[str] = None) -> List[Campaign]:
        query = (
            self.db.query(Campaign)
            .join(CampaignMember, CampaignMember.campaign_id == Campaign.id)
            .filter(CampaignMember.user_id == user_id)
        )
        if status:
            query = query.filter(Campaign.status == status)
        return query.order_by(Campaign.updated_at.desc()).all()

    def create(self, campaign: Campaign, owner_member: CampaignMember) -> Campaign:
        self.db.add(campaign)
        self.db.flush()
        owner_member.campaign_id = campaign.id
        self.db.add(owner_member)
        self.db.commit()
        self.db.refresh(campaign)
        return campaign

    def update(self, campaign: Campaign) -> Campaign:
        self.db.add(campaign)
        self.db.commit()
        self.db.refresh(campaign)
        return campaign

    def delete(self, campaign: Campaign) -> None:
        self.db.delete(campaign)
        self.db.commit()

    def get_member(self, campaign_id: str, user_id: str) -> Optional[CampaignMember]:
        return (
            self.db.query(CampaignMember)
            .filter(
                CampaignMember.campaign_id == campaign_id,
                CampaignMember.user_id == user_id,
            )
            .first()
        )

    def list_members(self, campaign_id: str) -> List[CampaignMember]:
        return (
            self.db.query(CampaignMember)
            .options(joinedload(CampaignMember.user))
            .filter(CampaignMember.campaign_id == campaign_id)
            .order_by(CampaignMember.joined_at.asc())
            .all()
        )

    def add_member(self, member: CampaignMember) -> CampaignMember:
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        return member

    def remove_member(self, member: CampaignMember) -> None:
        self.db.delete(member)
        self.db.commit()

    def create_invitation(self, invitation: CampaignInvitation) -> CampaignInvitation:
        self.db.add(invitation)
        self.db.commit()
        self.db.refresh(invitation)
        return invitation

    def get_invitation_by_hash(self, token_hash: str) -> Optional[CampaignInvitation]:
        return (
            self.db.query(CampaignInvitation)
            .options(joinedload(CampaignInvitation.campaign))
            .filter(CampaignInvitation.invitation_token_hash == token_hash)
            .first()
        )

    def list_invitations(self, campaign_id: str) -> List[CampaignInvitation]:
        return (
            self.db.query(CampaignInvitation)
            .filter(CampaignInvitation.campaign_id == campaign_id)
            .order_by(CampaignInvitation.created_at.desc())
            .all()
        )

    def list_pending_invitations_for_email(self, email: str) -> List[CampaignInvitation]:
        return (
            self.db.query(CampaignInvitation)
            .options(joinedload(CampaignInvitation.campaign))
            .filter(
                CampaignInvitation.email.ilike(email),
                CampaignInvitation.status == "pending",
            )
            .order_by(CampaignInvitation.created_at.desc())
            .all()
        )

    def update_invitation(self, invitation: CampaignInvitation) -> CampaignInvitation:
        self.db.add(invitation)
        self.db.commit()
        self.db.refresh(invitation)
        return invitation
