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
    <article className="group relative rounded-[1.35rem] border border-black/10 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-black/20 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <Link
        href={`/events/${event.id}`}
        aria-label={`Open ${title}`}
        className="absolute inset-0 z-10 rounded-[1.35rem] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/25"
      />

      <div className="relative flex items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold tracking-tight text-zinc-950">
              {title}
            </h2>

            {relationship ? (
              <span className="rounded-full bg-[#F0EBFF] px-2.5 py-1 text-xs font-semibold text-[#6E5AA7]">
                {
                  relationship
                }
              </span>
            ) : null}
          </div>

          <p className="mt-2 truncate text-[15px] text-zinc-700">
            {host}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
            <span>
              {format}
            </span>

            {event.power_level ? (
              <>
                <span className="text-zinc-300">
                  ·
                </span>

                <span>
                  {
                    event.power_level
                  }
                </span>
              </>
            ) : null}

            <span className="text-zinc-300">
              ·
            </span>

            <span>
              {when}
            </span>
          </div>

          <p className="mt-2 truncate text-sm text-zinc-500">
            {where}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
          <div className="relative z-20 flex items-center gap-2">
            <span className="rounded-full bg-black/[0.055] px-3 py-1 text-sm font-medium text-zinc-700">
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
            />
          </div>

          <div className="mt-1 text-right text-sm">
            <p className="font-semibold text-zinc-800">
              {players}
            </p>

            {distance ? (
              <p className="mt-1 text-zinc-500">
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