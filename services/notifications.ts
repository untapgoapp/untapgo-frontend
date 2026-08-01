import { api } from "@/lib/api";
import type { NotificationChange } from "@/lib/notification-live";

export { getNotificationHref } from "@/lib/notification-presentation";

export const NOTIFICATIONS_CHANGED_EVENT =
  "untapgo:notifications-changed";

export type NotificationMeta =
  Record<string, unknown>;

export type NotificationItem = {
  id: string;
  user_id?: string | null;
  event_id?: string | null;

  type: string;
  title: string;
  body: string;

  meta?: NotificationMeta | null;

  is_read: boolean;
  created_at: string;
};

export type NotificationListResponse = {
  unread_count: number;
  items: NotificationItem[];
};

export type NotificationActionResponse = {
  ok: boolean;
  updated: number;
};

type ListNotificationsOptions = {
  unreadOnly?: boolean;
  limit?: number;
};

export function emitNotificationsChanged(
  detail: NotificationChange = { kind: "refresh" },
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_CHANGED_EVENT, { detail }),
  );
}

export async function listNotifications({
  unreadOnly = false,
  limit = 50,
}: ListNotificationsOptions = {}): Promise<NotificationListResponse> {
  const search =
    new URLSearchParams();

  search.set(
    "unread_only",
    unreadOnly
      ? "true"
      : "false",
  );

  search.set(
    "limit",
    String(
      Math.min(
        200,
        Math.max(1, limit),
      ),
    ),
  );

  const result =
    await api.get<NotificationListResponse>(
      `/notifications?${search.toString()}`,
    );

  return {
    unread_count: Number(
      result.unread_count ?? 0,
    ),
    items: Array.isArray(
      result.items,
    )
      ? result.items
      : [],
  };
}

export async function markNotificationRead(
  notificationId: string,
): Promise<NotificationActionResponse> {
  const result =
    await api.post<NotificationActionResponse>(
      `/notifications/${encodeURIComponent(
        notificationId,
      )}/read`,
      {},
    );

  emitNotificationsChanged({
    kind: "read",
    notificationId,
    updated: result.updated,
  });

  return result;
}

export async function markNotificationsReadForEvent(
  eventId: string,
): Promise<NotificationActionResponse> {
  const result =
    await api.post<NotificationActionResponse>(
      `/notifications/read-for-event/${encodeURIComponent(
        eventId,
      )}`,
      {},
    );

  emitNotificationsChanged({
    kind: "read_event",
    eventId,
    updated: result.updated,
  });

  return result;
}

export async function markAllNotificationsRead(): Promise<NotificationActionResponse> {
  const result =
    await api.post<NotificationActionResponse>(
      "/notifications/clear",
      {},
    );

  emitNotificationsChanged({ kind: "read_all" });

  return result;
}
