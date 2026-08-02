import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  contextualNavigationSections,
  getContextualNavigation,
} from "../components/social-shell/navigation.ts";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Binder contextual navigation is route-scoped and maps Sent to Trade requests", () => {
  const binder = getContextualNavigation("/binder", "sent");
  assert.equal(binder?.section.label, "BINDER");
  assert.equal(binder?.activeKey, "requests");
  assert.deepEqual(
    contextualNavigationSections.binder.items.map(({ label, href }) => [label, href]),
    [
      ["Community", "/binder?view=community"],
      ["My Binder", "/binder?view=items"],
      ["Wanted List", "/binder?view=wanted"],
      ["Matches", "/binder?view=matches"],
      ["Trade requests", "/binder?view=received"],
    ],
  );
  assert.equal(getContextualNavigation("/binder", "invalid")?.activeKey, "community");
  assert.equal(getContextualNavigation("/profile/player-1/binder", null), null);
});

test("Deck contextual navigation stays useful on owner detail routes without false list state", () => {
  assert.equal(getContextualNavigation("/decks", "saved")?.activeKey, "saved");
  assert.equal(getContextualNavigation("/decks", "invalid")?.activeKey, "community");
  assert.equal(getContextualNavigation("/decks/deck-1", null)?.activeKey, null);
  assert.equal(getContextualNavigation("/profile/decks/deck-1/edit", null)?.activeKey, null);
  assert.equal(getContextualNavigation("/profile/player-1/decks/deck-1", null), null);
});

test("Players contextual navigation defaults to Discover and stays off public profiles", () => {
  const players = getContextualNavigation("/players", "connections");
  assert.equal(players?.section.label, "PLAYERS");
  assert.equal(players?.activeKey, "connections");
  assert.deepEqual(
    contextualNavigationSections.players.items.map(({ label, href }) => [label, href]),
    [
      ["Discover", "/players?view=discover"],
      ["Connections", "/players?view=connections"],
      ["Followers", "/players?view=followers"],
      ["Following", "/players?view=following"],
    ],
  );
  assert.equal(getContextualNavigation("/players", "invalid")?.activeKey, "discover");
  assert.equal(getContextualNavigation("/profile/player-1", null), null);
});

test("only one contextual menu renders and unrelated routes render none", () => {
  for (const pathname of ["/home", "/events", "/playgroups", "/profile", "/notifications", "/settings"]) {
    assert.equal(getContextualNavigation(pathname, null), null);
  }
  const component = source("../components/social-shell/SocialContextualNavigation.tsx");
  assert.match(component, /if \(!contextual\) return null/);
  assert.match(component, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(component, /aria-hidden="true"/);
  assert.equal((component.match(/data-contextual-navigation=/g) ?? []).length, 1);
});

test("desktop account links remain absent from the sidebar and present in the avatar menu", () => {
  const sidebar = source("../components/social-shell/SocialDesktopSidebar.tsx");
  const profileMenu = source("../components/social-shell/SocialProfileMenu.tsx");
  assert.doesNotMatch(sidebar, /Profile|Favorites|Settings|Blocked players/);
  for (const label of ["Profile", "Favorites", "Settings", "Blocked players", "Log out"]) {
    assert.match(profileMenu, new RegExp(label));
  }
});
