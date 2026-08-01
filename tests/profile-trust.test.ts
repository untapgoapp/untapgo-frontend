import assert from "node:assert/strict";
import test from "node:test";

import {
  buildProfileTrustPath,
  formatTrustRate,
  getHostTrustText,
  getPlayerTrustText,
  type HostTrustSummary,
  type PlayerTrustSummary,
} from "../lib/profile-trust.ts";

function player(
  values: Partial<PlayerTrustSummary> = {},
): PlayerTrustSummary {
  return {
    eligible_events: 8,
    verified_attendances: 7,
    rate: 0.875,
    display_state: "available",
    ...values,
  };
}

function host(
  values: Partial<HostTrustSummary> = {},
): HostTrustSummary {
  return {
    eligible_events: 5,
    completed_events: 4,
    cancelled_events: 1,
    rate: 0.8,
    display_state: "available",
    ...values,
  };
}

test("trust summary uses the authenticated privacy-safe profile endpoint", () => {
  assert.equal(
    buildProfileTrustPath("profile/id"),
    "/profiles/profile%2Fid/trust",
  );
});

test("player reliability displays verified sample size and rate", () => {
  assert.equal(
    getPlayerTrustText(player()),
    "Verified at 7 of 8 eligible events.",
  );
  assert.equal(formatTrustRate(0.875, "available"), "88%");
});

test("host reliability remains separate from attendance", () => {
  assert.equal(
    getHostTrustText(host()),
    "Hosted 4 completed events out of 5 eligible. 1 cancelled.",
  );
  assert.equal(formatTrustRate(0.8, "available"), "80%");
});

test("small samples show counts without a percentage", () => {
  const smallPlayer = player({
    eligible_events: 2,
    verified_attendances: 2,
    rate: null,
    display_state: "not_enough_data",
  });
  const smallHost = host({
    eligible_events: 1,
    completed_events: 1,
    cancelled_events: 0,
    rate: null,
    display_state: "not_enough_data",
  });

  assert.equal(
    getPlayerTrustText(smallPlayer),
    "Not enough verified activity yet · 2 eligible events",
  );
  assert.equal(
    getHostTrustText(smallHost),
    "Not enough hosting activity yet · 1 eligible event",
  );
  assert.equal(formatTrustRate(null, "not_enough_data"), null);
});

test("private summaries do not format a public rate", () => {
  assert.equal(formatTrustRate(1, "private"), null);
  assert.equal(
    getPlayerTrustText(player({ display_state: "private" })),
    "Verified attendance is private.",
  );
  assert.equal(
    getHostTrustText(host({ display_state: "private" })),
    "Host activity is private.",
  );
});

test("presentation copy contains no ratings, stars, or moral labels", () => {
  const copy = `${getPlayerTrustText(player())} ${getHostTrustText(host())}`.toLowerCase();

  for (const prohibited of ["star", "rating", "trustworthy", "untrustworthy", "good", "bad"]) {
    assert.equal(copy.includes(prohibited), false);
  }
});
