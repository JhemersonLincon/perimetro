from datetime import datetime, date
from typing import Any, List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

SessionStatus = Literal["planejada", "realizada", "cancelada", "planned", "completed", "cancelled"]
VisibilityLevel = Literal["private", "public", "restricted"]


class SessionSummary(BaseModel):
    id: str
    campaign_id: str
    session_number: int
    title: str
    real_date: Optional[date] = None
    status: str
    visibility: str = "public"

    model_config = ConfigDict(from_attributes=True)


class SessionCreate(BaseModel):
    session_number: int = Field(..., ge=1)
    title: str = Field(..., min_length=1, max_length=180)
    real_date: Optional[date] = None
    summary: str = Field(default="", max_length=25000)
    status: SessionStatus = "planejada"
    notes: Optional[str] = Field(default=None, max_length=15000)
    visibility: VisibilityLevel = "public"
    allowed_user_ids: List[str] = Field(default_factory=list)
    event_ids: List[str] = Field(default_factory=list)


class SessionUpdate(BaseModel):
    session_number: Optional[int] = Field(default=None, ge=1)
    title: Optional[str] = Field(default=None, min_length=1, max_length=180)
    real_date: Optional[date] = None
    summary: Optional[str] = Field(default=None, max_length=25000)
    status: Optional[SessionStatus] = None
    notes: Optional[str] = Field(default=None, max_length=15000)
    visibility: Optional[VisibilityLevel] = None
    allowed_user_ids: Optional[List[str]] = None
    event_ids: Optional[List[str]] = None


class SessionResponse(BaseModel):
    id: str
    campaign_id: str
    session_number: int
    title: str
    real_date: Optional[date] = None
    summary: str
    status: str
    notes: Optional[str] = None
    visibility: str
    allowed_user_ids: List[str] = Field(default_factory=list)
    events_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionDetailResponse(SessionResponse):
    events: List[Any] = Field(default_factory=list)


class PaginatedSessionsResponse(BaseModel):
    items: List[SessionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
