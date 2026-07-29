"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ManaCost } from "@/components/magic/mana-symbols";
import { deckRoutes } from "@/lib/deck-routes";
import { ApiError, decksApi, getCardImage } from "@/lib/decks-api";
import type {
  Deck,
  DeckCard,
  DeckCardsResponse,
  ScryfallCard,
} from "@/types/decks";

import { DeckCardInspector } from "./deck-card-inspector";
import { DeckCoverPicker } from "./deck-cover-picker";
import {
  EmptyArtwork,
  ErrorNotice,
  ManaPills,
  PageFrame,
  SecondaryButton,
  Spinner,
  Surface,
} from "./deck-ui";

const SECTION_ORDER = [
  "commander",
  "mainboard",
  "sideboard",
  "maybeboard",
  "companion",
];

function sectionLabel(value: string): string {
  if (value === "mainboard") return "Deck";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatLabel(value?: string | null): string {
  if (!value) return "No format";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function CardRow({
  entry,
  onOpen,
}: {
  entry: DeckCard;
  onOpen: (card: ScryfallCard) => void;
}) {
  const image = getCardImage(entry.card, "small");

  return (
    <button
      type="button"
      disabled={!entry.card}
      onClick={() => entry.card && onOpen(entry.card)}
      className="flex w-full min-w-0 items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition hover:bg-[#6E5AA7]/[0.05] disabled:cursor-default"
    >
      <div className="h-[62px] w-11 shrink-0 overflow-hidden rounded-lg bg-black/[0.04]">
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
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{entry.card_name}</p>
        <p className="mt-1 truncate text-xs text-black/38">
          {entry.card?.type_line ?? sectionLabel(entry.section)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {entry.card?.mana_cost ? (
          <ManaCost
            cost={entry.card.mana_cost}
            size="xs"
            className="hidden sm:inline-flex"
          />
        ) : null}

        <span className="rounded-full bg-black/[0.045] px-2.5 py-1 text-xs font-bold text-black/55">
          ×{entry.quantity}
        </span>
      </div>
    </button>
  );
}

export function DeckDetail({ deckId }: { deckId: string }) {
  const router = useRouter();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<DeckCardsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [selectedCard, setSelectedCard] =
    useState<ScryfallCard | null>(null);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      decksApi.get(deckId),
      decksApi.cards(deckId),
    ])
      .then(([deckResult, cardsResult]) => {
        if (cancelled) return;

        setDeck(deckResult);
        setCards(cardsResult);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;

        setError(
          caught instanceof ApiError || caught instanceof Error
            ? caught.message
            : "Could not load deck",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deckId]);

  const grouped = useMemo(() => {
    const map = new Map<string, DeckCard[]>();

    for (const card of cards?.cards ?? []) {
      const group = map.get(card.section) ?? [];
      group.push(card);
      map.set(card.section, group);
    }

    return SECTION_ORDER.filter((section) => map.has(section)).map(
      (section) =>
        [section, map.get(section) ?? []] as const,
    );
  }, [cards]);

  if (loading) {
    return (
      <PageFrame>
        <Spinner label="Loading deck" />
      </PageFrame>
    );
  }

  if (error || !deck) {
    return (
      <PageFrame>
        <ErrorNotice message={error ?? "Deck not found"} />
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push(deckRoutes.list)}
          className="self-start text-sm font-semibold text-[#6E5AA7]"
        >
          ← My decks
        </button>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <SecondaryButton
            type="button"
            onClick={() => setCoverOpen(true)}
          >
            Change cover
          </SecondaryButton>

          <Link
            href={deckRoutes.edit(deck.id)}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#111113] px-5 text-sm font-semibold text-white transition hover:bg-black/80"
          >
            Edit deck
          </Link>
        </div>
      </div>

      <Surface className="overflow-hidden">
        <div className="relative min-h-[230px] overflow-hidden sm:min-h-[340px] lg:min-h-[410px]">
          {deck.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={deck.image_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                objectPosition: `${deck.cover_focus_x}% ${deck.cover_focus_y}%`,
              }}
            />
          ) : (
            <div className="absolute inset-0">
              <EmptyArtwork label={deck.name} />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/5" />

          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7 lg:p-9">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/78">
              <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-xl">
                {formatLabel(deck.format_slug)}
              </span>

              <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-xl">
                {deck.is_public ? "Public" : "Private"}
              </span>

              {cards?.total_cards ? (
                <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-xl">
                  {cards.total_cards} cards
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.045em] drop-shadow sm:text-5xl">
              {deck.name}
            </h1>

            {deck.color_identity.length ? (
              <div className="mt-4 [&_span]:border-white/20 [&_span]:bg-white/15 [&_span]:text-white">
                <ManaPills colors={deck.color_identity} />
              </div>
            ) : null}
          </div>
        </div>
      </Surface>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          {grouped.length ? (
            grouped.map(([section, entries]) => {
              const count = entries.reduce(
                (sum, item) => sum + item.quantity,
                0,
              );

              return (
                <Surface
                  key={section}
                  className="p-3 sm:p-4"
                >
                  <div className="flex items-center justify-between px-2 pb-2 pt-1">
                    <h2 className="text-lg font-semibold tracking-[-0.02em]">
                      {sectionLabel(section)}
                    </h2>

                    <span className="text-sm font-medium text-black/35">
                      {count}
                    </span>
                  </div>

                  <div className="grid gap-0.5 sm:grid-cols-2 xl:grid-cols-3">
                    {entries.map((entry) => (
                      <CardRow
                        key={entry.id}
                        entry={entry}
                        onOpen={setSelectedCard}
                      />
                    ))}
                  </div>
                </Surface>
              );
            })
          ) : (
            <Surface className="px-6 py-14 text-center">
              <h2 className="text-lg font-semibold">
                This deck has not been submitted yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/45">
                The original list is safe. Open the editor and submit it
                to enable card previews and artwork selection.
              </p>

              <Link
                href={deckRoutes.edit(deck.id)}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#111113] px-5 text-sm font-semibold text-white"
              >
                Edit deck
              </Link>
            </Surface>
          )}
        </div>

        <Surface className="p-5 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/35">
            Deck details
          </p>

          <dl className="mt-4 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-black/40">Format</dt>
              <dd className="font-semibold">
                {formatLabel(deck.format_slug)}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-black/40">Main deck</dt>
              <dd className="font-semibold">
                {cards?.mainboard_count ?? 0}
              </dd>
            </div>

            {cards?.commander_count ? (
              <div className="flex justify-between gap-4">
                <dt className="text-black/40">Commander</dt>
                <dd className="font-semibold">
                  {cards.commander_count}
                </dd>
              </div>
            ) : null}

            {cards?.sideboard_count ? (
              <div className="flex justify-between gap-4">
                <dt className="text-black/40">Sideboard</dt>
                <dd className="font-semibold">
                  {cards.sideboard_count}
                </dd>
              </div>
            ) : null}
          </dl>

          {deck.deck_url ? (
            <a
              href={deck.deck_url}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex min-h-11 items-center justify-center rounded-full border border-black/[0.08] text-sm font-semibold text-[#6E5AA7] transition hover:bg-[#6E5AA7]/[0.06]"
            >
              Open original deck
            </a>
          ) : null}
        </Surface>
      </div>

      <DeckCoverPicker
        deck={deck}
        open={coverOpen}
        onClose={() => setCoverOpen(false)}
        onSaved={setDeck}
      />

      <DeckCardInspector
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </PageFrame>
  );
}