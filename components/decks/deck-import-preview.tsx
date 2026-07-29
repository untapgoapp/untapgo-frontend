"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { ManaCost } from "@/components/magic/mana-symbols";
import {
  ApiError,
  decksApi,
  getCardImage,
} from "@/lib/decks-api";
import type {
  DeckCardsResponse,
  DeckImportPreview,
  ParsedDeckEntry,
  ScryfallCard,
} from "@/types/decks";

import { DeckCardInspector } from "./deck-card-inspector";
import {
  EmptyArtwork,
  ManaPills,
  Surface,
  inputClassName,
} from "./deck-ui";

const SECTION_ORDER = [
  "commander",
  "mainboard",
  "sideboard",
  "maybeboard",
  "companion",
];

const EDITABLE_SECTIONS = [
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
] as const;

function sectionLabel(value: string): string {
  if (value === "mainboard") return "Deck";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

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

function printingLabel(
  card: ScryfallCard,
): string {
  const setCode =
    card.set_code?.toUpperCase() ??
    "Unknown";

  const setName =
    card.set_name ?? setCode;

  const collectorNumber =
    card.collector_number
      ? `#${card.collector_number}`
      : "";

  const year = card.released_at
    ? card.released_at.slice(0, 4)
    : "";

  return [
    setName,
    setCode,
    collectorNumber,
    year,
  ]
    .filter(Boolean)
    .join(" · ");
}

function entryKey(
  entry: ParsedDeckEntry,
): string {
  return [
    entry.section,
    entry.name.toLowerCase(),
    entry.set_code?.toLowerCase() ?? "",
    entry.collector_number?.toLowerCase() ?? "",
  ].join("|");
}

function consolidateEntries(
  entries: ParsedDeckEntry[],
): ParsedDeckEntry[] {
  const map = new Map<
    string,
    ParsedDeckEntry
  >();

  const order: string[] = [];

  for (const entry of entries) {
    const key = entryKey(entry);
    const current = map.get(key);

    if (current) {
      map.set(key, {
        ...current,
        quantity:
          current.quantity +
          entry.quantity,
        line_numbers: [
          ...(current.line_numbers ?? []),
          ...(entry.line_numbers ?? []),
        ],
      });

      continue;
    }

    map.set(key, {
      ...entry,
      line_numbers: [
        ...(entry.line_numbers ?? []),
      ],
    });

    order.push(key);
  }

  return order
    .map((key) => map.get(key))
    .filter(
      (
        entry,
      ): entry is ParsedDeckEntry =>
        Boolean(entry),
    );
}

function normalizeEntriesText(
  entries: ParsedDeckEntry[],
): string {
  const lines: string[] = [];

  for (const section of SECTION_ORDER) {
    const sectionEntries =
      entries.filter(
        (entry) =>
          entry.section === section,
      );

    if (!sectionEntries.length) {
      continue;
    }

    if (lines.length) {
      lines.push("");
    }

    lines.push(
      sectionLabel(section),
    );

    for (const entry of sectionEntries) {
      let printing = "";

      if (
        entry.set_code &&
        entry.collector_number
      ) {
        printing = ` (${entry.set_code.toUpperCase()}) ${entry.collector_number}`;
      } else if (entry.set_code) {
        printing = ` (${entry.set_code.toUpperCase()})`;
      }

      lines.push(
        `${entry.quantity} ${entry.name}${printing}`,
      );
    }
  }

  return lines.join("\n").trim();
}

type ManaColor = "W" | "U" | "B" | "R" | "G" | "C";

const MANA_COLOR_ORDER: readonly ManaColor[] = [
  "W",
  "U",
  "B",
  "R",
  "G",
];

function isManaColor(value: string): value is ManaColor {
  return (
    value === "W" ||
    value === "U" ||
    value === "B" ||
    value === "R" ||
    value === "G" ||
    value === "C"
  );
}

function colorIdentityFromEntries(
  entries: ParsedDeckEntry[],
): ManaColor[] {
  const colors = new Set<ManaColor>();

  for (const entry of entries) {
    for (const color of entry.card?.color_identity ?? []) {
      if (isManaColor(color)) {
        colors.add(color);
      }
    }
  }

  const orderedColors = MANA_COLOR_ORDER.filter((color) =>
    colors.has(color),
  );

  return orderedColors.length ? orderedColors : ["C"];
}

function countsFromEntries(
  entries: ParsedDeckEntry[],
) {
  const countSection = (
    section: string,
  ) =>
    entries
      .filter(
        (entry) =>
          entry.section === section,
      )
      .reduce(
        (sum, entry) =>
          sum + entry.quantity,
        0,
      );

  return {
    mainboard_count:
      countSection("mainboard"),

    sideboard_count:
      countSection("sideboard"),

    commander_count:
      countSection("commander"),

    total_cards: entries.reduce(
      (sum, entry) =>
        sum + entry.quantity,
      0,
    ),

    unique_card_count:
      entries.length,
  };
}

function buildPreview(
  original:
    | DeckImportPreview
    | null,
  entries: ParsedDeckEntry[],
): DeckImportPreview {
  const consolidated =
    consolidateEntries(entries);

  const counts =
    countsFromEntries(
      consolidated,
    );

  const errors =
    original?.errors ?? [];

  return {
    entries: consolidated,
    errors,
    normalized_text:
      normalizeEntriesText(
        consolidated,
      ),
    ...counts,
    color_identity:
      colorIdentityFromEntries(
        consolidated,
      ),
    can_save:
      consolidated.length > 0 &&
      errors.length === 0 &&
      consolidated.every(
        (entry) =>
          entry.resolved &&
          Boolean(entry.card),
      ),
  };
}

function entriesFromExisting(
  existingCards?: DeckCardsResponse | null,
): ParsedDeckEntry[] {
  return (
    existingCards?.cards ?? []
  ).map((entry) => ({
    name: entry.card_name,
    quantity: entry.quantity,
    section: entry.section,
    set_code:
      entry.card?.set_code ?? null,
    collector_number:
      entry.card
        ?.collector_number ?? null,
    line_numbers: [],
    resolved:
      Boolean(entry.card),
    card: entry.card ?? null,
  }));
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
      (
        right.released_at ?? ""
      ).localeCompare(
        left.released_at ?? "",
      ),
  );
}

function PreviewEntry({
  entry,
  index,
  editable,
  editionOpen,
  printings,
  loadingPrintings,
  editionError,
  onOpen,
  onChangeQuantity,
  onChangeSection,
  onRemove,
  onToggleEdition,
  onSelectPrinting,
}: {
  entry: ParsedDeckEntry;
  index: number;
  editable: boolean;
  editionOpen: boolean;
  printings: ScryfallCard[];
  loadingPrintings: boolean;
  editionError: string | null;
  onOpen: (
    card: ScryfallCard,
  ) => void;
  onChangeQuantity: (
    index: number,
    quantity: number,
  ) => void;
  onChangeSection: (
    index: number,
    section: string,
  ) => void;
  onRemove: (
    index: number,
  ) => void;
  onToggleEdition: (
    index: number,
  ) => void;
  onSelectPrinting: (
    index: number,
    card: ScryfallCard,
  ) => void;
}) {
  const image = getCardImage(
    entry.card,
    "small",
  );

  return (
    <div className="min-w-0 rounded-[20px] border border-black/[0.055] bg-[#FAFAFB] p-2.5">
      <div className="flex min-w-0 gap-3">
        <button
          type="button"
          disabled={!entry.card}
          onClick={() =>
            entry.card &&
            onOpen(entry.card)
          }
          className="h-[76px] w-[54px] shrink-0 overflow-hidden rounded-[10px] bg-black/[0.04] disabled:cursor-default"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <EmptyArtwork />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#202024]">
                {entry.name}
              </p>

              <p className="mt-1 truncate text-xs text-black/42">
                {entry.card
                  ? printingLabel(
                      entry.card,
                    )
                  : sectionLabel(
                      entry.section,
                    )}
              </p>

              {entry.card
                ?.type_line ? (
                <p className="mt-1 truncate text-[11px] text-black/30">
                  {
                    entry.card
                      .type_line
                  }
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {entry.card
                ?.mana_cost ? (
                <ManaCost
                  cost={
                    entry.card
                      .mana_cost
                  }
                  size="xs"
                  className="hidden sm:inline-flex"
                />
              ) : null}

              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  entry.resolved
                    ? "bg-[#5FA36B]"
                    : "bg-[#D66969]"
                }`}
                aria-label={
                  entry.resolved
                    ? "Resolved"
                    : "Not resolved"
                }
              />
            </div>
          </div>

          {editable ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="inline-flex h-9 items-center overflow-hidden rounded-full border border-black/[0.07] bg-white">
                <button
                  type="button"
                  onClick={() =>
                    onChangeQuantity(
                      index,
                      entry.quantity -
                        1,
                    )
                  }
                  className="flex h-full w-9 items-center justify-center text-base font-medium text-black/45 transition hover:bg-black/[0.035]"
                  aria-label="Decrease quantity"
                >
                  −
                </button>

                <span className="min-w-8 text-center text-xs font-bold text-black/65">
                  {entry.quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onChangeQuantity(
                      index,
                      entry.quantity +
                        1,
                    )
                  }
                  className="flex h-full w-9 items-center justify-center text-base font-medium text-black/45 transition hover:bg-black/[0.035]"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <select
                value={entry.section}
                onChange={(event) =>
                  onChangeSection(
                    index,
                    event.target.value,
                  )
                }
                className="h-9 rounded-full border border-black/[0.07] bg-white px-3 text-xs font-semibold text-black/60 outline-none transition focus:border-[#6E5AA7]/40"
                aria-label="Deck section"
              >
                {EDITABLE_SECTIONS.map(
                  (section) => (
                    <option
                      key={
                        section.value
                      }
                      value={
                        section.value
                      }
                    >
                      {section.label}
                    </option>
                  ),
                )}
              </select>

              <button
                type="button"
                onClick={() =>
                  onToggleEdition(
                    index,
                  )
                }
                disabled={
                  !entry.card
                }
                className="h-9 rounded-full border border-black/[0.07] bg-white px-3 text-xs font-semibold text-[#6E5AA7] transition hover:bg-[#6E5AA7]/[0.05] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {editionOpen
                  ? "Close editions"
                  : "Change edition"}
              </button>

              <button
                type="button"
                onClick={() =>
                  onRemove(index)
                }
                className="ml-auto h-9 rounded-full px-3 text-xs font-semibold text-[#B04444] transition hover:bg-[#B04444]/[0.06]"
              >
                Remove
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {editionOpen ? (
        <div className="mt-3 border-t border-black/[0.055] pt-3">
          {loadingPrintings ? (
            <div className="flex min-h-11 items-center gap-2 text-xs font-medium text-black/40">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-[#6E5AA7]" />
              Loading editions…
            </div>
          ) : editionError ? (
            <p className="text-xs font-medium text-[#963838]">
              {editionError}
            </p>
          ) : printings.length ? (
            <select
              value={
                entry.card?.id ?? ""
              }
              onChange={(event) => {
                const selected =
                  printings.find(
                    (card) =>
                      card.id ===
                      event.target
                        .value,
                  );

                if (selected) {
                  onSelectPrinting(
                    index,
                    selected,
                  );
                }
              }}
              className={`${inputClassName} text-sm`}
              aria-label="Card edition"
            >
              {printings.map(
                (printing) => (
                  <option
                    key={
                      printing.id
                    }
                    value={
                      printing.id
                    }
                  >
                    {printingLabel(
                      printing,
                    )}
                  </option>
                ),
              )}
            </select>
          ) : (
            <p className="text-xs text-black/40">
              No alternative
              editions found.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function DeckImportPreviewPanel({
  preview,
  existingCards,
  stale = false,
  onPreviewChange,
}: {
  preview: DeckImportPreview | null;
  existingCards?: DeckCardsResponse | null;
  stale?: boolean;
  onPreviewChange?: (
    preview: DeckImportPreview,
  ) => void;
}) {
  const [
    selectedCard,
    setSelectedCard,
  ] =
    useState<ScryfallCard | null>(
      null,
    );

  const [draftEntries, setDraftEntries] =
    useState<ParsedDeckEntry[]>([]);

  const [
    editionIndex,
    setEditionIndex,
  ] = useState<number | null>(
    null,
  );

  const [printings, setPrintings] =
    useState<ScryfallCard[]>([]);

  const [
    loadingPrintings,
    setLoadingPrintings,
  ] = useState(false);

  const [
    editionError,
    setEditionError,
  ] = useState<string | null>(
    null,
  );

  const sourceEntries = useMemo(() => {
    if (preview) {
      return preview.entries;
    }

    if (!stale) {
      return entriesFromExisting(
        existingCards,
      );
    }

    return [];
  }, [
    preview,
    existingCards,
    stale,
  ]);

  useEffect(() => {
    setDraftEntries(
      sourceEntries.map((entry) => ({
        ...entry,
        line_numbers: [
          ...(entry.line_numbers ??
            []),
        ],
      })),
    );

    setEditionIndex(null);
    setPrintings([]);
    setEditionError(null);
  }, [sourceEntries]);

  const totalCards =
    preview?.total_cards ??
    existingCards?.total_cards ??
    0;

  const editable =
    Boolean(onPreviewChange) &&
    !stale;

  function emitEntries(
    entries: ParsedDeckEntry[],
  ) {
    const nextPreview =
      buildPreview(
        preview,
        entries,
      );

    setDraftEntries(
      nextPreview.entries,
    );

    onPreviewChange?.(
      nextPreview,
    );
  }

  function changeQuantity(
    index: number,
    quantity: number,
  ) {
    if (quantity <= 0) {
      removeEntry(index);
      return;
    }

    emitEntries(
      draftEntries.map(
        (entry, entryIndex) =>
          entryIndex === index
            ? {
                ...entry,
                quantity: Math.min(
                  999,
                  quantity,
                ),
              }
            : entry,
      ),
    );
  }

  function changeSection(
    index: number,
    section: string,
  ) {
    emitEntries(
      draftEntries.map(
        (entry, entryIndex) =>
          entryIndex === index
            ? {
                ...entry,
                section,
              }
            : entry,
      ),
    );
  }

  function removeEntry(
    index: number,
  ) {
    emitEntries(
      draftEntries.filter(
        (
          _entry,
          entryIndex,
        ) => entryIndex !== index,
      ),
    );

    if (
      editionIndex === index
    ) {
      setEditionIndex(null);
      setPrintings([]);
    }
  }

  async function toggleEdition(
    index: number,
  ) {
    if (
      editionIndex === index
    ) {
      setEditionIndex(null);
      setPrintings([]);
      setEditionError(null);
      return;
    }

    const entry =
      draftEntries[index];

    const card = entry?.card;

    if (
      !card?.oracle_id
    ) {
      setEditionIndex(index);
      setPrintings([]);
      setEditionError(
        "This card has no Oracle ID.",
      );
      return;
    }

    setEditionIndex(index);
    setPrintings([]);
    setEditionError(null);
    setLoadingPrintings(true);

    try {
      const result =
        await decksApi.searchCards(
          `oracleid:${card.oracle_id}`,
          "prints",
        );

      setPrintings(
        sortPrintings([
          card,
          ...result.data,
        ]),
      );
    } catch (caught: unknown) {
      setEditionError(
        messageFromError(caught),
      );
    } finally {
      setLoadingPrintings(false);
    }
  }

  function selectPrinting(
    index: number,
    card: ScryfallCard,
  ) {
    emitEntries(
      draftEntries.map(
        (entry, entryIndex) =>
          entryIndex === index
            ? {
                ...entry,
                name: card.name,
                set_code:
                  card.set_code ??
                  null,
                collector_number:
                  card.collector_number ??
                  null,
                resolved: true,
                card,
              }
            : entry,
      ),
    );

    setEditionIndex(null);
    setPrintings([]);
    setEditionError(null);
  }

  if (
    !preview &&
    !draftEntries.length
  ) {
    return (
      <Surface className="flex min-h-[350px] items-center justify-center p-8 lg:min-h-[520px]">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6E5AA7]/10 text-xl text-[#6E5AA7]">
            ✦
          </div>

          <h2 className="text-lg font-semibold">
            Deck preview
          </h2>

          <p className="mt-2 text-sm leading-6 text-black/45">
            Add cards or paste a
            complete list, then submit
            it. You can adjust
            quantities, sections and
            editions here.
          </p>

          <div className="mt-5 rounded-2xl bg-black/[0.035] px-4 py-3 text-left font-mono text-xs leading-5 text-black/45">
            Deck
            <br />
            4 Cauldron Familiar
            <br />
            4 Gilded Goose
            <br />
            <br />
            Sideboard
            <br />
            4 Thoughtseize
          </div>
        </div>
      </Surface>
    );
  }

  const displayedTotal =
    draftEntries.reduce(
      (sum, entry) =>
        sum + entry.quantity,
      0,
    ) || totalCards;

  const sideboardCount =
    draftEntries
      .filter(
        (entry) =>
          entry.section ===
          "sideboard",
      )
      .reduce(
        (sum, entry) =>
          sum + entry.quantity,
        0,
      );

  return (
    <>
      <Surface className="overflow-hidden">
        <div className="border-b border-black/[0.06] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                {preview
                  ? "Submitted list"
                  : "Saved deck"}
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                {displayedTotal} cards
              </h2>
            </div>

            {sideboardCount ? (
              <span className="rounded-full bg-black/[0.04] px-3 py-1.5 text-xs font-medium text-black/50">
                {sideboardCount} sideboard
              </span>
            ) : null}
          </div>

          {preview?.color_identity
            .length ? (
            <div className="mt-4">
              <ManaPills
                colors={
                  preview.color_identity
                }
              />
            </div>
          ) : null}
        </div>

        {stale ? (
          <div className="border-b border-[#C38B32]/10 bg-[#C38B32]/[0.07] px-5 py-3.5 text-sm font-medium text-[#8A6123] sm:px-6">
            The list changed. Submit
            it again to refresh the
            preview.
          </div>
        ) : preview?.errors.length ? (
          <div className="border-b border-[#D04A4A]/10 bg-[#D04A4A]/[0.045] px-5 py-4 sm:px-6">
            <p className="text-sm font-semibold text-[#9E3535]">
              {preview.errors.length}{" "}
              line
              {preview.errors
                .length === 1
                ? " needs"
                : "s need"}{" "}
              attention
            </p>

            <div className="mt-3 space-y-2">
              {preview.errors
                .slice(0, 8)
                .map((error) => (
                  <div
                    key={`${error.line_number}-${error.code}`}
                    className="rounded-xl bg-white/55 px-3 py-2"
                  >
                    <p className="text-sm text-[#8E3838]">
                      Line{" "}
                      {
                        error.line_number
                      }
                      :{" "}
                      {
                        error.message
                      }
                    </p>

                    <p className="mt-0.5 truncate text-xs text-[#8E3838]/65">
                      {error.line}
                    </p>

                    {error.suggestion ? (
                      <p className="mt-1 text-xs font-semibold text-[#6E5AA7]">
                        Try:{" "}
                        {
                          error.suggestion
                        }
                      </p>
                    ) : null}
                  </div>
                ))}
            </div>
          </div>
        ) : preview ? (
          <div className="border-b border-[#5FA36B]/10 bg-[#5FA36B]/[0.055] px-5 py-3.5 text-sm font-medium text-[#397347] sm:px-6">
            All cards identified.
            Ready to save.
          </div>
        ) : null}

        <div className="max-h-[760px] overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-2.5">
            {draftEntries.map(
              (entry, index) => (
                <PreviewEntry
                  key={`${entryKey(entry)}-${index}`}
                  entry={entry}
                  index={index}
                  editable={editable}
                  editionOpen={
                    editionIndex ===
                    index
                  }
                  printings={
                    editionIndex ===
                    index
                      ? printings
                      : []
                  }
                  loadingPrintings={
                    editionIndex ===
                      index &&
                    loadingPrintings
                  }
                  editionError={
                    editionIndex ===
                    index
                      ? editionError
                      : null
                  }
                  onOpen={
                    setSelectedCard
                  }
                  onChangeQuantity={
                    changeQuantity
                  }
                  onChangeSection={
                    changeSection
                  }
                  onRemove={
                    removeEntry
                  }
                  onToggleEdition={
                    toggleEdition
                  }
                  onSelectPrinting={
                    selectPrinting
                  }
                />
              ),
            )}
          </div>
        </div>
      </Surface>

      <DeckCardInspector
        card={selectedCard}
        onClose={() =>
          setSelectedCard(null)
        }
      />
    </>
  );
}