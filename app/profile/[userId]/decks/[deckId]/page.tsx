"use client";

import { useParams } from "next/navigation";

import { DeckDetail } from "@/components/decks/deck-detail";

export default function PublicDeckDetailPage() {
  const params = useParams<{ userId: string; deckId: string }>();
  return <DeckDetail ownerId={params.userId} deckId={params.deckId} />;
}
