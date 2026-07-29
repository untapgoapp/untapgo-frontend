"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import EventCard from "@/components/events/EventCard";
import EventMap from "@/components/events/EventMap";
import FloatingMapActions from "@/components/events/FloatingMapActions";
import FloatingMapBackButton from "@/components/events/FloatingMapBackButton";
import FloatingMapFilters from "@/components/events/FloatingMapFilters";
import { useLocation } from "@/components/location/LocationContext";
import {
  useDistanceUnit,
} from "@/components/settings/DistanceUnitProvider";
import {
  formatDistanceAway,
  formatSearchDistance,
} from "@/lib/distance";
import type { EventItem } from "@/services/events";

type EventsBrowserProps = {
  initialEvents: EventItem[];
};

type EventsView = "list" | "map";

type Coordinates = {
  lat: number;
  lng: number;
};

type NearbyEvent = EventItem & {
  distanceKm: number;
};

const FORMAT_OPTIONS = [
  { value: "all", label: "All formats" },
  { value: "commander", label: "Commander" },
  { value: "cube", label: "Cube" },
  { value: "draft", label: "Draft" },
  { value: "legacy", label: "Legacy" },
  { value: "modern", label: "Modern" },
  { value: "pauper", label: "Pauper" },
  { value: "pioneer", label: "Pioneer" },
  { value: "premodern", label: "Premodern" },
  { value: "sealed", label: "Sealed" },
  { value: "standard", label: "Standard" },
  { value: "vintage", label: "Vintage" },
  { value: "other", label: "Other" },
];

const POWER_OPTIONS = [
  { value: "all", label: "All power" },
  { value: "Casual", label: "Casual" },
  { value: "Optimized", label: "Optimized" },
  { value: "Competitive", label: "Competitive" },
  { value: "cEDH", label: "cEDH" },
];

function normalizeStatus(
  status?: string | null,
): string {
  return (status ?? "")
    .trim()
    .toLowerCase();
}

function statusRank(
  event: EventItem,
): number {
  const status = normalizeStatus(
    event.status,
  );

  if (status === "open") return 0;
  if (status === "full") return 1;
  if (status === "started") return 2;

  return 9;
}

function getEventTime(
  event: EventItem,
): number {
  if (!event.starts_at) return 0;

  const value = new Date(
    event.starts_at,
  ).getTime();

  return Number.isFinite(value)
    ? value
    : 0;
}

function sortEvents(
  left: EventItem,
  right: EventItem,
): number {
  const statusDifference =
    statusRank(left) -
    statusRank(right);

  if (statusDifference !== 0) {
    return statusDifference;
  }

  const timeDifference =
    getEventTime(left) -
    getEventTime(right);

  if (timeDifference !== 0) {
    return timeDifference;
  }

  return (
    left.title ?? ""
  ).localeCompare(
    right.title ?? "",
  );
}

function hasCoordinates(
  event: EventItem,
): boolean {
  if (
    event.lat === null ||
    event.lat === undefined ||
    event.lng === null ||
    event.lng === undefined
  ) {
    return false;
  }

  const lat = Number(event.lat);
  const lng = Number(event.lng);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function hasSeats(
  event: EventItem,
): boolean {
  const attendees =
    Number(
      event.attendees_count ?? 0,
    );

  const maximum =
    Number(event.max_players ?? 0);

  if (maximum <= 0) {
    return true;
  }

  return attendees < maximum;
}

function getViewFromSearch(
  searchParams: {
    get: (
      key: string,
    ) => string | null;
  },
): EventsView {
  return searchParams.get("view") ===
    "map"
    ? "map"
    : "list";
}

function toRadians(
  value: number,
): number {
  return (
    value *
    Math.PI
  ) / 180;
}

function getDistanceKm(
  origin: Coordinates,
  destination: Coordinates,
): number {
  const earthRadiusKm = 6371;

  const deltaLat = toRadians(
    destination.lat -
      origin.lat,
  );

  const deltaLng = toRadians(
    destination.lng -
      origin.lng,
  );

  const originLat =
    toRadians(origin.lat);

  const destinationLat =
    toRadians(destination.lat);

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(originLat) *
      Math.cos(destinationLat) *
      Math.sin(deltaLng / 2) ** 2;

  const angle =
    2 *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine),
    );

  return earthRadiusKm * angle;
}

function getSafeRadius(
  value: string | null,
  fallback: number,
): number {
  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return parsed;
}

function matchesFilters(
  event: EventItem,
  format: string,
  power: string,
  openOnly: boolean,
): boolean {
  if (
    format !== "all" &&
    event.format_slug !== format
  ) {
    return false;
  }

  if (
    power !== "all" &&
    event.power_level !== power
  ) {
    return false;
  }

  if (
    openOnly &&
    !hasSeats(event)
  ) {
    return false;
  }

  return true;
}

export default function EventsBrowser({
  initialEvents,
}: EventsBrowserProps) {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const {
    coords,
    radius,
    applyLocation,
  } = useLocation();

  const distanceUnit =
    useDistanceUnit();

  const viewFromUrl =
    getViewFromSearch(
      searchParams,
    );

  const latParam =
    searchParams.get("lat");

  const lngParam =
    searchParams.get("lng");

  const radiusParam =
    searchParams.get("radius");

  const [view, setView] =
    useState<EventsView>(
      viewFromUrl,
    );

  const [format, setFormat] =
    useState("all");

  const [power, setPower] =
    useState("all");

  const [openOnly, setOpenOnly] =
    useState(false);

  const [
    mapFiltersOpen,
    setMapFiltersOpen,
  ] = useState(false);

  const [
    mapFilterHint,
    setMapFilterHint,
  ] = useState(false);

  useEffect(() => {
    setView(viewFromUrl);
  }, [viewFromUrl]);

  useEffect(() => {
    const lat = Number(latParam);
    const lng = Number(lngParam);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return;
    }

    const nextRadius =
      getSafeRadius(
        radiusParam,
        radius,
      );

    const sameCoordinates =
      Boolean(coords) &&
      Math.abs(
        coords!.lat - lat,
      ) < 0.000001 &&
      Math.abs(
        coords!.lng - lng,
      ) < 0.000001;

    const sameRadius =
      radius === nextRadius;

    if (
      sameCoordinates &&
      sameRadius
    ) {
      return;
    }

    applyLocation(
      {
        lat,
        lng,
      },
      "Selected area",
      nextRadius,
    );
  }, [
    applyLocation,
    coords,
    latParam,
    lngParam,
    radius,
    radiusParam,
  ]);

  useEffect(() => {
    if (view !== "map") {
      setMapFiltersOpen(false);
      setMapFilterHint(false);
      return;
    }

    setMapFilterHint(true);

    const timer =
      window.setTimeout(() => {
        setMapFilterHint(false);
      }, 1600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [view]);

  function changeView(
    nextView: EventsView,
  ) {
    setView(nextView);

    if (nextView === "map") {
      const params =
        new URLSearchParams();

      params.set(
        "view",
        "map",
      );

      if (coords) {
        params.set(
          "lat",
          String(coords.lat),
        );

        params.set(
          "lng",
          String(coords.lng),
        );

        params.set(
          "radius",
          String(radius),
        );
      }

      router.push(
        `/events?${params.toString()}`,
      );

      return;
    }

    router.push("/events");
  }

  function resetFilters() {
    setFormat("all");
    setPower("all");
    setOpenOnly(false);
  }

  /*
   * Main catalogue:
   * format, power and availability apply.
   * Location does not remove events.
   */
  const filteredEvents =
    useMemo(() => {
      return [...initialEvents]
        .filter((event) =>
          matchesFilters(
            event,
            format,
            power,
            openOnly,
          ),
        )
        .sort(sortEvents);
    }, [
      format,
      initialEvents,
      openOnly,
      power,
    ]);

  /*
   * Nearby is an independent subset.
   * It never replaces the main catalogue.
   */
  const nearbyEvents =
    useMemo<NearbyEvent[]>(() => {
      if (!coords) {
        return [];
      }

      return filteredEvents
        .map((event) => {
          if (
            !hasCoordinates(event)
          ) {
            return null;
          }

          const distanceKm =
            getDistanceKm(
              coords,
              {
                lat: Number(
                  event.lat,
                ),
                lng: Number(
                  event.lng,
                ),
              },
            );

          return {
            ...event,
            distanceKm,
          };
        })
        .filter(
          (
            event,
          ): event is NearbyEvent =>
            event !== null &&
            event.distanceKm <=
              radius,
        )
        .sort(
          (left, right) =>
            left.distanceKm -
            right.distanceKm,
        );
    }, [
      coords,
      filteredEvents,
      radius,
    ]);

  /*
   * The map receives every filtered event
   * that has coordinates, not only nearby events.
   */
  const mappedEvents =
    useMemo(() => {
      return filteredEvents.filter(
        hasCoordinates,
      );
    }, [filteredEvents]);

  const hasActiveFilters =
    format !== "all" ||
    power !== "all" ||
    openOnly;

  if (view === "map") {
    return (
      <section className="fixed inset-0 z-0 bg-[#F8F5EF]">
        <EventMap
          events={mappedEvents}
          fullBleed
          heightClassName="h-screen"
          focusLocation={coords}
          radiusKm={radius}
        />

        <FloatingMapBackButton
          onClick={() =>
            changeView("list")
          }
        />

        <FloatingMapFilters
          open={mapFiltersOpen}
          hint={mapFilterHint}
          format={format}
          power={power}
          openOnly={openOnly}
          hasActiveFilters={
            hasActiveFilters
          }
          onToggleFilters={() =>
            setMapFiltersOpen(
              (value) => !value,
            )
          }
          onFormatChange={
            setFormat
          }
          onPowerChange={setPower}
          onOpenOnlyChange={
            setOpenOnly
          }
          onReset={resetFilters}
        />

        <FloatingMapActions />
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <header className="mb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-950">
              Events
            </h1>

            <p className="mt-2 max-w-xl text-[15px] leading-6 text-zinc-600">
              Find open Magic
              tables, check the
              details, and request a
              seat.
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex w-fit rounded-full bg-[#6E5AA7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5F4E94]"
          >
            Host game
          </Link>
        </div>

        <div className="mt-8 border-b border-black/10">
          <ViewSwitcher
            view={view}
            onChange={changeView}
          />
        </div>
      </header>

      <section className="mb-6 flex flex-wrap items-center gap-2">
        <Filters
          format={format}
          power={power}
          openOnly={openOnly}
          hasActiveFilters={
            hasActiveFilters
          }
          onFormatChange={
            setFormat
          }
          onPowerChange={
            setPower
          }
          onOpenOnlyChange={
            setOpenOnly
          }
          onReset={resetFilters}
        />

        <p className="ml-auto text-sm text-zinc-500">
          {filteredEvents.length}{" "}
          event
          {filteredEvents.length ===
          1
            ? ""
            : "s"}
        </p>
      </section>

      {initialEvents.length === 0 ? (
        <EmptyState />
      ) : filteredEvents.length ===
        0 ? (
        <NoResults />
      ) : (
        <div className="space-y-10">
          {coords &&
          nearbyEvents.length ? (
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6E5AA7]">
                    Nearby
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em]">
                    Events within{" "}
                    {formatSearchDistance(
                      radius,
                      distanceUnit,
                    )}
                  </h2>
                </div>

                <span className="text-sm text-zinc-500">
                  {
                    nearbyEvents.length
                  }
                </span>
              </div>

              <div className="grid gap-3">
                {nearbyEvents.map(
                  (event) => (
                    <div
                      key={`nearby-${event.id}`}
                    >
                      <div className="mb-1.5 px-1 text-xs font-medium text-zinc-500">
                        {formatDistanceAway(
                          event.distanceKm,
                          distanceUnit,
                        )}
                      </div>

                      <EventCard
                        event={event}
                      />
                    </div>
                  ),
                )}
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-400">
                  Explore
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-[-0.025em]">
                  All events
                </h2>
              </div>

              <span className="text-sm text-zinc-500">
                {
                  filteredEvents.length
                }
              </span>
            </div>

            <div className="grid gap-3">
              {filteredEvents.map(
                (event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                  />
                ),
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ViewSwitcher({
  view,
  onChange,
}: {
  view: EventsView;
  onChange: (
    view: EventsView,
  ) => void;
}) {
  return (
    <nav className="flex gap-8">
      <TabButton
        active={view === "list"}
        onClick={() =>
          onChange("list")
        }
      >
        List
      </TabButton>

      <TabButton
        active={view === "map"}
        onClick={() =>
          onChange("map")
        }
      >
        Map
      </TabButton>
    </nav>
  );
}

function Filters({
  format,
  power,
  openOnly,
  hasActiveFilters,
  onFormatChange,
  onPowerChange,
  onOpenOnlyChange,
  onReset,
}: {
  format: string;
  power: string;
  openOnly: boolean;
  hasActiveFilters: boolean;
  onFormatChange: (
    value: string,
  ) => void;
  onPowerChange: (
    value: string,
  ) => void;
  onOpenOnlyChange: (
    value: boolean,
  ) => void;
  onReset: () => void;
}) {
  return (
    <>
      <select
        value={format}
        onChange={(event) =>
          onFormatChange(
            event.target.value,
          )
        }
        className="h-9 rounded-full border border-black/10 bg-white px-3 text-sm text-zinc-700 outline-none transition hover:border-black/20 focus:border-[#6E5AA7]"
      >
        {FORMAT_OPTIONS.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ),
        )}
      </select>

      <select
        value={power}
        onChange={(event) =>
          onPowerChange(
            event.target.value,
          )
        }
        className="h-9 rounded-full border border-black/10 bg-white px-3 text-sm text-zinc-700 outline-none transition hover:border-black/20 focus:border-[#6E5AA7]"
      >
        {POWER_OPTIONS.map(
          (option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ),
        )}
      </select>

      <button
        type="button"
        onClick={() =>
          onOpenOnlyChange(
            !openOnly,
          )
        }
        className={[
          "h-9 rounded-full border px-3 text-sm font-medium transition",
          openOnly
            ? "border-[#6E5AA7] bg-[#F0EBFF] text-[#6E5AA7]"
            : "border-black/10 bg-white text-zinc-700 hover:border-black/20",
        ].join(" ")}
      >
        Open seats
      </button>

      {hasActiveFilters ? (
        <button
          type="button"
          onClick={onReset}
          className="h-9 rounded-full px-3 text-sm font-medium text-zinc-500 hover:text-black"
        >
          Reset
        </button>
      ) : null}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative -mb-px pb-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#6E5AA7]/30",
        active
          ? "text-[#6E5AA7]"
          : "text-zinc-500 hover:text-black",
      ].join(" ")}
    >
      {children}

      {active ? (
        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#6E5AA7]" />
      ) : null}
    </button>
  );
}

function EmptyState() {
  return (
    <section className="border-y border-black/10 py-16 text-center">
      <h2 className="text-xl font-semibold">
        No events yet
      </h2>

      <p className="mt-2 text-sm text-zinc-500">
        Create the first table.
      </p>

      <Link
        href="/create"
        className="mt-6 inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
      >
        Host game
      </Link>
    </section>
  );
}

function NoResults() {
  return (
    <section className="border-y border-black/10 py-14 text-center">
      <h2 className="text-xl font-semibold">
        No matching events
      </h2>

      <p className="mt-2 text-sm text-zinc-500">
        Try clearing a filter or
        changing the format.
      </p>
    </section>
  );
}