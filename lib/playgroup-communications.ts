export const PLAYGROUP_POST_MAX_LENGTH = 4000;
export const PLAYGROUP_COMMENT_MAX_LENGTH = 2000;
export const PLAYGROUP_CHAT_MAX_LENGTH = 2000;
export const PLAYGROUP_WALL_PAGE_SIZE = 20;
export const PLAYGROUP_COMMENT_PAGE_SIZE = 20;
export const PLAYGROUP_CHAT_PAGE_SIZE = 50;
export const PLAYGROUP_REMOVED_POST_BODY = "Post removed";
export const PLAYGROUP_REMOVED_COMMENT_BODY = "Comment removed";
export const PLAYGROUP_REMOVED_MESSAGE_BODY = "Message removed";

export type PlaygroupSection = "overview" | "wall" | "chat" | "members";
export type CommunicationMembershipState = "none" | "pending" | "joined" | "owner";

export type PlaygroupContentAuthor = {
  id: string;
  nickname: string;
  avatar_url?: string | null;
};

export type PlaygroupPost = {
  id: string;
  playgroup_id: string;
  author: PlaygroupContentAuthor;
  body: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  reaction_count: number;
  comment_count: number;
  viewer_has_liked: boolean;
};

export type PlaygroupPostPage = {
  items: PlaygroupPost[];
  page: number;
  page_size: number;
  has_more: boolean;
};

export type PlaygroupComment = {
  id: string;
  post_id: string;
  author: PlaygroupContentAuthor;
  body: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
};

export type PlaygroupCommentPage = {
  items: PlaygroupComment[];
  page: number;
  page_size: number;
  has_more: boolean;
};

export type PlaygroupReactionState = { liked: boolean };

export type PlaygroupChatMessage = {
  id: string;
  playgroup_id: string;
  sender: PlaygroupContentAuthor;
  body: string;
  created_at: string;
};

export type PlaygroupChatMessagePage = {
  items: PlaygroupChatMessage[];
  has_more: boolean;
  next_before?: string | null;
};

export type PlaygroupChatState = {
  unread_count: number;
  last_read_message_id?: string | null;
};

export type PlaygroupChatReadState = {
  last_read_message_id: string;
  last_read_at: string;
};

export function normalizePlaygroupSection(value: unknown): PlaygroupSection {
  return value === "wall" || value === "chat" || value === "members"
    ? value
    : "overview";
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function normalizeDeepLinkedPostId(value: unknown): string | null {
  return isUuid(value) ? value : null;
}

export function canAccessPlaygroupCommunications(
  membershipState: CommunicationMembershipState,
  authenticated: boolean,
): boolean {
  return authenticated && (membershipState === "owner" || membershipState === "joined");
}

export function canMutatePlaygroupCommunications(
  membershipState: CommunicationMembershipState,
  status: "active" | "archived",
  authenticated: boolean,
): boolean {
  return status === "active" && canAccessPlaygroupCommunications(membershipState, authenticated);
}

export function canEditCommunication(authorId: string, viewerId: string | null, writable: boolean): boolean {
  return writable && Boolean(viewerId) && authorId === viewerId;
}

export function canDeleteCommunication(
  authorId: string,
  viewerId: string | null,
  membershipState: CommunicationMembershipState,
  writable: boolean,
): boolean {
  return writable && Boolean(viewerId) && (authorId === viewerId || membershipState === "owner");
}

export function canPinPlaygroupPost(membershipState: CommunicationMembershipState, writable: boolean): boolean {
  return writable && membershipState === "owner";
}

export type CommunicationContractChange = "access_lost" | "archived" | null;

export function getCommunicationContractChange(error: unknown): CommunicationContractChange {
  if (!error || typeof error !== "object") return null;
  const code = (error as { code?: unknown }).code;
  if (code === "PLAYGROUP_MEMBER_REQUIRED") return "access_lost";
  if (code === "PLAYGROUP_ARCHIVED") return "archived";
  return null;
}

export function normalizeCommunicationBody(value: string, maximum: number): string | null {
  const body = value.trim();
  return body && body.length <= maximum ? body : null;
}

export function canStartCommunicationSubmission(value: string, maximum: number, submitting: boolean): boolean {
  return !submitting && normalizeCommunicationBody(value, maximum) !== null;
}

export function shouldShowRemainingCharacters(valueLength: number, maximum: number): boolean {
  return maximum - valueLength <= Math.min(240, Math.ceil(maximum * 0.12));
}

function compareNewestFirst(first: { created_at: string; id: string }, second: { created_at: string; id: string }) {
  const time = Date.parse(second.created_at) - Date.parse(first.created_at);
  return time || second.id.localeCompare(first.id);
}

export function sortWallPosts(items: PlaygroupPost[]): PlaygroupPost[] {
  return [...items].sort((first, second) => {
    if (first.is_pinned !== second.is_pinned) return first.is_pinned ? -1 : 1;
    return compareNewestFirst(first, second);
  });
}

export function mergeWallPosts(current: PlaygroupPost[], incoming: PlaygroupPost[]): PlaygroupPost[] {
  const byId = new Map(current.map((post) => [post.id, post]));
  for (const post of incoming) {
    if (post.id) byId.set(post.id, post);
  }
  return sortWallPosts([...byId.values()]);
}

export type WallFeedStatus = "disabled" | "loading" | "loading_more" | "ready" | "error";
export type WallFeedState = {
  scope: string;
  items: PlaygroupPost[];
  page: number;
  hasMore: boolean;
  status: WallFeedStatus;
  requestId: number;
  failedPage: number | null;
};

export type WallFeedAction =
  | { type: "reset"; scope: string; enabled: boolean; requestId: number }
  | { type: "request_started"; scope: string; page: number; requestId: number }
  | { type: "request_succeeded"; requestId: number; response: PlaygroupPostPage }
  | { type: "request_failed"; requestId: number; page: number }
  | { type: "post_upserted"; post: PlaygroupPost }
  | { type: "post_changed"; id: string; update: (post: PlaygroupPost) => PlaygroupPost };

export function createWallFeedState(scope: string, enabled = true): WallFeedState {
  return {
    scope,
    items: [],
    page: 0,
    hasMore: false,
    status: enabled ? "loading" : "disabled",
    requestId: 0,
    failedPage: null,
  };
}

export function wallFeedReducer(state: WallFeedState, action: WallFeedAction): WallFeedState {
  if (action.type === "reset") {
    return { ...createWallFeedState(action.scope, action.enabled), requestId: action.requestId };
  }
  if (action.type === "post_upserted") {
    return { ...state, items: mergeWallPosts(state.items, [action.post]) };
  }
  if (action.type === "post_changed") {
    return {
      ...state,
      items: sortWallPosts(state.items.map((post) => post.id === action.id ? action.update(post) : post)),
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
      requestId: action.requestId,
      failedPage: null,
    };
  }
  if (action.requestId !== state.requestId) return state;
  if (action.type === "request_failed") {
    return { ...state, status: "error", failedPage: action.page };
  }
  return {
    ...state,
    items: mergeWallPosts(action.response.page > 1 ? state.items : [], action.response.items),
    page: action.response.page,
    hasMore: action.response.has_more,
    status: "ready",
    failedPage: null,
  };
}

export type LikeSnapshot = { liked: boolean; count: number };

export function optimisticallyToggleLike(post: PlaygroupPost): { post: PlaygroupPost; snapshot: LikeSnapshot } {
  const snapshot = { liked: post.viewer_has_liked, count: post.reaction_count };
  const liked = !snapshot.liked;
  return {
    snapshot,
    post: { ...post, viewer_has_liked: liked, reaction_count: Math.max(0, snapshot.count + (liked ? 1 : -1)) },
  };
}

export function applyCanonicalLike(post: PlaygroupPost, snapshot: LikeSnapshot, liked: boolean): PlaygroupPost {
  return {
    ...post,
    viewer_has_liked: liked,
    reaction_count: Math.max(0, snapshot.count + (liked ? 1 : 0) - (snapshot.liked ? 1 : 0)),
  };
}

export function rollbackLike(post: PlaygroupPost, snapshot: LikeSnapshot): PlaygroupPost {
  return { ...post, viewer_has_liked: snapshot.liked, reaction_count: snapshot.count };
}

export type DeepLinkLookupState = "idle" | "found" | "load_more" | "unavailable";

export function getDeepLinkLookupState(
  targetPostId: string | null,
  items: Pick<PlaygroupPost, "id">[],
  hasMore: boolean,
  page: number,
  maximumPages = 10,
): DeepLinkLookupState {
  if (!targetPostId) return "idle";
  if (items.some((post) => post.id === targetPostId)) return "found";
  return hasMore && page < maximumPages ? "load_more" : "unavailable";
}

export function deletedPost(post: PlaygroupPost): PlaygroupPost {
  return {
    ...post,
    body: PLAYGROUP_REMOVED_POST_BODY,
    is_deleted: true,
    is_pinned: false,
    reaction_count: 0,
    comment_count: 0,
    viewer_has_liked: false,
  };
}

export function mergeComments(current: PlaygroupComment[], incoming: PlaygroupComment[]): PlaygroupComment[] {
  const byId = new Map(current.map((comment) => [comment.id, comment]));
  for (const comment of incoming) {
    if (comment.id) byId.set(comment.id, comment);
  }
  return [...byId.values()].sort((first, second) => {
    const time = Date.parse(first.created_at) - Date.parse(second.created_at);
    return time || first.id.localeCompare(second.id);
  });
}

export function deletedComment(comment: PlaygroupComment): PlaygroupComment {
  return { ...comment, body: PLAYGROUP_REMOVED_COMMENT_BODY, is_deleted: true };
}

export function playgroupChatTopic(playgroupId: string): string | null {
  return isUuid(playgroupId) ? `playgroup:${playgroupId}:chat` : null;
}

export function isPlaygroupChatMessage(value: unknown, playgroupId?: string): value is PlaygroupChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  const sender = message.sender as Record<string, unknown> | null;
  return isUuid(message.id)
    && isUuid(message.playgroup_id)
    && (!playgroupId || message.playgroup_id === playgroupId)
    && typeof message.body === "string"
    && typeof message.created_at === "string"
    && Boolean(sender)
    && isUuid(sender?.id)
    && typeof sender?.nickname === "string"
    && (sender.avatar_url === undefined || sender.avatar_url === null || typeof sender.avatar_url === "string");
}

export function isDeletedChatMessage(message: PlaygroupChatMessage): boolean {
  return message.body === PLAYGROUP_REMOVED_MESSAGE_BODY;
}

export function deletedChatMessage(message: PlaygroupChatMessage): PlaygroupChatMessage {
  return { ...message, body: PLAYGROUP_REMOVED_MESSAGE_BODY };
}

export function mergeChatMessages(
  current: PlaygroupChatMessage[],
  incoming: PlaygroupChatMessage[],
): PlaygroupChatMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    if (!message.id) continue;
    const existing = byId.get(message.id);
    byId.set(message.id, existing && isDeletedChatMessage(existing) && !isDeletedChatMessage(message)
      ? existing
      : message);
  }
  return [...byId.values()].sort((first, second) => {
    const time = Date.parse(first.created_at) - Date.parse(second.created_at);
    return time || first.id.localeCompare(second.id);
  });
}

export function shouldGroupChatMessage(
  previous: PlaygroupChatMessage | null,
  current: PlaygroupChatMessage,
): boolean {
  if (!previous || previous.sender.id !== current.sender.id) return false;
  const distance = Date.parse(current.created_at) - Date.parse(previous.created_at);
  return distance >= 0 && distance <= 5 * 60 * 1000;
}

export function isNearChatBottom(scrollHeight: number, scrollTop: number, clientHeight: number, threshold = 96): boolean {
  return scrollHeight - scrollTop - clientHeight <= threshold;
}

export function shouldSubmitChatKey(key: string, shiftKey: boolean, composing: boolean): boolean {
  return key === "Enter" && !shiftKey && !composing;
}

export function shouldMarkChatRead({
  active,
  newestVisible,
  latestMessageId,
  lastMarkedMessageId,
}: {
  active: boolean;
  newestVisible: boolean;
  latestMessageId: string | null;
  lastMarkedMessageId: string | null;
}): boolean {
  return active && newestVisible && Boolean(latestMessageId) && latestMessageId !== lastMarkedMessageId;
}
