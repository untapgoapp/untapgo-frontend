"use client";

import Link from "next/link";
import type { FC } from "react";

import EventWatchButton from "@/components/events/EventWatchButton";
import {
  useDistanceUnit,
} from "@/components/settings/DistanceUnitProvider";
import {
  formatDistanceAway,
} from "@/lib/distance";
import type {
  EventItem,
} from "@/lib/api";

type EventCardProps = {
  event: EventItem;
  initialWatched?: boolean;
  onWatchChange?: (
    watched: boolean,
  ) => void;
};

function normalizeStatus(
  status?: string | null,
): string {
  return (status || "")
    .trim()
    .toLowerCase();
}

function getFormatLabel(
  event: EventItem,
): string {
  if (event.format) {
    return event.format;
  }

  if (!event.format_slug) {
    return "Magic";
  }

  return event.format_slug
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function getStatusLabel(
  status?: string | null,
): string {
  const normalized =
    normalizeStatus(
      status,
    );

  if (
    normalized === "open"
  ) {
    return "Open";
  }

  if (
    normalized === "full"
  ) {
    return "Full";
  }

  if (
    normalized === "started"
  ) {
    return "Started";
  }

  if (
    normalized === "ended" ||
    normalized === "finished"
  ) {
    return "Finished";
  }

  if (
    normalized ===
      "cancelled" ||
    normalized ===
      "canceled"
  ) {
    return "Cancelled";
  }

  return status || "Event";
}

function getStatusClasses(
  status?: string | null,
): string {
  const normalized = normalizeStatus(status);

  if (normalized === "open") return "bg-secondary text-secondary-foreground";
  if (normalized === "full") return "bg-warning-subtle text-warning";
  if (normalized === "cancelled" || normalized === "canceled") {
    return "bg-destructive-subtle text-destructive";
  }

  return "bg-muted text-muted-foreground";
}

function formatEventDate(
  value?: string | null,
): string {
  if (!value) {
    return "Date TBD";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Date TBD";
  }

  const now = new Date();

  const isToday =
    date.toDateString() ===
    now.toDateString();

  const tomorrow =
    new Date(now);

  tomorrow.setDate(
    now.getDate() + 1,
  );

  const isTomorrow =
    date.toDateString() ===
    tomorrow.toDateString();

  const time =
    new Intl.DateTimeFormat(
      "en",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(date);

  if (isToday) {
    return `Today ${time}`;
  }

  if (isTomorrow) {
    return `Tomorrow ${time}`;
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function getLocationLabel(
  event: EventItem,
): string {
  const raw = (
    event.address_text || ""
  ).trim();

  if (!raw) {
    return "Location TBD";
  }

  const parts = raw
    .split(",")
    .map((part) =>
      part.trim(),
    )
    .filter(Boolean);

  if (parts.length >= 3) {
    return `${parts[1]}, ${parts[2]}`;
  }

  if (parts.length === 2) {
    return `${parts[0]}, ${parts[1]}`;
  }

  return raw;
}

function getRelationshipLabel(
  event: EventItem,
): string | null {
  const myStatus =
    normalizeStatus(
      event.my_status,
    );

  if (
    myStatus === "pending"
  ) {
    return "Requested";
  }

  if (
    myStatus === "joined" ||
    event.is_joined
  ) {
    return "Joined";
  }

  if (
    myStatus === "kicked"
  ) {
    return "Kicked";
  }

  if (
    myStatus === "rejected"
  ) {
    return "Rejected";
  }

  return null;
}

const EventCard: FC<EventCardProps> = ({
  event,
  initialWatched,
  onWatchChange,
}) => {
  const distanceUnit =
    useDistanceUnit();

  const title =
    event.title ||
    "Untitled event";

  const host =
    event.host_nickname ||
    "Unknown host";

  const format =
    getFormatLabel(event);

  const when =
    formatEventDate(
      event.starts_at,
    );

  const where =
    getLocationLabel(
      event,
    );

  const status =
    getStatusLabel(
      event.status,
    );

  const relationship =
    getRelationshipLabel(
      event,
    );

  const distance =
    formatDistanceAway(
      event.distance_km,
      distanceUnit,
    );

  const players = `${
    event.attendees_count ||
    0
  }/${
    event.max_players ||
    0
  }`;

  return (
    <article className="group relative min-h-[152px] rounded-row bg-surface/45 px-4 py-4 transition-colors hover:bg-surface-selected/55 focus-within:bg-surface-selected/55 sm:px-5">
      <Link
        href={`/events/${event.id}`}
        aria-label={`Open ${title}`}
        className="absolute inset-0 z-10 rounded-row outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
      />

      <div className="relative flex items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>

            {relationship ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                {
                  relationship
                }
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 truncate text-sm text-muted-foreground">
            Hosted by <span className="font-medium text-foreground/80">{host}</span>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground/85">
              {format}
            </span>

            {event.power_level ? (
              <>
                <span className="text-border-strong">
                  ·
                </span>

                <span>
                  {
                    event.power_level
                  }
                </span>
              </>
            ) : null}

            <span className="text-border-strong">
              ·
            </span>

            <span>
              {when}
            </span>
          </div>

          <p className="mt-1.5 truncate text-sm text-muted-foreground">
            {where}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="relative z-20 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(event.status)}`}>
              {status}
            </span>

            <EventWatchButton
              eventId={
                event.id
              }
              initialWatched={
                initialWatched
              }
              onChanged={
                onWatchChange
              }
              className="!h-9 !w-9 !border-0 !shadow-none"
            />
          </div>

          <div className="text-right text-xs text-muted-foreground">
            <p className="font-semibold text-foreground/85">
              {players} players
            </p>

            {distance ? (
              <p className="mt-1 text-muted-foreground">
                {distance}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
};

export default EventCard;
