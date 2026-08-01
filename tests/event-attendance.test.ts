import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getAttendancePresentation,
  isVerifiedAttendance,
  normalizeAttendanceMethod,
} from "../lib/event-attendance.ts";
import { canSelectEventDeck } from "../lib/event-membership.ts";
import type { EventMyAttendance } from "../services/events.ts";

function attendance(
  values: Partial<EventMyAttendance> = {},
): EventMyAttendance {
  return {
    event_id: "event-id",
    attendance_method: "host",
    membership_state: "confirmed",
    attendance_status: "expected",
    verification_method: null,
    checked_in_at: null,
    check_in_state: "not_open",
    can_check_in: false,
    ...values,
  };
}

test("attendance modes normalize to exactly none, host, or qr", () => {
  assert.equal(normalizeAttendanceMethod("none"), "none");
  assert.equal(normalizeAttendanceMethod("host"), "host");
  assert.equal(normalizeAttendanceMethod("qr"), "qr");
  assert.equal(normalizeAttendanceMethod("legacy"), "none");
  assert.equal(normalizeAttendanceMethod(null), "none");
});

test("no verification is distinct from verified attendance", () => {
  const presentation = getAttendancePresentation({
    method: "none",
    attendance: attendance({
      attendance_method: "none",
      attendance_status: null,
      check_in_state: "not_required",
    }),
    confirmed: true,
    pending: false,
  });

  assert.equal(presentation.label, "No verification required");
  assert.equal(isVerifiedAttendance(attendance({
    attendance_status: null,
    verification_method: null,
  })), false);
});

test("player presentation covers pending, not-open, ready, and checked-in states", () => {
  assert.equal(getAttendancePresentation({
    method: "host",
    attendance: attendance({ check_in_state: "pending" }),
    confirmed: false,
    pending: true,
  }).label, "Request pending");

  assert.equal(getAttendancePresentation({
    method: "host",
    attendance: attendance({ check_in_state: "not_open" }),
    confirmed: true,
    pending: false,
  }).label, "Confirmed · check-in not open");

  assert.equal(getAttendancePresentation({
    method: "qr",
    attendance: attendance({
      attendance_method: "qr",
      check_in_state: "ready",
      can_check_in: true,
    }),
    confirmed: true,
    pending: false,
  }).label, "Confirmed · ready to check in");

  const checkedIn = attendance({
    attendance_status: "checked_in",
    verification_method: "qr",
    checked_in_at: "2026-08-01T10:00:00Z",
    check_in_state: "checked_in",
  });
  assert.equal(isVerifiedAttendance(checkedIn), true);
  assert.deepEqual(getAttendancePresentation({
    method: "qr",
    attendance: checkedIn,
    confirmed: true,
    pending: false,
  }), {
    label: "Checked in",
    detail: "Verified with QR",
  });
});

test("host controls are mode-specific and QR rows do not expose visual mutation", () => {
  const source = readFileSync(
    new URL("../components/events/EventAttendancePanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /attendanceMethod !== "host"/);
  assert.match(source, /attendanceMethod === "host" \? \(/);
  assert.match(source, /QR-only verification/);
});

test("deck access remains based on confirmed membership, not attendance", () => {
  assert.equal(canSelectEventDeck("confirmed"), true);
  assert.equal(canSelectEventDeck("pending"), false);
  assert.equal(canSelectEventDeck("not_joined"), false);

  const source = readFileSync(
    new URL("../components/events/EventUserPanels.tsx", import.meta.url),
    "utf8",
  );
  const start = source.indexOf("const canViewDecks =");
  const end = source.indexOf(";", start);
  const expression = source.slice(start, end);
  assert.match(expression, /\(isHost \|\| isPlaying\)/);
  assert.doesNotMatch(expression, /attendance/i);
});

test("frontend uses the canonical authenticated attendance endpoint", () => {
  const source = readFileSync(
    new URL("../services/events.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /\/attendance\/me/);
  assert.match(source, /status:\s*\| "expected"\s*\| "attended"/);
});
