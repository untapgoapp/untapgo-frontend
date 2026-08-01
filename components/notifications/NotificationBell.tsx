"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell } from "lucide-react";

import NotificationsPanel from "@/components/notifications/NotificationsPanel";
import { useNotifications } from "@/components/notifications/NotificationRealtimeProvider";
import { getNotificationHref, type NotificationItem } from "@/services/notifications";

export default function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const notifications = useNotifications();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(event: MouseEvent) {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function openNotification(notification: NotificationItem) {
    if (busyId) return;
    setBusyId(notification.id);
    setActionError(null);
    try {
      if (!notification.is_read) await notifications.markRead(notification);
      setOpen(false);
      router.push(getNotificationHref(notification));
    } catch {
      setActionError("Could not open notification.");
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

  if (!notifications.authenticated) return null;
  const unreadCount = notifications.unread_count;
  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-10 w-10 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-secondary/65 hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-surface bg-primary px-1 text-[9px] font-black leading-none text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <NotificationsPanel
          items={notifications.items.slice(0, 8)}
          unreadCount={unreadCount}
          loading={notifications.loading}
          refreshing={false}
          error={actionError ?? notifications.error}
          connection={notifications.connection}
          busyNotificationId={busyId}
          markingAllRead={markingAllRead}
          onClose={() => setOpen(false)}
          onRefresh={() => { void notifications.refresh(); }}
          onMarkAllRead={() => { void markAllRead(); }}
          onOpenNotification={(item) => { void openNotification(item); }}
          onDeleteNotification={(item) => { void removeNotification(item); }}
        />
      ) : null}
    </div>
  );
}
