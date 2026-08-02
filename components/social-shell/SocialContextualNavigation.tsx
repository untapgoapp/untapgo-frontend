"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { getContextualNavigation } from "./navigation";

export default function SocialContextualNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const contextual = getContextualNavigation(pathname, searchParams.get("view"));

  if (!contextual) return null;

  return (
    <section className="mt-5" data-contextual-navigation={contextual.section.key}>
      <div aria-hidden="true" className="mb-4 h-px w-10 bg-border/70" />
      <p className="mb-2 px-3 text-[10px] font-bold tracking-[0.12em] text-quiet-foreground">
        {contextual.section.label}
      </p>
      <nav aria-label={`${contextual.section.label.toLowerCase()} sections`} className="grid gap-0.5">
        {contextual.section.items.map((item) => {
          const active = item.key === contextual.activeKey;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex min-h-9 items-center gap-2.5 rounded-control px-3 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/15",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
              ].join(" ")}
            >
              {Icon ? <Icon aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
