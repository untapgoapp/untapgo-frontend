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

test("Realtime auth token is applied before the one private channel subscribes", () => {
  const setAuth = realtime.indexOf("await supabase.realtime.setAuth(session.access_token)");
  const removeExisting = realtime.indexOf("await removeExistingTopicChannel(topic)");
  const channel = realtime.indexOf("channel = supabase.channel(topic");
  const subscribe = realtime.indexOf(".subscribe((nextStatus, subscriptionError)");

  assert.ok(setAuth >= 0);
  assert.ok(setAuth < removeExisting);
  assert.ok(removeExisting < channel);
  assert.ok(channel < subscribe);
  assert.equal((realtime.match(/supabase\.channel\(/g) ?? []).length, 1);
  assert.match(realtime, /config: \{ private: true/);
});

test("the topic and both Broadcast event names are exact", () => {
  assert.equal(playgroupChatTopic(GROUP_ID), `playgroup:${GROUP_ID}:chat`);
  assert.match(realtime, /event: "message"/);
  assert.match(realtime, /event: "message_deleted"/);
  assert.doesNotMatch(realtime, /postgres_changes/);
});

test("the UI becomes live only after SUBSCRIBED and logs complete failures", () => {
  const subscribed = realtime.indexOf('nextStatus === "SUBSCRIBED"');
  const connected = realtime.indexOf('setStatus("connected")', subscribed);

  assert.ok(subscribed >= 0 && connected > subscribed);
  assert.match(realtime, /CHANNEL_ERROR/);
  assert.match(realtime, /TIMED_OUT/);
  assert.match(realtime, /CLOSED/);
  assert.match(realtime, /subscriptionError/);
  assert.match(realtime, /connectionState/);
  assert.match(realtime, /sessionAvailable/);
  assert.match(realtime, /tokenApplied/);
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

test("Strict Mode setup removes an existing topic channel and cleanup removes the active channel", () => {
  assert.match(realtime, /channelRemovalByTopic/);
  assert.match(realtime, /supabase\.getChannels\(\)\.find/);
  assert.match(realtime, /await supabase\.removeChannel\(channel\)/);
  assert.match(realtime, /authListener\.subscription\.unsubscribe\(\)/);
  assert.match(realtime, /removeCurrentChannel\(\)/);
});

test("membership loss and auth logout unsubscribe while token refresh reapplies auth", () => {
  assert.match(chat, /enabled: membershipState === "owner" \|\| membershipState === "joined"/);
  assert.match(realtime, /onAuthStateChange/);
  assert.match(realtime, /TOKEN_REFRESHED/);
  assert.match(realtime, /!session \|\| session\.user\.id !== viewerId[\s\S]*removeCurrentChannel\(\)/);
});

test("reconnect closes history gaps and a Realtime failure preserves REST history", () => {
  assert.match(realtime, /nextStatus === "SUBSCRIBED"[\s\S]*handlers\.current\.onReconnect\(\)/);
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
