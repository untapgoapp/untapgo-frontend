export type EventMembershipState =
  | "not_joined"
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "left"
  | "host";

const CONFIRMED_STATUSES = new Set([
  "accepted",
  "approved",
  "confirmed",
  "joined",
  "playing",
]);

const PENDING_STATUSES = new Set([
  "pending",
  "request",
  "requested",
]);

const REJECTED_STATUSES = new Set([
  "declined",
  "rejected",
]);

const CANCELLED_STATUSES = new Set([
  "canceled",
  "cancelled",
  "withdrawn",
]);

const LEFT_STATUSES = new Set([
  "kicked",
  "left",
  "removed",
]);

export function normalizeMembershipStatus(
  value?: string | null,
): string {
  return (value ?? "").trim().toLowerCase();
}

export function getEventMembershipState({
  status,
  isHost = false,
  legacyIsJoined,
  legacyIsPlaying,
}: {
  status?: string | null;
  isHost?: boolean;
  legacyIsJoined?: boolean | null;
  legacyIsPlaying?: boolean | null;
}): EventMembershipState {
  if (isHost) {
    return "host";
  }

  const normalized = normalizeMembershipStatus(status);

  if (normalized) {
    if (CONFIRMED_STATUSES.has(normalized)) return "confirmed";
    if (
      PENDING_STATUSES.has(normalized) ||
      normalized.includes("pend") ||
      normalized.includes("request")
    ) {
      return "pending";
    }
    if (REJECTED_STATUSES.has(normalized)) return "rejected";
    if (CANCELLED_STATUSES.has(normalized)) return "cancelled";
    if (LEFT_STATUSES.has(normalized)) return "left";
    if (normalized === "host") return "host";
    return "not_joined";
  }

  // Compatibility only for old responses that contain no explicit status.
  return legacyIsPlaying === true || legacyIsJoined === true
    ? "confirmed"
    : "not_joined";
}

export function isConfirmedMembership(
  state: EventMembershipState,
): boolean {
  return state === "confirmed";
}

export function isPendingMembership(
  state: EventMembershipState,
): boolean {
  return state === "pending";
}

export function canSelectEventDeck(
  state: EventMembershipState,
): boolean {
  return state === "confirmed";
}

export function canRequestEventSeat(
  state: EventMembershipState,
): boolean {
  return [
    "not_joined",
    "rejected",
    "cancelled",
    "left",
  ].includes(state);
}
