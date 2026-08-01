import type {
  NotificationItem,
  NotificationListResponse,
} from "@/services/notifications";

export const NOTIFICATION_REALTIME_EVENT = "notification";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type NotificationChange =
  | { kind: "received"; notification: NotificationItem }
  | { kind: "read"; notificationId: string; updated: number }
  | { kind: "read_event"; eventId: string; updated: number }
  | { kind: "read_all" }
  | { kind: "refresh" };

export function notificationRealtimeTopic(userId: string): string | null {
  return UUID_PATTERN.test(userId) ? `user:${userId}:notifications` : null;
}

export function parseNotificationBroadcast(
  value: unknown,
  expectedUserId: string,
): NotificationItem | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    !UUID_PATTERN.test(String(candidate.id ?? ""))
    || candidate.user_id !== expectedUserId
    || typeof candidate.type !== "string"
    || typeof candidate.title !== "string"
    || typeof candidate.body !== "string"
    || typeof candidate.is_read !== "boolean"
    || typeof candidate.created_at !== "string"
    || Number.isNaN(Date.parse(candidate.created_at))
  ) {
    return null;
  }

  const meta = candidate.meta;
  if (meta !== null && meta !== undefined && (typeof meta !== "object" || Array.isArray(meta))) {
    return null;
  }

  return {
    id: candidate.id as string,
    user_id: expectedUserId,
    event_id: typeof candidate.event_id === "string" ? candidate.event_id : null,
    type: candidate.type,
    title: candidate.title,
    body: candidate.body,
    meta: (meta ?? null) as Record<string, unknown> | null,
    is_read: candidate.is_read,
    created_at: candidate.created_at,
  };
}

function newestFirst(left: NotificationItem, right: NotificationItem): number {
  const timeDifference = Date.parse(right.created_at) - Date.parse(left.created_at);
  return timeDifference || right.id.localeCompare(left.id);
}

export function applyNotificationChange(
  current: NotificationListResponse,
  change: NotificationChange,
  { limit, unreadOnly = false }: { limit: number; unreadOnly?: boolean },
): NotificationListResponse {
  if (change.kind === "refresh") return current;

  if (change.kind === "read_all") {
    return {
      unread_count: 0,
      items: unreadOnly
        ? []
        : current.items.map((item) => ({ ...item, is_read: true })),
    };
  }

  if (change.kind === "read" || change.kind === "read_event") {
    const matches = (item: NotificationItem) => change.kind === "read"
      ? item.id === change.notificationId
      : item.event_id === change.eventId;
    const items = current.items.map((item) => (
      matches(item) ? { ...item, is_read: true } : item
    ));
    return {
      unread_count: Math.max(0, current.unread_count - Math.max(0, change.updated)),
      items: unreadOnly ? items.filter((item) => !item.is_read) : items,
    };
  }

  const existing = current.items.find((item) => item.id === change.notification.id);
  const unreadDelta = Number(!change.notification.is_read) - Number(existing ? !existing.is_read : false);
  const byId = new Map(current.items.map((item) => [item.id, item]));
  byId.set(change.notification.id, change.notification);
  const items = [...byId.values()]
    .filter((item) => !unreadOnly || !item.is_read)
    .sort(newestFirst)
    .slice(0, Math.max(1, limit));

  return {
    unread_count: Math.max(0, current.unread_count + unreadDelta),
    items,
  };
}
