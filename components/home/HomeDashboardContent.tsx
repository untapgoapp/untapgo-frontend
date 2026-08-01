"use client";

import Link from "next/link";

import HomeActivityRow from "@/components/home/HomeActivityRow";
import HomeEventRow from "@/components/home/HomeEventRow";
import { Button } from "@/components/ui/button";
import type { EventItem } from "@/services/events";
import type { NotificationItem } from "@/services/notifications";

type HomeDashboardContentProps = {
  nextEvent: EventItem | null;
  upcomingEvents: EventItem[] | null;
  myEventsFailed: boolean;
  savedEvents: EventItem[] | null;
  savedEventsFailed: boolean;
  notifications: NotificationItem[] | null;
  notificationsFailed: boolean;
  onSavedEventRemoved: (eventId: string) => void;
  onOpenNotification: (notification: NotificationItem) => void;
};

function renderSkeletons(count: number) {
  return Array.from({ length: count }, (_, index) => (
    <div key={index} className="px-4 py-4">
      <div className="h-5 w-2/3 animate-pulse rounded-full bg-black/10" />
      <div className="mt-3 h-4 w-1/3 animate-pulse rounded-full bg-black/[0.07]" />
      <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-black/[0.06]" />
    </div>
  ));
}

export default function HomeDashboardContent({
  nextEvent,
  upcomingEvents,
  myEventsFailed,
  savedEvents,
  savedEventsFailed,
  notifications,
  notificationsFailed,
  onSavedEventRemoved,
  onOpenNotification,
}: HomeDashboardContentProps) {
  const additionalUpcomingEvents = upcomingEvents?.slice(1, 4) ?? null;

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8">
      <div className="w-full max-w-[820px]">
        <header className="flex flex-col gap-5 pb-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Home</h1>
            <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted-foreground">
              Your next tables, saved games and recent activity in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link href="/events">Find a game</Link></Button>
            <Button asChild variant="outline"><Link href="/create">Host a game</Link></Button>
          </div>
        </header>

        <div className="mt-7 space-y-8">
          <section aria-labelledby="home-next-game">
            <h2 id="home-next-game" className="text-lg font-semibold tracking-tight">Next game</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your nearest confirmed table.</p>
            <div className="mt-3 grid gap-1 rounded-surface bg-surface/55 p-1">
              {upcomingEvents === null ? renderSkeletons(1) : null}
              {myEventsFailed ? (
                <div className="rounded-row bg-surface-subtle px-4 py-4 text-sm text-muted-foreground">Your next game could not be loaded right now.</div>
              ) : null}
              {!myEventsFailed && upcomingEvents !== null && nextEvent ? <HomeEventRow event={nextEvent} highlighted /> : null}
              {!myEventsFailed && upcomingEvents !== null && !nextEvent ? (
                <div className="rounded-row px-4 py-4">
                  <p className="font-semibold">No upcoming game yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Find an open table and request a seat.</p>
                  <Link href="/events" className="mt-2 inline-flex text-sm font-semibold text-primary hover:text-primary-hover">Browse events</Link>
                </div>
              ) : null}
            </div>
          </section>

          {upcomingEvents === null || (additionalUpcomingEvents && additionalUpcomingEvents.length > 0) ? (
            <section aria-labelledby="home-my-events">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 id="home-my-events" className="text-lg font-semibold tracking-tight">My upcoming events</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Tables you host or have a confirmed seat at.</p>
                </div>
                <Link href="/events/mine" className="shrink-0 text-sm font-semibold text-primary hover:text-primary-hover">View all</Link>
              </div>
              <div className="mt-3 grid gap-1 rounded-surface bg-surface/55 p-1">
                {upcomingEvents === null ? renderSkeletons(3) : null}
                {additionalUpcomingEvents?.map((event) => <HomeEventRow key={event.id} event={event} />)}
              </div>
            </section>
          ) : null}

          <section aria-labelledby="home-saved-events">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="home-saved-events" className="text-lg font-semibold tracking-tight">Saved events</h2>
                <p className="mt-1 text-sm text-muted-foreground">Games you bookmarked for later.</p>
              </div>
              <Link href="/events/saved" className="shrink-0 text-sm font-semibold text-primary hover:text-primary-hover">View saved</Link>
            </div>
            <div className="mt-3 grid gap-1 rounded-surface bg-surface/55 p-1">
              {savedEvents === null ? renderSkeletons(3) : null}
              {savedEventsFailed ? <div className="rounded-row bg-surface-subtle px-4 py-4 text-sm text-muted-foreground">Saved events could not be loaded.</div> : null}
              {!savedEventsFailed && savedEvents?.slice(0, 3).map((event) => (
                <HomeEventRow key={event.id} event={event} saved onSavedChange={(watched) => !watched && onSavedEventRemoved(event.id)} />
              ))}
              {!savedEventsFailed && savedEvents?.length === 0 ? (
                <div className="rounded-row px-4 py-4 text-sm text-muted-foreground">No saved events yet. <Link href="/events" className="font-semibold text-primary">Explore events</Link></div>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="home-notifications" className="pb-2">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="home-notifications" className="text-lg font-semibold tracking-tight">Recent activity</h2>
                <p className="mt-1 text-sm text-muted-foreground">What is happening around your tables.</p>
              </div>
              <Link href="/notifications" className="shrink-0 text-sm font-semibold text-primary hover:text-primary-hover">View all</Link>
            </div>
            <div className="mt-3 grid gap-1 rounded-surface bg-surface/55 p-1">
              {notifications === null ? renderSkeletons(3) : null}
              {notificationsFailed ? <div className="rounded-row bg-surface-subtle px-4 py-4 text-sm text-muted-foreground">Recent activity could not be loaded.</div> : null}
              {!notificationsFailed && notifications && notifications.length > 0 ? (
                <div className="grid gap-1">
                  {notifications.slice(0, 5).map((notification) => <HomeActivityRow key={notification.id} notification={notification} onActivate={onOpenNotification} />)}
                </div>
              ) : null}
              {!notificationsFailed && notifications?.length === 0 ? <p className="rounded-row px-4 py-4 text-sm text-muted-foreground">No recent activity.</p> : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
