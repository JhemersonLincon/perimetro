from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

from app.schemas.entity import EntitySummary
from app.schemas.session import SessionSummary

EventCategory = Literal[
    "investigacao",
    "descoberta",
    "encontro",
    "revelacao",
    "desaparecimento",
    "historico",
    "outro",
]
VisibilityLevel = Literal["private", "public", "restricted"]


class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=30000)
    calendar_type: Optional[Literal["gregorian", "fictional"]] = None
    narrative_date: Optional[str] = Field(default=None, max_length=120)
    narrative_year: Optional[int] = Field(default=None, ge=-999999, le=999999)
    narrative_month: Optional[int] = Field(default=None, ge=1, le=200)
    narrative_day: Optional[int] = Field(default=None, ge=1, le=1000)
    narrative_time: Optional[str] = Field(default=None, max_length=50)
    date_is_unknown: bool = False
    category: EventCategory = "investigacao"
    session_id: Optional[str] = None
    visibility: VisibilityLevel = "public"
    entity_ids: List[str] = Field(default_factory=list)
    allowed_user_ids: List[str] = Field(default_factory=list)


class EventUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=30000)
    calendar_type: Optional[Literal["gregorian", "fictional"]] = None
    narrative_date: Optional[str] = Field(default=None, max_length=120)
    narrative_year: Optional[int] = Field(default=None, ge=-999999, le=999999)
    narrative_month: Optional[int] = Field(default=None, ge=1, le=200)
    narrative_day: Optional[int] = Field(default=None, ge=1, le=1000)
    narrative_time: Optional[str] = Field(default=None, max_length=50)
    date_is_unknown: Optional[bool] = None
    category: Optional[EventCategory] = None
    session_id: Optional[str] = None
    visibility: Optional[VisibilityLevel] = None
    entity_ids: Optional[List[str]] = None
    allowed_user_ids: Optional[List[str]] = None


class EventResponse(BaseModel):
    id: str
    campaign_id: str
    title: str
    description: str
    calendar_type: str
    narrative_date: Optional[str] = None
    narrative_year: Optional[int] = None
    narrative_month: Optional[int] = None
    narrative_day: Optional[int] = None
    narrative_time: Optional[str] = None
    sort_key: Optional[int] = None
    date_is_unknown: bool
    category: str
    session_id: Optional[str] = None
    session: Optional[SessionSummary] = None
    visibility: str
    entities: List[EntitySummary] = Field(default_factory=list)
    allowed_user_ids: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedEventsResponse(BaseModel):
    items: List[EventResponse]
    undated_items: List[EventResponse] = Field(default_factory=list)
    total: int
    page: int
    page_size: int
    total_pages: int
