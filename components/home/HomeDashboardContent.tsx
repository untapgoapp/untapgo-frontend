"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  MapPin,
  Users,
} from "lucide-react";

import HomeFeedComposer from "@/components/home/HomeFeedComposer";
import HomeFeedList from "@/components/home/HomeFeedList";
import { Button } from "@/components/ui/button";
import useSocialFeed from "@/hooks/useSocialFeed";
import type { SocialFeedView } from "@/lib/social-feed";
import type { EventItem } from "@/services/events";

type HomeDashboardContentProps = {
  nextEvent: EventItem | null;
  upcomingEvents: EventItem[] | null;
  myEventsFailed: boolean;
  nickname: string;
  avatarUrl: string | null;
};

function formatEventDate(value?: string | null): string {
  if (!value) return "Date TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBD";

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getFormatLabel(event: EventItem): string {
  if (event.format) return event.format;
  if (!event.format_slug) return "Magic";

  return event.format_slug
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MobileNextEvent({ event }: { event: EventItem }) {
  return (
    <section className="rounded-surface bg-secondary/70 p-4 xl:hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary">
            Next event
          </p>
          <h2 className="mt-1.5 truncate text-base font-bold tracking-tight">
            {event.title || "Untitled event"}
          </h2>
          <p className="mt-1 text-sm font-semibold text-secondary-foreground">
            {getFormatLabel(event)}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {event.attendees_count || 0}/{event.max_players || 0}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          {formatEventDate(event.starts_at)}
        </span>
        <span className="inline-flex min-w-0 items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{event.address_text || "Location TBD"}</span>
        </span>
      </div>

      <Link
        href={`/events/${event.id}`}
        className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-primary-hover"
      >
        View event
      </Link>
    </section>
  );
}

export default function HomeDashboardContent({
  nextEvent,
  upcomingEvents,
  myEventsFailed,
  nickname,
  avatarUrl,
}: HomeDashboardContentProps) {
  const [feedView, setFeedView] = useState<SocialFeedView>("for-you");
  const feed = useSocialFeed(feedView);

  return (
    <main className="min-h-screen px-4 py-5 text-foreground sm:px-5 sm:py-7 lg:px-2 xl:px-0">
      <div className="mx-auto w-full max-w-[760px]">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              Home
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted-foreground">
              See what players are sharing and find your next table.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/events">Find a game</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/create">Host a game</Link>
            </Button>
          </div>
        </header>

        <div className="mt-6 space-y-5">
          {upcomingEvents === null ? (
            <div className="h-36 animate-pulse rounded-surface bg-black/[0.05] xl:hidden" />
          ) : null}

          {myEventsFailed ? (
            <div className="rounded-surface bg-surface-subtle px-4 py-4 text-sm text-muted-foreground xl:hidden">
              Your next event could not be loaded right now.
            </div>
          ) : null}

          {!myEventsFailed && upcomingEvents !== null && nextEvent ? (
            <MobileNextEvent event={nextEvent} />
          ) : null}

          <HomeFeedComposer
            nickname={nickname}
            avatarUrl={avatarUrl}
            onCreate={feed.create}
          />

          <section aria-label="Home feed" className="overflow-hidden rounded-surface bg-surface">
            <div
              role="tablist"
              aria-label="Feed view"
              className="flex items-center gap-6 border-b border-border/70 px-4 sm:px-5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={feedView === "for-you"}
                onClick={() => setFeedView("for-you")}
                className={[
                  "relative min-h-12 text-sm font-semibold outline-none transition-colors focus-visible:text-primary",
                  feedView === "for-you"
                    ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                For you
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={feedView === "following"}
                onClick={() => setFeedView("following")}
                className={[
                  "relative min-h-12 text-sm font-semibold outline-none transition-colors focus-visible:text-primary",
                  feedView === "following"
                    ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                Following
              </button>
            </div>

            <HomeFeedList
              view={feedView}
              items={feed.items}
              loading={feed.loading}
              loadingMore={feed.loadingMore}
              error={feed.error}
              hasMore={feed.hasMore}
              onRetry={feed.retry}
              onLoadMore={feed.loadMore}
              onDelete={feed.remove}
              onChange={feed.update}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
