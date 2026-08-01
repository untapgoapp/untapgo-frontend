"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotifications } from "@/components/notifications/NotificationRealtimeProvider";

import {
  getActiveSocialNavigationKey,
  socialNavigationItems,
} from "./navigation";

type SocialNavigationProps = {
  variant: "desktop" | "mobile";
};

export default function SocialNavigation({ variant }: SocialNavigationProps) {
  const pathname = usePathname();
  const { unread_count: unreadCount } = useNotifications();
  const activeKey = getActiveSocialNavigationKey(pathname);
  const items = variant === "mobile"
    ? socialNavigationItems.filter((item) => item.mobile && item.href)
    : socialNavigationItems;

  return (
    <nav
      aria-label={variant === "desktop" ? "Social navigation" : "Mobile navigation"}
      className={variant === "desktop" ? "grid gap-1" : "grid grid-cols-5"}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeKey === item.key;

        if (!item.href) {
          return (
            <span
              key={item.key}
              aria-disabled="true"
              className="flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium text-quiet-foreground"
            >
              <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
              <span>{item.label}</span>
              <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-quiet-foreground">
                {item.unavailableLabel}
              </span>
            </span>
          );
        }

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={getLinkClassName(variant, active)}
          >
            <Icon aria-hidden="true" className="h-[19px] w-[19px]" strokeWidth={active ? 2.35 : 1.9} />
            <span>{item.label}</span>
            {item.key === "notifications" && unreadCount > 0 ? (
              <span className={variant === "mobile"
                ? "absolute right-[20%] top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[8px] font-black text-primary-foreground"
                : "ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground"
              }>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function getLinkClassName(variant: SocialNavigationProps["variant"], active: boolean) {
  if (variant === "mobile") {
    return [
      "relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold transition",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
    ].join(" ");
  }

  return [
    "flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15",
    active
      ? "bg-secondary text-secondary-foreground"
      : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
  ].join(" ");
}
