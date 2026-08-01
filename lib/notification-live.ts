import type {
  NotificationItem,
  NotificationListResponse,
} from "@/services/notifications";

export const NOTIFICATION_CREATED_EVENT = "notification_created";
export const NOTIFICATION_UPDATED_EVENT = "notification_updated";
export const NOTIFICATION_DELETED_EVENT = "notification_deleted";
export const NOTIFICATIONS_CLEARED_EVENT = "notifications_cleared";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type NotificationChange =
  | { kind: "created"; notification: NotificationItem }
  | { kind: "updated"; notification: NotificationItem }
  | { kind: "deleted"; notificationId: string }
  | { kind: "mark_all_read"; updated?: number }
  | { kind: "mark_event_read"; eventId: string; updated: number };

export function notificationRealtimeTopic(userId: string): string | null {
  return UUID_PATTERN.test(userId) ? `user:${userId}:notifications` : null;
}

export function parseNotificationBroadcast(value: unknown): NotificationItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const eventId = item.event_id;
  const meta = item.meta;
  if (
    !UUID_PATTERN.test(String(item.id ?? ""))
    || (eventId !== null && eventId !== undefined && !UUID_PATTERN.test(String(eventId)))
    || typeof item.type !== "string"
    || typeof item.title !== "string"
    || typeof item.body !== "string"
    || typeof item.is_read !== "boolean"
    || typeof item.created_at !== "string"
    || Number.isNaN(Date.parse(item.created_at))
    || (meta !== null && meta !== undefined && (typeof meta !== "object" || Array.isArray(meta)))
  ) {
    return null;
  }
  const href = (meta as Record<string, unknown> | null | undefined)?.href;
  if (href !== undefined && typeof href !== "string") return null;
  return {
    id: String(item.id),
    event_id: eventId ? String(eventId) : null,
    type: item.type,
    title: item.title,
    body: item.body,
    meta: typeof href === "string" ? { href } : null,
    is_read: item.is_read,
    created_at: item.created_at,
  };
}

export function parseDeletedBroadcast(value: unknown): NotificationChange | null {
  if (!value || typeof value !== "object") return null;
  const id = String((value as Record<string, unknown>).id ?? "");
  return UUID_PATTERN.test(id) ? { kind: "deleted", notificationId: id } : null;
}

export function parseClearedBroadcast(value: unknown): NotificationChange | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (item.action === "mark_all_read") {
    return { kind: "mark_all_read", updated: safeCount(item.updated) };
  }
  const eventId = String(item.event_id ?? "");
  if (item.action === "mark_event_read" && UUID_PATTERN.test(eventId)) {
    return {
      kind: "mark_event_read",
      eventId,
      updated: safeCount(item.updated),
    };
  }
  return null;
}

function safeCount(value: unknown): number {
  const count = Number(value ?? 0);
  return Number.isInteger(count) && count > 0 ? count : 0;
}

function newestFirst(left: NotificationItem, right: NotificationItem): number {
  return Date.parse(right.created_at) - Date.parse(left.created_at)
    || right.id.localeCompare(left.id);
}

export function mergeNotificationPage(
  current: NotificationListResponse,
  incoming: NotificationListResponse,
  limit = 200,
): NotificationListResponse {
  const byId = new Map(current.items.map((item) => [item.id, item]));
  for (const item of incoming.items) byId.set(item.id, item);
  return {
    unread_count: Math.max(0, incoming.unread_count),
    items: [...byId.values()].sort(newestFirst).slice(0, limit),
  };
}

export function applyNotificationChange(
  current: NotificationListResponse,
  change: NotificationChange,
  limit = 200,
): NotificationListResponse {
  if (change.kind === "mark_all_read") {
    return {
      unread_count: 0,
      items: current.items.map((item) => ({ ...item, is_read: true })),
    };
  }
  if (change.kind === "mark_event_read") {
    return {
      unread_count: Math.max(0, current.unread_count - change.updated),
      items: current.items.map((item) => (
        item.event_id === change.eventId ? { ...item, is_read: true } : item
      )),
    };
  }
  if (change.kind === "deleted") {
    const existing = current.items.find((item) => item.id === change.notificationId);
    return {
      unread_count: Math.max(0, current.unread_count - Number(Boolean(existing && !existing.is_read))),
      items: current.items.filter((item) => item.id !== change.notificationId),
    };
  }

  const next = change.notification;
  const existing = current.items.find((item) => item.id === next.id);
  const unreadDelta = Number(!next.is_read) - Number(Boolean(existing && !existing.is_read));
  const byId = new Map(current.items.map((item) => [item.id, item]));
  byId.set(next.id, next);
  return {
    unread_count: Math.max(0, current.unread_count + unreadDelta),
    items: [...byId.values()].sort(newestFirst).slice(0, limit),
  };
}
