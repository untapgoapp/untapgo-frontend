export type TrustDisplayState =
  | "available"
  | "not_enough_data"
  | "private";

export type PlayerTrustSummary = {
  eligible_events: number | null;
  verified_attendances: number | null;
  rate: number | null;
  display_state: TrustDisplayState;
};

export type HostTrustSummary = {
  eligible_events: number | null;
  completed_events: number | null;
  cancelled_events: number | null;
  rate: number | null;
  display_state: TrustDisplayState;
};

export type ProfileTrustSummary = {
  player: PlayerTrustSummary;
  host: HostTrustSummary;
};

export function buildProfileTrustPath(profileId: string): string {
  return `/profiles/${encodeURIComponent(profileId)}/trust`;
}

export function formatTrustRate(
  rate: number | null,
  displayState: TrustDisplayState,
): string | null {
  if (displayState !== "available" || rate == null) {
    return null;
  }

  return `${Math.round(Math.max(0, Math.min(1, rate)) * 100)}%`;
}

export function pluralizeEvents(count: number): string {
  return count === 1 ? "event" : "events";
}

export function getPlayerTrustText(metric: PlayerTrustSummary): string {
  const eligible = metric.eligible_events ?? 0;
  const verified = metric.verified_attendances ?? 0;

  if (metric.display_state === "private") {
    return "Verified attendance is private.";
  }

  if (metric.display_state !== "available") {
    return `Not enough verified activity yet · ${eligible} eligible ${pluralizeEvents(eligible)}`;
  }

  return `Verified at ${verified} of ${eligible} eligible ${pluralizeEvents(eligible)}.`;
}

export function getHostTrustText(metric: HostTrustSummary): string {
  const eligible = metric.eligible_events ?? 0;
  const completed = metric.completed_events ?? 0;
  const cancelled = metric.cancelled_events ?? 0;

  if (metric.display_state === "private") {
    return "Host activity is private.";
  }

  if (metric.display_state !== "available") {
    return `Not enough hosting activity yet · ${eligible} eligible ${pluralizeEvents(eligible)}`;
  }

  const cancellationText = cancelled > 0
    ? ` ${cancelled} cancelled.`
    : "";

  return `Hosted ${completed} completed ${pluralizeEvents(completed)} out of ${eligible} eligible.${cancellationText}`;
}
