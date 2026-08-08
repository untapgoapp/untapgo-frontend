import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("direct messages are limited to Connections and exposed from profiles", () => {
  const button = read("components/profile/DirectMessageButton.tsx");
  const panel = read("components/profile/ProfileActionsPanel.tsx");
  assert.match(button, /relationship\.is_mutual/);
  assert.match(button, /directMessagesApi\.start/);
  assert.match(panel, /DirectMessageButton/);
});

test("direct conversation uses resilient private Realtime and read tracking", () => {
  const conversation = read("components/messages/DirectConversation.tsx");
  const realtime = read("hooks/useResilientPrivateBroadcastChannel.ts");
  assert.match(conversation, /direct:\$\{conversationId\}:chat/);
  assert.match(conversation, /useResilientPrivateBroadcastChannel/);
  assert.match(realtime, /config: \{ private: true/);
  assert.match(realtime, /CHANNEL_ERROR/);
  assert.match(realtime, /TIMED_OUT/);
  assert.match(conversation, /markRead/);
  assert.match(conversation, /message_deleted/);
});

test("global messaging provider includes direct conversations, live updates, and unread badges", () => {
  const provider = read("components/messages/MessagingProvider.tsx");
  const menu = read("components/social-shell/SocialMessagingMenu.tsx");
  assert.match(provider, /directMessagesApi\.conversations/);
  assert.match(provider, /conversation_updated/);
  assert.match(provider, /unreadCount/);
  assert.match(menu, /messaging\.conversations/);
  assert.match(menu, /messaging\.unreadCount/);
});
