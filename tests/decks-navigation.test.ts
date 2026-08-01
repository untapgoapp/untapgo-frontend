import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildCommunityDecksPath, deckRoutes, deckSectionHref, normalizeDecksView } from "../lib/deck-routes.ts";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Deck section routes default safely to Community", () => {
  assert.equal(normalizeDecksView(undefined), "community");
  assert.equal(normalizeDecksView("invalid"), "community");
  assert.equal(normalizeDecksView("community"), "community");
  assert.equal(normalizeDecksView("mine"), "mine");
  assert.equal(normalizeDecksView("saved"), "saved");
  assert.equal(deckSectionHref("community"), "/decks?view=community");
  assert.equal(deckRoutes.publicDetail("owner/id", "deck/id"), "/profile/owner%2Fid/decks/deck%2Fid");
});

test("Deck navigation uses the global contextual sidebar and compact mobile selector", () => {
  const dashboard = source("../components/decks/DecksDashboard.tsx");
  const navigation = source("../components/section-navigation/SectionNavigation.tsx");
  const metadata = source("../components/social-shell/navigation.ts");
  const sidebar = source("../components/social-shell/SocialDesktopSidebar.tsx");
  for (const label of ["Community", "My Decks", "Saved Decks"]) {
    assert.match(metadata, new RegExp(`label: "${label}"`));
  }
  assert.match(sidebar, /<SocialContextualNavigation \/>/);
  assert.match(dashboard, /<SectionNavigation section="decks" activeKey=\{view\} \/>/);
  assert.match(navigation, /<select/);
  assert.match(navigation, /max-w-full/);
  assert.match(navigation, /lg:hidden/);
  assert.doesNotMatch(navigation, /<aside|w-\[196px\]/);
  assert.doesNotMatch(dashboard, /lg:grid-cols-\[196px|overflow-x-auto|rounded-full.*Community/);
});

test("Deck server component passes only serializable section props to its client selector", () => {
  const dashboard = source("../components/decks/DecksDashboard.tsx");
  const navigation = source("../components/section-navigation/SectionNavigation.tsx");
  assert.doesNotMatch(dashboard, /^"use client"/);
  assert.doesNotMatch(dashboard, /Bookmark|Compass|Library|icon\s*:/);
  assert.match(dashboard, /section="decks" activeKey=\{view\}/);
  assert.doesNotMatch(navigation, /LucideIcon|items: SectionNavigationItem/);
  assert.match(navigation, /section: ContextualNavigationKey/);
  assert.match(navigation, /activeKey: string/);
});

test("Community Deck paths encode filters and explicit pagination", () => {
  const path = new URL(buildCommunityDecksPath({ q: " Burn ", format: " Modern ", colors: ["R", "W"], sort: "updated" }, 3), "https://test.local");
  assert.equal(path.pathname, "/decks/community");
  assert.equal(path.searchParams.get("q"), "Burn");
  assert.equal(path.searchParams.get("format"), "modern");
  assert.equal(path.searchParams.get("colors"), "R,W");
  assert.equal(path.searchParams.get("sort"), "updated");
  assert.equal(path.searchParams.get("page"), "3");
});

test("owner controls stay in My Decks while Community and Saved use discovery cards", () => {
  const dashboard = source("../components/decks/DecksDashboard.tsx");
  const owner = source("../components/decks/deck-list-row.tsx");
  const discovery = source("../components/decks/DeckDiscoveryCard.tsx");
  assert.match(dashboard, /view === "mine" \? <Button/);
  assert.match(dashboard, /view === "mine" \? <DeckList \/> : <DeckDiscoveryView/);
  assert.match(owner, />Edit</);
  assert.doesNotMatch(discovery, />Edit|Delete/);
  assert.match(discovery, /"Saved" : "Save"/);
  assert.match(discovery, />Open</);
});

test("Community and Saved Decks use real authenticated endpoints with optimistic rollback", () => {
  const service = source("../services/deck-discovery.ts");
  const routes = source("../lib/deck-routes.ts");
  const view = source("../components/decks/DeckDiscoveryView.tsx");
  assert.match(routes, /\/decks\/community/);
  assert.match(service, /\/decks\/saved/);
  assert.match(service, /\/decks\/\$\{encodeURIComponent\(deckId\)\}\/save/);
  assert.match(view, /deckDiscoveryApi\.community/);
  assert.match(view, /deckDiscoveryApi\.saved/);
  assert.match(view, /deckDiscoveryApi\.save/);
  assert.match(view, /deckDiscoveryApi\.unsave/);
  assert.match(view, /restored\.splice/);
  assert.match(view, /rowErrors/);
  assert.match(view, /<LoadMore/);
});

test("production-shaped discovery errors stay scoped and My Decks uses its independent API", () => {
  const dashboard = source("../components/decks/DecksDashboard.tsx");
  const discovery = source("../components/decks/DeckDiscoveryView.tsx");
  const pagination = source("../hooks/usePaginatedResource.ts");
  const mine = source("../components/decks/deck-list.tsx");
  assert.match(discovery, /resource\.error \? <BinderError/);
  assert.match(discovery, /onRetry=\{resource\.retry\}/);
  assert.match(pagination, /catch \{/);
  assert.match(pagination, /This section could not be loaded/);
  assert.match(dashboard, /view === "mine" \? <DeckList \/> : <DeckDiscoveryView/);
  assert.match(mine, /decksApi\s*\.list\(\)/);
  assert.doesNotMatch(mine, /deckDiscoveryApi|\/decks\/community|\/decks\/saved/);
});

test("public discovery cards open the authenticated public deck route without owner controls", () => {
  const card = source("../components/decks/DeckDiscoveryCard.tsx");
  const detail = source("../components/decks/deck-detail.tsx");
  const page = source("../app/profile/[userId]/decks/[deckId]/page.tsx");
  assert.match(card, /deckRoutes\.publicDetail\(deck\.owner\.id, deck\.id\)/);
  assert.match(page, /ownerId=\{params\.userId\}/);
  assert.match(detail, /deckDiscoveryApi\.publicDeck/);
  assert.match(detail, /deckDiscoveryApi\.publicDeckCards/);
  assert.match(detail, /!ownerId \? <div/);
  assert.match(detail, /!ownerId \? <DeckCoverPicker/);
});
