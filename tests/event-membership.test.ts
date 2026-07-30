import assert from "node:assert/strict";
import test from "node:test";

import {
  canRequestEventSeat,
  canSelectEventDeck,
  getEventMembershipState,
  isConfirmedMembership,
} from "../lib/event-membership.ts";

test("new join request is pending even when a legacy boolean is wrong", () => {
  const state = getEventMembershipState({
    status: "pending",
    legacyIsJoined: true,
    legacyIsPlaying: true,
  });

  assert.equal(state, "pending");
  assert.equal(isConfirmedMembership(state), false);
});

test("pending membership does not enable deck selection", () => {
  assert.equal(canSelectEventDeck("pending"), false);
});

test("pending membership is not counted as confirmed", () => {
  assert.equal(isConfirmedMembership("pending"), false);
});

test("host acceptance makes membership confirmed", () => {
  assert.equal(
    getEventMembershipState({
      status: "joined",
      legacyIsPlaying: true,
    }),
    "confirmed",
  );
});

test("confirmed membership enables deck selection", () => {
  assert.equal(canSelectEventDeck("confirmed"), true);
});

test("cancelled request returns to a non-confirmed state", () => {
  const state = getEventMembershipState({
      status: "cancelled",
      legacyIsPlaying: false,
  });

  assert.equal(state, "cancelled");
  assert.equal(canRequestEventSeat(state), true);
});

test("QR walk-in joined status remains a direct confirmed join", () => {
  assert.equal(
    getEventMembershipState({
      status: "joined",
      legacyIsJoined: true,
    }),
    "confirmed",
  );
});
