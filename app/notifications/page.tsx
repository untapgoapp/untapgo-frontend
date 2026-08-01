"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BellRing, CheckCheck, RefreshCw } from "lucide-react";

import NotificationCard from "@/components/notifications/NotificationCard";
import { useNotifications } from "@/components/notifications/NotificationRealtimeProvider";
import {
  getNotificationHref,
  type NotificationItem,
} from "@/services/notifications";

type Filter = "all" | "unread";

export default function NotificationsPage() {
  const router = useRouter();
  const notifications = useNotifications();
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const items = filter === "unread"
    ? notifications.items.filter((item) => !item.is_read)
    : notifications.items;

  async function openNotification(notification: NotificationItem) {
    if (busyId) return;
    setBusyId(notification.id);
    setActionError(null);
    try {
      if (!notification.is_read) await notifications.markRead(notification);
      router.push(getNotificationHref(notification));
    } catch {
      setActionError("Could not open notification.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeNotification(notification: NotificationItem) {
    if (busyId) return;
    setBusyId(notification.id);
    setActionError(null);
    try {
      await notifications.deleteNotification(notification);
    } catch {
      setActionError("Could not remove notification.");
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    if (markingAllRead || notifications.unread_count === 0) return;
    setMarkingAllRead(true);
    setActionError(null);
    try {
      await notifications.markAllRead();
    } catch {
      setActionError("Could not mark notifications as read.");
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await notifications.refresh();
    setRefreshing(false);
  }

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-3xl">
        <Link href="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-black">
          <ArrowLeft className="h-4 w-4" /> Back to events
        </Link>
        <header className="mt-8 flex flex-col gap-5 border-b border-black/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#EEE9FF] text-[#6E5AA7]"><BellRing className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold text-[#6E5AA7]">Activity</p><h1 className="text-3xl font-black tracking-tight">Notifications</h1></div>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600">Join requests, approvals, event changes and other table activity.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { void refresh(); }} disabled={refreshing || notifications.loading} aria-label="Refresh notifications" className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white text-zinc-500 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <button type="button" onClick={() => { void markAllRead(); }} disabled={markingAllRead || notifications.unread_count === 0} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-zinc-700 disabled:opacity-50">
              <CheckCheck className="h-4 w-4" /> {markingAllRead ? "Marking..." : "Mark all read"}
            </button>
          </div>
        </header>

        {!notifications.loading && !notifications.authenticated ? <LoginState /> : (
          <>
            <div className="mt-6 flex items-center justify-between gap-4">
              <div className="inline-flex rounded-full border border-black/10 bg-white p-1">
                <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>All</FilterButton>
                <FilterButton active={filter === "unread"} onClick={() => setFilter("unread")}>Unread{notifications.unread_count ? ` (${notifications.unread_count})` : ""}</FilterButton>
              </div>
              <p className="text-xs font-medium text-zinc-400">{connectionLabel(notifications.connection)}</p>
            </div>
            {actionError || notifications.error ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{actionError ?? notifications.error}</div>
            ) : null}
            {notifications.loading && !notifications.items.length ? <LoadingList /> : null}
            {!notifications.loading && items.length === 0 ? <EmptyState filter={filter} /> : null}
            {items.length ? (
              <div className="mt-6 grid gap-3">
                {items.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    disabled={busyId === notification.id}
                    onActivate={(item) => { void openNotification(item); }}
                    onDelete={(item) => { void removeNotification(item); }}
                  />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

function connectionLabel(connection: string) {
  if (connection === "connected") return "Live activity";
  if (connection === "unavailable") return "Live updates paused";
  return "Connecting live updates…";
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-[#6E5AA7] text-white" : "text-zinc-500"}`}>{children}</button>;
}

function LoginState() {
  return <section className="mt-8 rounded-[1.35rem] border border-black/10 bg-white p-6 text-center"><h2 className="text-lg font-bold">Log in to see notifications</h2><p className="mt-2 text-sm text-zinc-500">Your activity is linked to your UntapGo account.</p><Link href="/login?next=%2Fnotifications" className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-[#6E5AA7] px-5 text-sm font-semibold text-white">Log in</Link></section>;
}

function EmptyState({ filter }: { filter: Filter }) {
  return <section className="mt-8 rounded-[1.35rem] border border-black/10 bg-white p-10 text-center"><BellRing className="mx-auto h-5 w-5 text-zinc-400" /><h2 className="mt-4 font-bold">{filter === "unread" ? "You’re all caught up" : "No notifications yet"}</h2><p className="mt-2 text-sm text-zinc-500">{filter === "unread" ? "There are no unread notifications waiting for you." : "New activity will appear here."}</p></section>;
}

function LoadingList() {
  return <div className="mt-6 grid gap-3">{[1, 2, 3].map((key) => <div key={key} className="h-28 animate-pulse rounded-[1.25rem] border border-black/10 bg-white" />)}</div>;
}
