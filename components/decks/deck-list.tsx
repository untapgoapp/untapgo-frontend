"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { deckRoutes } from "@/lib/deck-routes";
import { ApiError, decksApi } from "@/lib/decks-api";
import type { Deck } from "@/types/decks";

import {
  EmptyArtwork,
  ErrorNotice,
  IconButton,
  ManaPills,
  MoreIcon,
  PageFrame,
  PlusIcon,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  Surface,
  TrashIcon,
} from "./deck-ui";

function formatLabel(value?: string | null): string {
  if (!value) return "No format";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function DeckActions({
  deck,
  onDelete,
}: {
  deck: Deck;
  onDelete: (deck: Deck) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative flex shrink-0 items-center gap-2">
      <Link
        href={deckRoutes.edit(deck.id)}
        className="inline-flex min-h-10 items-center justify-center rounded-full border border-black/[0.085] bg-white px-4 text-sm font-semibold transition hover:bg-black/[0.025]"
      >
        Edit
      </Link>
      <IconButton type="button" onClick={() => setOpen((value) => !value)} aria-label="Deck actions">
        <MoreIcon />
      </IconButton>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[170px] rounded-[18px] border border-black/[0.07] bg-white p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
          <Link
            href={deckRoutes.detail(deck.id)}
            onClick={() => setOpen(false)}
            className="block rounded-xl px-3.5 py-2.5 text-sm font-medium transition hover:bg-black/[0.035]"
          >
            View deck
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete(deck);
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-[#B73E3E] transition hover:bg-[#D04A4A]/[0.06]"
          >
            <TrashIcon />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DeckRow({
  deck,
  onDelete,
}: {
  deck: Deck;
  onDelete: (deck: Deck) => void;
}) {
  const total = deck.mainboard_count + deck.sideboard_count + deck.commander_count;

  return (
    <Surface className="min-w-0 p-3 sm:p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Link href={deckRoutes.detail(deck.id)} className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <div className="h-[76px] w-[94px] shrink-0 overflow-hidden rounded-[16px] bg-black/[0.04] sm:h-[82px] sm:w-[112px]">
            {deck.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={deck.image_url}
                alt=""
                className="h-full w-full object-cover"
                style={{ objectPosition: `${deck.cover_focus_x}% ${deck.cover_focus_y}%` }}
              />
            ) : (
              <EmptyArtwork label={deck.name} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="max-w-full truncate text-base font-semibold tracking-[-0.018em] sm:text-lg">{deck.name}</h2>
              <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-semibold text-black/42">
                {deck.is_public ? "Public" : "Private"}
              </span>
            </div>
            <p className="mt-1 text-sm text-black/45">
              {formatLabel(deck.format_slug)}{total > 0 ? ` · ${total} cards` : ""}
            </p>
            {deck.color_identity.length ? <div className="mt-2.5"><ManaPills colors={deck.color_identity} /></div> : null}
          </div>
        </Link>

        <div className="flex items-center justify-end border-t border-black/[0.05] pt-3 sm:border-0 sm:pt-0">
          <DeckActions deck={deck} onDelete={onDelete} />
        </div>
      </div>
    </Surface>
  );
}

export function DeckList() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Deck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void decksApi
      .list()
      .then((result) => {
        if (!cancelled) setDecks(result.decks);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof ApiError || caught instanceof Error ? caught.message : "Could not load decks");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await decksApi.remove(deleteTarget.id);
      setDecks((current) => current.filter((deck) => deck.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (caught) {
      setError(caught instanceof ApiError || caught instanceof Error ? caught.message : "Could not delete deck");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageFrame>
      <div className="mb-6 lg:mb-8">
        <Link href="/profile" className="text-sm font-semibold text-[#6E5AA7]">← Back to profile</Link>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">My decks</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-black/45">
              Keep the decks you bring to events, with card previews and artwork from Scryfall.
            </p>
          </div>
          <Link
            href={deckRoutes.create}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#111113] px-5 text-sm font-semibold text-white transition hover:bg-black/80 sm:w-auto"
          >
            <PlusIcon />
            Add deck
          </Link>
        </div>
      </div>

      {error ? <div className="mb-4"><ErrorNotice message={error} /></div> : null}
      {loading ? <Spinner label="Loading decks" /> : null}

      {!loading && !error && !decks.length ? (
        <Surface className="px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#6E5AA7]/10 text-2xl text-[#6E5AA7]">✦</div>
          <h2 className="mt-5 text-xl font-semibold">No decks yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-black/45">
            Paste a list from Moxfield, ManaBox, TappedOut or wherever your cardboard currently lives.
          </p>
          <Link href={deckRoutes.create} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#111113] px-5 text-sm font-semibold text-white">
            Create your first deck
          </Link>
        </Surface>
      ) : null}

      {!loading && decks.length ? (
        <div className="mx-auto max-w-[980px] space-y-3.5">
          {decks.map((deck) => <DeckRow key={deck.id} deck={deck} onDelete={(deck) => setDeleteTarget(deck)} />)}
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <div className="w-full rounded-t-[28px] bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-[28px] sm:p-6">
            <h2 className="text-xl font-semibold tracking-[-0.025em]">Delete {deleteTarget.name}?</h2>
            <p className="mt-2 text-sm leading-6 text-black/45">This removes the deck and its event associations. This cannot be undone.</p>
            <div className="mt-6 flex gap-3">
              <SecondaryButton type="button" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</SecondaryButton>
              <PrimaryButton type="button" className="flex-1 bg-[#B83E3E] hover:bg-[#A43535]" onClick={() => void confirmDelete()} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </PageFrame>
  );
}
