import { api } from "@/lib/api";

export type Deck = {
  id: string;
  commander_name?: string | null;
  commanderName?: string | null;

  deck_url?: string | null;
  deckUrl?: string | null;

  image_url?: string | null;
  imageUrl?: string | null;

  format_slug?: string | null;
  formatSlug?: string | null;

  export_text?: string | null;
  exportText?: string | null;

  color_white?: boolean | string | number | null;
  color_blue?: boolean | string | number | null;
  color_black?: boolean | string | number | null;
  color_red?: boolean | string | number | null;
  color_green?: boolean | string | number | null;
  color_colorless?: boolean | string | number | null;

  created_at?: string | null;
};

export type DeckPayload = {
  commander_name: string;
  deck_url: string | null;
  image_url: string | null;
  format_slug: string | null;
  export_text: string | null;

  color_white: boolean;
  color_blue: boolean;
  color_black: boolean;
  color_red: boolean;
  color_green: boolean;
  color_colorless: boolean;
};

export async function getMyDecks(formatSlug?: string): Promise<Deck[]> {
  const query =
    formatSlug && formatSlug.trim()
      ? `?format_slug=${encodeURIComponent(formatSlug.trim())}`
      : "";

  const result = await api.get<Deck[] | { decks?: Deck[] }>(
    `/me/decks${query}`
  );

  if (Array.isArray(result)) return result;

  return result.decks || [];
}

export async function createDeck(payload: DeckPayload): Promise<Deck> {
  return api.post<Deck>("/me/decks", payload);
}

export async function updateDeck(
  deckId: string,
  payload: DeckPayload
): Promise<Deck> {
  return api.patch<Deck>(`/me/decks/${deckId}`, payload);
}

export async function deleteDeck(deckId: string): Promise<{ ok?: boolean }> {
  return api.delete<{ ok?: boolean }>(`/me/decks/${deckId}`);
}

export function boolish(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}

export function getDeckCommanderName(deck: Deck) {
  return deck.commander_name || deck.commanderName || "Unnamed deck";
}

export function getDeckUrl(deck: Deck) {
  return deck.deck_url || deck.deckUrl || "";
}

export function getDeckImageUrl(deck: Deck) {
  return deck.image_url || deck.imageUrl || "";
}

export function getDeckFormatSlug(deck: Deck) {
  return deck.format_slug || deck.formatSlug || "";
}

export function getDeckExportText(deck: Deck) {
  return deck.export_text || deck.exportText || "";
}