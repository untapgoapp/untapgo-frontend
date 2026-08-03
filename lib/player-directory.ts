import type { ProfileRelationship } from "./profile-follow";

export const PLAYER_DIRECTORY_PAGE_SIZE = 20;

export type PlayersView = "discover" | "connections" | "followers" | "following";
export const PLAYERS_VIEWS: readonly PlayersView[] = ["discover", "connections", "followers", "following"];

export type PlayerDirectoryItem = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
  mtg_arena_username: string | null;
  location: {
    city: string;
    region: string | null;
    country: string;
    country_code: string | null;
    display_name: string;
  } | null;
  relationship: ProfileRelationship;
};

export type PlayerDirectoryResponse = {
  items: PlayerDirectoryItem[];
  page: number;
  page_size: number;
  has_more: boolean;
};

export type PlayerDirectoryStatus = "debouncing" | "loading" | "loading_more" | "ready" | "error";

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
  | { type: "request_failed"; requestId: number; page: number }
  | { type: "player_changed"; playerId: string; relationship: ProfileRelationship; remove: boolean }
  | { type: "player_removed"; playerId: string }
  | { type: "player_restored"; player: PlayerDirectoryItem; index: number };

export const initialPlayerDirectoryState: PlayerDirectoryState = {
  query: "", items: [], page: 0, hasMore: false, status: "loading",
  activeRequestId: 0, failedPage: null,
};

export function normalizePlayersView(value: string | string[] | null | undefined): PlayersView {
  const candidate = Array.isArray(value) ? value[0] : value;
  return PLAYERS_VIEWS.includes(candidate as PlayersView) ? candidate as PlayersView : "discover";
}

export function buildPlayerDirectoryPath({ query, page, pageSize = PLAYER_DIRECTORY_PAGE_SIZE }: {
  query: string; page: number; pageSize?: number;
}): string {
  const parameters = new URLSearchParams();
  if (query.trim()) parameters.set("q", query.trim());
  parameters.set("page", String(page));
  parameters.set("page_size", String(pageSize));
  return `/profiles?${parameters.toString()}`;
}

export function buildPlayersSectionPath({ view, currentUserId, query, page, pageSize = PLAYER_DIRECTORY_PAGE_SIZE }: {
  view: PlayersView; currentUserId: string; query: string; page: number; pageSize?: number;
}): string {
  const parameters = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (query.trim()) parameters.set("q", query.trim());
  if (view === "discover") return `/profiles?${parameters.toString()}`;
  if (view === "connections") return `/profiles/connections?${parameters.toString()}`;
  return `/profiles/${encodeURIComponent(currentUserId)}/${view}?${parameters.toString()}`;
}

export function mergeUniquePlayers(current: PlayerDirectoryItem[], incoming: PlayerDirectoryItem[]) {
  const result = new Map(current.map((player) => [player.id, player]));
  for (const player of incoming) if (player.id) result.set(player.id, player);
  return [...result.values()];
}

export function playerDirectoryReducer(state: PlayerDirectoryState, action: PlayerDirectoryAction): PlayerDirectoryState {
  if (action.type === "player_removed") {
    return {
      ...state,
      items: state.items.filter((player) => player.id !== action.playerId),
    };
  }
  if (action.type === "player_changed") {
    return {
      ...state,
      items: action.remove
        ? state.items.filter((player) => player.id !== action.playerId)
        : state.items.map((player) => player.id === action.playerId ? { ...player, relationship: action.relationship } : player),
    };
  }
  if (action.type === "player_restored") {
    const items = state.items.filter((player) => player.id !== action.player.id);
    items.splice(Math.min(Math.max(action.index, 0), items.length), 0, action.player);
    return { ...state, items };
  }
  if (action.type === "query_changed") {
    return { ...initialPlayerDirectoryState, query: action.query.trim(), status: "debouncing", activeRequestId: action.requestId };
  }
  if (action.type === "request_started") {
    return {
      ...state, query: action.query.trim(), items: action.page === 1 ? [] : state.items,
      page: action.page === 1 ? 0 : state.page, hasMore: action.page === 1 ? false : state.hasMore,
      status: action.page === 1 ? "loading" : "loading_more", activeRequestId: action.requestId, failedPage: null,
    };
  }
  if (action.requestId !== state.activeRequestId) return state;
  if (action.type === "request_failed") return { ...state, status: "error", failedPage: action.page };
  return {
    ...state,
    items: mergeUniquePlayers(action.response.page > 1 ? state.items : [], action.response.items),
    page: action.response.page, hasMore: action.response.has_more, status: "ready", failedPage: null,
  };
}

export function shouldRemovePlayerAfterRelationship(view: PlayersView, relationship: ProfileRelationship): boolean {
  return (view === "connections" && !relationship.is_mutual)
    || (view === "following" && !relationship.is_following);
}

export function getPlayerDirectoryEmptyCopy(view: PlayersView, query: string): { title: string; detail: string } {
  if (query.trim()) return { title: "No players found", detail: "Try another nickname." };
  if (view === "connections") return { title: "No connections yet.", detail: "Follow players and connect when they follow you back." };
  if (view === "followers") return { title: "No followers yet.", detail: "Players who follow you will appear here." };
  if (view === "following") return { title: "You are not following anyone yet.", detail: "Discover players and follow their UntapGo activity." };
  return { title: "No players yet", detail: "The player directory is currently empty." };
}

export function getPlayerProfileHref(userId: string): string {
  return `/profile/${encodeURIComponent(userId)}`;
}
