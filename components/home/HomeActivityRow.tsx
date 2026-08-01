"use client";

import {
  getNotificationActivityCopy,
  getNotificationIconClasses,
  getNotificationPresentation,
} from "@/lib/notification-presentation";
import type { NotificationItem } from "@/services/notifications";

type HomeActivityRowProps = {
  notification: NotificationItem;
  onActivate: (notification: NotificationItem) => void;
};

function formatActivityTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const difference = date.getTime() - Date.now();
  const absolute = Math.abs(difference);
  if (absolute < 60_000) return "Just now";

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (absolute < 3_600_000) return formatter.format(Math.round(difference / 60_000), "minute");
  if (absolute < 86_400_000) return formatter.format(Math.round(difference / 3_600_000), "hour");
  if (absolute < 604_800_000) return formatter.format(Math.round(difference / 86_400_000), "day");

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export default function HomeActivityRow({
  notification,
  onActivate,
}: HomeActivityRowProps) {
  const presentation = getNotificationPresentation(notification.type);
  const Icon = presentation.icon;
  const copy = getNotificationActivityCopy(notification);
  const time = formatActivityTime(notification.created_at);
  const iconTone =
    presentation.category === "social" || presentation.category === "playgroup"
      ? presentation.tone
      : "primary";

  return (
    <button
      type="button"
      onClick={() => onActivate(notification)}
      className="group flex w-full items-start gap-3 rounded-row px-3 py-3 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/15"
    >
      <span
        className={[
          "grid h-8 w-8 shrink-0 place-items-center rounded-control",
          getNotificationIconClasses(iconTone),
          presentation.requiresAttention ? "ring-1 ring-primary/25" : "",
        ].join(" ")}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-5 text-zinc-900">{copy.primary}</span>
        {copy.secondary ? <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-muted-foreground">{copy.secondary}</span> : null}
      </span>
      <time
        dateTime={notification.created_at}
        className="flex shrink-0 items-center gap-2 pt-0.5 text-[11px] font-medium text-quiet-foreground"
      >
        {time}
        {!notification.is_read ? <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="Unread" /> : null}
      </time>
    </button>
  );
}
