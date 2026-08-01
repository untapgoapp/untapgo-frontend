export const DECKS_BASE_PATH = "/profile/decks";

export type DecksView = "community" | "mine" | "saved";
export const DECKS_VIEWS: readonly DecksView[] = ["community", "mine", "saved"];

export function normalizeDecksView(value: string | string[] | null | undefined): DecksView {
  const candidate = Array.isArray(value) ? value[0] : value;
  return DECKS_VIEWS.includes(candidate as DecksView) ? candidate as DecksView : "mine";
}

export function deckSectionHref(view: DecksView): string {
  return `/decks?view=${view}`;
}

export const deckRoutes = {
  list: DECKS_BASE_PATH,
  create: `${DECKS_BASE_PATH}/new`,
  detail: (deckId: string) => `${DECKS_BASE_PATH}/${deckId}`,
  edit: (deckId: string) => `${DECKS_BASE_PATH}/${deckId}/edit`,
};
