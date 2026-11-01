from datetime import datetime, date
from typing import Any, Dict, Optional
from sqlalchemy import String, Text, Date, DateTime, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, generate_uuid, utc_now


def default_calendar_config() -> Dict[str, Any]:
    return {
        "type": "gregorian",
        "era_name": "d.C.",
        "months": [
            {"name": "Janeiro", "days": 31},
            {"name": "Fevereiro", "days": 28},
            {"name": "Março", "days": 31},
            {"name": "Abril", "days": 30},
            {"name": "Maio", "days": 31},
            {"name": "Junho", "days": 30},
            {"name": "Julho", "days": 31},
            {"name": "Agosto", "days": 31},
            {"name": "Setembro", "days": 30},
            {"name": "Outubro", "days": 31},
            {"name": "Novembro", "days": 30},
            {"name": "Dezembro", "days": 31},
        ],
    }


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    cover_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    rpg_system: Mapped[str] = mapped_column(String(120), nullable=False, default="Sistema Próprio")
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    calendar_config: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=default_calendar_config,
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="active", index=True)
    owner_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    owner = relationship("User", back_populates="owned_campaigns")
    members = relationship(
        "CampaignMember",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )
    invitations = relationship(
        "CampaignInvitation",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )
    entities = relationship(
        "Entity",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )
    sessions = relationship(
        "GameSession",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )
    events = relationship(
        "TimelineEvent",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )


class CampaignMember(Base):
    __tablename__ = "campaign_members"
    __table_args__ = (
        UniqueConstraint("campaign_id", "user_id", name="uq_campaign_member_user"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    campaign_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(String(30), nullable=False, default="player")
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    campaign = relationship("Campaign", back_populates="members")
    user = relationship("User", back_populates="memberships")


class CampaignInvitation(Base):
    __tablename__ = "campaign_invitations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    campaign_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    invitation_token_hash: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending", index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    campaign = relationship("Campaign", back_populates="invitations")
