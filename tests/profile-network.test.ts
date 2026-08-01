import assert from "node:assert/strict";
import test from "node:test";

import type {
  PlayerDirectoryItem,
  PlayerDirectoryResponse,
} from "../lib/player-directory.ts";
import { getPlayerProfileHref } from "../lib/player-directory.ts";
import {
  buildProfileNetworkPath,
  createProfileNetworkState,
  getProfileNetworkEmptyText,
  getProfileNetworkHref,
  normalizeProfileNetworkTab,
  profileNetworkReducer,
} from "../lib/profile-network.ts";

const profileId = "profile/id";

function player(id: string): PlayerDirectoryItem {
  return {
    id,
    nickname: id,
    avatar_url: null,
    bio: null,
    mtg_arena_username: null,
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

function start(
  tab: "followers" | "following",
  page: number,
  requestId: number,
  state = createProfileNetworkState(profileId, tab),
) {
  return profileNetworkReducer(state, {
    type: "request_started",
    profileId,
    tab,
    page,
    requestId,
  });
}

test("followers and following build the correct paginated endpoints", () => {
  assert.equal(
    buildProfileNetworkPath({ profileId, tab: "followers", page: 1 }),
    "/profiles/profile%2Fid/followers?page=1&page_size=20",
  );
  assert.equal(
    buildProfileNetworkPath({ profileId, tab: "following", page: 2 }),
    "/profiles/profile%2Fid/following?page=2&page_size=20",
  );
});

test("missing or invalid network tabs default to followers", () => {
  assert.equal(normalizeProfileNetworkTab(undefined), "followers");
  assert.equal(normalizeProfileNetworkTab("unknown"), "followers");
  assert.equal(normalizeProfileNetworkTab("following"), "following");
});

test("changing tabs resets previous results", () => {
  const loading = start("followers", 1, 1);
  const followers = profileNetworkReducer(loading, {
    type: "request_succeeded",
    requestId: 1,
    response: response([player("one")], 1, false),
  });
  const following = start("following", 1, 2, followers);

  assert.equal(following.tab, "following");
  assert.deepEqual(following.items, []);
  assert.equal(following.status, "loading");
});

test("Load more appends players and removes duplicate IDs", () => {
  const firstLoading = start("followers", 1, 1);
  const firstPage = profileNetworkReducer(firstLoading, {
    type: "request_succeeded",
    requestId: 1,
    response: response([player("one")], 1, true),
  });
  const moreLoading = start("followers", 2, 2, firstPage);
  const secondPage = profileNetworkReducer(moreLoading, {
    type: "request_succeeded",
    requestId: 2,
    response: response([player("one"), player("two")], 2, false),
  });

  assert.deepEqual(
    secondPage.items.map(({ id }) => id),
    ["one", "two"],
  );
  assert.equal(secondPage.page, 2);
});

test("stale responses cannot replace the current tab", () => {
  const current = start("following", 1, 8);
  const stale = profileNetworkReducer(current, {
    type: "request_succeeded",
    requestId: 7,
    response: response([player("stale")], 1, false),
  });

  assert.strictEqual(stale, current);
  assert.deepEqual(stale.items, []);
});

test("network API failures are retryable", () => {
  const loading = start("followers", 1, 4);
  const failed = profileNetworkReducer(loading, {
    type: "request_failed",
    requestId: 4,
    page: 1,
  });
  const retried = start(
    failed.tab,
    failed.failedPage ?? 1,
    5,
    failed,
  );

  assert.equal(failed.status, "error");
  assert.equal(failed.failedPage, 1);
  assert.equal(retried.status, "loading");
});

test("network rows and tabs link to the correct public profile routes", () => {
  assert.equal(
    getPlayerProfileHref(profileId),
    "/profile/profile%2Fid",
  );
  assert.equal(
    getProfileNetworkHref(profileId, "following"),
    "/profile/profile%2Fid/network?tab=following",
  );
});

test("each network tab has an explicit empty state", () => {
  assert.equal(
    getProfileNetworkEmptyText("followers"),
    "No followers to show yet.",
  );
  assert.equal(
    getProfileNetworkEmptyText("following"),
    "Not following anyone yet.",
  );
});
