import assert from "node:assert/strict";
import test from "node:test";

import { socialNavigationItems } from "../components/social-shell/navigation.ts";
import { getPlayerProfileHref } from "../lib/player-directory.ts";
import {
  applyPlaygroupDetailResponse,
  applyPlaygroupMembershipResponse,
  archiveConfirmationReducer,
  buildDiscoverPlaygroupsPath,
  buildMyPlaygroupsPath,
  buildPlaygroupPeoplePath,
  buildPlaygroupRequestActionPath,
  buildPlaygroupResourcePath,
  canStartPlaygroupSubmission,
  createPaginatedState,
  getPlaygroupMembershipAction,
  normalizePlaygroupPayload,
  normalizePlaygroupsView,
  paginatedReducer,
  shouldShowPlaygroupRequests,
  type PaginatedState,
  type PlaygroupDetail,
  type PlaygroupListItem,
  type PlaygroupPage,
} from "../lib/playgroups.ts";

function group(id: string, values: Partial<PlaygroupListItem> = {}): PlaygroupListItem {
  return {
    id,
    name: `Group ${id}`,
    description: null,
    avatar_url: null,
    city: null,
    country_code: null,
    join_policy: "open",
    membership_state: "none",
    ...values,
  };
}

function detail(values: Partial<PlaygroupDetail> = {}): PlaygroupDetail {
  return {
    ...group("group/id"),
    status: "active",
    owner: { id: "owner/id", nickname: "Owner", avatar_url: null },
    ...values,
  };
}

function response(items: PlaygroupListItem[], page: number, hasMore: boolean): PlaygroupPage {
  return { items, page, page_size: 20, has_more: hasMore };
}

function started(
  scope: string,
  page: number,
  requestId: number,
  state: PaginatedState<PlaygroupListItem> = createPaginatedState(scope),
) {
  return paginatedReducer(state, { type: "request_started", scope, page, requestId });
}

test("Discover sends trimmed name and city filters with backend pagination", () => {
  const url = new URL(
    buildDiscoverPlaygroupsPath("  Friday & Friends  ", "  Tallinn  ", 3),
    "https://example.test",
  );
  assert.equal(url.pathname, "/playgroups");
  assert.equal(url.searchParams.get("q"), "Friday & Friends");
  assert.equal(url.searchParams.get("city"), "Tallinn");
  assert.equal(url.searchParams.get("page"), "3");
  assert.equal(url.searchParams.get("page_size"), "20");
});

test("changing search scope resets results and pagination", () => {
  const loading = started("discover:old:", 1, 1);
  const loaded = paginatedReducer(loading, {
    type: "request_succeeded",
    requestId: 1,
    response: response([group("one")], 1, true),
  });
  const changed = paginatedReducer(loaded, {
    type: "scope_changed",
    scope: "discover:new:",
    requestId: 2,
  });
  assert.deepEqual(changed.items, []);
  assert.equal(changed.page, 0);
  assert.equal(changed.hasMore, false);
  assert.equal(changed.status, "debouncing");
});

test("Load more appends groups, deduplicates IDs, and ignores stale searches", () => {
  const first = paginatedReducer(started("discover::", 1, 1), {
    type: "request_succeeded",
    requestId: 1,
    response: response([group("one")], 1, true),
  });
  const secondLoading = started("discover::", 2, 2, first);
  const second = paginatedReducer(secondLoading, {
    type: "request_succeeded",
    requestId: 2,
    response: response([group("one"), group("two")], 2, false),
  });
  const stale = paginatedReducer(second, {
    type: "request_succeeded",
    requestId: 1,
    response: response([group("stale")], 1, false),
  });
  assert.deepEqual(second.items.map(({ id }) => id), ["one", "two"]);
  assert.strictEqual(stale, second);
});

test("My groups and Pending use the exact backend state filters", () => {
  assert.equal(buildMyPlaygroupsPath("owned", 1), "/playgroups/mine?page=1&page_size=20&state=owned");
  assert.equal(buildMyPlaygroupsPath("joined", 2), "/playgroups/mine?page=2&page_size=20&state=joined");
  assert.equal(buildMyPlaygroupsPath("pending", 1), "/playgroups/mine?page=1&page_size=20&state=pending");
});

test("invalid directory views default to Discover", () => {
  assert.equal(normalizePlaygroupsView(undefined), "discover");
  assert.equal(normalizePlaygroupsView("unknown"), "discover");
  assert.equal(normalizePlaygroupsView("mine"), "mine");
  assert.equal(normalizePlaygroupsView("pending"), "pending");
});

test("creation form normalizes the backend payload and validates fields", () => {
  const result = normalizePlaygroupPayload({
    name: "  Friday Night Crew  ",
    description: "  Modern and Commander.  ",
    avatarUrl: "  https://example.test/avatar.png  ",
    city: "  Tallinn  ",
    countryCode: " ee ",
    joinPolicy: "approval",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.payload, {
      name: "Friday Night Crew",
      description: "Modern and Commander.",
      avatar_url: "https://example.test/avatar.png",
      city: "Tallinn",
      country_code: "EE",
      join_policy: "approval",
    });
  }
  assert.equal(normalizePlaygroupPayload({ name: "x", description: "", avatarUrl: "", city: "", countryCode: "EST", joinPolicy: "open" }).ok, false);
});

test("duplicate create or edit submissions cannot start while submitting", () => {
  assert.equal(canStartPlaygroupSubmission(false), true);
  assert.equal(canStartPlaygroupSubmission(true), false);
});

test("membership actions match open, approval, pending, joined, owner, and archived states", () => {
  assert.equal(getPlaygroupMembershipAction(detail()), "join");
  assert.equal(getPlaygroupMembershipAction(detail({ join_policy: "approval" })), "request");
  assert.equal(getPlaygroupMembershipAction(detail({ membership_state: "pending" })), "cancel");
  assert.equal(getPlaygroupMembershipAction(detail({ membership_state: "joined" })), "leave");
  assert.equal(getPlaygroupMembershipAction(detail({ membership_state: "owner" })), null);
  assert.equal(getPlaygroupMembershipAction(detail({ status: "archived" })), null);

  assert.equal(applyPlaygroupMembershipResponse(detail(), { ok: true, membership_state: "joined" }).membership_state, "joined");
  assert.equal(applyPlaygroupMembershipResponse(detail({ join_policy: "approval" }), { ok: true, membership_state: "pending" }).membership_state, "pending");
  assert.equal(applyPlaygroupMembershipResponse(detail({ membership_state: "pending" }), { ok: true, membership_state: "none" }).membership_state, "none");
  assert.equal(applyPlaygroupMembershipResponse(detail({ membership_state: "joined" }), { ok: true, membership_state: "none" }).membership_state, "none");
});

test("members and request decisions use encoded paginated backend paths", () => {
  assert.equal(buildPlaygroupPeoplePath("group/id", "members", 2), "/playgroups/group%2Fid/members?page=2&page_size=20");
  assert.equal(buildPlaygroupPeoplePath("group/id", "requests", 1), "/playgroups/group%2Fid/requests?page=1&page_size=20");
  assert.equal(buildPlaygroupRequestActionPath("group/id", "user/id", "approve"), "/playgroups/group%2Fid/requests/user%2Fid/approve");
  assert.equal(buildPlaygroupRequestActionPath("group/id", "user/id", "reject"), "/playgroups/group%2Fid/requests/user%2Fid/reject");
  assert.equal(getPlayerProfileHref("user/id"), "/profile/user%2Fid");
});

test("request management is owner-only and removing a decision is local", () => {
  assert.equal(shouldShowPlaygroupRequests(detail({ membership_state: "owner" })), true);
  assert.equal(shouldShowPlaygroupRequests(detail({ membership_state: "joined" })), false);
  assert.equal(shouldShowPlaygroupRequests(detail({ membership_state: "owner", status: "archived" })), false);

  const loaded = paginatedReducer(started("requests", 1, 1), {
    type: "request_succeeded",
    requestId: 1,
    response: response([group("one"), group("two")], 1, false),
  });
  const afterDecision = paginatedReducer(loaded, { type: "item_removed", id: "one" });
  assert.deepEqual(afterDecision.items.map(({ id }) => id), ["two"]);
});

test("editing and archive responses update the visible group", () => {
  const current = detail({ name: "Old name" });
  const edited = detail({ name: "New name", city: "Tallinn" });
  assert.deepEqual(applyPlaygroupDetailResponse(current, edited), edited);

  let confirmation = archiveConfirmationReducer("idle", "request");
  assert.equal(confirmation, "confirming");
  confirmation = archiveConfirmationReducer(confirmation, "submit");
  assert.equal(confirmation, "submitting");
  confirmation = archiveConfirmationReducer(confirmation, "succeeded");
  assert.equal(confirmation, "idle");
  assert.equal(applyPlaygroupDetailResponse(current, detail({ status: "archived" })).status, "archived");
  assert.equal(buildPlaygroupResourcePath("group/id", "/archive"), "/playgroups/group%2Fid/archive");
});

test("an API failure changes only its own section state", () => {
  const members = started("members", 1, 1);
  const requests = started("requests", 1, 2);
  const failedMembers = paginatedReducer(members, { type: "request_failed", requestId: 1, page: 1 });
  assert.equal(failedMembers.status, "error");
  assert.equal(requests.status, "loading");
});

test("Playgroups navigation is active and no longer marked Soon", () => {
  const item = socialNavigationItems.find(({ key }) => key === "playgroups");
  assert.equal(item?.href, "/playgroups");
  assert.equal(item?.unavailableLabel, undefined);
});
