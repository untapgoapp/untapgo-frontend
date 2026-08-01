import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  Bell,
  CalendarClock,
  CalendarX,
  CircleCheck,
  CircleX,
  MessageSquare,
  UserMinus,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
  Users,
} from "lucide-react";

import {
  getNotificationActivityCopy,
  getNotificationHref,
  getNotificationPresentation,
} from "../lib/notification-presentation.ts";
import {
  applyNotificationChange,
  mergeNotificationPage,
  notificationRealtimeTopic,
  parseClearedBroadcast,
  parseDeletedBroadcast,
  parseNotificationBroadcast,
} from "../lib/notification-live.ts";
import type { NotificationItem } from "../services/notifications.ts";

function notification(
  type: string,
  values: Partial<NotificationItem> = {},
): NotificationItem {
  return {
    id: `notification-${type}`,
    type,
    title: "Notification title",
    body: "Backend-provided body.",
    meta: null,
    is_read: false,
    created_at: "2026-08-01T10:00:00Z",
    ...values,
  };
}

test("social and Playgroups notification types use their expected presentation", () => {
  const expected = [
    ["player_followed", UserPlus, "social", "primary", false],
    ["playgroup_join_requested", UserPlus, "playgroup", "primary", true],
    ["playgroup_request_approved", UserRoundCheck, "playgroup", "positive", false],
    ["playgroup_request_rejected", UserRoundX, "playgroup", "neutral", false],
    ["playgroup_post_commented", MessageSquare, "playgroup", "primary", false],
  ] as const;

  for (const [type, icon, category, tone, requiresAttention] of expected) {
    assert.deepEqual(getNotificationPresentation(type), {
      icon,
      category,
      tone,
      requiresAttention,
    });
  }
});

test("supported social activity uses the backend-provided body", () => {
  for (const type of [
    "player_followed",
    "playgroup_join_requested",
    "playgroup_request_approved",
    "playgroup_request_rejected",
    "playgroup_post_commented",
  ]) {
    assert.deepEqual(getNotificationActivityCopy(notification(type)), {
      primary: "Backend-provided body.",
    });
  }
});

test("each supported internal href is preserved exactly", () => {
  const paths = {
    player_followed: "/profile/player-id",
    playgroup_join_requested: "/playgroups/group-one",
    playgroup_request_approved: "/playgroups/group-two?view=members",
    playgroup_request_rejected: "/playgroups/group-three#members",
    playgroup_post_commented: "/playgroups/group-four?section=wall&post=post-id",
  };

  for (const [type, href] of Object.entries(paths)) {
    assert.equal(getNotificationHref(notification(type, { meta: { href } })), href);
  }
});

test("invalid external or malformed hrefs fall back safely", () => {
  for (const href of [
    "https://example.com/profile/player-id",
    "//example.com/playgroups/group-id",
    "/\\example.com/playgroups/group-id",
    "javascript:alert(1)",
  ]) {
    assert.equal(
      getNotificationHref(notification("player_followed", { meta: { href } })),
      "/notifications",
    );
  }

  assert.equal(
    getNotificationHref(notification("event_updated", {
      event_id: "event/id",
      meta: { href: "https://example.com" },
    })),
    "/events/event%2Fid",
  );
  assert.equal(
    getNotificationHref(notification("playgroup_request_approved")),
    "/notifications",
  );
});

test("unknown and malformed notification types remain generic", () => {
  assert.deepEqual(getNotificationPresentation("future_notification"), {
    icon: Bell,
    category: "generic",
    tone: "neutral",
    requiresAttention: false,
  });
  assert.equal(
    getNotificationPresentation(null).icon,
    Bell,
  );
});

test("existing event notification presentation remains unchanged", () => {
  const expected = [
    ["join_request_received", UserPlus, "primary"],
    ["player_joined", Users, "primary"],
    ["request_accepted", CircleCheck, "positive"],
    ["request_declined", CircleX, "negative"],
    ["kicked", UserMinus, "negative"],
    ["event_cancelled", CalendarX, "negative"],
    ["event_updated", CalendarClock, "warning"],
  ] as const;

  for (const [type, icon, tone] of expected) {
    const presentation = getNotificationPresentation(type);
    assert.equal(presentation.icon, icon);
    assert.equal(presentation.category, "event");
    assert.equal(presentation.tone, tone);
    assert.equal(presentation.requiresAttention, false);
  }
});

test("Home navigation does not mark notifications as read", () => {
  const source = readFileSync(new URL("../app/home/page.tsx", import.meta.url), "utf8");
  assert.match(source, /router\.push\(getNotificationHref\(notification\)\)/);
  assert.doesNotMatch(source, /markNotificationRead/);
});

test("Notifications marks an unread item through shared state before navigating", () => {
  const source = readFileSync(new URL("../app/notifications/page.tsx", import.meta.url), "utf8");
  const start = source.indexOf("async function openNotification");
  const end = source.indexOf("async function removeNotification", start);
  const handler = source.slice(start, end);

  assert.ok(handler.indexOf("notifications.markRead") >= 0);
  assert.ok(handler.indexOf("notifications.markRead") < handler.indexOf("router.push"));
});

test("push notification hrefs are restricted to the application origin", () => {
  const source = readFileSync(
    new URL("../app/firebase-messaging-sw.js/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /parsed\.origin === self\.location\.origin/);
  assert.match(source, /code === 92/);
  assert.match(source, /return eventId \? "\/events\/"/);
});

test("notification Realtime uses the recipient-only topic and validates canonical payloads", () => {
  const userId = "20000000-0000-4000-8000-000000000001";
  const item = notification("player_followed", {
    id: "50000000-0000-4000-8000-000000000001",
    event_id: null,
  });

  assert.equal(notificationRealtimeTopic(userId), `user:${userId}:notifications`);
  assert.equal(notificationRealtimeTopic("not-a-user-id"), null);
  assert.deepEqual(parseNotificationBroadcast(item), item);
  assert.equal(parseNotificationBroadcast({ ...item, id: "bad" }), null);
  assert.equal(parseNotificationBroadcast({ ...item, meta: { href: 42 } }), null);
});

test("live notification state updates immediately and deduplicates repeated events", () => {
  const first = notification("player_followed", {
    id: "50000000-0000-4000-8000-000000000001",
    created_at: "2026-08-01T10:00:00Z",
  });
  const newer = notification("playgroup_post_commented", {
    id: "50000000-0000-4000-8000-000000000002",
    created_at: "2026-08-01T10:01:00Z",
  });
  let state = { unread_count: 1, items: [first] };

  state = applyNotificationChange(
    state,
    { kind: "created", notification: newer },
    5,
  );
  assert.equal(state.unread_count, 2);
  assert.deepEqual(state.items.map((item) => item.id), [newer.id, first.id]);

  state = applyNotificationChange(
    state,
    { kind: "created", notification: newer },
    5,
  );
  assert.equal(state.unread_count, 2);
  assert.equal(state.items.filter((item) => item.id === newer.id).length, 1);
});

test("read, delete, and bulk events update shared live state without refetching", () => {
  const unread = notification("player_followed", {
    id: "50000000-0000-4000-8000-000000000001",
  });
  let state = applyNotificationChange(
    { unread_count: 1, items: [unread] },
    { kind: "updated", notification: { ...unread, is_read: true } },
    5,
  );

  assert.equal(state.unread_count, 0);
  assert.equal(state.items[0]?.is_read, true);
  state = applyNotificationChange(state, { kind: "deleted", notificationId: unread.id });
  assert.deepEqual(state.items, []);

  const eventNotice = notification("request_accepted", {
    id: "50000000-0000-4000-8000-000000000002",
    event_id: "70000000-0000-4000-8000-000000000001",
  });
  state = applyNotificationChange(
    { unread_count: 1, items: [eventNotice] },
    { kind: "mark_event_read", eventId: eventNotice.event_id!, updated: 1 },
  );
  assert.equal(state.unread_count, 0);
  assert.equal(state.items[0]?.is_read, true);
  assert.deepEqual(parseDeletedBroadcast({ id: unread.id }), {
    kind: "deleted", notificationId: unread.id,
  });
  assert.deepEqual(parseClearedBroadcast({ action: "mark_all_read", updated: 4 }), {
    kind: "mark_all_read", updated: 4,
  });
});

test("REST reconciliation deduplicates and preserves already loaded notification pages", () => {
  const first = notification("player_followed", { id: "50000000-0000-4000-8000-000000000001" });
  const second = notification("player_joined", { id: "50000000-0000-4000-8000-000000000002" });
  const state = mergeNotificationPage(
    { unread_count: 1, items: [first] },
    { unread_count: 2, items: [second, first] },
  );
  assert.equal(state.unread_count, 2);
  assert.deepEqual(new Set(state.items.map((item) => item.id)), new Set([first.id, second.id]));
});

test("one private provider applies auth, handles four events, reconnects, and cleans up", () => {
  const channel = readFileSync(
    new URL("../components/notifications/useNotificationRealtimeChannel.ts", import.meta.url),
    "utf8",
  );
  const provider = readFileSync(new URL("../components/notifications/NotificationRealtimeProvider.tsx", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../components/social-shell/SocialLayoutRouter.tsx", import.meta.url), "utf8");
  const home = readFileSync(new URL("../app/home/page.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/notifications/page.tsx", import.meta.url), "utf8");
  const bell = readFileSync(new URL("../components/notifications/NotificationBell.tsx", import.meta.url), "utf8");

  assert.ok(channel.indexOf("realtime.setAuth(accessToken)") < channel.indexOf("supabase.channel(topic"));
  assert.equal((channel.match(/supabase\.channel\(/g) ?? []).length, 1);
  assert.match(channel, /private: true/);
  assert.match(channel, /NOTIFICATION_CREATED_EVENT/);
  assert.match(channel, /NOTIFICATION_UPDATED_EVENT/);
  assert.match(channel, /NOTIFICATION_DELETED_EVENT/);
  assert.match(channel, /NOTIFICATIONS_CLEARED_EVENT/);
  assert.match(channel, /nextStatus === "SUBSCRIBED"/);
  assert.match(channel, /CHANNEL_ERROR/);
  assert.match(channel, /TIMED_OUT/);
  assert.match(channel, /CLOSED/);
  assert.match(channel, /removeExistingTopicChannel\(topic\)/);
  assert.match(channel, /removeChannel\(channel\)/);
  assert.doesNotMatch(channel, /\.from\(/);
  assert.match(provider, /onAuthStateChange/);
  assert.match(provider, /setState\(emptyState\)/);
  assert.match(provider, /onReconnect: \(\) => \{ void refresh\(\); \}/);
  assert.equal((shell.match(/<NotificationRealtimeProvider>/g) ?? []).length, 1);
  assert.ok(shell.indexOf("AuthGatePage") < shell.indexOf("<NotificationRealtimeProvider>"));
  for (const source of [home, page, bell]) assert.match(source, /useNotifications/);
  for (const source of [home, page, bell]) assert.doesNotMatch(source, /setInterval|visibilitychange/);
});

test("provider emits one presentation-aware toast only for a genuinely new creation", () => {
  const provider = readFileSync(new URL("../components/notifications/NotificationRealtimeProvider.tsx", import.meta.url), "utf8");
  const toast = readFileSync(new URL("../components/notifications/NotificationToastViewport.tsx", import.meta.url), "utf8");
  assert.match(provider, /change\.kind === "created"/);
  assert.match(provider, /knownIds\.current\.has/);
  assert.match(provider, /toastedIds\.current\.has/);
  assert.match(provider, /for \(const item of latest\.items\) knownIds\.current\.add/);
  assert.match(toast, /getNotificationPresentation/);
  assert.match(toast, /getNotificationHref/);
  assert.match(toast, /onDismiss/);
  assert.doesNotMatch(toast, /notification\.type ===/);
});

test("Realtime failure preserves REST state and public auth landing mounts no provider", () => {
  const provider = readFileSync(new URL("../components/notifications/NotificationRealtimeProvider.tsx", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../components/social-shell/SocialLayoutRouter.tsx", import.meta.url), "utf8");
  const catchBlock = provider.slice(provider.indexOf("catch {"), provider.indexOf("finally", provider.indexOf("catch {")));
  assert.match(catchBlock, /setError/);
  assert.doesNotMatch(catchBlock, /setState/);
  const authGate = shell.slice(shell.indexOf('if (["/"'), shell.indexOf("let content"));
  assert.match(authGate, /return <AuthGatePage>/);
  assert.doesNotMatch(authGate, /NotificationRealtimeProvider/);
});
