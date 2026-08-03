import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function source(path: string) {
  return fs.readFileSync(path, "utf8");
}

test("profile update sends Magic profile fields to the backend", () => {
  const profiles = source("services/profiles.ts");

  assert.match(profiles, /playing_since_year:\s*payload\.playing_since_year/);
  assert.match(profiles, /first_set_name:\s*payload\.first_set_name/);
  assert.match(profiles, /favorite_colors:\s*payload\.favorite_colors/);
  assert.match(profiles, /favorite_formats:\s*payload\.favorite_formats/);
});

test("About renders all Magic preference labels independently", () => {
  const profile = source(
    "components/profile/social/SocialPlayerProfile.tsx",
  );

  assert.match(profile, /Playing since/);
  assert.match(profile, /Favorite colors/);
  assert.match(profile, /Favorite formats/);
  assert.match(profile, /getProfileFavoriteColors/);
  assert.match(profile, /getProfileFavoriteFormats/);
  assert.doesNotMatch(profile, /border-b border-border\/45/);
});

test("profile tabs no longer use a full-width enclosing divider", () => {
  const profile = source(
    "components/profile/social/SocialPlayerProfile.tsx",
  );

  assert.match(profile, /bg-primary-soft text-primary/);
  assert.doesNotMatch(profile, /overflow-x-auto border-b/);
});
