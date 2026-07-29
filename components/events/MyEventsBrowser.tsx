"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, MapPin, RefreshCw, Sparkles, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getMyEvents, type EventItem } from "@/services/events";

type MyEventsTab = "upcoming" | "history";

function normalizeStatus(status?: string | null) {
  return (status || "").trim().toLowerCase();
}

function getEventTime(event: EventItem) {
  const value = event.starts_at ? new Date(event.starts_at).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

function formatDate(value?: string | null) {
  if (!value) return "Date not set";

  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Date not set";
  }
}

function getFormatLabel(event: EventItem) {
  if (event.format) return event.format;

  if (!event.format_slug) return "Unknown format";

  return event.format_slug.charAt(0).toUpperCase() + event.format_slug.slice(1);
}

function getStatusLabel(status?: string | null) {
  const normalized = normalizeStatus(status);

  if (normalized === "open") return "Open";
  if (normalized === "full") return "Full";
  if (normalized === "started") return "Started";
  if (normalized === "ended") return "Finished";
  if (normalized === "finished") return "Finished";
  if (normalized === "cancelled") return "Cancelled";
  if (normalized === "canceled") return "Cancelled";

  return status || "Event";
}

function isHistory(event: EventItem) {
  const status = normalizeStatus(event.status);

  return (
    status === "started" ||
    status === "ended" ||
    status === "finished" ||
    status === "cancelled" ||
    status === "canceled"
  );
}

function isUpcoming(event: EventItem) {
  return !isHistory(event);
}

function getPlayerLabel(event: EventItem) {
  const current = event.attendees_count || 0;
  const max = event.max_players || 0;

  return `${current}/${max}`;
}

function getRelationshipLabel(event: EventItem, currentUserId: string | null) {
  const isHost = Boolean(currentUserId && event.host_user_id === currentUserId);
  const myStatus = normalizeStatus(event.my_status);

  if (isHost && event.my_is_playing) return "Hosting & playing";
  if (isHost) return "Hosting";
  if (myStatus === "pending") return "Pending";
  if (myStatus === "joined" || event.is_joined) return "Playing";

  return "Saved";
}

export default function MyEventsBrowser() {
  const router = useRouter();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MyEventsTab>("upcoming");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          router.push("/login");
          return;
        }

        setCurrentUserId(data.user.id);

        const rows = await getMyEvents();
        setEvents(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load events.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const upcomingEvents = useMemo(() => {
    return events
      .filter(isUpcoming)
      .sort((a, b) => getEventTime(a) - getEventTime(b));
  }, [events]);

  const historyEvents = useMemo(() => {
    return events
      .filter(isHistory)
      .sort((a, b) => getEventTime(b) - getEventTime(a));
  }, [events]);

  const hostingCount = useMemo(() => {
    if (!currentUserId) return 0;
    return events.filter((event) => event.host_user_id === currentUserId).length;
  }, [currentUserId, events]);

  const pendingCount = useMemo(() => {
    return events.filter((event) => normalizeStatus(event.my_status) === "pending")
      .length;
  }, [events]);

  const visibleEvents =
    activeTab === "upcoming" ? upcomingEvents : historyEvents;

  return (
    <div>
      <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-[#6E5AA7] via-[#4B3D78] to-[#171717] px-6 py-8 text-white sm:px-8">
          <div className="absolute right-6 top-6 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur">
            My tables
          </div>

          <p className="text-sm font-semibold uppercase tracking-wide text-white/65">
            UntapGo
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            My events
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
            The games you are hosting, joining, requesting, or already played.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/create"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Host game
            </Link>

            <Link
              href="/events"
              className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white"
            >
              Explore games
            </Link>

            <button
              type="button"
              onClick={() => loadEvents({ refresh: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-zinc-100 p-6 sm:grid-cols-3 sm:p-8">
          <SummaryCard
            icon={<CalendarDays size={20} />}
            label="Upcoming"
            value={upcomingEvents.length}
          />

          <SummaryCard
            icon={<Sparkles size={20} />}
            label="Hosting"
            value={hostingCount}
          />

          <SummaryCard
            icon={<Clock size={20} />}
            label="Pending"
            value={pendingCount}
          />
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid gap-2 rounded-3xl bg-[#FBF7F1] p-2 sm:grid-cols-2">
            <TabButton
              active={activeTab === "upcoming"}
              onClick={() => setActiveTab("upcoming")}
              label="Upcoming"
              count={upcomingEvents.length}
            />

            <TabButton
              active={activeTab === "history"}
              onClick={() => setActiveTab("history")}
              label="Started / Finished"
              count={historyEvents.length}
            />
          </div>
        </div>
      </section>

      {loading ? (
        <div className="mt-6 grid gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {error ? (
        <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
          <p className="font-semibold">Could not load your events.</p>
          <p className="mt-2 text-sm">{error}</p>

          <button
            type="button"
            onClick={() => loadEvents({ refresh: true })}
            className="mt-5 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </section>
      ) : null}

      {!loading && !error && visibleEvents.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : null}

      {!loading && !error && visibleEvents.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {visibleEvents.map((event) => (
            <MyEventCard
              key={event.id}
              event={event}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl bg-[#FBF7F1] px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#6E5AA7]">
          {icon}
        </span>

        <div>
          <p className="text-sm font-semibold text-zinc-500">{label}</p>
          <p className="text-2xl font-black">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl px-4 py-3 text-sm font-semibold transition",
        active
          ? "bg-black text-white shadow-sm"
          : "bg-transparent text-zinc-600 hover:bg-white hover:text-black",
      ].join(" ")}
    >
      {label}

      <span
        className={[
          "ml-2 rounded-full px-2 py-0.5 text-xs",
          active ? "bg-white/15 text-white" : "bg-white text-zinc-500",
        ].join(" ")}
      >
        {count}
      </span>
    </button>
  );
}

function MyEventCard({
  event,
  currentUserId,
}: {
  event: EventItem;
  currentUserId: string | null;
}) {
  const relationship = getRelationshipLabel(event, currentUserId);
  const status = getStatusLabel(event.status);
  const pendingRequests = event.pending_requests_count || 0;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{relationship}</Badge>
            <Badge tone="soft">{status}</Badge>

            {pendingRequests > 0 ? (
              <Badge tone="purple">
                {pendingRequests} request{pendingRequests === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>

          <h2 className="mt-3 truncate text-xl font-black tracking-tight">
            {event.title}
          </h2>

          <div className="mt-3 grid gap-2 text-sm text-zinc-600">
            <MetaLine icon={<CalendarDays size={16} />}>
              {formatDate(event.starts_at)}
            </MetaLine>

            <MetaLine icon={<MapPin size={16} />}>
              {event.address_text || "Location not set"}
            </MetaLine>

            <MetaLine icon={<Sparkles size={16} />}>
              {getFormatLabel(event)}
              {event.power_level ? ` · ${event.power_level}` : ""}
            </MetaLine>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F2EEFF] px-4 py-2 text-sm font-bold text-[#4B3D78]">
            <Users size={16} />
            {getPlayerLabel(event)}
          </div>

          <span className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-[#6E5AA7]">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}

function MetaLine({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-zinc-400">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "soft" | "purple";
}) {
  const classes = {
    default: "bg-black text-white",
    soft: "bg-zinc-100 text-zinc-600",
    purple: "bg-[#F2EEFF] text-[#6E5AA7]",
  };

  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-bold",
        classes[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function EmptyState({ activeTab }: { activeTab: MyEventsTab }) {
  const isUpcoming = activeTab === "upcoming";

  return (
    <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-[#F2EEFF] text-[#6E5AA7]">
        {isUpcoming ? <CalendarDays size={24} /> : <Clock size={24} />}
      </div>

      <h2 className="mt-4 text-xl font-black">
        {isUpcoming ? "No upcoming events yet" : "No past events yet"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
        {isUpcoming
          ? "Host a table or request to join an open game. Your upcoming plans will show up here."
          : "Started, finished, and cancelled tables will live here once you have history."}
      </p>

      {isUpcoming ? (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/events"
            className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold"
          >
            Browse games
          </Link>

          <Link
            href="/create"
            className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Host game
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="h-5 w-32 rounded-full bg-zinc-100" />
      <div className="mt-4 h-7 w-2/3 rounded-full bg-zinc-100" />
      <div className="mt-5 grid gap-2">
        <div className="h-4 w-1/2 rounded-full bg-zinc-100" />
        <div className="h-4 w-3/4 rounded-full bg-zinc-100" />
        <div className="h-4 w-1/3 rounded-full bg-zinc-100" />
      </div>
    </div>
  );
}