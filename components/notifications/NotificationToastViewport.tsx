"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import {
  getNotificationBody,
  getNotificationHref,
  getNotificationIconClasses,
  getNotificationPresentation,
  getNotificationTitle,
} from "@/lib/notification-presentation";
import type { NotificationItem } from "@/services/notifications";

type Props = {
  notifications: NotificationItem[];
  onDismiss: (notificationId: string) => void;
  onMarkRead: (notification: NotificationItem) => Promise<void>;
};

export default function NotificationToastViewport({
  notifications,
  onDismiss,
  onMarkRead,
}: Props) {
  const router = useRouter();
  const firstId = notifications[0]?.id;

  useEffect(() => {
    if (!firstId) return;
    const timer = window.setTimeout(() => onDismiss(firstId), 7_000);
    return () => window.clearTimeout(timer);
  }, [firstId, onDismiss]);

  if (!notifications.length) return null;
  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[10000] grid w-[min(92vw,23rem)] gap-2" aria-live="polite">
      {notifications.slice(0, 3).map((notification) => {
        const visual = getNotificationPresentation(notification.type);
        const Icon = visual.icon;
        return (
          <div key={notification.id} role="status" className="flex gap-3 rounded-2xl border border-primary/15 bg-white p-3 shadow-[0_18px_50px_rgba(45,34,66,0.18)]">
            <button
              type="button"
              className="flex min-w-0 flex-1 gap-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
              onClick={() => {
                void (async () => {
                  if (!notification.is_read) await onMarkRead(notification);
                  router.push(getNotificationHref(notification));
                  onDismiss(notification.id);
                })();
              }}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${getNotificationIconClasses(visual.tone)}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-sm text-zinc-950">{getNotificationTitle(notification)}</strong>
                <span className="mt-0.5 line-clamp-2 block text-sm leading-5 text-zinc-600">{getNotificationBody(notification)}</span>
              </span>
            </button>
            <button type="button" aria-label="Dismiss notification" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" onClick={() => onDismiss(notification.id)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
