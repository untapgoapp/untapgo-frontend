"use client";

import { useParams } from "next/navigation";

import { DeckDetail } from "@/components/decks/deck-detail";

export default function DeckDetailPage() {
  const params = useParams<{ deckId: string }>();

  const deckId = Array.isArray(params.deckId)
    ? params.deckId[0]
    : params.deckId;

  return <DeckDetail deckId={deckId} />;
}