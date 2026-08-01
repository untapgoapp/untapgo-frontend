"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, Settings, ShieldBan, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SocialProfileMenu({
  nickname,
  avatarUrl,
}: {
  nickname: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) close(true);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    }
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  const links = [
    { href: "/profile", label: "Profile", icon: UserRound },
    { href: "/profile/favorites", label: "Favorites", icon: Heart },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/profile/blocked", label: "Blocked players", icon: ShieldBan },
  ];

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-10 items-center gap-1 rounded-full pl-1 pr-1.5 outline-none transition-colors hover:bg-secondary/65 focus-visible:ring-[3px] focus-visible:ring-ring/15 sm:pr-2"
      >
        <Avatar className="h-8 w-8 bg-secondary">
          <AvatarImage src={avatarUrl ?? undefined} alt="" className="object-cover" />
          <AvatarFallback className="text-xs">{nickname.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <ChevronDown aria-hidden="true" className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-[95] w-[min(19rem,calc(100vw-1.5rem))] rounded-surface border border-border/80 bg-surface p-2 shadow-overlay"
        >
          <div className="px-3 pb-2 pt-1">
            <p className="truncate text-sm font-bold text-foreground">{nickname}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Your UntapGo account</p>
          </div>
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                role="menuitem"
                href={item.href}
                onClick={() => close()}
                className="flex min-h-11 items-center gap-3 rounded-row px-3 text-sm font-semibold text-foreground outline-none hover:bg-secondary/55 focus-visible:bg-secondary"
              >
                <Icon aria-hidden="true" className="h-[17px] w-[17px] text-muted-foreground" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
