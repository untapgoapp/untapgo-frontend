import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPlayersSectionPath,
  buildPlayerDirectoryPath,
  getPlayerDirectoryEmptyCopy,
  getPlayerProfileHref,
  initialPlayerDirectoryState,
  normalizePlayersView,
  playerDirectoryReducer,
  shouldRemovePlayerAfterRelationship,
  type PlayerDirectoryItem,
  type PlayerDirectoryResponse,
} from "../lib/player-directory.ts";

function player(id: string, nickname = id): PlayerDirectoryItem {
  return {
    id,
    nickname,
    avatar_url: null,
    bio: null,
    mtg_arena_username: null,
    relationship: {
      is_following: false,
      is_followed_by: false,
      is_mutual: false,
    },
  };
}

function response(
  items: PlayerDirectoryItem[],
  page: number,
  hasMore: boolean,
): PlayerDirectoryResponse {
  return {
    items,
    page,
    page_size: 20,
    has_more: hasMore,
  };
}

test("search query is trimmed, encoded, and sent with pagination", () => {
  const path = buildPlayerDirectoryPath({
    query: "  Jace & Vraska  ",
    page: 3,
  });
  const url = new URL(path, "https://example.test");

  assert.equal(url.pathname, "/profiles");
  assert.equal(url.searchParams.get("q"), "Jace & Vraska");
  assert.equal(url.searchParams.get("page"), "3");
  assert.equal(url.searchParams.get("page_size"), "20");
});

test("Players views default safely and use one query-based route", () => {
  assert.equal(normalizePlayersView(undefined), "discover");
  assert.equal(normalizePlayersView("unknown"), "discover");
  assert.equal(normalizePlayersView(["following", "discover"]), "following");

  assert.equal(
    buildPlayersSectionPath({
      view: "connections",
      currentUserId: "viewer/id",
      query: "  Jace  ",
      page: 2,
    }),
    "/profiles/connections?page=2&page_size=20&q=Jace",
  );
  assert.equal(
    buildPlayersSectionPath({
      view: "followers",
      currentUserId: "viewer/id",
      query: "",
      page: 1,
    }),
    "/profiles/viewer%2Fid/followers?page=1&page_size=20",
  );
});

test("changing search resets existing results and pagination", () => {
  const loaded = playerDirectoryReducer(initialPlayerDirectoryState, {
    type: "request_started",
    query: "old",
    page: 1,
    requestId: 1,
  });
  const ready = playerDirectoryReducer(loaded, {
    type: "request_succeeded",
    requestId: 1,
    response: response([player("one")], 1, true),
  });

  const changed = playerDirectoryReducer(ready, {
    type: "query_changed",
    query: "  new  ",
    requestId: 2,
  });

  assert.equal(changed.query, "new");
  assert.deepEqual(changed.items, []);
  assert.equal(changed.page, 0);
  assert.equal(changed.hasMore, false);
  assert.equal(changed.status, "debouncing");
});

test("stale results cannot replace a newer search", () => {
  const current = playerDirectoryReducer(initialPlayerDirectoryState, {
    type: "request_started",
    query: "new search",
    page: 1,
    requestId: 8,
  });

  const stale = playerDirectoryReducer(current, {
    type: "request_succeeded",
    requestId: 7,
    response: response([player("stale")], 1, false),
  });

  assert.strictEqual(stale, current);
  assert.deepEqual(stale.items, []);
});

test("load more appends players to existing results", () => {
  const firstStarted = playerDirectoryReducer(initialPlayerDirectoryState, {
    type: "request_started",
    query: "",
    page: 1,
    requestId: 1,
  });
  const firstPage = playerDirectoryReducer(firstStarted, {
    type: "request_succeeded",
    requestId: 1,
    response: response([player("one")], 1, true),
  });
  const moreStarted = playerDirectoryReducer(firstPage, {
    type: "request_started",
    query: "",
    page: 2,
    requestId: 2,
  });
  const secondPage = playerDirectoryReducer(moreStarted, {
    type: "request_succeeded",
    requestId: 2,
    response: response([player("two")], 2, false),
  });

  assert.deepEqual(secondPage.items.map(({ id }) => id), ["one", "two"]);
  assert.equal(secondPage.page, 2);
});

test("duplicate player IDs are rendered only once", () => {
  const started = playerDirectoryReducer(initialPlayerDirectoryState, {
    type: "request_started",
    query: "",
    page: 1,
    requestId: 1,
  });
  const firstPage = playerDirectoryReducer(started, {
    type: "request_succeeded",
    requestId: 1,
    response: response([player("one")], 1, true),
  });
  const moreStarted = playerDirectoryReducer(firstPage, {
    type: "request_started",
    query: "",
    page: 2,
    requestId: 2,
  });
  const merged = playerDirectoryReducer(moreStarted, {
    type: "request_succeeded",
    requestId: 2,
    response: response([player("one"), player("two")], 2, false),
  });

  assert.deepEqual(merged.items.map(({ id }) => id), ["one", "two"]);
});

test("an empty search result uses the search-specific state", () => {
  assert.deepEqual(getPlayerDirectoryEmptyCopy("discover", "Liliana"), {
    title: "No players found",
    detail: "Try another nickname.",
  });
});

test("section empty states use Follow-based language", () => {
  assert.deepEqual(getPlayerDirectoryEmptyCopy("connections", ""), {
    title: "No connections yet.",
    detail: "Follow players and connect when they follow you back.",
  });
  assert.equal(
    getPlayerDirectoryEmptyCopy("following", "").title,
    "You are not following anyone yet.",
  );
});

test("section-specific relationship updates remove only rows that no longer belong", () => {
  const followBack = {
    is_following: false,
    is_followed_by: true,
    is_mutual: false,
  };
  assert.equal(shouldRemovePlayerAfterRelationship("connections", followBack), true);
  assert.equal(shouldRemovePlayerAfterRelationship("following", followBack), true);
  assert.equal(shouldRemovePlayerAfterRelationship("followers", followBack), false);
  assert.equal(shouldRemovePlayerAfterRelationship("discover", followBack), false);
});

test("removed rows are restored at their original position after a failed mutation", () => {
  const first = player("one");
  const second = player("two");
  const state = { ...initialPlayerDirectoryState, items: [first, second] };
  const removed = playerDirectoryReducer(state, {
    type: "player_changed",
    playerId: first.id,
    relationship: first.relationship,
    remove: true,
  });
  const restored = playerDirectoryReducer(removed, {
    type: "player_restored",
    player: first,
    index: 0,
  });

  assert.deepEqual(restored.items.map(({ id }) => id), ["one", "two"]);
});

test("a newly blocked player is removed from mounted directory state", () => {
  const state = {
    ...initialPlayerDirectoryState,
    items: [player("blocked"), player("visible")],
  };
  const next = playerDirectoryReducer(state, {
    type: "player_removed",
    playerId: "blocked",
  });

  assert.deepEqual(next.items.map(({ id }) => id), ["visible"]);
});

test("API errors retain the failed page and Retry starts it again", () => {
  const started = playerDirectoryReducer(initialPlayerDirectoryState, {
    type: "request_started",
    query: "Nissa",
    page: 1,
    requestId: 4,
  });
  const failed = playerDirectoryReducer(started, {
    type: "request_failed",
    requestId: 4,
    page: 1,
  });
  const retried = playerDirectoryReducer(failed, {
    type: "request_started",
    query: failed.query,
    page: failed.failedPage ?? 1,
    requestId: 5,
  });

  assert.equal(failed.status, "error");
  assert.equal(failed.failedPage, 1);
  assert.equal(retried.status, "loading");
  assert.equal(retried.failedPage, null);
});

test("profile links use the returned user ID", () => {
  assert.equal(
    getPlayerProfileHref("player/id"),
    "/profile/player%2Fid",
  );
});
