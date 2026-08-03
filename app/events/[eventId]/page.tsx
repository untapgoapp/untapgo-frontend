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
    return "bg-secondary text-secondary-foreground";
  }

  if (status === "full") {
    return "bg-warning-subtle text-warning";
  }

  if (
    status === "started" ||
    status === "in_progress"
  ) {
    return "bg-muted text-foreground";
  }

  if (
    status === "ended" ||
    status === "finished" ||
    status === "completed"
  ) {
    return "bg-muted text-muted-foreground";
  }

  if (
    status === "cancelled" ||
    status === "canceled"
  ) {
    return "bg-destructive-subtle text-destructive";
  }

  return "bg-muted text-muted-foreground";
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
      <div className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
        <div className="w-full max-w-3xl">
          <Link
            href="/events"
            className="inline-flex min-h-10 items-center gap-2 rounded-control px-1 text-sm font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20"
          >
            <ArrowLeft
              size={16}
            />

            Back to events
          </Link>

          <section className="mt-6 border-y border-destructive/20 py-4">
            <p className="font-semibold text-destructive">
              Could not load event
            </p>

            {errorMessage ? (
              <p className="mt-2 text-sm leading-6 text-destructive">
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

  const formatLabel =
    getFormatLabel(event);

  return (
    <div className="event-detail-shell min-h-screen bg-background px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 text-foreground sm:px-5 sm:pt-7 lg:pb-14 lg:px-0">
      <div className="w-full max-w-[1180px]">
        <nav
          aria-label="Breadcrumb"
          className="flex min-h-8 items-center gap-2 text-sm"
        >
          <Link
            href="/events"
            className="font-semibold text-primary outline-none transition-colors hover:text-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring/20"
          >
            Events
          </Link>

          <span
            aria-hidden="true"
            className="text-border-strong"
          >
            /
          </span>

          <span className="truncate text-muted-foreground">
            {formatLabel}
          </span>
        </nav>

        <div className="mt-4 grid gap-x-10 lg:grid-cols-[minmax(0,1fr)_296px] lg:items-start">
          <section className="min-w-0 lg:col-start-1 lg:row-start-1">
            <header className="pb-6">
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                    {formatLabel}
                  </p>

                  <h1 className="mt-2 max-w-3xl break-words text-4xl font-bold leading-none tracking-[-0.035em] text-foreground sm:text-[48px]">
                    {event.title ||
                      "Untitled event"}
                  </h1>
                </div>

                <EventWatchButton
                  eventId={event.id}
                  variant="button"
                  className="shrink-0"
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
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

                <span className="font-semibold text-foreground/85">
                  {attendeesCount}/
                  {maxPlayers} players
                </span>

                <span
                  aria-hidden="true"
                  className="h-1 w-1 rounded-full bg-border-strong"
                />

                <span className="text-muted-foreground">
                  {seatsLeft} seat
                  {seatsLeft === 1
                    ? ""
                    : "s"}{" "}
                  left
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {event.power_level ? (
                  <Pill>
                    {event.power_level}
                  </Pill>
                ) : null}

                {proxiesLabel ? (
                  <Pill>
                    Proxies:{" "}
                    {proxiesLabel}
                  </Pill>
                ) : null}

                <Pill>
                  Hosted by{" "}
                  <span className="font-semibold text-foreground">
                    {event.host_nickname ||
                      "Unknown host"}
                  </span>
                </Pill>
              </div>
            </header>

            {description ? (
              <section className="border-t border-border/70 py-5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  About this event
                </h2>

                <p className="mt-2 max-w-2xl whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">
                  {description}
                </p>
              </section>
            ) : null}

            <section
              aria-label="Event details"
              className="border-y border-border/70"
            >
              <div className="grid sm:grid-cols-3">
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
                  divided
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
                  divided
                />
              </div>
            </section>

            {event.host_notes ? (
              <section className="my-5 border-l-2 border-primary/35 pl-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Host notes
                </h2>

                <p className="mt-1.5 max-w-2xl whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">
                  {event.host_notes}
                </p>
              </section>
            ) : null}
          </section>

          <EventUserPanels
            eventId={event.id}
            initialEvent={event}
          />

          {coordinates ? (
            <section className="py-7 lg:col-start-1 lg:row-start-3">
              <div className="mb-3 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight">
                    Location
                  </h2>

                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {event.address_text ||
                      "Event location"}
                  </p>
                </div>

                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-control px-3 text-sm font-semibold text-primary outline-none transition-colors hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/20"
                  >
                    Open in maps
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>

              <EventMap
                events={[event]}
                heightClassName="h-[220px] sm:h-[250px]"
              />
            </section>
          ) : null}
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
  divided = false,
}: {
  icon: ReactNode;
  label: string;
  primary: string;
  secondary?: string | null;
  divided?: boolean;
}) {
  return (
    <div
      className={[
        "grid min-h-[88px] grid-cols-[30px_minmax(0,1fr)] items-center gap-3 py-4",
        divided
          ? "border-t border-border/70 sm:border-l sm:border-t-0 sm:pl-5"
          : "",
      ].join(" ")}
    >
      <div className="text-primary">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-quiet-foreground">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold leading-5 text-foreground">
          {primary}
        </p>

        {secondary ? (
          <p className="mt-0.5 text-xs text-muted-foreground">
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
    <span className="first-letter:uppercase">
      {children}
    </span>
  );
}
