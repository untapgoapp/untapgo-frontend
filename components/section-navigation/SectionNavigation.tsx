"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export type SectionNavigationItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

export default function SectionNavigation({
  label,
  items,
}: {
  label: string;
  items: SectionNavigationItem[];
}) {
  const router = useRouter();
  const active = items.find((item) => item.active) ?? items[0];

  return (
    <>
      <label className="block lg:hidden">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-quiet-foreground">{label}</span>
        <select
          aria-label={label}
          value={active?.href ?? ""}
          onChange={(event) => router.push(event.target.value)}
          className="h-11 w-full rounded-control border border-input bg-surface px-3 text-sm font-semibold text-foreground outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/15"
        >
          {items.map((item) => <option key={item.key} value={item.href}>{item.label}</option>)}
        </select>
      </label>

      <aside className="hidden w-[196px] shrink-0 lg:block" aria-label={label}>
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-quiet-foreground">{label}</p>
        <nav className="grid gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`flex min-h-10 items-center gap-2.5 rounded-control px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/15 ${item.active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"}`}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
