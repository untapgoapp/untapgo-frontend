import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  Layers3,
  LibraryBig,
  MapPin,
  Users,
} from "lucide-react";

import type { EventItem } from "@/services/events";

type HomeRightSidebarProps = {
  nextEvent: EventItem | null;
  pendingRequests: number | null;
  savedEventsCount: number | null;
};

function formatNextEventDate(value?: string | null): string {
  if (!value) return "Date TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBD";

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getFormatLabel(event: EventItem): string {
  if (event.format) return event.format;
  if (!event.format_slug) return "Magic";

  return event.format_slug
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function HomeRightSidebar({
  nextEvent,
  pendingRequests,
  savedEventsCount,
}: HomeRightSidebarProps) {
  return (
    <div className="space-y-4">
      {nextEvent ? (
        <section className="rounded-surface border border-border/70 bg-surface p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary">
            Next event
          </p>
          <h2 className="mt-2 text-base font-bold leading-5 tracking-tight">
            {nextEvent.title || "Untitled event"}
          </h2>
          <p className="mt-1 text-sm font-semibold text-secondary-foreground">
            {getFormatLabel(nextEvent)}
          </p>

          <div className="mt-3 grid gap-2 text-xs leading-5 text-muted-foreground">
            <span className="inline-flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {formatNextEventDate(nextEvent.starts_at)}
            </span>
            <span className="inline-flex min-w-0 items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="line-clamp-2">{nextEvent.address_text || "Location TBD"}</span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {nextEvent.attendees_count || 0}/{nextEvent.max_players || 0} players
            </span>
          </div>

          <Link
            href={`/events/${nextEvent.id}`}
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover"
          >
            View event
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      {pendingRequests !== null && pendingRequests > 0 ? (
        <section className="rounded-surface border border-border/70 bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold tracking-tight">Needs your attention</h2>
            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-secondary px-1.5 text-xs font-bold text-secondary-foreground">
              {pendingRequests}
            </span>
          </div>

          <Link
            href="/events/mine"
            className="mt-3 flex items-center justify-between gap-3 rounded-row bg-surface-subtle px-3 py-3 text-sm transition-colors hover:bg-secondary/65"
          >
            <span>
              <strong className="block font-semibold text-foreground">
                Review event requests
              </strong>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {pendingRequests} waiting for a decision
              </span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      <section className="rounded-surface border border-border/70 bg-surface p-2">
        <h2 className="px-2 pb-1 pt-2 text-sm font-bold tracking-tight">
          Quick links
        </h2>
        <nav aria-label="Home quick links" className="mt-1 grid gap-0.5">
          <Link
            href="/events/saved"
            className="flex min-h-10 items-center gap-3 rounded-row px-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-secondary-foreground"
          >
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            <span className="min-w-0 flex-1">Saved events</span>
            {savedEventsCount !== null && savedEventsCount > 0 ? (
              <span className="text-xs font-bold text-primary">{savedEventsCount}</span>
            ) : null}
          </Link>
          <Link
            href="/binder?view=matches"
            className="flex min-h-10 items-center gap-3 rounded-row px-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-secondary-foreground"
          >
            <LibraryBig className="h-4 w-4" aria-hidden="true" />
            <span>Binder matches</span>
          </Link>
          <Link
            href="/decks?view=mine"
            className="flex min-h-10 items-center gap-3 rounded-row px-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-secondary-foreground"
          >
            <Layers3 className="h-4 w-4" aria-hidden="true" />
            <span>My decks</span>
          </Link>
          <Link
            href="/playgroups"
            className="flex min-h-10 items-center gap-3 rounded-row px-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-secondary-foreground"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>My Playgroups</span>
          </Link>
        </nav>
      </section>
    </div>
  );
}
