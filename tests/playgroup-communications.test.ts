import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  applyCanonicalLike,
  canAccessPlaygroupCommunications,
  canDeleteCommunication,
  canEditCommunication,
  canMutatePlaygroupCommunications,
  canPinPlaygroupPost,
  canStartCommunicationSubmission,
  createWallFeedState,
  deletedChatMessage,
  getCommunicationContractChange,
  getDeepLinkLookupState,
  isDeletedChatMessage,
  isNearChatBottom,
  isPlaygroupChatMessage,
  mergeChatMessages,
  mergeComments,
  normalizeCommunicationBody,
  normalizeDeepLinkedPostId,
  normalizePlaygroupSection,
  optimisticallyToggleLike,
  PLAYGROUP_CHAT_MAX_LENGTH,
  PLAYGROUP_POST_MAX_LENGTH,
  playgroupChatTopic,
  rollbackLike,
  shouldGroupChatMessage,
  shouldMarkChatRead,
  shouldSubmitChatKey,
  wallFeedReducer,
  type PlaygroupChatMessage,
  type PlaygroupComment,
  type PlaygroupPost,
} from "../lib/playgroup-communications.ts";

const GROUP_ID = "10000000-0000-4000-8000-000000000001";
const OWNER_ID = "20000000-0000-4000-8000-000000000001";
const MEMBER_ID = "30000000-0000-4000-8000-000000000001";

function post(id: string, values: Partial<PlaygroupPost> = {}): PlaygroupPost {
  return {
    id,
    playgroup_id: GROUP_ID,
    author: { id: MEMBER_ID, nickname: "Member", avatar_url: null },
    body: "Post body",
    is_pinned: false,
    created_at: "2026-08-01T10:00:00Z",
    updated_at: "2026-08-01T10:00:00Z",
    is_deleted: false,
    reaction_count: 0,
    comment_count: 0,
    viewer_has_liked: false,
    ...values,
  };
}

function comment(id: string, createdAt: string): PlaygroupComment {
  return {
    id,
    post_id: "40000000-0000-4000-8000-000000000001",
    author: { id: MEMBER_ID, nickname: "Member", avatar_url: null },
    body: id,
    created_at: createdAt,
    updated_at: createdAt,
    is_deleted: false,
  };
}

function message(id: string, createdAt: string, body = id): PlaygroupChatMessage {
  return {
    id,
    playgroup_id: GROUP_ID,
    sender: { id: MEMBER_ID, nickname: "Member", avatar_url: null },
    body,
    created_at: createdAt,
  };
}

test("owner and joined members get communication access; pending and none do not", () => {
  assert.equal(canAccessPlaygroupCommunications("owner", true), true);
  assert.equal(canAccessPlaygroupCommunications("joined", true), true);
  assert.equal(canAccessPlaygroupCommunications("pending", true), false);
  assert.equal(canAccessPlaygroupCommunications("none", true), false);
  assert.equal(canAccessPlaygroupCommunications("owner", false), false);
});

test("archived groups remain readable but all mutations are unavailable", () => {
  assert.equal(canAccessPlaygroupCommunications("joined", true), true);
  assert.equal(canMutatePlaygroupCommunications("joined", "archived", true), false);
  assert.equal(canPinPlaygroupPost("owner", false), false);
});

test("membership and archive contract errors revoke controls immediately", () => {
  assert.equal(getCommunicationContractChange({ code: "PLAYGROUP_MEMBER_REQUIRED" }), "access_lost");
  assert.equal(getCommunicationContractChange({ code: "PLAYGROUP_ARCHIVED" }), "archived");
  assert.equal(getCommunicationContractChange({ code: "SOMETHING_ELSE" }), null);
});

test("section and Wall deep-link values default safely", () => {
  assert.equal(normalizePlaygroupSection("chat"), "chat");
  assert.equal(normalizePlaygroupSection("invalid"), "overview");
  assert.equal(normalizeDeepLinkedPostId("not-a-uuid"), null);
  assert.equal(normalizeDeepLinkedPostId("40000000-0000-4000-8000-000000000001"), "40000000-0000-4000-8000-000000000001");
});

test("post creation trims input, respects the deployed maximum, and rejects repeated submission", () => {
  assert.equal(normalizeCommunicationBody("  hello Wall  ", PLAYGROUP_POST_MAX_LENGTH), "hello Wall");
  assert.equal(normalizeCommunicationBody("   ", PLAYGROUP_POST_MAX_LENGTH), null);
  assert.equal(canStartCommunicationSubmission("hello", PLAYGROUP_POST_MAX_LENGTH, false), true);
  assert.equal(canStartCommunicationSubmission("hello", PLAYGROUP_POST_MAX_LENGTH, true), false);
  assert.equal(normalizeCommunicationBody("x".repeat(PLAYGROUP_POST_MAX_LENGTH + 1), PLAYGROUP_POST_MAX_LENGTH), null);
});

test("Wall pagination appends, deduplicates, sorts pinned first, and ignores stale responses", () => {
  let state = createWallFeedState(`wall:${GROUP_ID}`);
  state = wallFeedReducer(state, { type: "request_started", scope: state.scope, page: 1, requestId: 1 });
  state = wallFeedReducer(state, {
    type: "request_succeeded",
    requestId: 1,
    response: { items: [post("regular")], page: 1, page_size: 20, has_more: true },
  });
  state = wallFeedReducer(state, { type: "request_started", scope: state.scope, page: 2, requestId: 2 });
  state = wallFeedReducer(state, {
    type: "request_succeeded",
    requestId: 2,
    response: { items: [post("regular"), post("pinned", { is_pinned: true })], page: 2, page_size: 20, has_more: false },
  });
  assert.deepEqual(state.items.map((item) => item.id), ["pinned", "regular"]);

  const newerRequest = wallFeedReducer(state, { type: "request_started", scope: state.scope, page: 1, requestId: 4 });
  const stale = wallFeedReducer(newerRequest, {
    type: "request_succeeded",
    requestId: 3,
    response: { items: [post("stale")], page: 1, page_size: 20, has_more: false },
  });
  assert.strictEqual(stale, newerRequest);
});

test("post and comment permissions match author and owner rules", () => {
  assert.equal(canEditCommunication(MEMBER_ID, MEMBER_ID, true), true);
  assert.equal(canEditCommunication(MEMBER_ID, OWNER_ID, true), false);
  assert.equal(canDeleteCommunication(MEMBER_ID, OWNER_ID, "owner", true), true);
  assert.equal(canDeleteCommunication(MEMBER_ID, OWNER_ID, "joined", true), false);
  assert.equal(canPinPlaygroupPost("owner", true), true);
  assert.equal(canPinPlaygroupPost("joined", true), false);
});

test("Like optimistic state rolls back only Like fields and accepts canonical state", () => {
  const original = post("liked", { reaction_count: 4, comment_count: 7, body: "Keep me" });
  const optimistic = optimisticallyToggleLike(original);
  assert.equal(optimistic.post.viewer_has_liked, true);
  assert.equal(optimistic.post.reaction_count, 5);
  const changedElsewhere = { ...optimistic.post, comment_count: 8, body: "Updated" };
  const rolledBack = rollbackLike(changedElsewhere, optimistic.snapshot);
  assert.equal(rolledBack.viewer_has_liked, false);
  assert.equal(rolledBack.reaction_count, 4);
  assert.equal(rolledBack.comment_count, 8);
  assert.equal(rolledBack.body, "Updated");
  assert.equal(applyCanonicalLike(changedElsewhere, optimistic.snapshot, false).reaction_count, 4);
});

test("comments paginate oldest-first and deduplicate IDs", () => {
  const merged = mergeComments(
    [comment("b", "2026-08-01T10:02:00Z")],
    [comment("a", "2026-08-01T10:01:00Z"), comment("b", "2026-08-01T10:02:00Z")],
  );
  assert.deepEqual(merged.map((item) => item.id), ["a", "b"]);
});

test("deep-linked posts are focused, paged for explicitly, or fail safely", () => {
  const target = "40000000-0000-4000-8000-000000000001";
  assert.equal(getDeepLinkLookupState(target, [{ id: target }], true, 1), "found");
  assert.equal(getDeepLinkLookupState(target, [], true, 1), "load_more");
  assert.equal(getDeepLinkLookupState(target, [], false, 1), "unavailable");
});

test("chat history and older pages remain chronological and deduplicate POST, Realtime, and REST", () => {
  const first = message("40000000-0000-4000-8000-000000000001", "2026-08-01T10:01:00Z");
  const second = message("40000000-0000-4000-8000-000000000002", "2026-08-01T10:02:00Z");
  const third = message("40000000-0000-4000-8000-000000000003", "2026-08-01T10:03:00Z");
  const merged = mergeChatMessages([second, third], [first, second, third]);
  assert.deepEqual(merged.map((item) => item.id), [first.id, second.id, third.id]);
});

test("secure topic and Realtime payload validation use the deployed contract", () => {
  assert.equal(playgroupChatTopic(GROUP_ID), `playgroup:${GROUP_ID}:chat`);
  assert.equal(playgroupChatTopic("bad"), null);
  const valid = message("40000000-0000-4000-8000-000000000001", "2026-08-01T10:01:00Z");
  assert.equal(isPlaygroupChatMessage(valid, GROUP_ID), true);
  assert.equal(isPlaygroupChatMessage({ ...valid, playgroup_id: OWNER_ID }, GROUP_ID), false);
});

test("Enter sends, Shift+Enter makes a newline, and a busy send is rejected", () => {
  assert.equal(shouldSubmitChatKey("Enter", false, false), true);
  assert.equal(shouldSubmitChatKey("Enter", true, false), false);
  assert.equal(shouldSubmitChatKey("Enter", false, true), false);
  assert.equal(canStartCommunicationSubmission("hello", PLAYGROUP_CHAT_MAX_LENGTH, true), false);
});

test("new-message scrolling follows only when already near the bottom", () => {
  assert.equal(isNearChatBottom(1000, 650, 300), true);
  assert.equal(isNearChatBottom(1000, 300, 300), false);
});

test("read state is sent only for active Chat with the newest message visible and not already marked", () => {
  assert.equal(shouldMarkChatRead({ active: true, newestVisible: true, latestMessageId: "latest", lastMarkedMessageId: null }), true);
  assert.equal(shouldMarkChatRead({ active: false, newestVisible: true, latestMessageId: "latest", lastMarkedMessageId: null }), false);
  assert.equal(shouldMarkChatRead({ active: true, newestVisible: false, latestMessageId: "latest", lastMarkedMessageId: null }), false);
  assert.equal(shouldMarkChatRead({ active: true, newestVisible: true, latestMessageId: "latest", lastMarkedMessageId: "latest" }), false);
});

test("deleted chat representation cannot be resurrected by an older POST response", () => {
  const original = message("40000000-0000-4000-8000-000000000001", "2026-08-01T10:01:00Z", "Sensitive");
  const removed = deletedChatMessage(original);
  assert.equal(isDeletedChatMessage(removed), true);
  assert.equal(mergeChatMessages([removed], [original])[0]?.body, "Message removed");
});

test("nearby messages from the same sender group without oversized per-line bubbles", () => {
  const first = message("40000000-0000-4000-8000-000000000001", "2026-08-01T10:01:00Z");
  const second = message("40000000-0000-4000-8000-000000000002", "2026-08-01T10:05:00Z");
  const later = message("40000000-0000-4000-8000-000000000003", "2026-08-01T10:20:00Z");
  assert.equal(shouldGroupChatMessage(first, second), true);
  assert.equal(shouldGroupChatMessage(second, later), false);
});

test("components gate fetch/subscription, clean up private Realtime, preserve REST history, and support mobile", () => {
  const detail = readFileSync(new URL("../components/playgroups/PlaygroupDetail.tsx", import.meta.url), "utf8");
  const realtime = readFileSync(new URL("../components/playgroups/usePlaygroupChatRealtime.ts", import.meta.url), "utf8");
  const comments = readFileSync(new URL("../components/playgroups/PlaygroupComments.tsx", import.meta.url), "utf8");
  const chat = readFileSync(new URL("../components/playgroups/PlaygroupChat.tsx", import.meta.url), "utf8");
  const history = readFileSync(new URL("../components/playgroups/usePlaygroupChatHistory.ts", import.meta.url), "utf8");
  const composer = readFileSync(new URL("../components/playgroups/PlaygroupChatComposer.tsx", import.meta.url), "utf8");

  assert.match(detail, /section === "chat" && hasCommunicationAccess && user/);
  assert.match(detail, /membership_state: "none"/);
  assert.match(detail, /setInterval\(\(\) => void refreshGroup\(\), 30_000\)/);
  assert.match(realtime, /getSession\(\)/);
  assert.match(realtime, /realtime\.setAuth\(session\.access_token\)/);
  assert.match(realtime, /private: true/);
  assert.match(realtime, /event: "message"/);
  assert.match(realtime, /message_deleted/);
  assert.match(realtime, /SUBSCRIBED/);
  assert.match(realtime, /removeChannel\(channel\)/);
  assert.doesNotMatch(realtime, /\.from\(/);
  assert.match(comments, /enabled: open/);
  assert.match(chat, /anchorOffset/);
  assert.match(chat, /newMessages/);
  assert.doesNotMatch(history, /catch[\s\S]{0,160}setItems\(\[\]\)/);
  assert.match(composer, /env\(safe-area-inset-bottom\)/);
  assert.match(composer, /text-base/);
  assert.match(
    readFileSync(new URL("../components/playgroups/PlaygroupChatHistory.tsx", import.meta.url), "utf8"),
    /100dvh_-_9rem_-_env\(safe-area-inset-bottom\)/,
  );
});
