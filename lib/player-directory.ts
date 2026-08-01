export const PLAYER_DIRECTORY_PAGE_SIZE = 20;

export type PlayerDirectoryItem = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
  mtg_arena_username: string | null;
};

export type PlayerDirectoryResponse = {
  items: PlayerDirectoryItem[];
  page: number;
  page_size: number;
  has_more: boolean;
};

export type PlayerDirectoryStatus =
  | "debouncing"
  | "loading"
  | "loading_more"
  | "ready"
  | "error";

export type PlayerDirectoryState = {
  query: string;
  items: PlayerDirectoryItem[];
  page: number;
  hasMore: boolean;
  status: PlayerDirectoryStatus;
  activeRequestId: number;
  failedPage: number | null;
};

export type PlayerDirectoryAction =
  | { type: "query_changed"; query: string; requestId: number }
  | { type: "request_started"; query: string; page: number; requestId: number }
  | { type: "request_succeeded"; requestId: number; response: PlayerDirectoryResponse }
  | { type: "request_failed"; requestId: number; page: number };

export const initialPlayerDirectoryState: PlayerDirectoryState = {
  query: "",
  items: [],
  page: 0,
  hasMore: false,
  status: "loading",
  activeRequestId: 0,
  failedPage: null,
};

export function buildPlayerDirectoryPath({
  query,
  page,
  pageSize = PLAYER_DIRECTORY_PAGE_SIZE,
}: {
  query: string;
  page: number;
  pageSize?: number;
}): string {
  const parameters = new URLSearchParams();
  const cleanQuery = query.trim();

  if (cleanQuery) parameters.set("q", cleanQuery);
  parameters.set("page", String(page));
  parameters.set("page_size", String(pageSize));

  return `/profiles?${parameters.toString()}`;
}

export function mergeUniquePlayers(
  current: PlayerDirectoryItem[],
  incoming: PlayerDirectoryItem[],
): PlayerDirectoryItem[] {
  const seen = new Set<string>();

  return [...current, ...incoming].filter((player) => {
    if (!player.id || seen.has(player.id)) return false;
    seen.add(player.id);
    return true;
  });
}

export function playerDirectoryReducer(
  state: PlayerDirectoryState,
  action: PlayerDirectoryAction,
): PlayerDirectoryState {
  if (action.type === "query_changed") {
    return {
      ...initialPlayerDirectoryState,
      query: action.query.trim(),
      status: "debouncing",
      activeRequestId: action.requestId,
    };
  }

  if (action.type === "request_started") {
    return {
      ...state,
      query: action.query.trim(),
      items: action.page === 1 ? [] : state.items,
      page: action.page === 1 ? 0 : state.page,
      hasMore: action.page === 1 ? false : state.hasMore,
      status: action.page === 1 ? "loading" : "loading_more",
      activeRequestId: action.requestId,
      failedPage: null,
    };
  }

  if (action.requestId !== state.activeRequestId) return state;

  if (action.type === "request_failed") {
    return {
      ...state,
      status: "error",
      failedPage: action.page,
    };
  }

  const baseItems = action.response.page > 1 ? state.items : [];
  return {
    ...state,
    items: mergeUniquePlayers(baseItems, action.response.items),
    page: action.response.page,
    hasMore: action.response.has_more,
    status: "ready",
    failedPage: null,
  };
}

export function getPlayerDirectoryEmptyCopy(query: string): {
  title: string;
  detail: string;
} {
  return query.trim()
    ? { title: "No players found", detail: "Try another nickname." }
    : { title: "No players yet", detail: "The player directory is currently empty." };
}

export function getPlayerProfileHref(userId: string): string {
  return `/profile/${encodeURIComponent(userId)}`;
}
