"use client";

import {
  useEffect,
  useMemo,
  useRef,
} from "react";
import mapboxgl from "mapbox-gl";

import type { EventItem } from "@/services/events";

type Coordinates = {
  lat: number;
  lng: number;
};

type EventMapProps = {
  events: EventItem[];
  heightClassName?: string;
  fullBleed?: boolean;
  focusLocation?: Coordinates | null;
  radiusKm?: number;
};

type EventCoordinatesSource = EventItem & {
  latitude?: number | string | null;
  longitude?: number | string | null;
};

type MappableEvent = EventItem & {
  lat: number;
  lng: number;
};

const mapboxToken =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

function toMappableEvent(
  event: EventCoordinatesSource,
): MappableEvent | null {
  const rawLat =
    event.lat ?? event.latitude;

  const rawLng =
    event.lng ?? event.longitude;

  if (
    rawLat === null ||
    rawLat === undefined ||
    rawLng === null ||
    rawLng === undefined
  ) {
    return null;
  }

  const lat = Number(rawLat);
  const lng = Number(rawLng);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  if (
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return {
    ...event,
    lat,
    lng,
  };
}

function eventsAreTooSpreadOut(
  events: MappableEvent[],
): boolean {
  if (events.length <= 1) {
    return false;
  }

  const lats = events.map(
    (event) => event.lat,
  );

  const lngs = events.map(
    (event) => event.lng,
  );

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;

  return (
    latSpan > 8 ||
    lngSpan > 12
  );
}

function getMapZoomForRadius(
  radiusKm: number,
): number {
  if (radiusKm <= 2) return 14;
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 25) return 10.8;
  if (radiusKm <= 50) return 9.6;
  if (radiusKm <= 75) return 8.8;

  return 8;
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

function formatEventDate(
  value?: string | null,
): string {
  if (!value) {
    return "Date TBD";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Date TBD";
  }

  const now = new Date();

  const isToday =
    date.toDateString() ===
    now.toDateString();

  const tomorrow = new Date(now);

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

function escapeHtml(
  value: string,
): string {
  const replacements: Record<
    string,
    string
  > = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return value.replace(
    /[&<>"']/g,
    (character) =>
      replacements[character],
  );
}

function getPopupHtml(
  event: MappableEvent,
  pinned: boolean,
): string {
  const title = escapeHtml(
    event.title ||
      "Untitled event",
  );

  const host = escapeHtml(
    event.host_nickname ||
      "Unknown host",
  );

  const format = escapeHtml(
    getFormatLabel(event),
  );

  const powerLevel =
    event.power_level
      ? ` · ${escapeHtml(
          event.power_level,
        )}`
      : "";

  const date = escapeHtml(
    formatEventDate(
      event.starts_at,
    ),
  );

  const address = escapeHtml(
    event.address_text ||
      "Location TBD",
  );

  const attendees =
    event.attendees_count ?? 0;

  const maximum =
    event.max_players ?? 0;

  const eventUrl =
    `/events/${encodeURIComponent(
      String(event.id),
    )}`;

  return `
    <article
      class="
        w-[min(310px,calc(100vw-48px))]
        bg-white
        p-4
        text-zinc-950
      "
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <p
              class="
                text-[11px]
                font-bold
                uppercase
                tracking-[0.14em]
                text-[#6E5AA7]
              "
            >
              Event
            </p>

            ${
              pinned
                ? ""
                : `
                  <span class="text-[10px] text-zinc-400">
                    Click to keep open
                  </span>
                `
            }
          </div>

          <h3
            class="
              mt-1
              truncate
              text-lg
              font-black
              tracking-tight
            "
          >
            ${title}
          </h3>
        </div>

        ${
          pinned
            ? `
              <button
                type="button"
                data-event-popup-close
                aria-label="Close preview"
                class="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-lg
                  leading-none
                  text-zinc-400
                  transition
                  hover:bg-black/[0.05]
                  hover:text-black
                "
              >
                ×
              </button>
            `
            : ""
        }
      </div>

      <div class="mt-3 grid gap-1.5 text-sm text-zinc-600">
        <p>${host}</p>

        <p>
          ${format}${powerLevel}
        </p>

        <p>${date}</p>

        <p class="truncate">
          ${address}
        </p>
      </div>

      <div class="mt-4 flex items-center justify-between gap-3">
        <span
          class="
            rounded-full
            bg-black/[0.055]
            px-3
            py-1
            text-sm
            font-semibold
            text-zinc-700
          "
        >
          ${attendees}/${maximum}
        </span>

        <a
          href="${eventUrl}"
          class="
            rounded-full
            bg-black
            px-4
            py-2
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-zinc-800
          "
        >
          View event
        </a>
      </div>
    </article>
  `;
}

function stylePopup(
  popup: mapboxgl.Popup,
): void {
  const popupElement =
    popup.getElement();

  if (!popupElement) {
    return;
  }

  const content =
    popupElement.querySelector<HTMLElement>(
      ".mapboxgl-popup-content",
    );

  if (!content) {
    return;
  }

  content.style.padding = "0";
  content.style.overflow = "hidden";
  content.style.borderRadius = "20px";
  content.style.boxShadow =
    "0 18px 48px rgba(0, 0, 0, 0.18)";
  content.style.border =
    "1px solid rgba(0, 0, 0, 0.08)";
}

export default function EventMap({
  events,
  heightClassName = "h-[520px]",
  fullBleed = false,
  focusLocation = null,
  radiusKm = 25,
}: EventMapProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const mapRef =
    useRef<mapboxgl.Map | null>(
      null,
    );

  const markersRef =
    useRef<mapboxgl.Marker[]>([]);

  const popupRef =
    useRef<mapboxgl.Popup | null>(
      null,
    );

  const pinnedEventIdRef =
    useRef<string | null>(null);

  const closeTimerRef =
    useRef<number | null>(null);

  const mappableEvents =
    useMemo(() => {
      return events
        .map((event) =>
          toMappableEvent(
            event as EventCoordinatesSource,
          ),
        )
        .filter(
          (
            event,
          ): event is MappableEvent =>
            event !== null,
        );
    }, [events]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (!mapboxToken) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    mapboxgl.accessToken =
      mapboxToken;

    const map = new mapboxgl.Map({
      container:
        containerRef.current,
      style:
        "mapbox://styles/mapbox/light-v11",
      center: [
        -73.9857,
        40.7484,
      ],
      zoom: 4,
      minZoom: 3.5,
      projection: "mercator",
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.AttributionControl({
        compact: true,
      }),
      "bottom-right",
    );

    const popup =
      new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 20,
        maxWidth: "340px",
        focusAfterOpen: false,
      });

    popupRef.current = popup;

    map.on("load", () => {
      map.resize();
    });

    const closePopup = () => {
      pinnedEventIdRef.current =
        null;

      popup.remove();
    };

    map.on(
      "click",
      closePopup,
    );

    mapRef.current = map;

    return () => {
      map.off(
        "click",
        closePopup,
      );

      if (
        closeTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          closeTimerRef.current,
        );

        closeTimerRef.current =
          null;
      }

      for (
        const marker of
        markersRef.current
      ) {
        marker.remove();
      }

      markersRef.current = [];

      popup.remove();
      popupRef.current = null;

      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const popup =
      popupRef.current;

    if (!map || !popup) {
      return;
    }

    if (
      closeTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        closeTimerRef.current,
      );

      closeTimerRef.current =
        null;
    }

    popup.remove();

    pinnedEventIdRef.current =
      null;

    for (
      const marker of
      markersRef.current
    ) {
      marker.remove();
    }

    markersRef.current = [];

    const cancelCloseTimer =
      () => {
        if (
          closeTimerRef.current ===
          null
        ) {
          return;
        }

        window.clearTimeout(
          closeTimerRef.current,
        );

        closeTimerRef.current =
          null;
      };

    const schedulePopupClose =
      () => {
        cancelCloseTimer();

        if (
          pinnedEventIdRef.current
        ) {
          return;
        }

        closeTimerRef.current =
          window.setTimeout(() => {
            if (
              !pinnedEventIdRef.current
            ) {
              popup.remove();
            }

            closeTimerRef.current =
              null;
          }, 180);
      };

    const closePinnedPopup =
      () => {
        pinnedEventIdRef.current =
          null;

        popup.remove();
      };

    const openPopup = (
      event: MappableEvent,
      pinned: boolean,
    ) => {
      cancelCloseTimer();

      if (pinned) {
        pinnedEventIdRef.current =
          String(event.id);
      }

      popup
        .setLngLat([
          event.lng,
          event.lat,
        ])
        .setHTML(
          getPopupHtml(
            event,
            pinned,
          ),
        )
        .addTo(map);

      stylePopup(popup);

      const popupElement =
        popup.getElement();

      if (!popupElement) {
        return;
      }

      popupElement.onmouseenter =
        cancelCloseTimer;

      popupElement.onmouseleave =
        schedulePopupClose;

      const closeButton =
        popupElement.querySelector<HTMLButtonElement>(
          "[data-event-popup-close]",
        );

      closeButton?.addEventListener(
        "click",
        (clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();

          closePinnedPopup();
        },
      );
    };

    if (
      mappableEvents.length === 0
    ) {
      if (focusLocation) {
        map.easeTo({
          center: [
            focusLocation.lng,
            focusLocation.lat,
          ],
          zoom:
            getMapZoomForRadius(
              radiusKm,
            ),
          duration: 600,
        });
      }

      return;
    }

    for (
      const event of
      mappableEvents
    ) {
      /*
       * Mapbox positions this outer element.
       * Never apply scale transforms to it.
       */
      const markerElement =
        document.createElement(
          "div",
        );

      markerElement.className =
        "grid h-11 w-11 place-items-center";

      markerElement.style.cursor =
        "pointer";

      const markerButton =
        document.createElement(
          "button",
        );

      markerButton.type =
        "button";

      markerButton.className =
        "group grid h-11 w-11 place-items-center rounded-full focus:outline-none";

      markerButton.setAttribute(
        "aria-label",
        event.title || "Event",
      );

      /*
       * Only this inner circle scales.
       */
      const markerDot =
        document.createElement(
          "span",
        );

      markerDot.className =
        "block h-5 w-5 rounded-full border-[3px] border-white bg-[#6E5AA7] shadow-[0_5px_18px_rgba(0,0,0,0.32)] transition-transform duration-150 group-hover:scale-125 group-focus-visible:scale-125 group-focus-visible:ring-4 group-focus-visible:ring-[#6E5AA7]/25";

      markerButton.appendChild(
        markerDot,
      );

      markerElement.appendChild(
        markerButton,
      );

      markerElement.addEventListener(
        "mouseenter",
        () => {
          if (
            pinnedEventIdRef.current
          ) {
            return;
          }

          openPopup(
            event,
            false,
          );
        },
      );

      markerElement.addEventListener(
        "mouseleave",
        schedulePopupClose,
      );

      markerButton.addEventListener(
        "click",
        (clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();

          openPopup(
            event,
            true,
          );

          map.easeTo({
            center: [
              event.lng,
              event.lat,
            ],
            zoom: Math.max(
              map.getZoom(),
              11,
            ),
            duration: 450,
          });
        },
      );

      const marker =
        new mapboxgl.Marker({
          element: markerElement,
          anchor: "center",
        })
          .setLngLat([
            event.lng,
            event.lat,
          ])
          .addTo(map);

      markersRef.current.push(
        marker,
      );
    }

    map.resize();

    if (
      mappableEvents.length === 1
    ) {
      const event =
        mappableEvents[0];

      map.easeTo({
        center: [
          event.lng,
          event.lat,
        ],
        zoom: 11,
        duration: 600,
      });

      return;
    }

    if (
      eventsAreTooSpreadOut(
        mappableEvents,
      )
    ) {
      const firstEvent =
        mappableEvents[0];

      map.easeTo({
        center: [
          firstEvent.lng,
          firstEvent.lat,
        ],
        zoom: 8,
        duration: 600,
      });

      return;
    }

    const bounds =
      new mapboxgl.LngLatBounds();

    for (
      const event of
      mappableEvents
    ) {
      bounds.extend([
        event.lng,
        event.lat,
      ]);
    }

    map.fitBounds(bounds, {
      padding: fullBleed
        ? 140
        : 80,
      maxZoom: 12,
      duration: 600,
    });
  }, [
    focusLocation,
    fullBleed,
    mappableEvents,
    radiusKm,
  ]);

  if (!mapboxToken) {
    return (
      <div
        className={[
          "grid place-items-center bg-white text-center text-sm text-zinc-500",
          fullBleed
            ? "h-screen w-screen"
            : `rounded-[1.5rem] border border-[#6E5AA7]/[0.1] ${heightClassName}`,
        ].join(" ")}
      >
        Missing Mapbox token.
      </div>
    );
  }

  return (
    <div
      className={[
        "relative overflow-hidden bg-white",
        fullBleed
          ? "h-screen w-screen"
          : `rounded-[1.5rem] border border-[#6E5AA7]/[0.1] shadow-[0_12px_34px_rgba(53,40,76,0.055)] ${heightClassName}`,
      ].join(" ")}
    >
      <div
        ref={containerRef}
        className="h-full w-full"
      />
    </div>
  );
}
