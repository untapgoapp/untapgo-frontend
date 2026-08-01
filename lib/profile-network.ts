import type {
  PlayerDirectoryItem,
  PlayerDirectoryResponse,
} from "./player-directory";

export const PROFILE_NETWORK_PAGE_SIZE = 20;

export type ProfileNetworkTab = "followers" | "following";

export type ProfileNetworkStatus =
  | "loading"
  | "loading_more"
  | "ready"
  | "error";

export type ProfileNetworkState = {
  profileId: string;
  tab: ProfileNetworkTab;
  items: PlayerDirectoryItem[];
  page: number;
  hasMore: boolean;
  status: ProfileNetworkStatus;
  activeRequestId: number;
  failedPage: number | null;
};

export type ProfileNetworkAction =
  | {
      type: "request_started";
      profileId: string;
      tab: ProfileNetworkTab;
      page: number;
      requestId: number;
    }
  | {
      type: "request_succeeded";
      requestId: number;
      response: PlayerDirectoryResponse;
    }
  | {
      type: "request_failed";
      requestId: number;
      page: number;
    };

export function normalizeProfileNetworkTab(
  value: string | string[] | undefined,
): ProfileNetworkTab {
  return value === "following" ? "following" : "followers";
}

export function createProfileNetworkState(
  profileId: string,
  tab: ProfileNetworkTab,
): ProfileNetworkState {
  return {
    profileId,
    tab,
    items: [],
    page: 0,
    hasMore: false,
    status: "loading",
    activeRequestId: 0,
    failedPage: null,
  };
}

export function buildProfileNetworkPath({
  profileId,
  tab,
  page,
  pageSize = PROFILE_NETWORK_PAGE_SIZE,
}: {
  profileId: string;
  tab: ProfileNetworkTab;
  page: number;
  pageSize?: number;
}): string {
  const parameters = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  return (
    `/profiles/${encodeURIComponent(profileId)}/${tab}` +
    `?${parameters.toString()}`
  );
}

export function getProfileNetworkHref(
  profileId: string,
  tab: ProfileNetworkTab,
): string {
  return (
    `/profile/${encodeURIComponent(profileId)}/network` +
    `?tab=${tab}`
  );
}

export function getProfileNetworkEmptyText(
  tab: ProfileNetworkTab,
): string {
  return tab === "following"
    ? "Not following anyone yet."
    : "No followers to show yet.";
}

export function profileNetworkReducer(
  state: ProfileNetworkState,
  action: ProfileNetworkAction,
): ProfileNetworkState {
  if (action.type === "request_started") {
    const resetsList =
      action.page === 1 ||
      action.profileId !== state.profileId ||
      action.tab !== state.tab;

    return {
      ...state,
      profileId: action.profileId,
      tab: action.tab,
      items: resetsList ? [] : state.items,
      page: resetsList ? 0 : state.page,
      hasMore: resetsList ? false : state.hasMore,
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
  const seen = new Set<string>();
  const items = [...baseItems, ...action.response.items].filter(
    (player) => {
      if (!player.id || seen.has(player.id)) return false;
      seen.add(player.id);
      return true;
    },
  );

  return {
    ...state,
    items,
    page: action.response.page,
    hasMore: action.response.has_more,
    status: "ready",
    failedPage: null,
  };
}
