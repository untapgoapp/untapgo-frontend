import Link from "next/link";
import { Plus } from "lucide-react";

import SectionNavigation from "@/components/section-navigation/SectionNavigation";
import { Button } from "@/components/ui/button";
import { deckRoutes, type DecksView } from "@/lib/deck-routes";

import DeckDiscoveryView from "./DeckDiscoveryView";
import { DeckList } from "./deck-list";
import { PageFrame } from "./deck-ui";

const identity: Record<DecksView, { title: string; subtitle: string }> = {
  community: { title: "Community Decks", subtitle: "Discover public decks shared by UntapGo players." },
  mine: { title: "My Decks", subtitle: "Manage the decks you bring to events." },
  saved: { title: "Saved Decks", subtitle: "Decks you saved for later." },
};

export default function DecksDashboard({ view }: { view: DecksView }) {
  const page = identity[view];

  return (
    <PageFrame>
      <SectionNavigation section="decks" activeKey={view} />
      <div className="mt-6 min-w-0 lg:mt-0">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{page.title}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{page.subtitle}</p>
          </div>
          {view === "mine" ? <Button asChild><Link href={deckRoutes.create}><Plus aria-hidden="true" />Add deck</Link></Button> : null}
        </header>
        <div className="py-6">
          {view === "mine" ? <DeckList /> : <DeckDiscoveryView mode={view} />}
        </div>
      </div>
    </PageFrame>
  );
}
