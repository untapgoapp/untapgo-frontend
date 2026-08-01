import Link from "next/link";

import type { EventItem } from "@/services/events";

type HomeRightSidebarProps = {
  nextEvent: EventItem | null;
  pendingRequests: number | null;
};

function formatNextEventDate(value?: string | null): string {
  if (!value) return "Date TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBD";

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function HomeRightSidebar({
  nextEvent,
  pendingRequests,
}: HomeRightSidebarProps) {
  return (
    <div className="w-full space-y-5 rounded-surface bg-surface/55 p-4">
      {nextEvent ? (
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Next event</p>
          <h2 className="mt-1.5 text-sm font-bold leading-5 text-zinc-950">{nextEvent.title || "Untitled event"}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{formatNextEventDate(nextEvent.starts_at)}</p>
          <Link href={`/events/${nextEvent.id}`} className="mt-2 inline-flex text-xs font-semibold text-primary">View event</Link>
        </section>
      ) : null}

      {pendingRequests !== null && pendingRequests > 0 ? (
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-quiet-foreground">Pending requests</p>
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <strong className="text-xl font-black text-zinc-950">{pendingRequests}</strong>
            <Link href="/events/mine" className="text-xs font-semibold text-primary">Review</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
