"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { DeckTextSection } from "@/lib/deck-text";
import {
  ApiError,
  decksApi,
  getCardImage,
} from "@/lib/decks-api";
import type { ScryfallCard } from "@/types/decks";

import {
  EmptyArtwork,
  PrimaryButton,
  SearchIcon,
  inputClassName,
} from "./deck-ui";

const QUANTITIES = [1, 2, 3, 4] as const;

const SECTIONS: Array<{
  value: DeckTextSection;
  label: string;
}> = [
  {
    value: "mainboard",
    label: "Deck",
  },
  {
    value: "sideboard",
    label: "Sideboard",
  },
  {
    value: "commander",
    label: "Commander",
  },
];

function messageFromError(
  error: unknown,
): string {
  if (
    error instanceof ApiError ||
    error instanceof Error
  ) {
    return error.message;
  }

  return "Could not load card editions";
}

function editionLabel(
  card: ScryfallCard,
): string {
  const set =
    card.set_code?.toUpperCase() ??
    "Unknown set";

  const setName =
    card.set_name ?? set;

  const collector =
    card.collector_number
      ? `#${card.collector_number}`
      : "";

  const year = card.released_at
    ? card.released_at.slice(0, 4)
    : "";

  const language =
    card.lang &&
    card.lang.toLowerCase() !== "en"
      ? card.lang.toUpperCase()
      : "";

  return [
    setName,
    set,
    collector,
    year,
    language,
  ]
    .filter(Boolean)
    .join(" · ");
}

function sortPrintings(
  cards: ScryfallCard[],
): ScryfallCard[] {
  const unique = new Map<
    string,
    ScryfallCard
  >();

  for (const card of cards) {
    unique.set(card.id, card);
  }

  return [...unique.values()].sort(
    (left, right) =>
      (right.released_at ?? "").localeCompare(
        left.released_at ?? "",
      ),
  );
}

export function DeckCardInlineSearch({
  onAdd,
}: {
  onAdd: (
    card: ScryfallCard,
    quantity: number,
    section: DeckTextSection,
  ) => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] =
    useState<string[]>([]);

  const [printings, setPrintings] =
    useState<ScryfallCard[]>([]);

  const [
    selectedPrintingId,
    setSelectedPrintingId,
  ] = useState("");

  const [quantity, setQuantity] =
    useState(1);

  const [section, setSection] =
    useState<DeckTextSection>("mainboard");

  const [searching, setSearching] =
    useState(false);

  const [
    loadingPrintings,
    setLoadingPrintings,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [lastAdded, setLastAdded] =
    useState<string | null>(null);

  useEffect(() => {
    const normalized = query.trim();

    if (
      normalized.length < 2 ||
      loadingPrintings
    ) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(() => {
      setSearching(true);
      setError(null);

      void decksApi
        .autocompleteCards(normalized)
        .then((result) => {
          if (cancelled) return;

          setSuggestions(
            result.data.slice(0, 8),
          );
        })
        .catch((caught: unknown) => {
          if (cancelled) return;

          setSuggestions([]);
          setError(
            messageFromError(caught),
          );
        })
        .finally(() => {
          if (!cancelled) {
            setSearching(false);
          }
        });
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, loadingPrintings]);

  const selectedPrinting =
    useMemo(
      () =>
        printings.find(
          (card) =>
            card.id === selectedPrintingId,
        ) ??
        printings[0] ??
        null,
      [printings, selectedPrintingId],
    );

  const selectedImage = getCardImage(
    selectedPrinting,
    "small",
  );

  async function chooseCard(
    name: string,
  ) {
    setQuery(name);
    setSuggestions([]);
    setLoadingPrintings(true);
    setError(null);
    setLastAdded(null);

    try {
      const canonical =
        await decksApi.namedCard(name);

      let available = [canonical];

      if (canonical.oracle_id) {
        const result =
          await decksApi.searchCards(
            `oracleid:${canonical.oracle_id}`,
            "prints",
          );

        available = sortPrintings([
          canonical,
          ...result.data,
        ]);
      }

      const first =
        available[0] ?? canonical;

      setPrintings(available);
      setSelectedPrintingId(first.id);
    } catch (caught: unknown) {
      setPrintings([]);
      setSelectedPrintingId("");
      setError(
        messageFromError(caught),
      );
    } finally {
      setLoadingPrintings(false);
    }
  }

  function resetSelection() {
    setQuery("");
    setSuggestions([]);
    setPrintings([]);
    setSelectedPrintingId("");
  }

  function addSelectedPrinting() {
    if (!selectedPrinting) return;

    onAdd(
      selectedPrinting,
      quantity,
      section,
    );

    setLastAdded(
      `${quantity}× ${selectedPrinting.name} · ${selectedPrinting.set_code?.toUpperCase() ?? "edition"} added.`,
    );

    resetSelection();
  }

  return (
    <div className="mt-4">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-black/35">
          <SearchIcon />
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPrintings([]);
            setSelectedPrintingId("");
            setLastAdded(null);
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              suggestions[0]
            ) {
              event.preventDefault();

              void chooseCard(
                suggestions[0],
              );
            }

            if (event.key === "Escape") {
              setSuggestions([]);
            }
          }}
          className={`${inputClassName} pl-12 pr-11`}
          placeholder="Search Scryfall…"
          autoComplete="off"
          aria-label="Search cards"
        />

        {searching ||
        loadingPrintings ? (
          <span className="absolute inset-y-0 right-4 my-auto h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-[#6E5AA7]" />
        ) : null}

        {suggestions.length ? (
          <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[20px] border border-black/[0.07] bg-white p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
            {suggestions.map(
              (suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={(event) =>
                    event.preventDefault()
                  }
                  onClick={() =>
                    void chooseCard(
                      suggestion,
                    )
                  }
                  className="flex min-h-11 w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-left text-sm font-medium transition hover:bg-black/[0.035]"
                >
                  <span className="truncate">
                    {suggestion}
                  </span>

                  <span className="ml-4 shrink-0 text-xs font-semibold text-[#6E5AA7]">
                    Select
                  </span>
                </button>
              ),
            )}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 text-xs font-medium text-[#963838]">
          {error}
        </p>
      ) : null}

      {lastAdded ? (
        <p className="mt-2 text-xs font-medium text-[#5D4A8A]">
          {lastAdded}
        </p>
      ) : null}

      {selectedPrinting ? (
        <div className="mt-3 rounded-[22px] border border-black/[0.06] bg-[#FAFAFB] p-3">
          <div className="grid gap-3 sm:grid-cols-[64px_minmax(0,1fr)]">
            <div className="h-[90px] w-16 overflow-hidden rounded-[10px] bg-black/[0.04]">
              {selectedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <EmptyArtwork />
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {selectedPrinting.name}
              </p>

              <p className="mt-0.5 truncate text-xs text-black/40">
                {selectedPrinting.type_line ??
                  "Magic card"}
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_82px_132px_auto]">
                <select
                  value={
                    selectedPrinting.id
                  }
                  onChange={(event) =>
                    setSelectedPrintingId(
                      event.target.value,
                    )
                  }
                  className={`${inputClassName} min-w-0 px-3 text-sm`}
                  aria-label="Card edition"
                >
                  {printings.map(
                    (printing) => (
                      <option
                        key={printing.id}
                        value={printing.id}
                      >
                        {editionLabel(
                          printing,
                        )}
                      </option>
                    ),
                  )}
                </select>

                <select
                  className={`${inputClassName} px-3`}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                  aria-label="Card quantity"
                >
                  {QUANTITIES.map(
                    (value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}×
                      </option>
                    ),
                  )}
                </select>

                <select
                  className={`${inputClassName} px-3`}
                  value={section}
                  onChange={(event) =>
                    setSection(
                      event.target
                        .value as DeckTextSection,
                    )
                  }
                  aria-label="Deck section"
                >
                  {SECTIONS.map(
                    (item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ),
                  )}
                </select>

                <PrimaryButton
                  type="button"
                  onClick={
                    addSelectedPrinting
                  }
                >
                  Add
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}