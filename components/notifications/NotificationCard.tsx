"use client";

import {
  getNotificationBody,
  getNotificationIconClasses,
  getNotificationPresentation,
  getNotificationTitle,
} from "@/lib/notification-presentation";
import type {
  NotificationItem,
} from "@/services/notifications";

type NotificationCardProps = {
  notification: NotificationItem;
  compact?: boolean;
  disabled?: boolean;
  onActivate: (
    notification: NotificationItem,
  ) => void;
};

function formatRelativeTime(
  value: string,
): string {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  const difference =
    date.getTime() -
    Date.now();

  const absoluteDifference =
    Math.abs(difference);

  const formatter =
    new Intl.RelativeTimeFormat(
      "en",
      {
        numeric: "auto",
      },
    );

  if (
    absoluteDifference <
    60_000
  ) {
    return "Just now";
  }

  if (
    absoluteDifference <
    3_600_000
  ) {
    return formatter.format(
      Math.round(
        difference / 60_000,
      ),
      "minute",
    );
  }

  if (
    absoluteDifference <
    86_400_000
  ) {
    return formatter.format(
      Math.round(
        difference /
          3_600_000,
      ),
      "hour",
    );
  }

  if (
    absoluteDifference <
    604_800_000
  ) {
    return formatter.format(
      Math.round(
        difference /
          86_400_000,
      ),
      "day",
    );
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year:
        date.getFullYear() ===
        new Date().getFullYear()
          ? undefined
          : "numeric",
    },
  ).format(date);
}

function formatAbsoluteTime(
  value: string,
): string {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

export default function NotificationCard({
  notification,
  compact = false,
  disabled = false,
  onActivate,
}: NotificationCardProps) {
  const visual =
    getNotificationPresentation(
      notification.type,
    );

  const Icon = visual.icon;
  const title = getNotificationTitle(notification);
  const body = getNotificationBody(notification);

  const relativeTime =
    formatRelativeTime(
      notification.created_at,
    );

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        onActivate(
          notification,
        );
      }}
      className={[
        "group flex w-full items-start gap-3 text-left transition disabled:cursor-wait disabled:opacity-60",
        compact
          ? "px-4 py-3.5 hover:bg-black/[0.035]"
          : "rounded-[1.25rem] border px-4 py-4 shadow-[0_6px_24px_rgba(0,0,0,0.025)]",
        compact
          ? ""
          : notification.is_read
            ? "border-black/10 bg-white hover:border-black/20"
            : "border-[#6E5AA7]/25 bg-[#FAF8FF] hover:border-[#6E5AA7]/40",
      ].join(" ")}
    >
      <div
        className={[
          "grid h-10 w-10 shrink-0 place-items-center rounded-full",
          getNotificationIconClasses(visual.tone),
          visual.requiresAttention ? "ring-1 ring-[#6E5AA7]/25" : "",
        ].join(" ")}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p
            className={[
              "min-w-0 flex-1 text-sm leading-5 text-zinc-950",
              notification.is_read
                ? "font-semibold"
                : "font-bold",
            ].join(" ")}
          >
            {title}
          </p>

          {!notification.is_read ? (
            <span
              aria-label="Unread"
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#6E5AA7]"
            />
          ) : null}
        </div>

        {body ? (
          <p
            className={[
              "mt-1 text-sm leading-5 text-zinc-500",
              compact ? "line-clamp-2" : "",
            ].join(" ")}
          >
            {body}
          </p>
        ) : null}

        {visual.requiresAttention ? (
          <span className="mt-2 block text-[11px] font-semibold text-[#6E5AA7]">
            Review request
          </span>
        ) : null}

        {relativeTime ? (
          <time
            dateTime={
              notification.created_at
            }
            title={formatAbsoluteTime(
              notification.created_at,
            )}
            className="mt-2 block text-xs font-medium text-zinc-400"
          >
            {relativeTime}
          </time>
        ) : null}
      </div>
    </button>
  );
}
