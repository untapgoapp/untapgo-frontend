export type EventItem = {
  id: string;
  title: string;

  address_text?: string | null;
  lat?: number | null;
  lng?: number | null;

  status: string;
  starts_at: string;

  attendees_count: number;
  max_players: number;

  host_user_id: string;
  host_nickname: string;

  is_joined?: boolean;

  format_slug?: string | null;
  format?: string | null;

  proxies_policy?: string | null;
  power_level?: string | null;
  host_notes?: string | null;

  distance_km?: number | null;

  my_status?: string | null;
  cooldown_seconds?: number | null;

  pending_requests_count?: number | null;
};