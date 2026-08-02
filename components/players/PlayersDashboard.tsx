import SectionNavigation from "@/components/section-navigation/SectionNavigation";
import type { PlayersView } from "@/lib/player-directory";

import PlayersDirectory from "./PlayersDirectory";

const identity: Record<PlayersView, { title: string; subtitle: string }> = {
  discover: { title: "Players", subtitle: "Find other Magic players on UntapGo." },
  connections: { title: "Connections", subtitle: "Players you follow who follow you back." },
  followers: { title: "Followers", subtitle: "Players following your UntapGo activity." },
  following: { title: "Following", subtitle: "Players whose UntapGo activity you follow." },
};

export default function PlayersDashboard({ view }: { view: PlayersView }) {
  const page = identity[view];
  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[1120px]">
        <SectionNavigation section="players" activeKey={view} />
        <div className="mt-6 lg:mt-0">
          <header className="border-b border-border/60 pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Players</p>
            <h1 className="mt-1 text-3xl font-bold tracking-[-0.035em]">{page.title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{page.subtitle}</p>
          </header>
          <PlayersDirectory key={view} view={view} />
        </div>
      </div>
    </main>
  );
}
