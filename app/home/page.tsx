"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import HomeDashboardContent from "@/components/home/HomeDashboardContent";
import HomeRightSidebar from "@/components/home/HomeRightSidebar";
import { useNotifications } from "@/components/notifications/NotificationRealtimeProvider";
import SocialAppShell from "@/components/social-shell/SocialAppShell";
import {
  getEventMembershipState,
  isConfirmedMembership,
} from "@/lib/event-membership";
import { supabase } from "@/lib/supabase/client";
import {
  getMyEvents,
  getWatchlist,
  type EventItem,
} from "@/services/events";
import {
  getNotificationHref,
} from "@/services/notifications";

const INACTIVE_EVENT_STATUSES = new Set([
  "started",
  "ended",
  "finished",
  "cancelled",
  "canceled",
]);

function getStartTime(event: EventItem): number | null {
  if (!event.starts_at) return null;
  const time = new Date(event.starts_at).getTime();
  return Number.isFinite(time) ? time : null;
}

function getConfirmedUpcomingEvents(
  events: EventItem[],
  userId: string,
): EventItem[] {
  const now = Date.now();

  return events
    .filter((event) => {
      const startsAt = getStartTime(event);
      if (startsAt === null || startsAt < now) return false;
      if (INACTIVE_EVENT_STATUSES.has(event.status.trim().toLowerCase())) return false;

      const membership = getEventMembershipState({
        status: event.my_status,
        isHost: event.host_user_id === userId,
        legacyIsJoined: event.is_joined,
        legacyIsPlaying: event.my_is_playing,
      });

      return membership === "host" || isConfirmedMembership(membership);
    })
    .sort((left, right) => (getStartTime(left) ?? 0) - (getStartTime(right) ?? 0));
}

export default function HomePage() {
  const router = useRouter();
  const notificationState = useNotifications();
  const [authenticated, setAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [myEvents, setMyEvents] = useState<EventItem[] | null>(null);
  const [savedEvents, setSavedEvents] = useState<EventItem[] | null>(null);
  const [myEventsFailed, setMyEventsFailed] = useState(false);
  const [savedEventsFailed, setSavedEventsFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/login?next=%2Fhome");
        return;
      }

      if (!active) return;
      setAuthenticated(true);
      setUserId(data.user.id);

      void getMyEvents().then(
        (items) => active && setMyEvents(items),
        () => {
          if (!active) return;
          setMyEventsFailed(true);
          setMyEvents([]);
        },
      );
      void getWatchlist({ force: true }).then(
        (items) => active && setSavedEvents(items),
        () => {
          if (!active) return;
          setSavedEventsFailed(true);
          setSavedEvents([]);
        },
      );
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [router]);

  const upcomingEvents = useMemo(() => {
    if (!myEvents || !userId) return null;
    return getConfirmedUpcomingEvents(myEvents, userId);
  }, [myEvents, userId]);

  const nextEvent = upcomingEvents?.[0] ?? null;
  const pendingRequests = useMemo(() => {
    if (!upcomingEvents || !userId) return null;

    return upcomingEvents.reduce((total, event) => {
      if (event.host_user_id !== userId) return total;
      return total + Math.max(0, Number(event.pending_requests_count ?? 0));
    }, 0);
  }, [upcomingEvents, userId]);
  const notificationsFailed = Boolean(
    notificationState.error && notificationState.items.length === 0,
  );
  const unreadCount = notificationsFailed ? null : notificationState.unread_count;
  const hasRightSidebar = Boolean(
    nextEvent || (pendingRequests ?? 0) > 0 || (unreadCount ?? 0) > 0,
  );
  const rightSidebar = authenticated && hasRightSidebar ? (
    <HomeRightSidebar
      nextEvent={nextEvent}
      pendingRequests={pendingRequests}
      unreadCount={unreadCount}
    />
  ) : undefined;

  return (
    <SocialAppShell rightSidebar={rightSidebar}>
      <HomeDashboardContent
        nextEvent={nextEvent}
        upcomingEvents={upcomingEvents}
        myEventsFailed={myEventsFailed}
        savedEvents={savedEvents}
        savedEventsFailed={savedEventsFailed}
        notifications={notificationState.loading ? null : notificationState.items.slice(0, 5)}
        notificationsFailed={notificationsFailed}
        onSavedEventRemoved={(eventId) => {
          setSavedEvents((current) => current?.filter((event) => event.id !== eventId) ?? null);
        }}
        onOpenNotification={(notification) => {
          router.push(getNotificationHref(notification));
        }}
      />
    </SocialAppShell>
  );
}
