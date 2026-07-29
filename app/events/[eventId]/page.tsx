import type {
  ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  UserRound,
} from "lucide-react";

import EventMap from "@/components/events/EventMap";
import EventUserPanels from "@/components/events/EventUserPanels";
import EventWatchButton from "@/components/events/EventWatchButton";
import {
  getEvent,
  type EventItem,
} from "@/services/events";

type Coordinates = {
  lat: number;
  lng: number;
};

type DetailedEventItem =
  EventItem & {
    description?: string | null;
  };

function formatEventDate(
  value?: string | null,
): {
  date: string;
  time: string | null;
} {
  if (!value) {
    return {
      date: "Date TBD",
      time: null,
    };
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return {
      date: "Date TBD",
      time: null,
    };
  }

  return {
    date:
      new Intl.DateTimeFormat(
        "en",
        {
          weekday: "long",
          month: "long",
          day: "numeric",
        },
      ).format(date),

    time:
      new Intl.DateTimeFormat(
        "en",
        {
          hour: "2-digit",
          minute: "2-digit",
        },
      ).format(date),
  };
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

function getProxiesLabel(
  value?: string | null,
): string | null {
  const normalized =
    (value ?? "")
      .trim()
      .toLowerCase();

  if (!normalized) {
    return null;
  }

  if (
    normalized === "yes"
  ) {
    return "Allowed";
  }

  if (
    normalized === "no"
  ) {
    return "Not allowed";
  }

  if (
    normalized === "ask"
  ) {
    return "Ask host";
  }

  return value?.trim() || null;
}

function getSeatsLeft(
  event: EventItem,
): number {
  return Math.max(
    0,
    Number(
      event.max_players ?? 0,
    ) -
      Number(
        event.attendees_count ??
          0,
      ),
  );
}

function getCoordinates(
  event: EventItem,
): Coordinates | null {
  if (
    event.lat === null ||
    event.lat === undefined ||
    event.lng === null ||
    event.lng === undefined
  ) {
    return null;
  }

  const lat =
    Number(event.lat);

  const lng =
    Number(event.lng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return {
    lat,
    lng,
  };
}

function getMapsUrl(
  coordinates: Coordinates,
): string {
  const query =
    encodeURIComponent(
      `${coordinates.lat},${coordinates.lng}`,
    );

  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function normalizeStatus(
  value?: string | null,
): string {
  return (value ?? "")
    .trim()
    .toLowerCase();
}

function getStatusLabel(
  event: EventItem,
): string {
  const status =
    normalizeStatus(
      event.status,
    );

  if (status === "open") {
    return "Open";
  }

  if (status === "full") {
    return "Full";
  }

  if (
    status === "started" ||
    status === "in_progress"
  ) {
    return "Started";
  }

  if (
    status === "ended" ||
    status === "finished" ||
    status === "completed"
  ) {
    return "Finished";
  }

  if (
    status === "cancelled" ||
    status === "canceled"
  ) {
    return "Cancelled";
  }

  return (
    event.status ||
    "Scheduled"
  );
}

function getStatusClasses(
  event: EventItem,
): string {
  const status =
    normalizeStatus(
      event.status,
    );

  if (status === "open") {
    return "bg-[#EEE9FF] text-[#6E5AA7]";
  }

  if (status === "full") {
    return "bg-amber-100 text-amber-800";
  }

  if (
    status === "started" ||
    status === "in_progress"
  ) {
    return "bg-zinc-900 text-white";
  }

  if (
    status === "ended" ||
    status === "finished" ||
    status === "completed"
  ) {
    return "bg-zinc-200 text-zinc-700";
  }

  if (
    status === "cancelled" ||
    status === "canceled"
  ) {
    return "bg-red-100 text-red-700";
  }

  return "bg-black/[0.06] text-zinc-700";
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{
    eventId: string;
  }>;
}) {
  const { eventId } =
    await params;

  let event:
    | DetailedEventItem
    | null = null;

  let errorMessage:
    | string
    | null = null;

  try {
    event =
      await getEvent(
        eventId,
      );
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to load event";
  }

  if (
    errorMessage ||
    !event
  ) {
    return (
      <div className="min-h-screen bg-[#F8F5EF] px-4 py-8 text-zinc-950 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/events"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-zinc-600 outline-none transition hover:text-black focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20"
          >
            <ArrowLeft
              size={16}
            />

            Back to events
          </Link>

          <section className="mt-6 border-y border-red-500/20 py-5">
            <p className="font-semibold text-red-700">
              Could not load event
            </p>

            {errorMessage ? (
              <p className="mt-2 text-sm leading-6 text-red-600">
                {errorMessage}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    );
  }

  const seatsLeft =
    getSeatsLeft(event);

  const proxiesLabel =
    getProxiesLabel(
      event.proxies_policy,
    );

  const coordinates =
    getCoordinates(event);

  const mapsUrl =
    coordinates
      ? getMapsUrl(
          coordinates,
        )
      : null;

  const formattedDate =
    formatEventDate(
      event.starts_at,
    );

  const description =
    event.description?.trim() ??
    "";

  const attendeesCount =
    Number(
      event.attendees_count ??
        0,
    );

  const maxPlayers =
    Number(
      event.max_players ??
        0,
    );

  return (
    <div className="event-detail-shell min-h-screen bg-[#F8F5EF] px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-6 text-zinc-950 sm:px-6 sm:pt-8 lg:pb-14">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/events"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-zinc-500 outline-none transition hover:text-[#594586] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20"
        >
          <ArrowLeft
            size={16}
          />

          Back to events
        </Link>

        <div className="mt-5 grid gap-x-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <header className="border-b border-[#6E5AA7]/[0.13] pb-7">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-[#EEE9FF] px-2.5 py-1 text-[12px] font-bold text-[#5B478A] shadow-[inset_0_0_0_1px_rgba(110,90,167,0.08)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#806AB8]" />

                    {getFormatLabel(
                      event,
                    )}
                  </p>

                  <h1 className="mt-3 max-w-3xl break-words text-[38px] font-extrabold leading-[1.01] tracking-[-0.048em] text-[#1B1820] sm:text-[54px]">
                    {event.title ||
                      "Untitled event"}
                  </h1>
                </div>

                <EventWatchButton
                  eventId={event.id}
                  variant="button"
                  className="min-h-11 shrink-0"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm">
                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold shadow-[inset_0_0_0_1px_rgba(110,90,167,0.06)]",
                    getStatusClasses(
                      event,
                    ),
                  ].join(" ")}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />

                  {getStatusLabel(
                    event,
                  )}
                </span>

                <span className="font-semibold text-zinc-800">
                  {attendeesCount}/
                  {maxPlayers} players
                </span>

                <span className="h-1 w-1 rounded-full bg-[#6E5AA7]/30" />

                <span className="text-zinc-500">
                  {seatsLeft} seat
                  {seatsLeft === 1
                    ? ""
                    : "s"}{" "}
                  left
                </span>
              </div>

              {event.power_level ||
              proxiesLabel ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {event.power_level ? (
                    <Pill>
                      {
                        event.power_level
                      }
                    </Pill>
                  ) : null}

                  {proxiesLabel ? (
                    <Pill>
                      Proxies:{" "}
                      {
                        proxiesLabel
                      }
                    </Pill>
                  ) : null}
                </div>
              ) : null}
            </header>

            {description ? (
              <section className="border-b border-[#6E5AA7]/[0.1] py-6">
                <h2 className="text-base font-bold tracking-[-0.015em] text-zinc-900">
                  About this event
                </h2>

                <p className="mt-2 max-w-2xl whitespace-pre-wrap text-[15px] leading-7 text-zinc-600">
                  {description}
                </p>
              </section>
            ) : null}

            <section
              aria-label="Event details"
              className="my-6 overflow-hidden rounded-[1.35rem] bg-white/55 px-4 shadow-[inset_0_0_0_1px_rgba(110,90,167,0.08),0_10px_28px_rgba(64,47,91,0.025)]"
            >
              <div className="divide-y divide-[#6E5AA7]/[0.09]">
                <InfoRow
                  icon={
                    <CalendarDays
                      size={18}
                    />
                  }
                  label="Date and time"
                  primary={
                    formattedDate.date
                  }
                  secondary={
                    formattedDate.time
                  }
                />

                <InfoRow
                  icon={
                    <MapPin
                      size={18}
                    />
                  }
                  label="Location"
                  primary={
                    event.address_text ||
                    "Location TBD"
                  }
                />

                <InfoRow
                  icon={
                    <UserRound
                      size={18}
                    />
                  }
                  label="Hosted by"
                  primary={
                    event.host_nickname ||
                    "Unknown host"
                  }
                />
              </div>
            </section>

            {event.host_notes ? (
              <section className="border-y border-[#6E5AA7]/[0.1] py-5">
                <h2 className="text-sm font-bold text-[#65518F]">
                  Host notes
                </h2>

                <p className="mt-2 max-w-2xl whitespace-pre-wrap text-[15px] leading-7 text-zinc-600">
                  {
                    event.host_notes
                  }
                </p>
              </section>
            ) : null}

            {coordinates ? (
              <section className="py-7">
                <div className="mb-3 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="h-1.5 w-6 rounded-full bg-[#6E5AA7]" />

                      <h2 className="text-[22px] font-bold tracking-[-0.03em]">
                        Location
                      </h2>
                    </div>

                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {event.address_text ||
                        "Event location"}
                    </p>
                  </div>

                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-[#EEE9FF] px-4 text-sm font-semibold text-[#5B478A] shadow-[inset_0_0_0_1px_rgba(110,90,167,0.08)] outline-none transition hover:bg-[#E7E0FF] hover:text-[#49356F] active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20"
                    >
                      Open in maps
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>

                <EventMap
                  events={[event]}
                  heightClassName="h-[320px] sm:h-[360px]"
                />
              </section>
            ) : null}
          </div>

          <EventUserPanels
            eventId={event.id}
            initialEvent={event}
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  primary,
  secondary,
}: {
  icon: ReactNode;
  label: string;
  primary: string;
  secondary?: string | null;
}) {
  return (
    <div className="grid min-h-[70px] grid-cols-[36px_minmax(0,1fr)] items-center gap-3 py-3">
      <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#EEE9FF] text-[#6E5AA7] shadow-[inset_0_0_0_1px_rgba(110,90,167,0.08)]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[#6E5AA7]/75">
          {label}
        </p>

        <p className="mt-0.5 break-words text-[15px] font-medium text-zinc-900">
          {primary}
        </p>

        {secondary ? (
          <p className="mt-0.5 text-sm text-zinc-500">
            {secondary}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Pill({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="rounded-full border border-[#6E5AA7]/[0.09] bg-[#EEE9FF]/65 px-2.5 py-1 text-xs font-semibold text-[#625080]">
      {children}
    </span>
  );
}
