import Link from "next/link";
import { Plus } from "lucide-react";

import DiscoverPlaygroupsView from "@/components/playgroups/DiscoverPlaygroupsView";
import MyPlaygroupsView from "@/components/playgroups/MyPlaygroupsView";
import PendingPlaygroupsView from "@/components/playgroups/PendingPlaygroupsView";
import { Button } from "@/components/ui/button";
import type { PlaygroupsView } from "@/lib/playgroups";

const VIEWS: Array<{ value: PlaygroupsView; label: string }> = [
  { value: "discover", label: "Discover" },
  { value: "mine", label: "My groups" },
  { value: "pending", label: "Pending" },
];

export default function PlaygroupsDirectory({ view }: { view: PlaygroupsView }) {
  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[1050px]">
        <header className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Community</p>
            <h1 className="mt-1 text-3xl font-bold tracking-[-0.035em]">Playgroups</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Find a regular group and keep playing together.</p>
          </div>
          <Button asChild size="sm" className="self-start sm:self-auto">
            <Link href="/playgroups/new"><Plus size={15} aria-hidden="true" /> Create playgroup</Link>
          </Button>
        </header>

        <nav aria-label="Playgroup views" className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {VIEWS.map((item) => (
            <Link
              key={item.value}
              href={`/playgroups?view=${item.value}`}
              aria-current={view === item.value ? "page" : undefined}
              className={[
                "shrink-0 rounded-control px-3 py-2.5 text-sm font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15",
                view === item.value
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <section className="py-5" aria-label={VIEWS.find((item) => item.value === view)?.label}>
          {view === "discover" ? <DiscoverPlaygroupsView /> : null}
          {view === "mine" ? <MyPlaygroupsView /> : null}
          {view === "pending" ? <PendingPlaygroupsView /> : null}
        </section>
      </div>
    </main>
  );
}
