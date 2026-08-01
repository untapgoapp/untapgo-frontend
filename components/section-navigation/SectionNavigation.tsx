"use client";

import { useRouter } from "next/navigation";

import {
  contextualNavigationSections,
  type ContextualNavigationKey,
} from "@/components/social-shell/navigation";

export default function SectionNavigation({
  section,
  activeKey,
}: {
  section: ContextualNavigationKey;
  activeKey: string;
}) {
  const router = useRouter();
  const navigation = contextualNavigationSections[section];
  const active = navigation.items.find((item) => item.key === activeKey)
    ?? navigation.items[0];

  return (
    <label className="block lg:hidden">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-quiet-foreground">
        {navigation.selectorLabel}
      </span>
      <select
        aria-label={navigation.selectorLabel}
        value={active.href}
        onChange={(event) => router.push(event.target.value)}
        className="h-11 w-full max-w-full rounded-control border border-input bg-surface px-3 text-sm font-semibold text-foreground outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/15"
      >
        {navigation.items.map((item) => (
          <option key={item.key} value={item.href}>{item.label}</option>
        ))}
      </select>
    </label>
  );
}
