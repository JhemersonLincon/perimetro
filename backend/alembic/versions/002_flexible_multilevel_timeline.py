"""Granularidade multinível com zoom semântico e autoria flexível na timeline

Revision ID: 002_flexible_multilevel_timeline
Revises: 001_initial_schema
Create Date: 2026-11-02 23:30:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "002_flexible_multilevel_timeline"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Adiciona novos campos temporais granulares e de autoria colaborativa
    op.add_column("timeline_events", sa.Column("year", sa.Integer(), nullable=True))
    op.add_column("timeline_events", sa.Column("month", sa.Integer(), nullable=True))
    op.add_column("timeline_events", sa.Column("day", sa.Integer(), nullable=True))
    op.add_column("timeline_events", sa.Column("time_label", sa.String(length=50), nullable=True))
    op.add_column("timeline_events", sa.Column("sort_order", sa.Float(), nullable=False, server_default="0.0"))
    op.add_column("timeline_events", sa.Column("event_type", sa.String(length=30), nullable=False, server_default="canonical"))
    op.add_column("timeline_events", sa.Column("created_by_id", sa.String(length=36), nullable=True))

    # 2. Migração de dados legados: copia valores de narrative_* para year, month, day, time_label
    op.execute(
        """
        UPDATE timeline_events
        SET year = narrative_year,
            month = narrative_month,
            day = narrative_day,
            time_label = narrative_time
        WHERE year IS NULL AND narrative_year IS NOT NULL;
        """
    )

    # 3. Criação de índices determinísticos e chaves estrangeiras
    op.create_index(op.f("ix_timeline_events_year"), "timeline_events", ["year"], unique=False)
    op.create_index(op.f("ix_timeline_events_month"), "timeline_events", ["month"], unique=False)
    op.create_index(op.f("ix_timeline_events_day"), "timeline_events", ["day"], unique=False)
    op.create_index(op.f("ix_timeline_events_sort_order"), "timeline_events", ["sort_order"], unique=False)
    op.create_index(op.f("ix_timeline_events_event_type"), "timeline_events", ["event_type"], unique=False)
    op.create_index(op.f("ix_timeline_events_created_by_id"), "timeline_events", ["created_by_id"], unique=False)

    op.create_foreign_key(
        "fk_timeline_events_created_by_id_users",
        "timeline_events",
        "users",
        ["created_by_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_timeline_events_created_by_id_users", "timeline_events", type_="foreignkey")
    op.drop_index(op.f("ix_timeline_events_created_by_id"), table_name="timeline_events")
    op.drop_index(op.f("ix_timeline_events_event_type"), table_name="timeline_events")
    op.drop_index(op.f("ix_timeline_events_sort_order"), table_name="timeline_events")
    op.drop_index(op.f("ix_timeline_events_day"), table_name="timeline_events")
    op.drop_index(op.f("ix_timeline_events_month"), table_name="timeline_events")
    op.drop_index(op.f("ix_timeline_events_year"), table_name="timeline_events")

    op.drop_column("timeline_events", "created_by_id")
    op.drop_column("timeline_events", "event_type")
    op.drop_column("timeline_events", "sort_order")
    op.drop_column("timeline_events", "time_label")
    op.drop_column("timeline_events", "day")
    op.drop_column("timeline_events", "month")
    op.drop_column("timeline_events", "year")

