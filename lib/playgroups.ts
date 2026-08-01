export const PLAYGROUP_PAGE_SIZE = 20;

export type PlaygroupJoinPolicy = "open" | "approval";
export type PlaygroupStatus = "active" | "archived";
export type PlaygroupMembershipState = "none" | "pending" | "joined" | "owner";
export type MyPlaygroupState = "joined" | "pending" | "owned";
export type PlaygroupsView = "discover" | "mine" | "pending";

export type PlaygroupListItem = {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  country_code?: string | null;
  join_policy: PlaygroupJoinPolicy;
  membership_state: PlaygroupMembershipState;
};

export type PlaygroupOwner = {
  id: string;
  nickname: string;
  avatar_url?: string | null;
};

export type PlaygroupDetail = Omit<PlaygroupListItem, "membership_state"> & {
  status: PlaygroupStatus;
  owner: PlaygroupOwner;
  membership_state: PlaygroupMembershipState;
};

export type PlaygroupMember = {
  id: string;
  nickname: string;
  avatar_url?: string | null;
  bio?: string | null;
  mtg_arena_username?: string | null;
  role: "owner" | "member";
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  page_size: number;
  has_more: boolean;
};

export type PlaygroupPage = PaginatedResponse<PlaygroupListItem>;
export type PlaygroupMemberPage = PaginatedResponse<PlaygroupMember>;

export type PlaygroupPayload = {
  name: string;
  description: string | null;
  avatar_url: string | null;
  city: string | null;
  country_code: string | null;
  join_policy: PlaygroupJoinPolicy;
};

export type PlaygroupMembershipResponse = {
  ok?: boolean;
  membership_state: PlaygroupMembershipState;
};

export function normalizePlaygroupsView(value: string | string[] | undefined): PlaygroupsView {
  return value === "mine" || value === "pending" ? value : "discover";
}

function pageParameters(page: number): URLSearchParams {
  return new URLSearchParams({
    page: String(page),
    page_size: String(PLAYGROUP_PAGE_SIZE),
  });
}

export function buildDiscoverPlaygroupsPath(query: string, city: string, page: number): string {
  const parameters = pageParameters(page);
  const cleanQuery = query.trim();
  const cleanCity = city.trim();
  if (cleanQuery) parameters.set("q", cleanQuery);
  if (cleanCity) parameters.set("city", cleanCity);
  return `/playgroups?${parameters.toString()}`;
}

export function buildMyPlaygroupsPath(state: MyPlaygroupState, page: number): string {
  const parameters = pageParameters(page);
  parameters.set("state", state);
  return `/playgroups/mine?${parameters.toString()}`;
}

export function buildPlaygroupResourcePath(playgroupId: string, suffix = ""): string {
  return `/playgroups/${encodeURIComponent(playgroupId)}${suffix}`;
}

export function buildPlaygroupPeoplePath(
  playgroupId: string,
  kind: "members" | "requests",
  page: number,
): string {
  return `${buildPlaygroupResourcePath(playgroupId, `/${kind}`)}?${pageParameters(page)}`;
}

export function buildPlaygroupRequestActionPath(
  playgroupId: string,
  userId: string,
  action: "approve" | "reject",
): string {
  return buildPlaygroupResourcePath(
    playgroupId,
    `/requests/${encodeURIComponent(userId)}/${action}`,
  );
}

export type PaginatedStatus = "debouncing" | "loading" | "loading_more" | "ready" | "error";

export type PaginatedState<T> = {
  scope: string;
  items: T[];
  page: number;
  hasMore: boolean;
  status: PaginatedStatus;
  activeRequestId: number;
  failedPage: number | null;
};

export type PaginatedAction<T> =
  | { type: "scope_changed"; scope: string; requestId: number }
  | { type: "request_started"; scope: string; page: number; requestId: number }
  | { type: "request_succeeded"; requestId: number; response: PaginatedResponse<T> }
  | { type: "request_failed"; requestId: number; page: number }
  | { type: "item_removed"; id: string };

export function createPaginatedState<T>(scope: string): PaginatedState<T> {
  return {
    scope,
    items: [],
    page: 0,
    hasMore: false,
    status: "loading",
    activeRequestId: 0,
    failedPage: null,
  };
}

export function mergeUniqueItems<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const seen = new Set<string>();
  return [...current, ...incoming].filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function paginatedReducer<T extends { id: string }>(
  state: PaginatedState<T>,
  action: PaginatedAction<T>,
): PaginatedState<T> {
  if (action.type === "scope_changed") {
    return {
      ...createPaginatedState<T>(action.scope),
      status: "debouncing",
      activeRequestId: action.requestId,
    };
  }
  if (action.type === "request_started") {
    const reset = action.page === 1 || action.scope !== state.scope;
    return {
      ...state,
      scope: action.scope,
      items: reset ? [] : state.items,
      page: reset ? 0 : state.page,
      hasMore: reset ? false : state.hasMore,
      status: action.page === 1 ? "loading" : "loading_more",
      activeRequestId: action.requestId,
      failedPage: null,
    };
  }
  if (action.type === "item_removed") {
    return { ...state, items: state.items.filter((item) => item.id !== action.id) };
  }
  if (action.requestId !== state.activeRequestId) return state;
  if (action.type === "request_failed") {
    return { ...state, status: "error", failedPage: action.page };
  }
  const base = action.response.page > 1 ? state.items : [];
  return {
    ...state,
    items: mergeUniqueItems(base, action.response.items),
    page: action.response.page,
    hasMore: action.response.has_more,
    status: "ready",
    failedPage: null,
  };
}

export type PlaygroupFormValues = {
  name: string;
  description: string;
  avatarUrl: string;
  city: string;
  countryCode: string;
  joinPolicy: PlaygroupJoinPolicy;
};

export type PlaygroupFieldErrors = Partial<Record<keyof PlaygroupFormValues, string>>;

export function getPlaygroupFormValues(group?: PlaygroupDetail | null): PlaygroupFormValues {
  return {
    name: group?.name ?? "",
    description: group?.description ?? "",
    avatarUrl: group?.avatar_url ?? "",
    city: group?.city ?? "",
    countryCode: group?.country_code ?? "",
    joinPolicy: group?.join_policy ?? "open",
  };
}

export function normalizePlaygroupPayload(values: PlaygroupFormValues):
  | { ok: true; payload: PlaygroupPayload }
  | { ok: false; errors: PlaygroupFieldErrors } {
  const name = values.name.trim();
  const description = values.description.trim();
  const avatarUrl = values.avatarUrl.trim();
  const city = values.city.trim();
  const countryCode = values.countryCode.trim().toUpperCase();
  const errors: PlaygroupFieldErrors = {};

  if (name.length < 3) errors.name = "Use at least 3 characters.";
  else if (name.length > 80) errors.name = "Keep the name under 80 characters.";
  if (description.length > 600) errors.description = "Keep the description under 600 characters.";
  if (avatarUrl.length > 2048) errors.avatarUrl = "The avatar URL is too long.";
  if (city.length > 100) errors.city = "Keep the city under 100 characters.";
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) {
    errors.countryCode = "Use a two-letter country code, such as EE.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    payload: {
      name,
      description: description || null,
      avatar_url: avatarUrl || null,
      city: city || null,
      country_code: countryCode || null,
      join_policy: values.joinPolicy,
    },
  };
}

export type MembershipAction = "join" | "request" | "cancel" | "leave" | null;

export function getPlaygroupMembershipAction(group: PlaygroupDetail): MembershipAction {
  if (group.status === "archived" || group.membership_state === "owner") return null;
  if (group.membership_state === "pending") return "cancel";
  if (group.membership_state === "joined") return "leave";
  return group.join_policy === "open" ? "join" : "request";
}

export function applyPlaygroupMembershipResponse(
  group: PlaygroupDetail,
  response: PlaygroupMembershipResponse,
): PlaygroupDetail {
  return { ...group, membership_state: response.membership_state };
}

export function applyPlaygroupDetailResponse(
  current: PlaygroupDetail,
  response: PlaygroupDetail,
): PlaygroupDetail {
  return current.id === response.id ? response : current;
}

export function canStartPlaygroupSubmission(submitting: boolean): boolean {
  return !submitting;
}

export type ArchiveConfirmationState = "idle" | "confirming" | "submitting";
export type ArchiveConfirmationAction = "request" | "cancel" | "submit" | "succeeded" | "failed";

export function archiveConfirmationReducer(
  state: ArchiveConfirmationState,
  action: ArchiveConfirmationAction,
): ArchiveConfirmationState {
  if (action === "request" && state === "idle") return "confirming";
  if (action === "cancel" || action === "succeeded") return "idle";
  if (action === "submit" && state === "confirming") return "submitting";
  if (action === "failed" && state === "submitting") return "confirming";
  return state;
}

export function shouldShowPlaygroupRequests(group: PlaygroupDetail): boolean {
  return group.membership_state === "owner" && group.status === "active";
}
