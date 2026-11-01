from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, Integer, BigInteger, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, generate_uuid, utc_now


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    campaign_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    calendar_type: Mapped[str] = mapped_column(String(30), nullable=False, default="gregorian")
    narrative_date: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    narrative_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    narrative_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    narrative_day: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    narrative_time: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    sort_key: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True, index=True)
    date_is_unknown: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="investigacao", index=True)
    session_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    visibility: Mapped[str] = mapped_column(String(30), nullable=False, default="public", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    campaign = relationship("Campaign", back_populates="events")
    session = relationship("GameSession", back_populates="events")
    entity_links = relationship(
        "EventEntity",
        back_populates="event",
        cascade="all, delete-orphan",
    )


class EventEntity(Base):
    __tablename__ = "event_entities"
    __table_args__ = (
        UniqueConstraint("event_id", "entity_id", name="uq_event_entity"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    event_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("timeline_events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    entity_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("entities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    event = relationship("TimelineEvent", back_populates="entity_links")
    entity = relationship("Entity", back_populates="event_links")
