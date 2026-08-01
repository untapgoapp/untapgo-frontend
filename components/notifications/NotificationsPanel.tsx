"use client";

import Link from "next/link";
import {
  CheckCheck,
  RefreshCw,
  X,
} from "lucide-react";

import NotificationCard from "@/components/notifications/NotificationCard";
import { NotificationPanelEmpty, NotificationPanelLoading } from "@/components/notifications/NotificationPanelStates";
import type {
  NotificationItem,
} from "@/services/notifications";
import type { NotificationConnectionState } from "./useNotificationRealtimeChannel";

type NotificationsPanelProps = {
  id?: string;
  items: NotificationItem[];
  unreadCount: number;

  loading: boolean;
  refreshing: boolean;

  error: string | null;
  connection: NotificationConnectionState;
  busyNotificationId: string | null;
  markingAllRead: boolean;

  onClose: () => void;
  onRefresh: () => void;
  onMarkAllRead: () => void;
  onOpenNotification: (
    notification: NotificationItem,
  ) => void;
  onDeleteNotification: (
    notification: NotificationItem,
  ) => void;
};

export default function NotificationsPanel({
  id,
  items,
  unreadCount,
  loading,
  refreshing,
  error,
  connection,
  busyNotificationId,
  markingAllRead,
  onClose,
  onRefresh,
  onMarkAllRead,
  onOpenNotification,
  onDeleteNotification,
}: NotificationsPanelProps) {
  return (
    <section
      id={id}
      role="dialog"
      aria-label="Notifications"
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] top-[4.5rem] z-[95] flex flex-col overflow-hidden rounded-surface border border-border/80 bg-surface shadow-overlay sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:max-h-[min(620px,calc(100dvh-5.5rem))] sm:w-[390px]"
    >
      <header className="flex items-start justify-between gap-4 border-b border-border/70 px-4 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Notifications
            </h2>

            {unreadCount > 0 ? (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-secondary-foreground">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {connection === "unavailable" ? "Live updates paused · REST still available" : "Event activity and account updates"}
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
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
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
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {unreadCount > 0 ? (
        <div className="flex justify-end border-b border-border/70 px-4 py-2">
          <button
            type="button"
            onClick={
              onMarkAllRead
            }
            disabled={
              markingAllRead
            }
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-secondary disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />

            {markingAllRead
              ? "Marking..."
              : "Mark all as read"}
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <NotificationPanelLoading />
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
          <NotificationPanelEmpty />
        ) : null}

        {!loading &&
        !error &&
        items.length > 0 ? (
          <div className="divide-y divide-border/60">
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
                  onDelete={
                    onDeleteNotification
                  }
                />
              ),
            )}
          </div>
        ) : null}
      </div>

      <footer className="border-t border-border/70 bg-background p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3">
        <Link
          href="/notifications"
          onClick={onClose}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-control text-sm font-semibold text-primary transition hover:bg-secondary"
        >
          See all notifications
        </Link>
      </footer>
    </section>
  );
}
