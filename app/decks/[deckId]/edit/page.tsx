"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { DeckEditor } from "@/components/decks/deck-editor";
import { ErrorNotice, PageFrame, Spinner } from "@/components/decks/deck-ui";
import { ApiError, decksApi } from "@/lib/decks-api";
import type { Deck } from "@/types/decks";

export default function EditDeckPage() {
  const params = useParams<{ deckId: string }>();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void decksApi
      .get(params.deckId)
      .then((result) => {
        if (!cancelled) setDeck(result);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof ApiError || caught instanceof Error
              ? caught.message
              : "Could not load deck",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.deckId]);

  if (error) {
    return (
      <PageFrame>
        <ErrorNotice message={error} />
      </PageFrame>
    );
  }

  if (!deck) {
    return (
      <PageFrame>
        <Spinner label="Loading deck" />
      </PageFrame>
    );
  }

  return <DeckEditor deck={deck} />;
}
