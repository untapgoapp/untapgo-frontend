import { deckRoutes } from "@/lib/deck-routes";
import {
  getEventMembershipState,
  isConfirmedMembership,
} from "@/lib/event-membership";
import {
  getDeckColors,
  getDeckCommanderName,
  getDeckExportText,
  getDeckFormatSlug,
  getDeckImageUrl,
  getDeckUrl,
  type PublicDeck,
} from "@/services/profiles";
import type { EventItem } from "@/services/events";
import type { Deck } from "@/types/decks";

export type ProfileDeckView = {
  id: string;
  name: string;
  commander: string | null;
  format: string | null;
  imageUrl: string | null;
  exportText: string | null;
  colors: string[];
  href: string | null;
  external: boolean;
  isPublic: boolean | null;
};

export type ProfileEventView = {
  event: EventItem;
  relationship: "Hosting" | "Playing";
};

const CANCELLED_EVENT_STATUSES = new Set([
  "cancelled",
  "canceled",
  "deleted",
]);

const FINISHED_EVENT_STATUSES = new Set([
  "completed",
  "ended",
  "finished",
]);

const NON_UPCOMING_EVENT_STATUSES = new Set([
  ...CANCELLED_EVENT_STATUSES,
  ...FINISHED_EVENT_STATUSES,
  "in_progress",
  "started",
]);

function clean(value?: string | null): string | null {
  return value?.trim() || null;
}

function eventTimestamp(event: EventItem): number | null {
  if (!event.starts_at) return null;
  const timestamp = new Date(event.starts_at).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function eventStatus(event: EventItem): string {
  return (event.status ?? "").trim().toLowerCase();
}

function isUpcomingEvent(event: EventItem, now: number): boolean {
  const timestamp = eventTimestamp(event);
  return (
    timestamp !== null &&
    timestamp > now &&
    !NON_UPCOMING_EVENT_STATUSES.has(eventStatus(event))
  );
}

function isFinishedEvent(event: EventItem, now: number): boolean {
  if (CANCELLED_EVENT_STATUSES.has(eventStatus(event))) return false;
  if (FINISHED_EVENT_STATUSES.has(eventStatus(event))) return true;

  const timestamp = eventTimestamp(event);
  if (timestamp === null || timestamp > now) return false;

  const duration = Math.max(0, event.duration_minutes ?? 0) * 60_000;
  return timestamp + duration <= now;
}

function ownerRelationship(
  event: EventItem,
  userId: string,
): ProfileEventView["relationship"] | null {
  const isHost = event.host_user_id === userId;
  const membership = getEventMembershipState({
    status: event.my_status,
    isHost,
    legacyIsJoined: event.is_joined,
    legacyIsPlaying: event.my_is_playing,
  });

  if (membership === "host") return "Hosting";
  return isConfirmedMembership(membership) ? "Playing" : null;
}

export function normalizeOwnerDeck(deck: Deck): ProfileDeckView {
  const name = clean(deck.name) ?? clean(deck.commander_name) ?? "Unnamed deck";
  const commander = clean(deck.commander_name);
  const fallbackColors = [
    deck.color_white && "W",
    deck.color_blue && "U",
    deck.color_black && "B",
    deck.color_red && "R",
    deck.color_green && "G",
    deck.color_colorless && "C",
  ].filter((color): color is string => Boolean(color));

  return {
    id: deck.id,
    name,
    commander: commander === name ? null : commander,
    format: clean(deck.format_slug),
    imageUrl: clean(deck.image_url),
    exportText: clean(deck.export_text),
    colors: Array.isArray(deck.color_identity) && deck.color_identity.length > 0
      ? deck.color_identity
      : fallbackColors,
    href: deckRoutes.detail(deck.id),
    external: false,
    isPublic: deck.is_public,
  };
}

export function normalizePublicDeck(deck: PublicDeck): ProfileDeckView {
  const deckUrl = getDeckUrl(deck);
  let safeUrl: string | null = null;

  if (deckUrl) {
    try {
      const url = new URL(deckUrl);
      safeUrl = url.protocol === "http:" || url.protocol === "https:" ? deckUrl : null;
    } catch {
      safeUrl = null;
    }
  }

  return {
    id: deck.id,
    name: getDeckCommanderName(deck),
    commander: null,
    format: getDeckFormatSlug(deck),
    imageUrl: getDeckImageUrl(deck),
    exportText: getDeckExportText(deck),
    colors: getDeckColors(deck),
    href: safeUrl,
    external: true,
    isPublic: null,
  };
}

export function selectOwnerProfileEvents(
  events: EventItem[],
  userId: string,
  now = Date.now(),
): { upcoming: ProfileEventView[]; recent: ProfileEventView[] } {
  const relevant = events.flatMap((event) => {
    const relationship = ownerRelationship(event, userId);
    return relationship ? [{ event, relationship }] : [];
  });

  return {
    upcoming: relevant
      .filter(({ event }) => isUpcomingEvent(event, now))
      .sort((a, b) => (eventTimestamp(a.event) ?? 0) - (eventTimestamp(b.event) ?? 0)),
    recent: relevant
      .filter(({ event }) => isFinishedEvent(event, now))
      .sort((a, b) => (eventTimestamp(b.event) ?? 0) - (eventTimestamp(a.event) ?? 0)),
  };
}

export function selectPublicHostedEvents(
  events: EventItem[],
  userId: string,
  now = Date.now(),
): ProfileEventView[] {
  return events
    .filter((event) => event.host_user_id === userId && isUpcomingEvent(event, now))
    .sort((a, b) => (eventTimestamp(a) ?? 0) - (eventTimestamp(b) ?? 0))
    .map((event) => ({ event, relationship: "Hosting" }));
}
