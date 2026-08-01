import { api } from "@/lib/api";
import { buildCommunityDecksPath } from "@/lib/deck-routes";
import type {
  CommunityDeckPage,
  Deck,
  DeckCardsResponse,
  DeckDiscoveryFilters,
} from "@/types/decks";

export const deckDiscoveryApi = {
  community: (filters: DeckDiscoveryFilters, page: number) =>
    api.get<CommunityDeckPage>(buildCommunityDecksPath(filters, page)),
  saved: (page: number) =>
    api.get<CommunityDeckPage>(`/decks/saved?page=${page}&page_size=20`),
  save: (deckId: string) =>
    api.post<{ ok: boolean; is_saved: true }>(`/decks/${encodeURIComponent(deckId)}/save`),
  unsave: (deckId: string) =>
    api.delete<{ ok: boolean; is_saved: false }>(`/decks/${encodeURIComponent(deckId)}/save`),
  publicDeck: (ownerId: string, deckId: string) =>
    api.get<Deck>(`/profiles/${encodeURIComponent(ownerId)}/decks/${encodeURIComponent(deckId)}`),
  publicDeckCards: (ownerId: string, deckId: string) =>
    api.get<DeckCardsResponse>(`/profiles/${encodeURIComponent(ownerId)}/decks/${encodeURIComponent(deckId)}/cards`),
};
