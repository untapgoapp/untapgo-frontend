import { Bookmark, Library } from "lucide-react";

import { DeckList } from "@/components/decks/deck-list";
import { PageFrame } from "@/components/decks/deck-ui";
import type { DecksView } from "@/lib/deck-routes";

import DeckSectionNavigation from "./DeckSectionNavigation";

export default function DecksDashboard({ view }: { view: DecksView }) {
  if (view === "mine") {
    return <DeckList sectionNavigation={<DeckSectionNavigation view={view} />} />;
  }

  const community = view === "community";
  return (
    <PageFrame>
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Deck library</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Decks</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-black/45">Browse community decks or keep your own deck library ready for events.</p>
      </header>
      <DeckSectionNavigation view={view} />
      <section className="py-12 text-center" aria-labelledby="deck-unavailable-title">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-secondary-foreground">
          {community ? <Library aria-hidden="true" className="h-5 w-5" /> : <Bookmark aria-hidden="true" className="h-5 w-5" />}
        </span>
        <h2 id="deck-unavailable-title" className="mt-4 text-lg font-semibold">
          {community ? "Community Deck discovery is not available yet" : "Saved Decks are not available yet"}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-black/45">
          {community
            ? "A privacy-safe paginated community endpoint is required before public Decks can appear here."
            : "UntapGo does not currently provide a saved-Deck endpoint, so this view makes no browser data request."}
        </p>
      </section>
    </PageFrame>
  );
}
