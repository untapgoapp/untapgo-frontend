/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import NotificationBell from "@/components/notifications/NotificationBell";

export default function SocialMobileHeader() {
  return (
    <header className="sticky top-0 z-[70] border-b border-border/75 bg-background/95 px-4 backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 rounded-control text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15"
        >
          <span className="grid h-9 w-9 place-items-center rounded-control bg-secondary/75">
            <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
          </span>
          <span className="text-base font-black tracking-[-0.04em]">UntapGo</span>
        </Link>

        <NotificationBell />
      </div>
    </header>
  );
}
