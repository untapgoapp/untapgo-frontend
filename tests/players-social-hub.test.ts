import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Players uses one query-based dashboard with a compact mobile selector", () => {
  const page = source("../app/players/page.tsx");
  const dashboard = source("../components/players/PlayersDashboard.tsx");
  const selector = source("../components/section-navigation/SectionNavigation.tsx");

  assert.match(page, /normalizePlayersView\(query\.view\)/);
  assert.match(dashboard, /SectionNavigation section="players" activeKey=\{view\}/);
  assert.match(selector, /className="block lg:hidden"/);
  assert.match(selector, /aria-label=\{navigation\.selectorLabel\}/);
  assert.match(selector, /max-w-full/);
  assert.doesNotMatch(dashboard, /hidden lg:block/);
});

test("the active Players section alone loads and supports stale-safe pagination", () => {
  const directory = source("../components/players/PlayersDirectory.tsx");
  const service = source("../services/profiles.ts");

  assert.match(directory, /getPlayersSection\(\{ view, currentUserId: userId, query, page \}\)/);
  assert.match(directory, /requestSequence\.current/);
  assert.match(directory, /state\.page \+ 1/);
  assert.match(directory, /Load more/);
  assert.match(service, /buildPlayersSectionPath\(\{ view, currentUserId, query, page \}\)/);
  assert.doesNotMatch(directory, /Promise\.all/);
});

test("directory relationship mutations are row-scoped, optimistic, and rollback safely", () => {
  const directory = source("../components/players/PlayersDirectory.tsx");
  const row = source("../components/players/PlayerDirectoryRow.tsx");
  const action = source("../components/players/PlayerRelationshipAction.tsx");

  assert.match(directory, /busyIdsRef\.current\.has\(player\.id\)/);
  assert.match(directory, /followProfile\(player\.id\)/);
  assert.match(directory, /unfollowProfile\(player\.id\)/);
  assert.match(directory, /type: "player_restored"/);
  assert.match(directory, /Follow could not be updated\. Try again\./);
  assert.match(row, /<Link href=\{getPlayerProfileHref\(player\.id\)\}/);
  assert.match(action, /event\.stopPropagation\(\)/);
  assert.match(action, /if \(blocked\) return null/);
  assert.match(action, /aria-busy=\{busy\}/);
});

test("blocking refreshes the mounted section and no Friends system is introduced", () => {
  const directory = source("../components/players/PlayersDirectory.tsx");
  const navigation = source("../components/social-shell/navigation.ts");

  assert.match(directory, /BLOCKED_PROFILES_CHANGED_EVENT/);
  assert.match(directory, /refreshAfterBlock/);
  assert.match(directory, /type: "player_removed"/);
  assert.doesNotMatch(directory, /friend request|add friend/i);
  assert.doesNotMatch(navigation, /friends/i);
});

test("public profile Follow and network surfaces continue to reuse shared components", () => {
  const profileActions = source("../components/profile/ProfileActionsPanel.tsx");
  const network = source("../components/profile/social/ProfileNetworkList.tsx");

  assert.match(profileActions, /<ProfileFollowButton/);
  assert.match(network, /<PlayerDirectoryRow key=\{player\.id\} player=\{player\}/);
});
