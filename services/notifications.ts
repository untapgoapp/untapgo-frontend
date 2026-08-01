import { api } from "@/lib/api";

export { getNotificationHref } from "@/lib/notification-presentation";

export const NOTIFICATIONS_REFRESH_REQUESTED_EVENT =
  "untapgo:notifications-refresh-requested";

export type NotificationMeta = Record<string, unknown> & {
  href?: string;
};

export type NotificationItem = {
  id: string;
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
  notification?: NotificationItem | null;
};

export type NotificationDeleteResponse = {
  ok: boolean;
  deleted: number;
};

type ListNotificationsOptions = {
  unreadOnly?: boolean;
  limit?: number;
};

export function requestNotificationsRefresh(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_REQUESTED_EVENT));
  }
}

export async function listNotifications({
  unreadOnly = false,
  limit = 50,
}: ListNotificationsOptions = {}): Promise<NotificationListResponse> {
  const search = new URLSearchParams({
    unread_only: unreadOnly ? "true" : "false",
    limit: String(Math.min(200, Math.max(1, limit))),
  });
  const result = await api.get<NotificationListResponse>(
    `/notifications?${search.toString()}`,
  );
  return {
    unread_count: Math.max(0, Number(result.unread_count ?? 0)),
    items: Array.isArray(result.items) ? result.items : [],
  };
}

export function markNotificationRead(
  notificationId: string,
): Promise<NotificationActionResponse> {
  return api.post(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
    {},
  );
}

export function markNotificationsReadForEvent(
  eventId: string,
): Promise<NotificationActionResponse> {
  return api.post(
    `/notifications/read-for-event/${encodeURIComponent(eventId)}`,
    {},
  );
}

export function markAllNotificationsRead(): Promise<NotificationActionResponse> {
  return api.post("/notifications/clear", {});
}

export function deleteNotification(
  notificationId: string,
): Promise<NotificationDeleteResponse> {
  return api.delete(`/notifications/${encodeURIComponent(notificationId)}`);
}
