"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { deckRoutes } from "@/lib/deck-routes";
import { ApiError, decksApi } from "@/lib/decks-api";
import type { Deck } from "@/types/decks";

import DeckListRow from "./deck-list-row";
import {
  ErrorNotice,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  Surface,
} from "./deck-ui";

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
    <>
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
          {decks.map((deck) => <DeckListRow key={deck.id} deck={deck} onDelete={(deck) => setDeleteTarget(deck)} />)}
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
    </>
  );
}
