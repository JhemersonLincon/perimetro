from datetime import datetime, date
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.schemas.auth import UserResponse


class CalendarMonthConfig(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)
    days: int = Field(..., ge=1, le=500)


class CalendarConfigSchema(BaseModel):
    type: Literal["gregorian", "fictional"] = "gregorian"
    era_name: Optional[str] = Field(default="d.C.", max_length=40)
    months: List[CalendarMonthConfig] = Field(default_factory=list)


class CampaignCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=160)
    description: str = Field(default="", max_length=5000)
    cover_url: Optional[str] = Field(default=None, max_length=500)
    rpg_system: str = Field(..., min_length=1, max_length=120)
    start_date: Optional[date] = None
    calendar_config: Optional[CalendarConfigSchema] = None
    status: Literal["active", "archived"] = "active"


class CampaignUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=160)
    description: Optional[str] = Field(default=None, max_length=5000)
    cover_url: Optional[str] = Field(default=None, max_length=500)
    rpg_system: Optional[str] = Field(default=None, min_length=1, max_length=120)
    start_date: Optional[date] = None
    calendar_config: Optional[CalendarConfigSchema] = None
    status: Optional[Literal["active", "archived"]] = None


class CampaignMemberResponse(BaseModel):
    id: str
    campaign_id: str
    user_id: str
    role: str
    joined_at: datetime
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)


class InvitationCreate(BaseModel):
    email: Optional[EmailStr] = None
    expires_in_days: int = Field(default=7, ge=1, le=90)


class InvitationResponse(BaseModel):
    id: str
    campaign_id: str
    campaign_name: Optional[str] = None
    email: Optional[str] = None
    status: str
    expires_at: datetime
    created_at: datetime
    token: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CampaignResponse(BaseModel):
    id: str
    name: str
    description: str
    cover_url: Optional[str] = None
    rpg_system: str
    start_date: Optional[date] = None
    calendar_config: Dict[str, Any]
    status: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    user_role: str = "player"
    entities_count: int = 0
    sessions_count: int = 0
    events_count: int = 0
    members_count: int = 1

    model_config = ConfigDict(from_attributes=True)


class DashboardIndicators(BaseModel):
    events_count: int = 0
    characters_and_npcs_count: int = 0
    characters_count: int = 0
    npcs_count: int = 0
    locations_count: int = 0
    organizations_count: int = 0
    sessions_count: int = 0
    members_count: int = 0


class CampaignDashboardResponse(BaseModel):
    campaign: CampaignResponse
    indicators: DashboardIndicators
    recent_events: List[Any] = Field(default_factory=list)
    recent_sessions: List[Any] = Field(default_factory=list)


class CampaignCoverUploadResponse(BaseModel):
    cover_url: str
    filename: str
    content_type: str
    size: int
