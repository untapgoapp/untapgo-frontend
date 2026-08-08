import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Supabase Realtime uses a worker and heartbeat failure recovery", () => {
  const client = read("lib/supabase/client.ts");
  const provider = read("components/realtime/RealtimeRecoveryProvider.tsx");
  assert.match(client, /worker: true/);
  assert.match(client, /heartbeatCallback/);
  assert.match(client, /REALTIME_HEARTBEAT_FAILED_EVENT/);
  assert.match(provider, /visibilitychange/);
  assert.match(provider, /pageshow/);
  assert.match(provider, /online/);
  assert.match(provider, /realtime\.setAuth/);
  assert.match(provider, /realtime\.connect\(\)/);
  assert.match(provider, /dispatchRealtimeRecovery/);
});

test("private Broadcast channels re-auth, retry with backoff, and reconcile after resume", () => {
  const hook = read("hooks/useResilientPrivateBroadcastChannel.ts");
  assert.ok(hook.indexOf("await supabase.realtime.setAuth") < hook.indexOf("supabase.channel(topic"));
  assert.match(hook, /config: \{ private: true/);
  assert.match(hook, /SUBSCRIBED/);
  assert.match(hook, /CHANNEL_ERROR/);
  assert.match(hook, /TIMED_OUT/);
  assert.match(hook, /CLOSED/);
  assert.match(hook, /2 \*\* Math\.min/);
  assert.match(hook, /REALTIME_RECOVERY_REQUESTED_EVENT/);
  assert.match(hook, /onRecovery/);
  assert.match(hook, /onSubscribed/);
});

test("direct, trade, Playgroup and inbox messaging use the resilient channel hook", () => {
  for (const path of [
    "components/messages/FloatingDirectChat.tsx",
    "components/messages/FloatingTradeChat.tsx",
    "components/messages/FloatingPlaygroupChat.tsx",
    "components/messages/DirectConversation.tsx",
    "components/binder/TradeConversation.tsx",
    "components/messages/DirectThreadsView.tsx",
    "components/messages/MessagingProvider.tsx",
  ]) {
    assert.match(read(path), /useResilientPrivateBroadcastChannel/);
  }
});

test("browser tab exposes unread messages in the title and favicon", () => {
  const indicator = read("components/messages/BrowserUnreadIndicator.tsx");
  const provider = read("components/messages/MessagingProvider.tsx");
  assert.match(indicator, /`\(\$\{unreadRef\.current\}\) \$\{baseTitleRef\.current\}`/);
  assert.match(indicator, /canvas\.toDataURL/);
  assert.match(indicator, /untapgo-message-favicon/);
  assert.match(provider, /BrowserUnreadIndicator unreadCount=\{unreadCount\}/);
});

test("the recovery provider is mounted once around notification and messaging providers", () => {
  const router = read("components/social-shell/SocialLayoutRouter.tsx");
  assert.equal((router.match(/<RealtimeRecoveryProvider>/g) ?? []).length, 1);
  assert.match(router, /<RealtimeRecoveryProvider>[\s\S]*<NotificationRealtimeProvider>[\s\S]*<MessagingProvider>/);
});
