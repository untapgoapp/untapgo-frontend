"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { DeckEditor } from "@/components/decks/deck-editor";
import {
  ErrorNotice,
  PageFrame,
  Spinner,
} from "@/components/decks/deck-ui";
import { ApiError, decksApi } from "@/lib/decks-api";
import type { Deck } from "@/types/decks";

export default function EditDeckPage() {
  const params = useParams<{ deckId: string }>();

  const deckId = Array.isArray(params.deckId)
    ? params.deckId[0]
    : params.deckId;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deckId) return;

    let cancelled = false;

    void decksApi
      .get(deckId)
      .then((result) => {
        if (!cancelled) {
          setDeck(result);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) return;

        setError(
          caught instanceof ApiError || caught instanceof Error
            ? caught.message
            : "Could not load deck",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [deckId]);

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