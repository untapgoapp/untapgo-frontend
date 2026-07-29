import {
  api,
  type EventItem,
} from "@/lib/api";

export type { EventItem } from "@/lib/api";

export type AttendanceMethod =
  | "none"
  | "host"
  | "qr";

export type AttendanceStatus =
  | "expected"
  | "checked_in"
  | "attended"
  | "no_show"
  | "excused"
  | "disputed";

export type EventAttendanceParticipant = {
  user_id: string;
  nickname?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  attendance_status: AttendanceStatus;
  verification_method?: "host" | "qr" | null;
  checked_in_at?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  joined_at?: string | null;
};

export type EventAttendanceRoster = {
  event_id: string;
  attendance_method: AttendanceMethod;
  allow_walk_ins: boolean;
  attendance_finalized_at?: string | null;
  can_finalize: boolean;
  participants: EventAttendanceParticipant[];
};

export type EventAttendanceUpdateResult = {
  user_id: string;
  attendance_status: AttendanceStatus;
  verification_method?: "host" | "qr" | null;
  checked_in_at?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
};

export type AttendanceFinalizeResult = {
  ok: boolean;
  event_id: string;
  finalized_at: string;
  attended_from_check_in: number;
  marked_no_show: number;
};

export type AttendanceQrSession = {
  token: string;
  check_in_url: string;
  expires_at: string;
  refresh_after_seconds: number;
  opens_at: string;
  closes_at: string;
};

export type AttendanceQrCheckInResult = {
  ok: boolean;
  event_id: string;
  event_title?: string | null;
  attendance_status:
    | "checked_in"
    | "attended";
  joined_as_walk_in: boolean;
  already_checked_in: boolean;
  checked_in_at: string;
  members: number;
  max_players: number;
  event_status: string;
};

export type FeedbackSentiment =
  | "positive"
  | "neutral"
  | "negative";

export type FeedbackReasonCode =
  | "late_arrival"
  | "poor_communication"
  | "disrespectful_behaviour"
  | "event_details_inaccurate"
  | "host_absent"
  | "unsafe_behaviour"
  | "other";

export type EventFeedbackTarget = {
  user_id: string;
  nickname?: string | null;
  avatar_url?: string | null;
  role: "host" | "player";
  attendance_status?: AttendanceStatus | null;

  my_sentiment?: FeedbackSentiment | null;
  my_reason_code?: FeedbackReasonCode | null;

  received_revealed: boolean;
  received_sentiment?: FeedbackSentiment | null;
  received_reason_code?: FeedbackReasonCode | null;
};

export type EventFeedbackContext = {
  event_id: string;
  event_title: string;
  viewer_role:
    | "none"
    | "host"
    | "player";
  attendance_verified: boolean;
  event_cancelled: boolean;
  feedback_open: boolean;
  opens_at: string;
  closes_at: string;
  targets: EventFeedbackTarget[];
};

export type EventFeedbackSubmitResult = {
  ok: boolean;
  event_id: string;
  reviewee_id: string;
  reviewee_role: "host" | "player";
  sentiment: FeedbackSentiment;
  reason_code?: FeedbackReasonCode | null;
  updated_at: string;
  received_revealed: boolean;
  received_sentiment?: FeedbackSentiment | null;
  received_reason_code?: FeedbackReasonCode | null;
};

export type EventActionResult = {
  ok?: boolean;
  success?: boolean;

  requested?: boolean;
  already_requested?: boolean;
  already_joined?: boolean;

  my_status?: string;
  is_playing?: boolean;

  cooldown_seconds?: number | null;

  members?: number;
  player_count?: number;
  max_players?: number;
  event_status?: string;
};

export type EventAttendee = {
  id?: string;
  user_id?: string;
  nickname?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  status?: string | null;
  visible_status?: string | null;
  is_playing?: boolean | null;
  cooldown_until?: string | null;
  joined_at?: string | null;
};

export type EventJoinRequest = {
  id?: string;
  user_id?: string;
  nickname?: string | null;
  avatar_url?: string | null;
  status?: string | null;
  requested_at?: string | null;
};

export type EventDeckVisibility =
  | "private"
  | "name"
  | "full";

export type EventDeckBrief = {
  id: string;
  name: string;
  format_slug?: string | null;
  image_url?: string | null;
  is_public?: boolean;
  export_text?: string | null;
};

export type EventPlayerDeck = {
  user_id: string;
  nickname?: string | null;
  visibility: EventDeckVisibility;
  deck?: EventDeckBrief | null;
};

export type EventDecksResponse = {
  decks: EventPlayerDeck[];
};

export type EventDeckSelectionResult = {
  ok?: boolean;
  success?: boolean;
  deck_id?: string | null;
  visibility?: EventDeckVisibility;
};

export type CreateEventPayload = {
  title: string;
  description?: string;

  starts_at: string;
  duration_minutes: number;
  max_players: number;

  format_slug: string;
  power_level: string;
  proxies_policy: string;

  address_text: string;
  place_id: string;
  lat: number | null;
  lng: number | null;

  host_notes?: string;
  auto_join: boolean;

  attendance_method: AttendanceMethod;
  allow_walk_ins: boolean;
};

export type UpdateEventPayload = {
  title?: string;
  description?: string;

  starts_at?: string;
  duration_minutes?: number;
  max_players?: number;
  format_slug?: string;

  address_text?: string;
  place_id?: string;
  lat?: number | null;
  lng?: number | null;

  power_level?: string | null;
  proxies_policy?: string | null;
  host_notes?: string | null;

  attendance_method?: AttendanceMethod;
  allow_walk_ins?: boolean;
};

export async function getEvents(): Promise<
  EventItem[]
> {
  const result =
    await api.get<
      | EventItem[]
      | {
          events?: EventItem[];
          data?: EventItem[];
        }
    >("/public/events");

  if (Array.isArray(result)) {
    return result;
  }

  return (
    result.events ??
    result.data ??
    []
  );
}

export async function getEvent(
  id: string
): Promise<EventItem> {
  return api.get<EventItem>(
    `/public/events/${id}`
  );
}

export async function getPrivateEvent(
  id: string
): Promise<EventItem> {
  return api.get<EventItem>(
    `/events/${id}`
  );
}

export async function createEvent(
  payload: CreateEventPayload
): Promise<EventItem> {
  return api.post<EventItem>(
    "/events",
    payload
  );
}

export async function updateEvent(
  id: string,
  payload: UpdateEventPayload
): Promise<EventItem> {
  return api.patch<EventItem>(
    `/events/${id}`,
    payload
  );
}

export async function joinEvent(
  id: string
): Promise<EventActionResult> {
  return api.post<EventActionResult>(
    `/events/${id}/join`,
    {}
  );
}

export async function leaveEvent(
  id: string
): Promise<EventActionResult> {
  return api.post<EventActionResult>(
    `/events/${id}/leave`,
    {}
  );
}

export async function cancelEvent(
  id: string
): Promise<EventActionResult> {
  return api.post<EventActionResult>(
    `/events/${id}/cancel`,
    {}
  );
}

export async function getEventAttendees(
  id: string
): Promise<EventAttendee[]> {
  return api.get<EventAttendee[]>(
    `/events/${id}/attendees`
  );
}

export async function getEventRequests(
  id: string
): Promise<
  EventJoinRequest[]
> {
  return api.get<
    EventJoinRequest[]
  >(
    `/events/${id}/requests`
  );
}

export async function acceptEventRequest({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}): Promise<EventActionResult> {
  return api.post<EventActionResult>(
    `/events/${eventId}/accept`,
    {
      user_id: userId,
    }
  );
}

export async function rejectEventRequest({
  eventId,
  userId,
  cooldownMinutes = 10,
}: {
  eventId: string;
  userId: string;
  cooldownMinutes?: number;
}): Promise<EventActionResult> {
  return api.post<EventActionResult>(
    `/events/${eventId}/reject`,
    {
      user_id: userId,
      cooldown_minutes:
        cooldownMinutes,
    }
  );
}

export async function kickEventAttendee({
  eventId,
  userId,
  cooldownMinutes = 10,
}: {
  eventId: string;
  userId: string;
  cooldownMinutes?: number;
}): Promise<EventActionResult> {
  return api.post<EventActionResult>(
    `/events/${eventId}/kick`,
    {
      user_id: userId,
      cooldown_minutes:
        cooldownMinutes,
    }
  );
}



export async function getEventAttendance(
  eventId: string,
): Promise<EventAttendanceRoster> {
  return api.get<EventAttendanceRoster>(
    `/events/${encodeURIComponent(
      eventId,
    )}/attendance`,
  );
}

export async function updateEventAttendance({
  eventId,
  userId,
  status,
}: {
  eventId: string;
  userId: string;
  status:
    | "expected"
    | "attended"
    | "no_show"
    | "excused";
}): Promise<EventAttendanceUpdateResult> {
  return api.patch<EventAttendanceUpdateResult>(
    `/events/${encodeURIComponent(
      eventId,
    )}/attendance/${encodeURIComponent(
      userId,
    )}`,
    { status },
  );
}

export async function finalizeEventAttendance(
  eventId: string,
): Promise<AttendanceFinalizeResult> {
  return api.post<AttendanceFinalizeResult>(
    `/events/${encodeURIComponent(
      eventId,
    )}/attendance/finalize`,
    {},
  );
}

export async function createEventQrSession(
  eventId: string,
): Promise<AttendanceQrSession> {
  return api.post<AttendanceQrSession>(
    `/events/${encodeURIComponent(
      eventId,
    )}/attendance/qr-session`,
    {},
  );
}

export async function checkInWithEventQr(
  token: string,
): Promise<AttendanceQrCheckInResult> {
  return api.post<AttendanceQrCheckInResult>(
    "/events/attendance/qr/check-in",
    {
      token,
    },
  );
}


export async function getEventFeedback(
  eventId: string,
): Promise<EventFeedbackContext> {
  return api.get<EventFeedbackContext>(
    `/events/${encodeURIComponent(
      eventId,
    )}/feedback`,
  );
}

export async function submitEventFeedback({
  eventId,
  revieweeId,
  sentiment,
  reasonCode,
}: {
  eventId: string;
  revieweeId: string;
  sentiment: FeedbackSentiment;
  reasonCode?: FeedbackReasonCode | null;
}): Promise<EventFeedbackSubmitResult> {
  return api.put<EventFeedbackSubmitResult>(
    `/events/${encodeURIComponent(
      eventId,
    )}/feedback/${encodeURIComponent(
      revieweeId,
    )}`,
    {
      sentiment,
      reason_code:
        sentiment === "negative"
          ? reasonCode ?? null
          : null,
    },
  );
}


export async function getEventDecks(
  eventId: string
): Promise<EventDecksResponse> {
  const result =
    await api.get<
      | EventDecksResponse
      | EventPlayerDeck[]
    >(
      `/events/${eventId}/decks`
    );

  if (Array.isArray(result)) {
    return {
      decks: result,
    };
  }

  return {
    decks:
      result.decks ?? [],
  };
}

export async function setMyEventDeck({
  eventId,
  deckId,
  visibility,
}: {
  eventId: string;
  deckId: string;
  visibility: EventDeckVisibility;
}): Promise<EventDeckSelectionResult> {
  return api.put<EventDeckSelectionResult>(
    `/events/${eventId}/my-deck`,
    {
      deck_id: deckId,
      visibility,
    }
  );
}

export async function clearMyEventDeck(
  eventId: string
): Promise<EventDeckSelectionResult> {
  return api.delete<EventDeckSelectionResult>(
    `/events/${eventId}/my-deck`
  );
}

export async function getMyEvents(): Promise<
  EventItem[]
> {
  const result =
    await api.get<
      | EventItem[]
      | {
          events?: EventItem[];
          data?: EventItem[];
        }
    >("/events/mine");

  if (Array.isArray(result)) {
    return result;
  }

  return (
    result.events ??
    result.data ??
    []
  );
}

export const WATCHLIST_CHANGED_EVENT =
  "untapgo:watchlist-changed";

export type WatchlistChangedDetail = {
  eventId: string;
  watched: boolean;
};

export type WatchEventResult = {
  success?: boolean;
  ok?: boolean;
};

let watchlistCache:
  | EventItem[]
  | null = null;

let watchlistRequest:
  | Promise<EventItem[]>
  | null = null;

function normalizeEventList(
  result:
    | EventItem[]
    | {
        events?: EventItem[];
        data?: EventItem[];
      },
): EventItem[] {
  if (Array.isArray(result)) {
    return result;
  }

  return (
    result.events ??
    result.data ??
    []
  );
}

function emitWatchlistChanged(
  eventId: string,
  watched: boolean,
): void {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<WatchlistChangedDetail>(
      WATCHLIST_CHANGED_EVENT,
      {
        detail: {
          eventId,
          watched,
        },
      },
    ),
  );
}

export async function getWatchlist({
  force = false,
}: {
  force?: boolean;
} = {}): Promise<EventItem[]> {
  if (
    !force &&
    watchlistCache
  ) {
    return watchlistCache;
  }

  if (
    !force &&
    watchlistRequest
  ) {
    return watchlistRequest;
  }

  const request =
    api
      .get<
        | EventItem[]
        | {
            events?: EventItem[];
            data?: EventItem[];
          }
      >("/events/watchlist")
      .then((result) => {
        const events =
          normalizeEventList(
            result,
          );

        watchlistCache =
          events;

        return events;
      })
      .finally(() => {
        watchlistRequest =
          null;
      });

  watchlistRequest = request;

  return request;
}

export async function watchEvent(
  eventId: string,
): Promise<WatchEventResult> {
  const result =
    await api.post<WatchEventResult>(
      `/events/${encodeURIComponent(
        eventId,
      )}/watch`,
      {},
    );

  watchlistCache = null;

  emitWatchlistChanged(
    eventId,
    true,
  );

  return result;
}

export async function unwatchEvent(
  eventId: string,
): Promise<WatchEventResult> {
  const result =
    await api.delete<WatchEventResult>(
      `/events/${encodeURIComponent(
        eventId,
      )}/watch`,
    );

  if (watchlistCache) {
    watchlistCache =
      watchlistCache.filter(
        (event) =>
          String(event.id) !==
          String(eventId),
      );
  }

  emitWatchlistChanged(
    eventId,
    false,
  );

  return result;
}

export function invalidateWatchlist(): void {
  watchlistCache = null;
}