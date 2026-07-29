export const DECKS_BASE_PATH = "/profile/decks";

export const deckRoutes = {
  list: DECKS_BASE_PATH,
  create: `${DECKS_BASE_PATH}/new`,
  detail: (deckId: string) => `${DECKS_BASE_PATH}/${deckId}`,
  edit: (deckId: string) => `${DECKS_BASE_PATH}/${deckId}/edit`,
};
