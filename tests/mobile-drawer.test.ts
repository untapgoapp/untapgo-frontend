import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(
  new URL(
    "../components/layout/Header.tsx",
    import.meta.url,
  ),
  "utf8",
);

const drawer = source.slice(
  source.indexOf("{menuOpen ?"),
);

test("mobile drawer does not contain My events", () => {
  assert.doesNotMatch(drawer, />\s*My events\s*</);
});

test("mobile drawer does not contain My decks", () => {
  assert.doesNotMatch(drawer, />\s*My decks\s*</);
});

test("mobile drawer does not contain Profile", () => {
  assert.doesNotMatch(drawer, />\s*Profile\s*</);
});

test("mobile drawer has no duplicate Profile button", () => {
  assert.equal(
    (
      drawer.match(
        />\s*Profile\s*</g,
      ) ?? []
    ).length,
    0,
  );
});

test("mobile drawer retains Notifications", () => {
  assert.match(drawer, />\s*Notifications\s*</);
});
