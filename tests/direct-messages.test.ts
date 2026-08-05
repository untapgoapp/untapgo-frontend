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

test("direct conversation uses private Realtime and read tracking", () => {
  const conversation = read("components/messages/DirectConversation.tsx");
  assert.match(conversation, /direct:\$\{conversationId\}:chat/);
  assert.match(conversation, /private: true/);
  assert.match(conversation, /markRead/);
  assert.match(conversation, /message_deleted/);
});

test("global message menu includes direct conversations and unread badges", () => {
  const menu = read("components/social-shell/SocialMessagingMenu.tsx");
  assert.match(menu, />Direct</);
  assert.match(menu, /directMessagesApi\.conversations/);
  assert.match(menu, /conversation_updated/);
  assert.match(menu, /unreadCount/);
});
