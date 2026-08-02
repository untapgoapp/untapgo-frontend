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
import { supabase } from "@/lib/supabase/client";
import {
  getMyEvents,
  getWatchlist,
  type EventItem,
} from "@/services/events";
import {
  getProfileAvatarUrl,
  getProfileNickname,
  getPublicProfile,
  type PublicProfile,
} from "@/services/profiles";

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
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [myEvents, setMyEvents] = useState<EventItem[] | null>(null);
  const [savedEvents, setSavedEvents] = useState<EventItem[] | null>(null);
  const [myEventsFailed, setMyEventsFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadHome() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/login?next=%2Fhome");
        return;
      }

      if (!active) return;
      setAuthenticated(true);
      setUserId(data.user.id);

      void getPublicProfile(data.user.id).then(
        (value) => active && setProfile(value),
        () => active && setProfile(null),
      );

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
        () => active && setSavedEvents([]),
      );
    }

    void loadHome();
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

  const rightSidebar = authenticated ? (
    <HomeRightSidebar
      nextEvent={nextEvent}
      pendingRequests={pendingRequests}
      savedEventsCount={savedEvents?.length ?? null}
    />
  ) : undefined;

  return (
    <SocialAppShell rightSidebar={rightSidebar}>
      <HomeDashboardContent
        nextEvent={nextEvent}
        upcomingEvents={upcomingEvents}
        myEventsFailed={myEventsFailed}
        nickname={profile ? getProfileNickname(profile) : "Player"}
        avatarUrl={profile ? getProfileAvatarUrl(profile) : null}
      />
    </SocialAppShell>
  );
}