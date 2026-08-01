import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  desktopNavigationItems,
  getActiveSocialNavigationKey,
  getActiveMobileSecondaryNavigationKey,
  isMobileMoreRoute,
  mobileMoreNavigationItem,
  mobilePrimaryNavigationItems,
  mobileSecondaryNavigationItems,
} from "../components/social-shell/navigation.ts";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function activePrimary(pathname: string) {
  return mobilePrimaryNavigationItems.find((item) => item.matches(pathname))?.key ?? null;
}

test("mobile bottom navigation has exactly four routes and one More action", () => {
  assert.deepEqual(
    mobilePrimaryNavigationItems.map(({ label, href }) => [label, href]),
    [
      ["Home", "/home"],
      ["Events", "/events"],
      ["Playgroups", "/playgroups"],
      ["Players", "/players"],
    ],
  );
  assert.equal(mobilePrimaryNavigationItems.length + 1, 5);
  assert.equal(mobileMoreNavigationItem.label, "More");
  assert.equal("href" in mobileMoreNavigationItem, false);

  const navigation = source("../components/social-shell/SocialNavigation.tsx");
  assert.match(navigation, /grid-cols-5/);
  assert.match(navigation, /aria-haspopup="dialog"/);
  assert.match(navigation, /aria-expanded=\{moreOpen\}/);
  assert.doesNotMatch(navigation, /href=["'{]\/more/);
});

test("primary active routes cover Playgroups details without broadening Home", () => {
  assert.equal(activePrimary("/home"), "home");
  assert.equal(activePrimary("/home/archive"), null);
  assert.equal(activePrimary("/events"), "events");
  assert.equal(activePrimary("/events/friday-night"), "events");
  assert.equal(activePrimary("/create"), "events");
  assert.equal(activePrimary("/check-in"), "events");
  assert.equal(activePrimary("/playgroups"), "playgroups");
  assert.equal(activePrimary("/playgroups/new"), "playgroups");
  assert.equal(activePrimary("/playgroups/friday-night"), "playgroups");
  assert.equal(activePrimary("/players"), "players");
});

test("More contains only real secondary routes with Binder first", () => {
  assert.deepEqual(
    mobileSecondaryNavigationItems.map(({ label, href }) => [label, href]),
    [
      ["Binder", "/binder"],
      ["Decks", "/decks"],
      ["Profile", "/profile"],
      ["Favorites", "/profile/favorites"],
      ["Settings", "/settings"],
      ["Blocked players", "/profile/blocked"],
    ],
  );

  const routeFiles = [
    "../app/binder/page.tsx",
    "../app/decks/page.tsx",
    "../app/profile/page.tsx",
    "../app/profile/favorites/page.tsx",
    "../app/settings/page.tsx",
    "../app/profile/blocked/page.tsx",
  ];
  for (const routeFile of routeFiles) {
    assert.equal(existsSync(new URL(routeFile, import.meta.url)), true, `${routeFile} must exist`);
  }
});

test("More active state recognizes Binder, Decks, Profile and specific profile routes", () => {
  assert.equal(getActiveMobileSecondaryNavigationKey("/binder"), "binder");
  assert.equal(getActiveMobileSecondaryNavigationKey("/profile/player-1/binder"), "binder");
  assert.equal(getActiveMobileSecondaryNavigationKey("/decks"), "decks");
  assert.equal(getActiveMobileSecondaryNavigationKey("/profile/decks"), "decks");
  assert.equal(getActiveMobileSecondaryNavigationKey("/profile/player-1/decks/deck-1"), "decks");
  assert.equal(getActiveMobileSecondaryNavigationKey("/profile"), "profile");
  assert.equal(getActiveMobileSecondaryNavigationKey("/profile/favorites"), "favorites");
  assert.equal(getActiveMobileSecondaryNavigationKey("/settings"), "settings");
  assert.equal(getActiveMobileSecondaryNavigationKey("/profile/blocked"), "blocked");
  assert.equal(isMobileMoreRoute("/binder"), true);
  assert.equal(isMobileMoreRoute("/home"), false);
});

test("More sheet reuses accessible sheet behavior and closes on selection or route change", () => {
  const bottom = source("../components/social-shell/SocialBottomNavigation.tsx");
  const moreSheet = source("../components/social-shell/MobileMoreSheet.tsx");
  const actionSheet = source("../components/events/EventActionSheet.tsx");

  assert.match(bottom, /useState\(false\)/);
  assert.match(bottom, /moreOpen=\{moreOpen\}/);
  assert.match(bottom, /onMoreOpen=\{\(\) => setMoreOpen\(true\)\}/);
  assert.match(bottom, /<MobileMoreSheet open=\{moreOpen\} onClose=\{closeMore\}/);
  assert.match(moreSheet, /<EventActionSheet/);
  assert.match(moreSheet, /onClick=\{onClose\}/);
  assert.match(moreSheet, /\[pathname, onClose\]/);
  assert.match(actionSheet, /role="dialog"/);
  assert.match(actionSheet, /aria-modal="true"/);
  assert.match(actionSheet, /event\.key === "Escape"/);
  assert.match(actionSheet, /event\.target ===[\s\S]*event\.currentTarget/);
  assert.match(actionSheet, /event\.key !== "Tab"/);
  assert.match(actionSheet, /previouslyFocused\?\.focus\(\)/);
});

test("mobile chrome preserves touch targets, overflow protection, safe area, messages and bell", () => {
  const navigation = source("../components/social-shell/SocialNavigation.tsx");
  const bottom = source("../components/social-shell/SocialBottomNavigation.tsx");
  const shell = source("../components/social-shell/SocialAppShell.tsx");
  const header = source("../components/social-shell/SocialTopBar.tsx");
  const actionSheet = source("../components/events/EventActionSheet.tsx");

  assert.match(navigation, /min-h-14/);
  assert.match(bottom, /overflow-x-hidden/);
  assert.match(bottom, /pb-\[env\(safe-area-inset-bottom\)\]/);
  assert.match(shell, /pb-\[calc\(4\.5rem\+env\(safe-area-inset-bottom\)\)\]/);
  assert.match(actionSheet, /h-\[env\(safe-area-inset-bottom\)\]/);
  assert.match(header, /<NotificationBell \/>/);
  assert.match(header, /<SocialMessagingMenu/);
  assert.doesNotMatch(header, /Binder|Playgroups/);
});

test("desktop navigation contains only primary destinations and account links live in avatar menu", () => {
  assert.deepEqual(
    desktopNavigationItems.map(({ label, href }) => [label, href]),
    [
      ["Home", "/home"],
      ["Events", "/events"],
      ["Players", "/players"],
      ["Playgroups", "/playgroups"],
      ["Binder", "/binder"],
      ["Decks", "/decks"],
    ],
  );
  const sidebar = source("../components/social-shell/SocialDesktopSidebar.tsx");
  const profileMenu = source("../components/social-shell/SocialProfileMenu.tsx");
  assert.match(sidebar, /<SocialNavigation variant="desktop" \/>/);
  assert.doesNotMatch(sidebar, /desktop-secondary|Profile|Favorites|Settings|Blocked players/);
  for (const label of ["Profile", "Favorites", "Settings", "Blocked players", "Log out"]) assert.match(profileMenu, new RegExp(label));
  assert.match(profileMenu, /supabase\.auth\.signOut\(\)/);
  assert.match(profileMenu, /router\.replace\("\/"\)/);
  assert.equal(desktopNavigationItems.some(({ href }) => href === "/notifications"), false);
  assert.equal(getActiveSocialNavigationKey("/settings"), "settings");
  assert.equal(getActiveSocialNavigationKey("/profile/decks"), "decks");
  assert.equal(getActiveSocialNavigationKey("/profile/player-1/binder"), "binder");
  assert.equal(getActiveSocialNavigationKey("/profile/player-1/decks/deck-1"), "decks");
});
