from typing import List, Set
from sqlalchemy.orm import Session

from app.models.permission import RecordPermission


class PermissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_allowed_user_ids(self, record_type: str, record_id: str) -> List[str]:
        rows = (
            self.db.query(RecordPermission.user_id)
            .filter(
                RecordPermission.record_type == record_type,
                RecordPermission.record_id == record_id,
            )
            .all()
        )
        return [r[0] for r in rows]

    def get_accessible_record_ids_for_user(self, record_type: str, user_id: str) -> Set[str]:
        rows = (
            self.db.query(RecordPermission.record_id)
            .filter(
                RecordPermission.record_type == record_type,
                RecordPermission.user_id == user_id,
            )
            .all()
        )
        return {r[0] for r in rows}

    def set_permissions(self, record_type: str, record_id: str, user_ids: List[str]) -> None:
        self.db.query(RecordPermission).filter(
            RecordPermission.record_type == record_type,
            RecordPermission.record_id == record_id,
        ).delete(synchronize_session=False)
        unique_ids = list(dict.fromkeys([uid for uid in user_ids if uid]))
        for uid in unique_ids:
            self.db.add(
                RecordPermission(
                    record_type=record_type,
                    record_id=record_id,
                    user_id=uid,
                    permission_type="view",
                )
            )
        self.db.commit()

    def delete_for_record(self, record_type: str, record_id: str) -> None:
        self.db.query(RecordPermission).filter(
            RecordPermission.record_type == record_type,
            RecordPermission.record_id == record_id,
        ).delete(synchronize_session=False)
        self.db.commit()
