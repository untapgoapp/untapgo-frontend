import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("public Binder links the owner identity back to the player profile", () => {
  const binder = source("../components/binder/PublicBinder.tsx");
  assert.match(binder, /href=\{`\/profile\/\$\{encodeURIComponent\(owner\.id\)\}`\}/);
  assert.match(binder, /aria-label=\{`View \$\{owner\.nickname\}'s profile`\}/);
  assert.match(binder, /\{owner\.nickname\}[\s\S]*?&apos;s Binder/);
});

test("directory pages do not repeat their section name as a purple kicker", () => {
  const binder = source("../components/binder/BinderDashboard.tsx");
  const players = source("../components/players/PlayersDashboard.tsx");
  const decks = source("../components/decks/DecksDashboard.tsx");

  assert.doesNotMatch(binder, />\s*Binder\s*<\/p>/);
  assert.doesNotMatch(players, />\s*Players\s*<\/p>/);
  assert.doesNotMatch(decks, />\s*Decks\s*<\/p>/);
});

test("public Binder cards pin the interest action to the bottom of equal-height rows", () => {
  const card = source("../components/binder/BinderCard.tsx");
  assert.match(card, /flex h-full min-w-0 flex-col/);
  assert.match(card, /flex flex-1 flex-col px-0\.5 pt-2\.5/);
  assert.match(card, /className="mt-auto pt-2\.5"/);
});
