export const DECKS_BASE_PATH = "/profile/decks";

export type DecksView = "community" | "mine" | "saved";
export const DECKS_VIEWS: readonly DecksView[] = ["community", "mine", "saved"];

export function normalizeDecksView(value: string | string[] | null | undefined): DecksView {
  const candidate = Array.isArray(value) ? value[0] : value;
  return DECKS_VIEWS.includes(candidate as DecksView) ? candidate as DecksView : "community";
}

export function deckSectionHref(view: DecksView): string {
  return `/decks?view=${view}`;
}

export function buildCommunityDecksPath(filters: {
  q: string;
  format: string;
  colors: string[];
  sort: string;
}, page: number, pageSize = 20): string {
  const parameters = new URLSearchParams({
    sort: filters.sort,
    page: String(page),
    page_size: String(pageSize),
  });
  if (filters.q.trim()) parameters.set("q", filters.q.trim());
  if (filters.format.trim()) parameters.set("format", filters.format.trim().toLowerCase());
  if (filters.colors.length) parameters.set("colors", filters.colors.join(","));
  return `/decks/community?${parameters.toString()}`;
}

export const deckRoutes = {
  list: DECKS_BASE_PATH,
  create: `${DECKS_BASE_PATH}/new`,
  detail: (deckId: string) => `${DECKS_BASE_PATH}/${deckId}`,
  edit: (deckId: string) => `${DECKS_BASE_PATH}/${deckId}/edit`,
  publicDetail: (ownerId: string, deckId: string) => `/profile/${encodeURIComponent(ownerId)}/decks/${encodeURIComponent(deckId)}`,
};
