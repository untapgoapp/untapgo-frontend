"use client";

import { useEffect, useState } from "react";

import { ManaCost, ManaText } from "@/components/magic/mana-symbols";
import { ApiError, decksApi, getCardImage } from "@/lib/decks-api";
import type { DeckTextSection } from "@/lib/deck-text";
import type { ScryfallCard } from "@/types/decks";

import {
  CloseIcon,
  EmptyArtwork,
  ErrorNotice,
  IconButton,
  PrimaryButton,
  SearchIcon,
  SecondaryButton,
  Spinner,
  inputClassName,
} from "./deck-ui";

function messageFromError(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Could not search cards";
}

export function DeckCardSearch({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (card: ScryfallCard, quantity: number, section: DeckTextSection) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selected, setSelected] = useState<ScryfallCard | null>(null);
  const [section, setSection] = useState<DeckTextSection>("mainboard");
  const [quantity, setQuantity] = useState(1);
  const [searching, setSearching] = useState(false);
  const [loadingCard, setLoadingCard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSuggestions([]);
    setSelected(null);
    setSection("mainboard");
    setQuantity(1);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2 || selected?.name === query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      setSearching(true);
      setError(null);
      void decksApi
        .autocompleteCards(query.trim())
        .then((result) => setSuggestions(result.data.slice(0, 12)))
        .catch((caught) => setError(messageFromError(caught)))
        .finally(() => setSearching(false));
    }, 280);

    return () => window.clearTimeout(timer);
  }, [open, query, selected?.name]);

  async function choose(name: string) {
    setQuery(name);
    setSuggestions([]);
    setLoadingCard(true);
    setError(null);
    try {
      setSelected(await decksApi.namedCard(name));
    } catch (caught) {
      setError(messageFromError(caught));
    } finally {
      setLoadingCard(false);
    }
  }

  if (!open) return null;

  const image = getCardImage(selected, "normal");

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="max-h-[94vh] w-full overflow-hidden rounded-t-[30px] bg-[#F5F5F7] shadow-2xl sm:max-w-4xl sm:rounded-[30px]">
        <div className="flex items-center justify-between border-b border-black/[0.06] bg-white/85 px-5 py-4 backdrop-blur-xl">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">Add a card</h2>
            <p className="mt-0.5 text-xs text-black/40">Search Scryfall without leaving the deck.</p>
          </div>
          <IconButton type="button" onClick={onClose} aria-label="Close card search">
            <CloseIcon />
          </IconButton>
        </div>

        <div className="max-h-[calc(94vh-76px)] overflow-y-auto p-4 sm:p-6">
          {error ? <div className="mb-4"><ErrorNotice message={error} /></div> : null}

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-black/35">
              <SearchIcon />
            </div>
            <input
              autoFocus
              className={`${inputClassName} pl-12 pr-11`}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(null);
              }}
              placeholder="Sol Ring, Lightning Bolt…"
            />
            {searching ? (
              <span className="absolute inset-y-0 right-4 my-auto h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-[#6E5AA7]" />
            ) : null}

            {suggestions.length ? (
              <div className="absolute inset-x-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-[20px] border border-black/[0.07] bg-white p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
                {suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => void choose(name)}
                    className="block w-full rounded-2xl px-3.5 py-3 text-left text-sm font-medium transition hover:bg-black/[0.035]"
                  >
                    {name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {loadingCard ? <Spinner label="Loading card" /> : null}

          {!loadingCard && selected ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-[210px_minmax(0,1fr)]">
              <div className="mx-auto w-full max-w-[230px] overflow-hidden rounded-[18px] bg-black/[0.04] shadow-[0_15px_35px_rgba(0,0,0,0.13)]">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={selected.name} className="h-auto w-full" />
                ) : (
                  <div className="aspect-[0.714]"><EmptyArtwork label={selected.name} /></div>
                )}
              </div>

              <div className="rounded-[24px] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold tracking-[-0.025em]">{selected.name}</h3>
                    <p className="mt-1 text-sm text-black/45">{selected.type_line ?? "Magic card"}</p>
                  </div>
                  {selected.mana_cost ? (
                    <div className="rounded-full bg-black/[0.035] px-3 py-2">
                      <ManaCost cost={selected.mana_cost} size="sm" />
                    </div>
                  ) : null}
                </div>
                {selected.oracle_text ? (
                  <p className="mt-4 text-sm leading-6 text-black/68">
                    <ManaText text={selected.oracle_text} size="xs" />
                  </p>
                ) : null}

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-black/35">Add to</p>
                  <div className="mt-2 grid grid-cols-3 rounded-2xl bg-black/[0.045] p-1">
                    {([
                      ["mainboard", "Deck"],
                      ["sideboard", "Sideboard"],
                      ["commander", "Commander"],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSection(value)}
                        className={`min-h-10 rounded-xl px-2 text-xs font-semibold transition ${
                          section === value ? "bg-white text-[#5D4A8A] shadow-sm" : "text-black/45"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 rounded-full bg-black/[0.045] p-1">
                    <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="h-9 w-9 rounded-full bg-white text-lg font-medium shadow-sm">−</button>
                    <span className="min-w-7 text-center text-sm font-semibold">{quantity}</span>
                    <button type="button" onClick={() => setQuantity((value) => Math.min(99, value + 1))} className="h-9 w-9 rounded-full bg-white text-lg font-medium shadow-sm">+</button>
                  </div>
                  <PrimaryButton
                    type="button"
                    onClick={() => {
                      onAdd(selected, quantity, section);
                      onClose();
                    }}
                  >
                    Add card
                  </PrimaryButton>
                </div>
              </div>
            </div>
          ) : null}

          {!loadingCard && !selected ? (
            <div className="mt-5 rounded-[24px] bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6E5AA7]/10 text-[#6E5AA7]">
                <SearchIcon />
              </div>
              <h3 className="mt-4 font-semibold">Search the complete card catalogue</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-black/42">Type at least two letters, choose a card and it will be added to the pasted deck list.</p>
            </div>
          ) : null}

          <div className="mt-5 flex justify-end sm:hidden">
            <SecondaryButton type="button" onClick={onClose}>Close</SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
