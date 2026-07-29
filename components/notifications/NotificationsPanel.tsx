"use client";

import Link from "next/link";
import {
  BellOff,
  CheckCheck,
  RefreshCw,
  X,
} from "lucide-react";

import NotificationCard from "@/components/notifications/NotificationCard";
import type {
  NotificationItem,
} from "@/services/notifications";

type NotificationsPanelProps = {
  items: NotificationItem[];
  unreadCount: number;

  loading: boolean;
  refreshing: boolean;

  error: string | null;
  busyNotificationId: string | null;
  markingAllRead: boolean;

  onClose: () => void;
  onRefresh: () => void;
  onMarkAllRead: () => void;
  onOpenNotification: (
    notification: NotificationItem,
  ) => void;
};

export default function NotificationsPanel({
  items,
  unreadCount,
  loading,
  refreshing,
  error,
  busyNotificationId,
  markingAllRead,
  onClose,
  onRefresh,
  onMarkAllRead,
  onOpenNotification,
}: NotificationsPanelProps) {
  return (
    <section
      role="dialog"
      aria-label="Notifications"
      className="fixed inset-x-4 top-20 z-[90] max-h-[min(620px,calc(100vh-100px))] overflow-hidden rounded-[1.5rem] border border-black/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[390px]"
    >
      <header className="flex items-start justify-between gap-4 border-b border-black/10 px-4 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-zinc-950">
              Notifications
            </h2>

            {unreadCount > 0 ? (
              <span className="rounded-full bg-[#EEE9FF] px-2 py-0.5 text-[11px] font-bold text-[#6E5AA7]">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs text-zinc-500">
            Event activity and
            account updates
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            disabled={
              refreshing ||
              loading
            }
            aria-label="Refresh notifications"
            title="Refresh notifications"
            className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 transition hover:bg-black/[0.05] hover:text-black disabled:opacity-50"
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
            onClick={onClose}
            aria-label="Close notifications"
            className="grid h-9 w-9 place-items-center rounded-full text-zinc-500 transition hover:bg-black/[0.05] hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {unreadCount > 0 ? (
        <div className="flex justify-end border-b border-black/10 px-4 py-2">
          <button
            type="button"
            onClick={
              onMarkAllRead
            }
            disabled={
              markingAllRead
            }
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#6E5AA7] transition hover:bg-[#EEE9FF] disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />

            {markingAllRead
              ? "Marking..."
              : "Mark all as read"}
          </button>
        </div>
      ) : null}

      <div className="max-h-[450px] overflow-y-auto">
        {loading ? (
          <LoadingState />
        ) : null}

        {!loading && error ? (
          <div className="m-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {error}

            <button
              type="button"
              onClick={onRefresh}
              className="mt-2 block font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!loading &&
        !error &&
        items.length === 0 ? (
          <EmptyState />
        ) : null}

        {!loading &&
        !error &&
        items.length > 0 ? (
          <div className="divide-y divide-black/10">
            {items.map(
              (notification) => (
                <NotificationCard
                  key={
                    notification.id
                  }
                  notification={
                    notification
                  }
                  compact
                  disabled={
                    busyNotificationId ===
                    notification.id
                  }
                  onActivate={
                    onOpenNotification
                  }
                />
              ),
            )}
          </div>
        ) : null}
      </div>

      <footer className="border-t border-black/10 bg-[#FAF9F6] p-3">
        <Link
          href="/notifications"
          onClick={onClose}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-xl text-sm font-semibold text-[#6E5AA7] transition hover:bg-[#EEE9FF]"
        >
          View all notifications
        </Link>
      </footer>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-1 py-2">
      <LoadingRow />
      <LoadingRow />
      <LoadingRow />
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <div className="h-10 w-10 animate-pulse rounded-full bg-black/10" />

      <div className="flex-1">
        <div className="h-3.5 w-32 animate-pulse rounded-full bg-black/10" />

        <div className="mt-2 h-3 w-full animate-pulse rounded-full bg-black/[0.06]" />

        <div className="mt-2 h-2.5 w-16 animate-pulse rounded-full bg-black/[0.05]" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-black/[0.045] text-zinc-400">
        <BellOff className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-semibold text-zinc-800">
        Nothing new
      </p>

      <p className="mt-1 max-w-56 text-sm leading-6 text-zinc-500">
        New event activity will
        appear here.
      </p>
    </div>
  );
}