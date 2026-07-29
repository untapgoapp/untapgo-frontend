"use client";

import {
  useEffect,
  useState,
  type MouseEvent,
} from "react";

import {
  ManaCost,
  ManaText,
} from "@/components/magic/mana-symbols";
import { getCardImage } from "@/lib/decks-api";
import type { ScryfallCard } from "@/types/decks";

import {
  CloseIcon,
  EmptyArtwork,
  IconButton,
} from "./deck-ui";

function faceImage(
  face: ScryfallCard["card_faces"][number] | null,
  size: "large" | "normal",
): string | null {
  if (!face?.image_uris) return null;

  return (
    face.image_uris[size] ??
    face.image_uris.normal ??
    face.image_uris.large ??
    face.image_uris.png ??
    null
  );
}

export function DeckCardInspector({
  card,
  onClose,
}: {
  card: ScryfallCard | null;
  onClose: () => void;
}) {
  const [activeFaceIndex, setActiveFaceIndex] = useState(0);

  useEffect(() => {
    setActiveFaceIndex(0);
  }, [card?.id]);

  if (!card) return null;

  const faces = card.card_faces ?? [];
  const hasMultipleFaces = faces.length > 1;

  const activeFace =
    faces.length > 0
      ? faces[Math.min(activeFaceIndex, faces.length - 1)]
      : null;

  const image =
    faceImage(activeFace, "large") ??
    faceImage(activeFace, "normal") ??
    getCardImage(card, "large") ??
    getCardImage(card, "normal");

  const activeName = activeFace?.name ?? card.name;
  const activeMana = activeFace?.mana_cost ?? card.mana_cost;
  const activeType = activeFace?.type_line ?? card.type_line;
  const activeText = activeFace?.oracle_text ?? card.oracle_text;

  function flipCard() {
    if (!hasMultipleFaces) return;

    setActiveFaceIndex(
      (current) => (current + 1) % faces.length,
    );
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-[30px] bg-[#F5F5F7] shadow-2xl sm:max-w-4xl sm:rounded-[30px]"
        onClick={(event: MouseEvent<HTMLDivElement>) =>
          event.stopPropagation()
        }
      >
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/[0.06] bg-white/85 px-5 py-4 backdrop-blur-xl">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-[-0.02em]">
              {activeName}
            </h2>

            <p className="mt-0.5 truncate text-xs text-black/40">
              {card.set_name ??
                card.set_code?.toUpperCase() ??
                "Magic card"}

              {card.collector_number
                ? ` · #${card.collector_number}`
                : ""}
            </p>
          </div>

          <IconButton
            type="button"
            onClick={onClose}
            aria-label="Close card"
          >
            <CloseIcon />
          </IconButton>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[minmax(250px,330px)_minmax(0,1fr)] sm:p-7">
          <div className="relative mx-auto w-full max-w-[330px] overflow-hidden rounded-[20px] bg-black/[0.04] shadow-[0_18px_45px_rgba(0,0,0,0.14)]">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={activeName}
                className="h-auto w-full"
              />
            ) : (
              <div className="aspect-[0.714]">
                <EmptyArtwork label={activeName} />
              </div>
            )}

            {hasMultipleFaces ? (
              <button
                type="button"
                onClick={flipCard}
                aria-label="Flip card"
                title="Flip card"
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-xl text-white shadow-lg backdrop-blur-xl transition hover:bg-black/90 active:scale-95"
              >
                ↻
              </button>
            ) : null}
          </div>

          <div className="space-y-4">
            <section className="rounded-[22px] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {activeName}
                  </h3>

                  {activeType ? (
                    <p className="mt-1 text-sm text-black/50">
                      {activeType}
                    </p>
                  ) : null}
                </div>

                {activeMana ? (
                  <div className="rounded-full bg-black/[0.035] px-3 py-2">
                    <ManaCost
                      cost={activeMana}
                      size="sm"
                    />
                  </div>
                ) : null}
              </div>

              {activeText ? (
                <div className="mt-4 text-sm leading-6 text-black/70">
                  <ManaText
                    text={activeText}
                    size="xs"
                  />
                </div>
              ) : null}
            </section>

            <section className="rounded-[22px] bg-white p-5 text-sm">
              <dl className="space-y-3">
                <div className="flex justify-between gap-4">
                  <dt className="text-black/40">
                    Artist
                  </dt>

                  <dd className="text-right font-medium">
                    {card.artist ?? "Unknown"}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-black/40">
                    Rarity
                  </dt>

                  <dd className="font-medium capitalize">
                    {card.rarity ?? "Unknown"}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-black/40">
                    Set
                  </dt>

                  <dd className="text-right font-medium">
                    {card.set_name ??
                      card.set_code?.toUpperCase() ??
                      "Unknown"}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}