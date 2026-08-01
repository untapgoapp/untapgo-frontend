import Link from "next/link";

import type { PlaygroupSection } from "@/lib/playgroup-communications";

const sections: { value: PlaygroupSection; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "wall", label: "Wall" },
  { value: "chat", label: "Chat" },
  { value: "members", label: "Members" },
];

export default function PlaygroupSectionNav({
  playgroupId,
  active,
  unreadCount,
}: {
  playgroupId: string;
  active: PlaygroupSection;
  unreadCount: number | null;
}) {
  return (
    <nav aria-label="Playgroup sections" className="mt-5 overflow-x-auto border-b border-border/70">
      <div className="flex min-w-max gap-1">
        {sections.map((section) => (
          <Link
            key={section.value}
            href={`/playgroups/${encodeURIComponent(playgroupId)}?section=${section.value}`}
            aria-current={active === section.value ? "page" : undefined}
            className={[
              "inline-flex min-h-11 items-center gap-2 rounded-t-control px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/20",
              active === section.value
                ? "bg-surface-subtle text-secondary-foreground"
                : "text-muted-foreground hover:bg-surface/55 hover:text-foreground",
            ].join(" ")}
          >
            {section.label}
            {section.value === "chat" && unreadCount && unreadCount > 0 ? (
              <span className="min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </nav>
  );
}
