import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  deckSectionHref,
  normalizeDecksView,
} from "../lib/deck-routes.ts";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Deck section routes normalize safely and preserve My Decks by default", () => {
  assert.equal(normalizeDecksView(undefined), "mine");
  assert.equal(normalizeDecksView("invalid"), "mine");
  assert.equal(normalizeDecksView("community"), "community");
  assert.equal(normalizeDecksView("mine"), "mine");
  assert.equal(normalizeDecksView("saved"), "saved");
  assert.equal(deckSectionHref("community"), "/decks?view=community");
  assert.equal(deckSectionHref("mine"), "/decks?view=mine");
  assert.equal(deckSectionHref("saved"), "/decks?view=saved");
});

test("Deck navigation exposes Community, My Decks and Saved Decks", () => {
  const navigation = source("../components/decks/DeckSectionNavigation.tsx");
  const page = source("../app/decks/page.tsx");
  assert.match(navigation, /label: "Community"/);
  assert.match(navigation, /label: "My Decks"/);
  assert.match(navigation, /label: "Saved Decks"/);
  assert.match(navigation, /aria-current=\{view === item\.view \? "page"/);
  assert.match(page, /normalizeDecksView\(query\.view\)/);
});

test("unsupported Deck views render no fake data and make no all-decks query", () => {
  const dashboard = source("../components/decks/DecksDashboard.tsx");
  const deckApi = source("../lib/decks-api.ts");
  assert.match(dashboard, /view === "mine"/);
  assert.match(dashboard, /Community Deck discovery is not available yet/);
  assert.match(dashboard, /Saved Decks are not available yet/);
  assert.doesNotMatch(dashboard, /decksApi|fetch\(|getPublicProfileDecks/);
  assert.match(deckApi, /"\/me\/decks"/);
  assert.doesNotMatch(deckApi, /\/decks\/community|\/decks\/saved|\/profiles.*\.map/);
});
