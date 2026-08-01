/* eslint-disable @next/next/no-img-element */
"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { Input } from "@/components/ui/input";
import { shouldSearchCardQuery } from "@/lib/binder";
import { getCardImage, decksApi } from "@/lib/decks-api";
import type { ScryfallCard } from "@/types/decks";

function editionLabel(card: ScryfallCard) {
  return [
    card.set_name,
    card.set_code?.toUpperCase(),
    card.collector_number ? `#${card.collector_number}` : null,
    card.lang?.toUpperCase(),
  ].filter(Boolean).join(" · ");
}

function uniquePrintings(cards: ScryfallCard[]) {
  return [...new Map(cards.map((card) => [card.id, card])).values()].sort(
    (left, right) => (right.released_at ?? "").localeCompare(left.released_at ?? ""),
  );
}

export default function CardPrintingSelector({
  value,
  onChange,
  inputRef,
  fieldError,
}: {
  value: ScryfallCard | null;
  onChange: (card: ScryfallCard | null) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  fieldError?: string;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [printings, setPrintings] = useState<ScryfallCard[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [loadingPrintings, setLoadingPrintings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);

  useEffect(() => {
    const normalized = query.trim();
    if (!shouldSearchCardQuery({
      query: normalized,
      hasSelectedCard: Boolean(value),
      isSearchOpen,
      loadingPrintings,
    })) {
      setSearching(false);
      return;
    }

    let active = true;
    const requestId = ++sequence.current;
    const timer = window.setTimeout(() => {
      setSearching(true);
      setError(null);
      void decksApi.autocompleteCards(normalized)
        .then((result) => {
          if (!active || requestId !== sequence.current) return;
          setSuggestions(result.data.slice(0, 8));
          setHighlightedSuggestion(-1);
        })
        .catch(() => {
          if (active && requestId === sequence.current) {
            setSuggestions([]);
            setError("Card search is unavailable.");
          }
        })
        .finally(() => {
          if (active && requestId === sequence.current) setSearching(false);
        });
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isSearchOpen, loadingPrintings, query, value]);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        sequence.current += 1;
        setIsSearchOpen(false);
        setHighlightedSuggestion(-1);
        setSearching(false);
      }
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  function closeSearch({ clearResults = false }: { clearResults?: boolean } = {}) {
    sequence.current += 1;
    setIsSearchOpen(false);
    setHighlightedSuggestion(-1);
    setSearching(false);
    if (clearResults) setSuggestions([]);
  }

  async function chooseCard(name: string) {
    const requestId = ++sequence.current;
    setQuery(name);
    setSuggestions([]);
    setHighlightedSuggestion(-1);
    setIsSearchOpen(false);
    setSearching(false);
    setLoadingPrintings(true);
    setError(null);
    try {
      const card = await decksApi.namedCard(name);
      const result = card.oracle_id
        ? await decksApi.searchCards(`oracleid:${card.oracle_id}`, "prints")
        : { data: [card] };
      if (requestId !== sequence.current) return;
      const available = uniquePrintings([card, ...result.data]);
      setPrintings(available);
      onChange(available[0] ?? card);
    } catch {
      if (requestId === sequence.current) setError("Could not load exact printings.");
    } finally {
      if (requestId === sequence.current) setLoadingPrintings(false);
    }
  }

  function editQuery(nextQuery: string) {
    sequence.current += 1;
    setQuery(nextQuery);
    setPrintings([]);
    setSuggestions([]);
    setHighlightedSuggestion(-1);
    setSearching(false);
    setError(null);
    setIsSearchOpen(nextQuery.trim().length >= 2);
    onChange(null);
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      closeSearch();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isSearchOpen && !value && query.trim().length >= 2) setIsSearchOpen(true);
      if (!suggestions.length) return;
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setHighlightedSuggestion((current) => {
        if (current < 0) return direction > 0 ? 0 : suggestions.length - 1;
        return (current + direction + suggestions.length) % suggestions.length;
      });
      return;
    }
    if (event.key === "Enter" && isSearchOpen && highlightedSuggestion >= 0) {
      const name = suggestions[highlightedSuggestion];
      if (name) {
        event.preventDefault();
        void chooseCard(name);
      }
    }
  }

  const selectedImage = useMemo(() => getCardImage(value, "normal"), [value]);
  const listboxId = "binder-card-suggestions";

  return (
    <div ref={rootRef}>
      <label htmlFor="binder-card-search" className="text-sm font-semibold">Search Scryfall</label>
      <div className="relative mt-2">
        <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-quiet-foreground" aria-hidden="true" />
        <Input
          ref={inputRef}
          id="binder-card-search"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isSearchOpen && suggestions.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={highlightedSuggestion >= 0 ? `binder-card-suggestion-${highlightedSuggestion}` : undefined}
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? "binder-card-error" : undefined}
          autoComplete="off"
          value={query}
          onChange={(event) => editQuery(event.target.value)}
          onFocus={() => {
            if (!value && query.trim().length >= 2) setIsSearchOpen(true);
          }}
          onKeyDown={handleSearchKeyDown}
          className="pl-10"
          placeholder="Search a card name"
        />
        {searching ? <span className="absolute right-4 top-3.5 h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" /> : null}
        {isSearchOpen && suggestions.length ? (
          <div id={listboxId} role="listbox" className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-20 rounded-surface border border-border bg-surface p-1 shadow-overlay">
            {suggestions.map((name, index) => (
              <button
                id={`binder-card-suggestion-${index}`}
                key={name}
                type="button"
                role="option"
                aria-selected={index === highlightedSuggestion}
                onMouseEnter={() => setHighlightedSuggestion(index)}
                onClick={() => void chooseCard(name)}
                className={`block w-full rounded-control px-3 py-2.5 text-left text-sm font-medium ${index === highlightedSuggestion ? "bg-secondary" : "hover:bg-secondary"}`}
              >
                {name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {fieldError ? <p id="binder-card-error" role="alert" className="mt-2 text-sm text-destructive">{fieldError}</p> : null}
      {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
      {loadingPrintings ? <p className="mt-4 text-sm text-muted-foreground">Loading exact printings…</p> : null}
      {printings.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-[12rem]">
            {selectedImage ? <img src={selectedImage} alt={value?.name ?? "Selected card"} className="w-full rounded-[0.7rem]" /> : <div className="aspect-[0.714] rounded-surface bg-muted" />}
          </div>
          <div>
            <label htmlFor="binder-printing" className="text-sm font-semibold">Exact printing</label>
            <select id="binder-printing" value={value?.id ?? ""} onChange={(event) => onChange(printings.find((card) => card.id === event.target.value) ?? null)} className="mt-2 h-11 w-full rounded-control border border-input bg-surface px-3 text-sm">
              {printings.map((card) => <option key={card.id} value={card.id}>{editionLabel(card)}</option>)}
            </select>
            {value ? <p className="mt-3 text-sm text-muted-foreground">{value.name}<br />{editionLabel(value)}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
