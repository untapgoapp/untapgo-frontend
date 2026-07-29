"use client";

import { useParams } from "next/navigation";

import { DeckDetail } from "@/components/decks/deck-detail";

export default function DeckDetailPage() {
  const params = useParams<{ deckId: string }>();
  return <DeckDetail deckId={params.deckId} />;
}
