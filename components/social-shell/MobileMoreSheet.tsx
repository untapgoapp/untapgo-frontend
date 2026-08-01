"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import EventActionSheet from "@/components/events/EventActionSheet";
import {
  getActiveMobileSecondaryNavigationKey,
  mobileSecondaryNavigationItems,
} from "./navigation";

type MobileMoreSheetProps = {
  open: boolean;
  onClose: () => void;
};

export default function MobileMoreSheet({ open, onClose }: MobileMoreSheetProps) {
  const pathname = usePathname();
  const activeKey = getActiveMobileSecondaryNavigationKey(pathname);

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <EventActionSheet
      open={open}
      title="More"
      description="Your cards, profile, and account"
      onClose={onClose}
    >
      <nav aria-label="More destinations" className="grid gap-1">
        {mobileSecondaryNavigationItems.map((item) => {
          const Icon = item.icon;
          const active = item.key === activeKey;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onClose}
              className={[
                "group flex min-h-14 items-center gap-3 rounded-row px-3 py-2.5 outline-none transition-colors hover:bg-secondary/55 focus-visible:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/15",
                active ? "bg-secondary/65 text-primary" : "text-foreground",
              ].join(" ")}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary/12">
                <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold">{item.label}</span>
              <ChevronRight aria-hidden="true" className="h-4 w-4 text-quiet-foreground" />
            </Link>
          );
        })}
      </nav>
    </EventActionSheet>
  );
}
