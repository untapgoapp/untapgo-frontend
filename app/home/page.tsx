"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import HomeDashboardContent from "@/components/home/HomeDashboardContent";
import HomeRightSidebar from "@/components/home/HomeRightSidebar";
import SocialAppShell from "@/components/social-shell/SocialAppShell";
import {
  getEventMembershipState,
  isConfirmedMembership,
} from "@/lib/event-membership";
import {
  applyNotificationChange,
  type NotificationChange,
} from "@/lib/notification-live";
import { supabase } from "@/lib/supabase/client";
import {
  getMyEvents,
  getWatchlist,
  type EventItem,
} from "@/services/events";
import {
  getNotificationHref,
  listNotifications,
  NOTIFICATIONS_CHANGED_EVENT,
  type NotificationListResponse,
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
  const [authenticated, setAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [myEvents, setMyEvents] = useState<EventItem[] | null>(null);
  const [savedEvents, setSavedEvents] = useState<EventItem[] | null>(null);
  const [notifications, setNotifications] = useState<NotificationListResponse | null>(null);
  const [myEventsFailed, setMyEventsFailed] = useState(false);
  const [savedEventsFailed, setSavedEventsFailed] = useState(false);
  const [notificationsFailed, setNotificationsFailed] = useState(false);

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
      void listNotifications({ limit: 5 }).then(
        (result) => active && setNotifications(result),
        () => {
          if (!active) return;
          setNotificationsFailed(true);
          setNotifications({ unread_count: 0, items: [] });
        },
      );
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    function handleNotificationsChanged(event: Event) {
      const detail = (event as CustomEvent<NotificationChange>).detail;
      if (!detail || detail.kind === "refresh") {
        void listNotifications({ limit: 5 }).then(
          (result) => {
            setNotifications(result);
            setNotificationsFailed(false);
          },
          () => setNotificationsFailed(true),
        );
        return;
      }
      setNotifications((current) => applyNotificationChange(
        current ?? { unread_count: 0, items: [] },
        detail,
        { limit: 5 },
      ));
    }

    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, handleNotificationsChanged);
    return () => window.removeEventListener(
      NOTIFICATIONS_CHANGED_EVENT,
      handleNotificationsChanged,
    );
  }, []);

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
  const unreadCount = notificationsFailed ? null : notifications?.unread_count ?? null;
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
        notifications={notifications?.items ?? null}
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
