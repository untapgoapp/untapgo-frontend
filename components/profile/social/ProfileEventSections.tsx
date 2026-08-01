import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

import type { ProfileEventView } from "./profile-view-data";

type ProfileEventSectionsProps = {
  upcoming: ProfileEventView[] | null;
  recent?: ProfileEventView[] | null;
  failed: boolean;
  isOwner: boolean;
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

function formatEventFormat(value?: string | null): string | null {
  if (!value) return null;
  return value
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function EventRow({ item }: { item: ProfileEventView }) {
  const { event, relationship } = item;
  const format = event.format || formatEventFormat(event.format_slug);

  return (
    <Link
      href={`/events/${encodeURIComponent(event.id)}`}
      className="group flex items-start gap-3 rounded-row px-2 py-3.5 outline-none transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/15 sm:px-3"
    >
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-control bg-secondary text-primary">
        <CalendarDays size={17} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="truncate text-sm font-bold text-foreground group-hover:text-primary">
            {event.title || "Untitled event"}
          </span>
          {format ? <span className="text-xs font-semibold text-primary">{format}</span> : null}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{formatEventDate(event.starts_at)}</span>
          {event.address_text ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin size={12} className="shrink-0" aria-hidden="true" />
              <span className="max-w-72 truncate">{event.address_text}</span>
            </span>
          ) : null}
        </span>
      </span>
      <span className="shrink-0 text-[10px] font-semibold text-quiet-foreground">
        {relationship}
      </span>
    </Link>
  );
}

function EventSkeletons({ count }: { count: number }) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} className="flex animate-pulse items-center gap-3 px-3 py-4">
      <div className="h-9 w-9 rounded-lg bg-black/[0.07]" />
      <div className="flex-1">
        <div className="h-4 w-2/3 rounded bg-black/10" />
        <div className="mt-2 h-3 w-1/2 rounded bg-black/[0.06]" />
      </div>
    </div>
  ));
}

export default function ProfileEventSections({
  upcoming,
  recent,
  failed,
  isOwner,
}: ProfileEventSectionsProps) {
  return (
    <section id="events" aria-labelledby="profile-events-title" className="scroll-mt-6 py-2">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="profile-events-title" className="text-lg font-semibold tracking-tight">Events</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isOwner ? "Tables you host or have a confirmed seat at." : "Upcoming tables hosted by this player."}
          </p>
        </div>
        {isOwner ? (
          <Link href="/events/mine" className="shrink-0 text-sm font-semibold text-primary hover:underline">
            View all
          </Link>
        ) : null}
      </div>

      <div className="mt-3 grid gap-1 rounded-surface bg-surface/55 p-1">
        {upcoming === null && !failed ? <EventSkeletons count={3} /> : null}
        {failed ? <p className="rounded-row bg-surface-subtle px-3 py-4 text-sm text-muted-foreground">Events could not be loaded right now.</p> : null}
        {!failed && upcoming?.slice(0, 6).map((event) => <EventRow key={event.event.id} item={event} />)}
        {!failed && upcoming?.length === 0 ? (
          <p className="rounded-row px-3 py-4 text-sm text-muted-foreground">
            {isOwner ? "No upcoming hosted or confirmed events." : "No upcoming hosted events."}
          </p>
        ) : null}
      </div>

      {!failed && recent && recent.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-xs font-semibold text-quiet-foreground">Recent games</h3>
          <div className="mt-2 grid gap-1 rounded-surface bg-surface/55 p-1">
            {recent.slice(0, 3).map((event) => <EventRow key={event.event.id} item={event} />)}
          </div>
        </div>
      ) : null}
    </section>
  );
}
