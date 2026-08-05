import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarClock,
  CalendarX,
  CircleCheck,
  CircleX,
  MessageSquare,
  Handshake,
  UserMinus,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
  Users,
} from "lucide-react";

import type { NotificationItem } from "@/services/notifications";

export type NotificationCategory = "event" | "social" | "playgroup" | "generic";
export type NotificationTone = "primary" | "positive" | "neutral" | "warning" | "negative";

export type NotificationPresentation = {
  icon: LucideIcon;
  category: NotificationCategory;
  tone: NotificationTone;
  requiresAttention: boolean;
};

export type NotificationActivityCopy = {
  primary: string;
  secondary?: string;
};

const genericPresentation: NotificationPresentation = {
  icon: Bell,
  category: "generic",
  tone: "neutral",
  requiresAttention: false,
};

const notificationPresentations: Record<string, NotificationPresentation> = {
  join_request_received: { icon: UserPlus, category: "event", tone: "primary", requiresAttention: false },
  player_joined: { icon: Users, category: "event", tone: "primary", requiresAttention: false },
  request_accepted: { icon: CircleCheck, category: "event", tone: "positive", requiresAttention: false },
  request_declined: { icon: CircleX, category: "event", tone: "negative", requiresAttention: false },
  kicked: { icon: UserMinus, category: "event", tone: "negative", requiresAttention: false },
  event_cancelled: { icon: CalendarX, category: "event", tone: "negative", requiresAttention: false },
  event_canceled: { icon: CalendarX, category: "event", tone: "negative", requiresAttention: false },
  event_updated: { icon: CalendarClock, category: "event", tone: "warning", requiresAttention: false },
  event_changed: { icon: CalendarClock, category: "event", tone: "warning", requiresAttention: false },
  player_followed: { icon: UserPlus, category: "social", tone: "primary", requiresAttention: false },
  playgroup_join_requested: { icon: UserPlus, category: "playgroup", tone: "primary", requiresAttention: true },
  playgroup_request_approved: { icon: UserRoundCheck, category: "playgroup", tone: "positive", requiresAttention: false },
  playgroup_request_rejected: { icon: UserRoundX, category: "playgroup", tone: "neutral", requiresAttention: false },
  playgroup_post_commented: { icon: MessageSquare, category: "playgroup", tone: "primary", requiresAttention: false },
  playgroup_chat_message: { icon: MessageSquare, category: "playgroup", tone: "primary", requiresAttention: false },
  binder_interest_received: { icon: Handshake, category: "social", tone: "primary", requiresAttention: true },
  binder_interest_accepted: { icon: CircleCheck, category: "social", tone: "positive", requiresAttention: false },
  binder_interest_declined: { icon: CircleX, category: "social", tone: "neutral", requiresAttention: false },
  binder_trade_message: { icon: MessageSquare, category: "social", tone: "primary", requiresAttention: false },
  binder_trade_completed: { icon: CircleCheck, category: "social", tone: "positive", requiresAttention: false },
  binder_trade_cancelled: { icon: CircleX, category: "social", tone: "neutral", requiresAttention: false },
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeType(value: unknown): string {
  return cleanString(value).toLowerCase();
}

function getMetaString(notification: NotificationItem, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = notification.meta?.[key];
    const text = cleanString(value);
    if (text) return text;
  }

  return null;
}

function sentence(value: string): string {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function getSafeInternalPath(value: unknown): string | null {
  const path = cleanString(value);
  if (!path.startsWith("/") || path.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(path)) {
    return null;
  }

  try {
    const base = new URL("https://untapgo.internal");
    const parsed = new URL(path, base);
    return parsed.origin === base.origin ? path : null;
  } catch {
    return null;
  }
}

export function getNotificationPresentation(type: unknown): NotificationPresentation {
  return notificationPresentations[normalizeType(type)] ?? genericPresentation;
}

export function getNotificationIconClasses(tone: NotificationTone): string {
  switch (tone) {
    case "primary":
      return "bg-[#EEE9FF] text-[#6E5AA7]";
    case "positive":
      return "bg-emerald-100 text-emerald-700";
    case "warning":
      return "bg-amber-100 text-amber-700";
    case "negative":
      return "bg-red-100 text-red-700";
    default:
      return "bg-zinc-100 text-zinc-600";
  }
}

export function getNotificationTitle(notification: NotificationItem): string {
  return cleanString(notification.title) || "Notification";
}

export function getNotificationBody(notification: NotificationItem): string {
  return cleanString(notification.body);
}

export function getNotificationActivityCopy(notification: NotificationItem): NotificationActivityCopy {
  const type = normalizeType(notification.type);
  const title = getNotificationTitle(notification);
  const body = getNotificationBody(notification);

  if (
    type === "player_followed" ||
    type === "playgroup_join_requested" ||
    type === "playgroup_request_approved" ||
    type === "playgroup_request_rejected" ||
    type === "playgroup_post_commented" ||
    type === "playgroup_chat_message" ||
    type === "binder_interest_received" ||
    type === "binder_interest_accepted" ||
    type === "binder_interest_declined" ||
    type === "binder_trade_message" ||
    type === "binder_trade_completed" ||
    type === "binder_trade_cancelled"
  ) {
    return { primary: body || title };
  }

  const actor = getMetaString(
    notification,
    "requesting_user_nickname",
    "joining_user_nickname",
    "actor_nickname",
    "nickname",
  );
  const event = getMetaString(notification, "event_title", "event_name");

  if (type === "join_request_received" && actor && event) {
    return { primary: sentence(`${actor} requested to join ${event}`) };
  }
  if (type === "player_joined" && actor && event) {
    return { primary: sentence(`${actor} joined ${event}`) };
  }
  if (type === "request_accepted" && event) {
    return { primary: sentence(`Your request to join ${event} was accepted`) };
  }
  if (type === "request_declined" && event) {
    return { primary: sentence(`Your request to join ${event} was declined`) };
  }
  if ((type === "event_cancelled" || type === "event_canceled") && event) {
    return { primary: sentence(`${event} was cancelled`) };
  }
  if ((type === "event_updated" || type === "event_changed") && event) {
    return { primary: sentence(`${event} was updated`) };
  }

  return { primary: title, secondary: body || undefined };
}

export function getNotificationHref(notification: NotificationItem): string {
  const explicitPath = getSafeInternalPath(
    getMetaString(notification, "href", "url"),
  );
  if (explicitPath) return explicitPath;

  const eventId = cleanString(notification.event_id);
  if (eventId) return `/events/${encodeURIComponent(eventId)}`;

  const profileUserId = getMetaString(
    notification,
    "requesting_user_id",
    "joining_user_id",
    "profile_user_id",
    "user_id",
  );
  if (profileUserId) return `/profile/${encodeURIComponent(profileUserId)}`;

  return "/notifications";
}
