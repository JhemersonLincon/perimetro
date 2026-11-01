from typing import List, Optional, Set, Tuple
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from app.models.session import GameSession


class SessionRepository:
    def __init__(self, db: Session):
        self.db = db

    def _apply_visibility(self, query, is_gm: bool, accessible_ids: Set[str], visibility_filter: Optional[str] = None):
        if not is_gm:
            if accessible_ids:
                query = query.filter(
                    or_(
                        GameSession.visibility == "public",
                        and_(GameSession.visibility == "restricted", GameSession.id.in_(accessible_ids)),
                    )
                )
            else:
                query = query.filter(GameSession.visibility == "public")

        if visibility_filter:
            query = query.filter(GameSession.visibility == visibility_filter)
        return query

    def get_by_id(self, session_id: str) -> Optional[GameSession]:
        return self.db.query(GameSession).filter(GameSession.id == session_id).first()

    def get_by_number(self, campaign_id: str, session_number: int) -> Optional[GameSession]:
        return (
            self.db.query(GameSession)
            .filter(
                GameSession.campaign_id == campaign_id,
                GameSession.session_number == session_number,
            )
            .first()
        )

    def list_for_campaign(
        self,
        campaign_id: str,
        is_gm: bool,
        accessible_ids: Set[str],
        status: Optional[str] = None,
        visibility: Optional[str] = None,
        order: str = "asc",
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[GameSession], int]:
        query = self.db.query(GameSession).filter(GameSession.campaign_id == campaign_id)
        query = self._apply_visibility(query, is_gm, accessible_ids, visibility)

        if status:
            query = query.filter(GameSession.status == status)

        total = query.count()
        sort_col = GameSession.session_number.desc() if order == "desc" else GameSession.session_number.asc()
        items = (
            query.order_by(sort_col)
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def create(self, game_session: GameSession) -> GameSession:
        self.db.add(game_session)
        self.db.commit()
        self.db.refresh(game_session)
        return game_session

    def update(self, game_session: GameSession) -> GameSession:
        self.db.add(game_session)
        self.db.commit()
        self.db.refresh(game_session)
        return game_session

    def delete(self, game_session: GameSession) -> None:
        self.db.delete(game_session)
        self.db.commit()
