import Link from "next/link";
import { Bookmark, Compass, Library, Plus } from "lucide-react";

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
  const sections = [
    { key: "community", label: "Community", href: "/decks?view=community", icon: Compass, active: view === "community" },
    { key: "mine", label: "My Decks", href: "/decks?view=mine", icon: Library, active: view === "mine" },
    { key: "saved", label: "Saved Decks", href: "/decks?view=saved", icon: Bookmark, active: view === "saved" },
  ];

  return (
    <PageFrame>
      <div className="grid gap-6 lg:grid-cols-[196px_minmax(0,1fr)] lg:gap-8">
        <SectionNavigation label="Deck sections" items={sections} />
        <div className="min-w-0">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Decks</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{page.title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{page.subtitle}</p>
            </div>
            {view === "mine" ? <Button asChild><Link href={deckRoutes.create}><Plus aria-hidden="true" />Add deck</Link></Button> : null}
          </header>
          <div className="py-6">
            {view === "mine" ? <DeckList /> : <DeckDiscoveryView mode={view} />}
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
