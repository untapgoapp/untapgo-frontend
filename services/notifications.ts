import { api } from "@/lib/api";

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

function emitNotificationsChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      NOTIFICATIONS_CHANGED_EVENT,
    ),
  );
}

function getMetaString(
  meta: NotificationMeta | null | undefined,
  key: string,
): string | null {
  const value = meta?.[key];

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  return value.trim();
}

function getSafeInternalPath(
  value: string | null,
): string | null {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return null;
  }

  return value;
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

  emitNotificationsChanged();

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

  emitNotificationsChanged();

  return result;
}

export async function markAllNotificationsRead(): Promise<NotificationActionResponse> {
  const result =
    await api.post<NotificationActionResponse>(
      "/notifications/clear",
      {},
    );

  emitNotificationsChanged();

  return result;
}

export function getNotificationHref(
  notification: NotificationItem,
): string {
  const explicitPath =
    getSafeInternalPath(
      getMetaString(
        notification.meta,
        "href",
      ) ??
        getMetaString(
          notification.meta,
          "url",
        ),
    );

  if (explicitPath) {
    return explicitPath;
  }

  if (notification.event_id) {
    return `/events/${encodeURIComponent(
      notification.event_id,
    )}`;
  }

  const profileUserId =
    getMetaString(
      notification.meta,
      "requesting_user_id",
    ) ??
    getMetaString(
      notification.meta,
      "joining_user_id",
    ) ??
    getMetaString(
      notification.meta,
      "profile_user_id",
    ) ??
    getMetaString(
      notification.meta,
      "user_id",
    );

  if (profileUserId) {
    return `/profile/${encodeURIComponent(
      profileUserId,
    )}`;
  }

  return "/notifications";
}