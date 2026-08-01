import Link from "next/link";

import { deckSectionHref, type DecksView } from "@/lib/deck-routes";

const sections: Array<{ view: DecksView; label: string }> = [
  { view: "community", label: "Community" },
  { view: "mine", label: "My Decks" },
  { view: "saved", label: "Saved Decks" },
];

export default function DeckSectionNavigation({ view }: { view: DecksView }) {
  return (
    <nav aria-label="Deck views" className="mt-5 flex gap-1 overflow-x-auto rounded-control bg-surface-subtle p-1">
      {sections.map((item) => (
        <Link
          key={item.view}
          href={deckSectionHref(item.view)}
          aria-current={view === item.view ? "page" : undefined}
          className={`shrink-0 rounded-control px-3 py-2 text-sm font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/20 ${view === item.view ? "bg-surface text-secondary-foreground shadow-surface" : "text-muted-foreground hover:text-foreground"}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
