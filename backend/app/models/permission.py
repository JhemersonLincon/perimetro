from sqlalchemy import String, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, generate_uuid


class RecordPermission(Base):
    __tablename__ = "record_permissions"
    __table_args__ = (
        UniqueConstraint("record_type", "record_id", "user_id", name="uq_record_permission"),
        Index("ix_record_permissions_lookup", "record_type", "record_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    record_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    record_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    permission_type: Mapped[str] = mapped_column(String(30), nullable=False, default="view")

    user = relationship("User", back_populates="record_permissions")
