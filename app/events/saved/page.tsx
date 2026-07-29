"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  RefreshCw,
} from "lucide-react";

import EventCard from "@/components/events/EventCard";
import {
  ApiError,
} from "@/lib/api";
import {
  getWatchlist,
  WATCHLIST_CHANGED_EVENT,
  type EventItem,
} from "@/services/events";

export default function SavedEventsPage() {
  const [events, setEvents] =
    useState<EventItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    unauthorized,
    setUnauthorized,
  ] = useState(false);

  const loadSavedEvents =
    useCallback(
      async (
        silent = false,
      ) => {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        try {
          const loadedEvents =
            await getWatchlist({
              force: true,
            });

          setUnauthorized(
            false,
          );

          setEvents(
            loadedEvents,
          );
        } catch (loadError) {
          if (
            loadError instanceof
              ApiError &&
            loadError.status === 401
          ) {
            setUnauthorized(
              true,
            );

            setEvents([]);

            return;
          }

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Could not load saved events.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadSavedEvents();
  }, [loadSavedEvents]);

  useEffect(() => {
    function handleWatchlistChanged() {
      void loadSavedEvents(
        true,
      );
    }

    window.addEventListener(
      WATCHLIST_CHANGED_EVENT,
      handleWatchlistChanged,
    );

    return () => {
      window.removeEventListener(
        WATCHLIST_CHANGED_EVENT,
        handleWatchlistChanged,
      );
    };
  }, [loadSavedEvents]);

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>

        <header className="mt-8 flex flex-col gap-5 border-b border-black/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#EEE9FF] text-[#6E5AA7]">
                <Bookmark
                  className="h-5 w-5"
                  fill="currentColor"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#6E5AA7]">
                  Watchlist
                </p>

                <h1 className="text-3xl font-black tracking-tight">
                  Saved events
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600">
              Keep interesting
              tables nearby while
              you decide whether
              to join.
            </p>
          </div>

          {!unauthorized ? (
            <button
              type="button"
              onClick={() => {
                void loadSavedEvents(
                  true,
                );
              }}
              disabled={
                loading ||
                refreshing
              }
              aria-label="Refresh saved events"
              className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white text-zinc-500 transition hover:border-black/20 hover:text-black disabled:opacity-50"
            >
              <RefreshCw
                className={
                  refreshing
                    ? "h-4 w-4 animate-spin"
                    : "h-4 w-4"
                }
              />
            </button>
          ) : null}
        </header>

        {unauthorized ? (
          <LoginState />
        ) : null}

        {!unauthorized &&
        error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {error}
          </div>
        ) : null}

        {!unauthorized &&
        loading ? (
          <LoadingList />
        ) : null}

        {!unauthorized &&
        !loading &&
        !error &&
        events.length === 0 ? (
          <EmptyState />
        ) : null}

        {!unauthorized &&
        !loading &&
        events.length > 0 ? (
          <div className="mt-7 grid gap-4">
            {events.map(
              (event) => (
                <EventCard
                  key={
                    event.id
                  }
                  event={event}
                  initialWatched
                  onWatchChange={(
                    watched,
                  ) => {
                    if (
                      watched
                    ) {
                      return;
                    }

                    setEvents(
                      (
                        currentEvents,
                      ) =>
                        currentEvents.filter(
                          (
                            currentEvent,
                          ) =>
                            currentEvent.id !==
                            event.id,
                        ),
                    );
                  }}
                />
              ),
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function LoginState() {
  return (
    <section className="mt-8 rounded-[1.35rem] border border-black/10 bg-white p-8 text-center">
      <Bookmark className="mx-auto h-7 w-7 text-[#6E5AA7]" />

      <h2 className="mt-4 text-lg font-bold">
        Log in to save events
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        Your watchlist is linked
        to your UntapGo account.
      </p>

      <Link
        href="/login?next=%2Fevents%2Fsaved"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#6E5AA7] px-5 text-sm font-semibold text-white transition hover:bg-[#5F4E94]"
      >
        Log in
      </Link>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="mt-8 rounded-[1.35rem] border border-black/10 bg-white p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black/[0.045] text-zinc-400">
        <Bookmark className="h-5 w-5" />
      </div>

      <h2 className="mt-4 font-bold">
        No saved events
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        Use the bookmark button
        on an event to keep it
        here.
      </p>

      <Link
        href="/events"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#6E5AA7] px-5 text-sm font-semibold text-white transition hover:bg-[#5F4E94]"
      >
        Explore events
      </Link>
    </section>
  );
}

function LoadingList() {
  return (
    <div className="mt-7 grid gap-4">
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-[1.35rem] border border-black/10 bg-white p-5">
      <div className="h-5 w-52 animate-pulse rounded-full bg-black/10" />

      <div className="mt-3 h-4 w-32 animate-pulse rounded-full bg-black/[0.07]" />

      <div className="mt-5 h-4 w-64 animate-pulse rounded-full bg-black/[0.06]" />
    </div>
  );
}