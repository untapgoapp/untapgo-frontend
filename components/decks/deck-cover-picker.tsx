"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";

import { ApiError, decksApi, getCardImage } from "@/lib/decks-api";
import type {
  CardArtwork,
  CoverCardOption,
  Deck,
} from "@/types/decks";

import {
  CloseIcon,
  EmptyArtwork,
  ErrorNotice,
  PrimaryButton,
  SecondaryButton,
  Spinner,
} from "./deck-ui";

function artworkImage(artwork: CardArtwork): string | null {
  return artwork.image_uris?.art_crop ?? artwork.image_uris?.normal ?? null;
}

export function DeckCoverPicker({
  deck,
  open,
  onClose,
  onSaved,
}: {
  deck: Deck;
  open: boolean;
  onClose: () => void;
  onSaved: (deck: Deck) => void;
}) {
  const [cards, setCards] = useState<CoverCardOption[]>([]);
  const [artworks, setArtworks] = useState<CardArtwork[]>([]);
  const [selectedOracleId, setSelectedOracleId] = useState<string | null>(null);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(
    deck.cover_scryfall_id ?? null,
  );
  const [focusX, setFocusX] = useState(deck.cover_focus_x ?? 50);
  const [focusY, setFocusY] = useState(deck.cover_focus_y ?? 50);
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingArtworks, setLoadingArtworks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedArtwork = useMemo(
    () => artworks.find((item) => item.scryfall_id === selectedArtworkId) ?? null,
    [artworks, selectedArtworkId],
  );

  const previewImage = selectedArtwork
    ? artworkImage(selectedArtwork)
    : deck.image_url ?? null;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoadingCards(true);
    setError(null);
    setFocusX(deck.cover_focus_x ?? 50);
    setFocusY(deck.cover_focus_y ?? 50);
    setSelectedArtworkId(deck.cover_scryfall_id ?? null);

    void decksApi
      .coverCards(deck.id)
      .then((result) => {
        if (cancelled) return;
        setCards(result.cards);
        const firstOracle =
          deck.cover_oracle_id ?? result.cards[0]?.oracle_id ?? null;
        setSelectedOracleId(firstOracle);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof ApiError || caught instanceof Error
              ? caught.message
              : "Could not load cover options",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCards(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deck, open]);

  useEffect(() => {
    if (!open || !selectedOracleId) {
      setArtworks([]);
      return;
    }

    let cancelled = false;
    setLoadingArtworks(true);
    setError(null);

    void decksApi
      .coverArtworks(deck.id, selectedOracleId)
      .then((result) => {
        if (cancelled) return;
        setArtworks(result.artworks);

        const preferredArtworkId =
          selectedOracleId === deck.cover_oracle_id
            ? deck.cover_scryfall_id
            : null;
        const preferredExists = result.artworks.some(
          (item) => item.scryfall_id === preferredArtworkId,
        );

        setSelectedArtworkId(
          preferredExists
            ? preferredArtworkId ?? null
            : result.artworks[0]?.scryfall_id ?? null,
        );
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof ApiError || caught instanceof Error
              ? caught.message
              : "Could not load artworks",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingArtworks(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    deck.cover_oracle_id,
    deck.cover_scryfall_id,
    deck.id,
    open,
    selectedOracleId,
  ]);

  async function save() {
    if (!selectedArtworkId) return;

    setSaving(true);
    setError(null);

    try {
      const updated = await decksApi.updateCover(deck.id, {
        scryfall_id: selectedArtworkId,
        focus_x: focusX,
        focus_y: focusY,
      });
      onSaved(updated);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof ApiError || caught instanceof Error
          ? caught.message
          : "Could not save cover",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="max-h-[94vh] w-full overflow-hidden rounded-t-[30px] bg-[#F5F5F7] shadow-2xl sm:max-w-6xl sm:rounded-[30px]">
        <div className="flex items-center justify-between border-b border-black/[0.06] bg-white/80 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">
              Choose cover
            </h2>
            <p className="mt-0.5 text-xs text-black/40">
              Pick a card, artwork and crop.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/[0.045] text-black/55 transition hover:bg-black/[0.08]"
            aria-label="Close cover picker"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="max-h-[calc(94vh-74px)] overflow-y-auto p-4 sm:p-6">
          {error ? <div className="mb-4"><ErrorNotice message={error} /></div> : null}

          {loadingCards ? (
            <Spinner label="Loading deck cards" />
          ) : cards.length === 0 ? (
            <div className="rounded-[24px] bg-white px-6 py-14 text-center text-sm text-black/45">
              Process this deck before choosing a cover.
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)_minmax(320px,0.9fr)]">
              <section className="rounded-[24px] bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,0.035)]">
                <p className="px-2 pb-3 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-black/35">
                  Card
                </p>
                <div className="flex gap-2 overflow-x-auto lg:block lg:max-h-[590px] lg:space-y-1.5 lg:overflow-y-auto">
                  {cards.map((card) => {
                    const active = card.oracle_id === selectedOracleId;
                    const image = getCardImage(card.current_printing, "small");
                    return (
                      <button
                        key={card.oracle_id}
                        type="button"
                        onClick={() => {
                          setSelectedOracleId(card.oracle_id);
                          setSelectedArtworkId(null);
                        }}
                        className={`flex min-w-[190px] items-center gap-3 rounded-2xl p-2.5 text-left transition lg:min-w-0 lg:w-full ${
                          active
                            ? "bg-[#6E5AA7]/10 text-[#4E3B7C]"
                            : "hover:bg-black/[0.035]"
                        }`}
                      >
                        <div className="h-12 w-9 shrink-0 overflow-hidden rounded-md bg-black/[0.04]">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <EmptyArtwork />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {card.name}
                          </p>
                          <p className="mt-0.5 text-xs capitalize text-black/40">
                            {card.section} · ×{card.quantity}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[24px] bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.035)]">
                <p className="pb-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/35">
                  Artwork
                </p>
                {loadingArtworks ? (
                  <Spinner label="Loading artworks" />
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {artworks.map((artwork) => {
                      const image = artworkImage(artwork);
                      const active = artwork.scryfall_id === selectedArtworkId;
                      return (
                        <button
                          key={artwork.scryfall_id}
                          type="button"
                          onClick={() => setSelectedArtworkId(artwork.scryfall_id)}
                          className={`overflow-hidden rounded-2xl border bg-[#F5F5F7] text-left transition ${
                            active
                              ? "border-[#6E5AA7] ring-4 ring-[#6E5AA7]/10"
                              : "border-black/[0.06] hover:border-black/15"
                          }`}
                        >
                          <div className="aspect-[4/3] overflow-hidden">
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
                          <div className="px-3 py-2.5">
                            <p className="truncate text-xs font-semibold">
                              {artwork.set_name ?? artwork.set_code ?? "Printing"}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] text-black/40">
                              {artwork.artist ? `Art by ${artwork.artist}` : artwork.released_at}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="lg:sticky lg:top-0 lg:self-start">
                <div className="overflow-hidden rounded-[26px] bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.035)]">
                  <p className="pb-3 text-xs font-semibold uppercase tracking-[0.14em] text-black/35">
                    Preview
                  </p>
                  <div className="relative aspect-[16/9] overflow-hidden rounded-[20px] bg-black/[0.04]">
                    {previewImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewImage}
                        alt=""
                        className="h-full w-full object-cover"
                        style={{ objectPosition: `${focusX}% ${focusY}%` }}
                      />
                    ) : (
                      <EmptyArtwork />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="truncate text-lg font-semibold drop-shadow">
                        {deck.name}
                      </p>
                      <p className="mt-0.5 text-xs text-white/75">
                        {deck.format_slug ?? "Deck"}
                      </p>
                    </div>
                  </div>

                  <label className="mt-5 block">
                    <div className="mb-2 flex justify-between text-xs font-medium text-black/45">
                      <span>Horizontal position</span>
                      <span>{Math.round(focusX)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={focusX}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setFocusX(Number(event.target.value))
                      }
                      className="w-full accent-[#6E5AA7]"
                    />
                  </label>

                  <label className="mt-4 block">
                    <div className="mb-2 flex justify-between text-xs font-medium text-black/45">
                      <span>Vertical position</span>
                      <span>{Math.round(focusY)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={focusY}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        setFocusY(Number(event.target.value))
                      }
                      className="w-full accent-[#6E5AA7]"
                    />
                  </label>

                  <div className="mt-6 flex gap-2">
                    <SecondaryButton type="button" className="flex-1" onClick={onClose}>
                      Cancel
                    </SecondaryButton>
                    <PrimaryButton
                      type="button"
                      className="flex-1"
                      disabled={!selectedArtworkId || saving}
                      onClick={save}
                    >
                      {saving ? "Saving…" : "Use cover"}
                    </PrimaryButton>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
