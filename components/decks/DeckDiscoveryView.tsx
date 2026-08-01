"use client";

import { useCallback, useState } from "react";

import { BinderEmpty, BinderError, LoadMore } from "@/components/binder/BinderFeedback";
import usePaginatedResource from "@/hooks/usePaginatedResource";
import { deckDiscoveryApi } from "@/services/deck-discovery";
import type { CommunityDeck, DeckDiscoveryFilters as FilterValues } from "@/types/decks";

import DeckDiscoveryCard from "./DeckDiscoveryCard";
import DeckDiscoveryFilters, { EMPTY_DECK_FILTERS } from "./DeckDiscoveryFilters";

const byId = (deck: CommunityDeck) => deck.id;

export default function DeckDiscoveryView({ mode }: { mode: "community" | "saved" }) {
  const [filters, setFilters] = useState<FilterValues>(EMPTY_DECK_FILTERS);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const scope = mode === "community" ? JSON.stringify(filters) : "saved";
  const loader = useCallback((page: number) => mode === "community" ? deckDiscoveryApi.community(filters, page) : deckDiscoveryApi.saved(page), [filters, mode]);
  const resource = usePaginatedResource(scope, loader, byId);

  async function toggleSaved(deck: CommunityDeck) {
    if (busyIds.has(deck.id)) return;
    const index = resource.items.findIndex((item) => item.id === deck.id);
    setBusyIds((ids) => new Set(ids).add(deck.id));
    setRowErrors((errors) => ({ ...errors, [deck.id]: "" }));
    resource.updateItems((items) => mode === "saved" && deck.is_saved
      ? items.filter((item) => item.id !== deck.id)
      : items.map((item) => item.id === deck.id ? { ...item, is_saved: !deck.is_saved } : item));
    try {
      if (deck.is_saved) await deckDiscoveryApi.unsave(deck.id);
      else await deckDiscoveryApi.save(deck.id);
    } catch {
      resource.updateItems((items) => {
        if (mode === "saved" && !items.some((item) => item.id === deck.id)) {
          const restored = [...items];
          restored.splice(Math.max(0, index), 0, deck);
          return restored;
        }
        return items.map((item) => item.id === deck.id ? deck : item);
      });
      setRowErrors((errors) => ({ ...errors, [deck.id]: deck.is_saved ? "Deck could not be removed from Saved." : "Deck could not be saved." }));
    } finally {
      setBusyIds((ids) => { const next = new Set(ids); next.delete(deck.id); return next; });
    }
  }

  return (
    <section aria-label={mode === "community" ? "Community Deck results" : "Saved Deck results"}>
      {mode === "community" ? <DeckDiscoveryFilters value={filters} onChange={setFilters} /> : null}
      <div className={mode === "community" ? "mt-6" : ""}>
        {resource.loading ? <DeckLoading /> : null}
        {resource.error ? <BinderError message={resource.error} onRetry={resource.retry} /> : null}
        {!resource.loading && !resource.error && !resource.items.length ? <BinderEmpty title={mode === "community" ? "No public decks found" : "No saved decks"} detail={mode === "community" ? "Try clearing a filter or searching for another deck." : "Save a Community Deck and it will appear here."} /> : null}
        {resource.items.length ? <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{resource.items.map((deck) => <DeckDiscoveryCard key={deck.id} deck={deck} busy={busyIds.has(deck.id)} error={rowErrors[deck.id]} onToggleSaved={() => { void toggleSaved(deck); }} />)}</div> : null}
        {resource.hasMore ? <LoadMore loading={resource.loadingMore} onClick={resource.loadMore} /> : null}
      </div>
    </section>
  );
}

function DeckLoading() {
  return <div aria-label="Loading decks" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{[1, 2, 3, 4].map((key) => <div key={key} className="h-72 animate-pulse rounded-surface bg-muted" />)}</div>;
}
