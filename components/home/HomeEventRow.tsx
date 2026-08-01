"use client";

import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Users,
} from "lucide-react";

import EventWatchButton from "@/components/events/EventWatchButton";
import type { EventItem } from "@/services/events";

type HomeEventRowProps = {
  event: EventItem;
  highlighted?: boolean;
  saved?: boolean;
  onSavedChange?: (saved: boolean) => void;
};

function formatEventDate(value?: string | null): string {
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

export default function HomeEventRow({
  event,
  highlighted = false,
  saved = false,
  onSavedChange,
}: HomeEventRowProps) {
  return (
    <article className={highlighted ? "rounded-row bg-secondary/80 px-4 py-4" : "rounded-row px-4 py-3.5 transition-colors hover:bg-surface"}>
      <div className="flex items-start gap-4">
        <Link href={`/events/${event.id}`} className="min-w-0 flex-1 rounded-control outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className="truncate text-[15px] font-bold text-zinc-950">
              {event.title || "Untitled event"}
            </h3>
            <span className="text-xs font-semibold text-primary">
              {getFormatLabel(event)}
            </span>
          </div>

          <p className="mt-1 truncate text-sm text-muted-foreground">
            Hosted by {event.host_nickname || "Unknown host"}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
              {formatEventDate(event.starts_at)}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
              <span className="max-w-64 truncate">{event.address_text || "Location TBD"}</span>
            </span>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {event.attendees_count || 0}/{event.max_players || 0}
          </span>
          {saved ? (
            <EventWatchButton
              eventId={event.id}
              initialWatched
              onChanged={onSavedChange}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
