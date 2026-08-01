"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  desktopNavigationItems,
  getActiveSocialNavigationKey,
  isMobileMoreRoute,
  mobileMoreNavigationItem,
  mobilePrimaryNavigationItems,
} from "./navigation";

type SocialNavigationProps = {
  variant: "desktop" | "mobile";
  moreOpen?: boolean;
  onMoreOpen?: () => void;
};

export default function SocialNavigation({
  variant,
  moreOpen = false,
  onMoreOpen,
}: SocialNavigationProps) {
  const pathname = usePathname();
  const activeKey = getActiveSocialNavigationKey(pathname);
  const items = variant === "mobile"
    ? mobilePrimaryNavigationItems
    : desktopNavigationItems;
  const MoreIcon = mobileMoreNavigationItem.icon;
  const moreActive = isMobileMoreRoute(pathname);

  return (
    <nav
      aria-label={variant === "mobile"
        ? "Mobile navigation"
        : "Primary navigation"}
      className={variant === "mobile" ? "grid w-full grid-cols-5 overflow-hidden" : "grid gap-1"}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = variant === "mobile" ? item.matches(pathname) : item.key === activeKey;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={getLinkClassName(variant, active)}
          >
            <Icon aria-hidden="true" className="h-[19px] w-[19px]" strokeWidth={active ? 2.35 : 1.9} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {variant === "mobile" ? (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          aria-pressed={moreActive}
          onClick={onMoreOpen}
          className={getLinkClassName("mobile", moreActive)}
        >
          <MoreIcon aria-hidden="true" className="h-[19px] w-[19px]" strokeWidth={moreActive ? 2.35 : 1.9} />
          <span>{mobileMoreNavigationItem.label}</span>
        </button>
      ) : null}
    </nav>
  );
}

function getLinkClassName(variant: SocialNavigationProps["variant"], active: boolean) {
  if (variant === "mobile") {
    return [
      "relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold outline-none transition-colors focus-visible:bg-secondary focus-visible:ring-inset focus-visible:ring-[3px] focus-visible:ring-ring/20",
      active ? "bg-secondary/55 text-primary" : "text-muted-foreground hover:bg-secondary/35 hover:text-foreground",
    ].join(" ");
  }
  return [
    "flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/15",
    active
      ? "bg-secondary text-secondary-foreground"
      : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
  ].join(" ");
}
