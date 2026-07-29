"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  ArrowLeft,
  BellRing,
  CheckCheck,
  RefreshCw,
} from "lucide-react";

import NotificationCard from "@/components/notifications/NotificationCard";
import {
  ApiError,
} from "@/lib/api";
import {
  getNotificationHref,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_CHANGED_EVENT,
  type NotificationItem,
} from "@/services/notifications";

type Filter =
  | "all"
  | "unread";

export default function NotificationsPage() {
  const router = useRouter();

  const [filter, setFilter] =
    useState<Filter>("all");

  const [items, setItems] =
    useState<NotificationItem[]>(
      [],
    );

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

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

  const [
    busyNotificationId,
    setBusyNotificationId,
  ] = useState<string | null>(
    null,
  );

  const [
    markingAllRead,
    setMarkingAllRead,
  ] = useState(false);

  const loadNotifications =
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
          const result =
            await listNotifications({
              unreadOnly:
                filter ===
                "unread",
              limit: 100,
            });

          setUnauthorized(false);
          setItems(result.items);
          setUnreadCount(
            result.unread_count,
          );
        } catch (loadError) {
          if (
            loadError instanceof
              ApiError &&
            loadError.status === 401
          ) {
            setUnauthorized(true);
            setItems([]);
            setUnreadCount(0);

            return;
          }

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load notifications.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [filter],
    );

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadNotifications(
            true,
          );
        }
      }, 30_000);

    function handleChanged() {
      void loadNotifications(
        true,
      );
    }

    window.addEventListener(
      NOTIFICATIONS_CHANGED_EVENT,
      handleChanged,
    );

    return () => {
      window.clearInterval(
        interval,
      );

      window.removeEventListener(
        NOTIFICATIONS_CHANGED_EVENT,
        handleChanged,
      );
    };
  }, [loadNotifications]);

  async function handleOpenNotification(
    notification: NotificationItem,
  ) {
    if (
      busyNotificationId
    ) {
      return;
    }

    setBusyNotificationId(
      notification.id,
    );

    try {
      if (
        !notification.is_read
      ) {
        await markNotificationRead(
          notification.id,
        );

        setItems(
          (currentItems) =>
            filter === "unread"
              ? currentItems.filter(
                  (current) =>
                    current.id !==
                    notification.id,
                )
              : currentItems.map(
                  (current) =>
                    current.id ===
                    notification.id
                      ? {
                          ...current,
                          is_read:
                            true,
                        }
                      : current,
                ),
        );

        setUnreadCount(
          (current) =>
            Math.max(
              0,
              current - 1,
            ),
        );
      }

      router.push(
        getNotificationHref(
          notification,
        ),
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Could not open notification.",
      );
    } finally {
      setBusyNotificationId(
        null,
      );
    }
  }

  async function handleMarkAllRead() {
    if (
      markingAllRead ||
      unreadCount === 0
    ) {
      return;
    }

    setMarkingAllRead(true);
    setError(null);

    try {
      await markAllNotificationsRead();

      setUnreadCount(0);

      setItems(
        (currentItems) =>
          filter === "unread"
            ? []
            : currentItems.map(
                (notification) => ({
                  ...notification,
                  is_read: true,
                }),
              ),
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Could not mark notifications as read.",
      );
    } finally {
      setMarkingAllRead(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-3xl">
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
                <BellRing className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#6E5AA7]">
                  Activity
                </p>

                <h1 className="text-3xl font-black tracking-tight">
                  Notifications
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600">
              Join requests,
              approvals, event
              changes and other
              table activity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void loadNotifications(
                  true,
                );
              }}
              disabled={
                refreshing ||
                loading
              }
              className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white text-zinc-500 transition hover:border-black/20 hover:text-black disabled:opacity-50"
              aria-label="Refresh notifications"
            >
              <RefreshCw
                className={
                  refreshing
                    ? "h-4 w-4 animate-spin"
                    : "h-4 w-4"
                }
              />
            </button>

            <button
              type="button"
              onClick={() => {
                void handleMarkAllRead();
              }}
              disabled={
                markingAllRead ||
                unreadCount === 0
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-black/20 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />

              {markingAllRead
                ? "Marking..."
                : "Mark all read"}
            </button>
          </div>
        </header>

        {unauthorized ? (
          <LoginState />
        ) : (
          <>
            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="inline-flex rounded-full border border-black/10 bg-white p-1">
                <FilterButton
                  active={
                    filter === "all"
                  }
                  onClick={() => {
                    setFilter("all");
                  }}
                >
                  All
                </FilterButton>

                <FilterButton
                  active={
                    filter ===
                    "unread"
                  }
                  onClick={() => {
                    setFilter(
                      "unread",
                    );
                  }}
                >
                  Unread
                  {unreadCount > 0
                    ? ` (${unreadCount})`
                    : ""}
                </FilterButton>
              </div>

              <p className="text-xs font-medium text-zinc-400">
                Updates every 30
                seconds
              </p>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            ) : null}

            {loading ? (
              <LoadingList />
            ) : null}

            {!loading &&
            !error &&
            items.length === 0 ? (
              <EmptyState
                filter={filter}
              />
            ) : null}

            {!loading &&
            items.length > 0 ? (
              <div className="mt-6 grid gap-3">
                {items.map(
                  (notification) => (
                    <NotificationCard
                      key={
                        notification.id
                      }
                      notification={
                        notification
                      }
                      disabled={
                        busyNotificationId ===
                        notification.id
                      }
                      onActivate={(
                        selected,
                      ) => {
                        void handleOpenNotification(
                          selected,
                        );
                      }}
                    />
                  ),
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-[#6E5AA7] text-white"
          : "text-zinc-500 hover:text-black",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function LoginState() {
  return (
    <section className="mt-8 rounded-[1.35rem] border border-black/10 bg-white p-6 text-center">
      <h2 className="text-lg font-bold">
        Log in to see notifications
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Your event activity is
        linked to your UntapGo
        account.
      </p>

      <Link
        href="/login?next=%2Fnotifications"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#6E5AA7] px-5 text-sm font-semibold text-white transition hover:bg-[#5F4E94]"
      >
        Log in
      </Link>
    </section>
  );
}

function EmptyState({
  filter,
}: {
  filter: Filter;
}) {
  return (
    <section className="mt-8 rounded-[1.35rem] border border-black/10 bg-white p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black/[0.045] text-zinc-400">
        <BellRing className="h-5 w-5" />
      </div>

      <h2 className="mt-4 font-bold">
        {filter === "unread"
          ? "You’re all caught up"
          : "No notifications yet"}
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        {filter === "unread"
          ? "There are no unread notifications waiting for you."
          : "New join requests and event updates will appear here."}
      </p>
    </section>
  );
}

function LoadingList() {
  return (
    <div className="mt-6 grid gap-3">
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="flex items-start gap-3 rounded-[1.25rem] border border-black/10 bg-white px-4 py-4">
      <div className="h-10 w-10 animate-pulse rounded-full bg-black/10" />

      <div className="flex-1">
        <div className="h-3.5 w-36 animate-pulse rounded-full bg-black/10" />

        <div className="mt-2 h-3 w-full animate-pulse rounded-full bg-black/[0.06]" />

        <div className="mt-2 h-3 w-2/3 animate-pulse rounded-full bg-black/[0.05]" />
      </div>
    </div>
  );
}