"""Esquema relacional inicial completo da plataforma Crônica RPG

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-01 10:50:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("username", sa.String(length=60), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "campaigns",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("cover_url", sa.String(length=500), nullable=True),
        sa.Column("rpg_system", sa.String(length=120), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("calendar_config", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("owner_id", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_campaigns_name"), "campaigns", ["name"], unique=False)
    op.create_index(op.f("ix_campaigns_owner_id"), "campaigns", ["owner_id"], unique=False)
    op.create_index(op.f("ix_campaigns_status"), "campaigns", ["status"], unique=False)

    op.create_table(
        "campaign_members",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("campaign_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("role", sa.String(length=30), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("campaign_id", "user_id", name="uq_campaign_member_user"),
    )
    op.create_index(op.f("ix_campaign_members_campaign_id"), "campaign_members", ["campaign_id"], unique=False)
    op.create_index(op.f("ix_campaign_members_user_id"), "campaign_members", ["user_id"], unique=False)

    op.create_table(
        "campaign_invitations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("campaign_id", sa.String(length=36), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("invitation_token_hash", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_campaign_invitations_campaign_id"), "campaign_invitations", ["campaign_id"], unique=False)
    op.create_index(op.f("ix_campaign_invitations_email"), "campaign_invitations", ["email"], unique=False)
    op.create_index(op.f("ix_campaign_invitations_invitation_token_hash"), "campaign_invitations", ["invitation_token_hash"], unique=True)
    op.create_index(op.f("ix_campaign_invitations_status"), "campaign_invitations", ["status"], unique=False)

    op.create_table(
        "entities",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("campaign_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("extra_info", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("visibility", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_entities_campaign_id"), "entities", ["campaign_id"], unique=False)
    op.create_index(op.f("ix_entities_category"), "entities", ["category"], unique=False)
    op.create_index(op.f("ix_entities_name"), "entities", ["name"], unique=False)
    op.create_index(op.f("ix_entities_status"), "entities", ["status"], unique=False)
    op.create_index(op.f("ix_entities_visibility"), "entities", ["visibility"], unique=False)

    op.create_table(
        "sessions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("campaign_id", sa.String(length=36), nullable=False),
        sa.Column("session_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("real_date", sa.Date(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("visibility", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("campaign_id", "session_number", name="uq_campaign_session_number"),
    )
    op.create_index(op.f("ix_sessions_campaign_id"), "sessions", ["campaign_id"], unique=False)
    op.create_index(op.f("ix_sessions_status"), "sessions", ["status"], unique=False)
    op.create_index(op.f("ix_sessions_visibility"), "sessions", ["visibility"], unique=False)

    op.create_table(
        "timeline_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("campaign_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("calendar_type", sa.String(length=30), nullable=False),
        sa.Column("narrative_date", sa.String(length=120), nullable=True),
        sa.Column("narrative_year", sa.Integer(), nullable=True),
        sa.Column("narrative_month", sa.Integer(), nullable=True),
        sa.Column("narrative_day", sa.Integer(), nullable=True),
        sa.Column("narrative_time", sa.String(length=50), nullable=True),
        sa.Column("sort_key", sa.BigInteger(), nullable=True),
        sa.Column("date_is_unknown", sa.Boolean(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("session_id", sa.String(length=36), nullable=True),
        sa.Column("visibility", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["campaign_id"], ["campaigns.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_timeline_events_campaign_id"), "timeline_events", ["campaign_id"], unique=False)
    op.create_index(op.f("ix_timeline_events_category"), "timeline_events", ["category"], unique=False)
    op.create_index(op.f("ix_timeline_events_date_is_unknown"), "timeline_events", ["date_is_unknown"], unique=False)
    op.create_index(op.f("ix_timeline_events_narrative_day"), "timeline_events", ["narrative_day"], unique=False)
    op.create_index(op.f("ix_timeline_events_narrative_month"), "timeline_events", ["narrative_month"], unique=False)
    op.create_index(op.f("ix_timeline_events_narrative_year"), "timeline_events", ["narrative_year"], unique=False)
    op.create_index(op.f("ix_timeline_events_session_id"), "timeline_events", ["session_id"], unique=False)
    op.create_index(op.f("ix_timeline_events_sort_key"), "timeline_events", ["sort_key"], unique=False)
    op.create_index(op.f("ix_timeline_events_title"), "timeline_events", ["title"], unique=False)
    op.create_index(op.f("ix_timeline_events_visibility"), "timeline_events", ["visibility"], unique=False)

    op.create_table(
        "event_entities",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("event_id", sa.String(length=36), nullable=False),
        sa.Column("entity_id", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["entity_id"], ["entities.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["event_id"], ["timeline_events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "entity_id", name="uq_event_entity"),
    )
    op.create_index(op.f("ix_event_entities_entity_id"), "event_entities", ["entity_id"], unique=False)
    op.create_index(op.f("ix_event_entities_event_id"), "event_entities", ["event_id"], unique=False)

    op.create_table(
        "record_permissions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("record_type", sa.String(length=30), nullable=False),
        sa.Column("record_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("permission_type", sa.String(length=30), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("record_type", "record_id", "user_id", name="uq_record_permission"),
    )
    op.create_index("ix_record_permissions_lookup", "record_permissions", ["record_type", "record_id"], unique=False)
    op.create_index(op.f("ix_record_permissions_record_id"), "record_permissions", ["record_id"], unique=False)
    op.create_index(op.f("ix_record_permissions_record_type"), "record_permissions", ["record_type"], unique=False)
    op.create_index(op.f("ix_record_permissions_user_id"), "record_permissions", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_table("record_permissions")
    op.drop_table("event_entities")
    op.drop_table("timeline_events")
    op.drop_table("sessions")
    op.drop_table("entities")
    op.drop_table("campaign_invitations")
    op.drop_table("campaign_members")
    op.drop_table("campaigns")
    op.drop_table("users")
