import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function source(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("profile edit supports automatic and manual location", () => {
  const picker = source("components/location/ProfileLocationPicker.tsx");
  const edit = source("app/profile/edit/page.tsx");

  assert.match(picker, /Use current location/);
  assert.match(picker, /Enter manually/);
  assert.match(picker, /State \/ Region/);
  assert.match(picker, /Who can see this\?/);
  assert.match(picker, /Use for nearby results/);
  assert.match(picker, /enableHighAccuracy: false/);
  assert.match(edit, /updateMyProfileLocation/);
  assert.match(edit, /removeMyProfileLocation/);
});

test("public profile and player directory show privacy-safe location", () => {
  const profile = source("components/profile/social/SocialPlayerProfile.tsx");
  const player = source("components/players/PlayerDirectoryRow.tsx");

  assert.match(profile, /getProfileLocationDisplay/);
  assert.match(profile, /AboutRow label="Location"/);
  assert.match(player, /player\.location\?\.display_name/);
});
