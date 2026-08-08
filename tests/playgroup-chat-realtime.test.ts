import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  deletedChatMessage,
  mergeChatMessages,
  playgroupChatTopic,
  type PlaygroupChatMessage,
} from "../lib/playgroup-communications.ts";

const GROUP_ID = "10000000-0000-4000-8000-000000000001";
const MESSAGE_ID = "40000000-0000-4000-8000-000000000001";

const realtime = readFileSync(
  new URL("../components/playgroups/usePlaygroupChatRealtime.ts", import.meta.url),
  "utf8",
);
const sharedRealtime = readFileSync(
  new URL("../hooks/useResilientPrivateBroadcastChannel.ts", import.meta.url),
  "utf8",
);
const chat = readFileSync(
  new URL("../components/playgroups/PlaygroupChat.tsx", import.meta.url),
  "utf8",
);
const status = readFileSync(
  new URL("../components/playgroups/PlaygroupChatStatus.tsx", import.meta.url),
  "utf8",
);
const history = readFileSync(
  new URL("../components/playgroups/usePlaygroupChatHistory.ts", import.meta.url),
  "utf8",
);
const policy = readFileSync(
  new URL(
    "../../untapgo_backend/supabase/migrations/20260802020000_create_playgroup_communications.sql",
    import.meta.url,
  ),
  "utf8",
).toLowerCase();

function message(body = "Hello"): PlaygroupChatMessage {
  return {
    id: MESSAGE_ID,
    playgroup_id: GROUP_ID,
    sender: {
      id: "00000000-0000-4000-8000-000000000001",
      nickname: "Owner",
      avatar_url: null,
    },
    body,
    created_at: "2026-08-01T12:00:00Z",
  };
}

test("Realtime auth token is applied before the shared private channel subscribes", () => {
  const setAuth = sharedRealtime.indexOf("await supabase.realtime.setAuth(data.session.access_token)");
  const channel = sharedRealtime.indexOf("supabase.channel(topic");
  const subscribe = sharedRealtime.indexOf("nextChannel.subscribe((nextStatus, subscriptionError)");

  assert.ok(setAuth >= 0);
  assert.ok(setAuth < channel);
  assert.ok(channel < subscribe);
  assert.equal((sharedRealtime.match(/supabase\.channel\(/g) ?? []).length, 1);
  assert.match(sharedRealtime, /config: \{ private: true/);
  assert.match(realtime, /useResilientPrivateBroadcastChannel/);
});

test("the topic and both Broadcast event names are exact", () => {
  assert.equal(playgroupChatTopic(GROUP_ID), `playgroup:${GROUP_ID}:chat`);
  assert.match(realtime, /message: \(payload: unknown\)/);
  assert.match(realtime, /message_deleted: \(payload: unknown\)/);
  assert.doesNotMatch(realtime, /postgres_changes/);
});

test("the UI becomes live only after SUBSCRIBED and shared failures retry", () => {
  const subscribed = sharedRealtime.indexOf('nextStatus === "SUBSCRIBED"');
  const connected = sharedRealtime.indexOf('setStatus("connected")', subscribed);

  assert.ok(subscribed >= 0 && connected > subscribed);
  assert.match(sharedRealtime, /CHANNEL_ERROR/);
  assert.match(sharedRealtime, /TIMED_OUT/);
  assert.match(sharedRealtime, /CLOSED/);
  assert.match(sharedRealtime, /subscriptionError/);
  assert.match(sharedRealtime, /connectionState/);
  assert.match(sharedRealtime, /scheduleRetry/);
  assert.match(status, /realtimeStatus === "connected"[\s\S]*Live conversation/);
});

test("new and deleted Broadcast payloads update local state immediately", () => {
  assert.match(chat, /handleRealtimeMessage[\s\S]*upsertMessage\(message\)/);
  assert.match(chat, /handleDeletedMessage[\s\S]*upsertMessage\(deletedChatMessage\(message\)\)/);
  assert.deepEqual(mergeChatMessages([], [message()]), [message()]);
  assert.equal(
    mergeChatMessages([message()], [deletedChatMessage(message())])[0]?.body,
    "Message removed",
  );
});

test("POST, Broadcast, and REST copies render once by canonical ID", () => {
  const canonical = message();
  const merged = mergeChatMessages([canonical], [canonical, canonical]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.id, MESSAGE_ID);
  assert.match(chat, /knownIdsRef\.current\.has\(message\.id\)/);
});

test("shared Realtime cleanup removes active channels and auth listeners", () => {
  assert.match(sharedRealtime, /removeCurrentChannel/);
  assert.match(sharedRealtime, /supabase\.removeChannel\(current\)/);
  assert.match(sharedRealtime, /authListener\.subscription\.unsubscribe\(\)/);
  assert.match(sharedRealtime, /REALTIME_RECOVERY_REQUESTED_EVENT/);
});

test("membership loss and auth logout unsubscribe while token refresh reapplies auth", () => {
  assert.match(chat, /enabled: membershipState === "owner" \|\| membershipState === "joined"/);
  assert.match(sharedRealtime, /onAuthStateChange/);
  assert.match(sharedRealtime, /TOKEN_REFRESHED/);
  assert.match(sharedRealtime, /!nextSession \|\| nextSession\.user\.id !== userId[\s\S]*removeCurrentChannel\(\)/);
});

test("reconnect closes history gaps and a Realtime failure preserves REST history", () => {
  assert.match(realtime, /onSubscribed: \(reason\)[\s\S]*onReconnect\(\)/);
  assert.match(realtime, /onRecovery: onReconnect/);
  assert.match(chat, /handleReconnect[\s\S]*refreshLatest\(\)/);
  assert.doesNotMatch(history, /catch[\s\S]{0,200}setItems\(\[\]\)/);
});

test("Realtime RLS is topic-scoped to owner and joined membership", () => {
  const realtimePolicy = policy.split(
    "create policy playgroup_chat_private_broadcast_receive",
    2,
  )[1] ?? "";
  assert.match(realtimePolicy, /on realtime\.messages/);
  assert.match(realtimePolicy, /for select/);
  assert.match(realtimePolicy, /to authenticated/);
  assert.match(realtimePolicy, /realtime\.topic\(\)/);
  assert.match(realtimePolicy, /is_playgroup_participant/);
  assert.match(policy, /pm\.status = 'joined'/);
  assert.match(policy, /pm\.role in \('owner', 'member'\)/);
  assert.doesNotMatch(realtimePolicy, /using \(\s*true\s*\)/);
});
