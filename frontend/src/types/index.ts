export type VisibilityLevel = "public" | "private" | "restricted";
export type EntityCategory = "character" | "npc" | "location" | "organization";
export type EventCategory =
  | "investigacao"
  | "descoberta"
  | "encontro"
  | "revelacao"
  | "desaparecimento"
  | "historico"
  | "outro";

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CalendarMonthConfig {
  name: string;
  days: number;
}

export interface CalendarConfig {
  type: "gregorian" | "fictional";
  era_name?: string;
  months: CalendarMonthConfig[];
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  cover_url?: string | null;
  rpg_system: string;
  start_date?: string | null;
  calendar_config: CalendarConfig;
  status: "active" | "archived";
  owner_id: string;
  created_at: string;
  updated_at: string;
  user_role: "gm" | "player";
  entities_count: number;
  sessions_count: number;
  events_count: number;
  members_count: number;
}

export interface DashboardIndicators {
  events_count: number;
  characters_and_npcs_count: number;
  characters_count: number;
  npcs_count: number;
  locations_count: number;
  organizations_count: number;
  sessions_count: number;
  members_count: number;
}

export interface CampaignDashboard {
  campaign: Campaign;
  indicators: DashboardIndicators;
  recent_events: Array<{
    id: string;
    title: string;
    category: EventCategory;
    narrative_date?: string | null;
    date_is_unknown: boolean;
    visibility: VisibilityLevel;
    created_at: string;
  }>;
  recent_sessions: Array<{
    id: string;
    session_number: number;
    title: string;
    real_date?: string | null;
    status: string;
    visibility: VisibilityLevel;
    created_at: string;
  }>;
}

export interface CampaignMember {
  id: string;
  campaign_id: string;
  user_id: string;
  role: "gm" | "player";
  joined_at: string;
  user: User;
}

export interface CampaignInvitation {
  id: string;
  campaign_id: string;
  campaign_name?: string | null;
  email?: string | null;
  status: string;
  expires_at: string;
  created_at: string;
  token?: string | null;
}

export interface EntitySummary {
  id: string;
  campaign_id: string;
  name: string;
  category: EntityCategory;
  status: string;
  image_url?: string | null;
  visibility: VisibilityLevel;
}

export interface Entity extends EntitySummary {
  description: string;
  extra_info?: string | null;
  allowed_user_ids: string[];
  events_count: number;
  created_at: string;
  updated_at: string;
}

export interface EntityDetail extends Entity {
  related_events: Array<{
    id: string;
    title: string;
    description: string;
    category: EventCategory;
    narrative_date?: string | null;
    narrative_time?: string | null;
    date_is_unknown: boolean;
    visibility: VisibilityLevel;
    session_id?: string | null;
  }>;
  related_sessions: Array<{
    id: string;
    session_number: number;
    title: string;
    real_date?: string | null;
    status: string;
  }>;
}

export interface SessionSummary {
  id: string;
  campaign_id: string;
  session_number: number;
  title: string;
  real_date?: string | null;
  status: string;
  visibility: VisibilityLevel;
}

export interface GameSession extends SessionSummary {
  summary: string;
  notes?: string | null;
  allowed_user_ids: string[];
  events_count: number;
  created_at: string;
  updated_at: string;
}

export interface GameSessionDetail extends GameSession {
  events: Array<{
    id: string;
    title: string;
    description: string;
    category: EventCategory;
    narrative_date?: string | null;
    narrative_time?: string | null;
    date_is_unknown: boolean;
    visibility: VisibilityLevel;
  }>;
}

export interface TimelineEvent {
  id: string;
  campaign_id: string;
  title: string;
  description: string;
  calendar_type: "gregorian" | "fictional";
  narrative_date?: string | null;
  narrative_year?: number | null;
  narrative_month?: number | null;
  narrative_day?: number | null;
  narrative_time?: string | null;
  sort_key?: number | null;
  date_is_unknown: boolean;
  category: EventCategory;
  session_id?: string | null;
  session?: SessionSummary | null;
  visibility: VisibilityLevel;
  entities: EntitySummary[];
  allowed_user_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface PaginatedEvents {
  items: TimelineEvent[];
  undated_items: TimelineEvent[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginatedEntities {
  items: Entity[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaginatedSessions {
  items: GameSession[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
