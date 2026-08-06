import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("messaging provider is mounted once around social content", () => {
  const router = read("components/social-shell/SocialLayoutRouter.tsx");
  assert.equal((router.match(/<MessagingProvider>/g) ?? []).length, 1);
  assert.match(router, /<NotificationRealtimeProvider>[\s\S]*<MessagingProvider>/);
});

test("messages menu opens floating conversations instead of navigating", () => {
  const menu = read("components/social-shell/SocialMessagingMenu.tsx");
  assert.match(menu, /messaging\.openConversation\(item\)/);
  assert.doesNotMatch(menu, /href=\{`\/messages\//);
  assert.doesNotMatch(menu, /href=\{`\/trades\//);
});

test("floating dock supports direct, trade and Playgroup conversations", () => {
  const dock = read("components/messages/MessagingDock.tsx");
  assert.match(dock, /FloatingDirectChat/);
  assert.match(dock, /FloatingTradeChat/);
  assert.match(dock, /FloatingPlaygroupChat/);
  assert.match(dock, /Minimize conversation/);
});

test("message notification types are excluded from the bell", () => {
  const notifications = read("services/notifications.ts");
  assert.match(notifications, /direct_message/);
  assert.match(notifications, /binder_trade_message/);
  assert.match(notifications, /playgroup_chat_message/);
  assert.match(notifications, /isBellNotification/);
});

test("foreground push routes message activity to Messages", () => {
  const bootstrap = read("components/pwa/PwaBootstrap.tsx");
  assert.match(bootstrap, /MESSAGING_REFRESH_REQUESTED_EVENT/);
  assert.match(bootstrap, /conversation_type/);
  assert.match(bootstrap, /sameOpenConversation/);
});
