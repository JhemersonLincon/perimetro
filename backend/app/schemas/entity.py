from datetime import datetime
from typing import Any, List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

EntityCategory = Literal["character", "npc", "location", "organization"]
VisibilityLevel = Literal["private", "public", "restricted"]


class EntitySummary(BaseModel):
    id: str
    campaign_id: str
    name: str
    category: str
    status: str
    image_url: Optional[str] = None
    visibility: str

    model_config = ConfigDict(from_attributes=True)


class EntityCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=160)
    category: EntityCategory
    description: str = Field(default="", max_length=20000)
    extra_info: Optional[str] = Field(default=None, max_length=10000)
    image_url: Optional[str] = Field(default=None, max_length=500)
    status: str = Field(default="ativo", min_length=1, max_length=40)
    visibility: VisibilityLevel = "public"
    allowed_user_ids: List[str] = Field(default_factory=list)


class EntityUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=160)
    category: Optional[EntityCategory] = None
    description: Optional[str] = Field(default=None, max_length=20000)
    extra_info: Optional[str] = Field(default=None, max_length=10000)
    image_url: Optional[str] = Field(default=None, max_length=500)
    status: Optional[str] = Field(default=None, min_length=1, max_length=40)
    visibility: Optional[VisibilityLevel] = None
    allowed_user_ids: Optional[List[str]] = None


class EntityResponse(BaseModel):
    id: str
    campaign_id: str
    name: str
    category: str
    description: str
    extra_info: Optional[str] = None
    image_url: Optional[str] = None
    status: str
    visibility: str
    allowed_user_ids: List[str] = Field(default_factory=list)
    events_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EntityDetailResponse(EntityResponse):
    related_events: List[Any] = Field(default_factory=list)
    related_sessions: List[Any] = Field(default_factory=list)


class PaginatedEntitiesResponse(BaseModel):
    items: List[EntityResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
