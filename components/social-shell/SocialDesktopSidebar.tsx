/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import SocialNavigation from "./SocialNavigation";

export default function SocialDesktopSidebar() {
  return (
    <aside className="hidden lg:block" aria-label="Application sidebar">
      <div className="sticky top-0 flex h-screen flex-col py-5 pr-4">
        <Link
          href="/"
          className="mb-6 flex min-h-11 items-center gap-2.5 rounded-control px-2 text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15"
        >
          <span className="grid h-9 w-9 place-items-center rounded-control bg-secondary/75">
            <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
          </span>
          <span className="text-[17px] font-black tracking-[-0.04em]">UntapGo</span>
        </Link>

        <SocialNavigation variant="desktop" />

        <p className="mt-auto px-3 text-xs leading-5 text-quiet-foreground">
          Find a table. Meet players. Keep playing.
        </p>
      </div>
    </aside>
  );
}
