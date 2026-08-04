import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("Binder cards use compact discovery grids and owner actions", () => {
  const card = source("../components/binder/BinderCard.tsx");
  const items = source("../components/binder/BinderItemsView.tsx");
  const community = source("../components/binder/CommunityBinderView.tsx");
  assert.match(card, /text-\[13px\]/);
  assert.match(card, /Remove from Binder/);
  assert.match(card, /Share card/);
  assert.match(items, /lg:grid-cols-4/);
  assert.match(community, /lg:grid-cols-4/);
  assert.match(items, /binderApi\.removeItem/);
});

test("exact Scryfall language variants drive Binder submissions", () => {
  const api = source("../lib/decks-api.ts");
  const form = source("../components/binder/BinderItemForm.tsx");
  const types = source("../types/decks.ts");
  assert.match(api, /printingLanguages/);
  assert.match(api, /\/cards\/\$\{encodeURIComponent\(cardId\)\}\/languages/);
  assert.match(types, /CardLanguageVariant/);
  assert.match(form, /Printed language/);
  assert.match(form, /scryfall_card_id: selectedCard\.id/);
  assert.match(form, /setSelectedCard\(variant\.card\)/);
});

test("Binder sharing and accepted trades are first-class routes", () => {
  const dashboard = source("../components/binder/BinderDashboard.tsx");
  const publicBinder = source("../components/binder/PublicBinder.tsx");
  const publicItem = source("../components/binder/PublicBinderItem.tsx");
  const navigation = source("../components/social-shell/navigation.ts");
  assert.match(dashboard, /Share Binder/);
  assert.match(publicBinder, /Share Binder/);
  assert.match(publicItem, /Share card/);
  assert.match(navigation, /Active trades/);
  assert.match(navigation, /\/trades/);
});

test("trade conversations use private Realtime and lifecycle controls", () => {
  const conversation = source("../components/binder/TradeConversation.tsx");
  const service = source("../services/binder.ts");
  const menu = source("../components/social-shell/SocialMessagingMenu.tsx");
  assert.match(conversation, /trade:\$\{threadId\}:chat/);
  assert.match(conversation, /config: \{ private: true/);
  assert.match(conversation, /trade_completed/);
  assert.match(conversation, /trade_cancelled/);
  assert.match(service, /sendTradeMessage/);
  assert.match(service, /markTradeRead/);
  assert.match(menu, /Playgroup and trade conversations/);
  assert.match(menu, /trade\.unread_count/);
});

test("trade notifications have social presentation", () => {
  const presentation = source("../lib/notification-presentation.ts");
  assert.match(presentation, /binder_trade_message/);
  assert.match(presentation, /binder_trade_completed/);
  assert.match(presentation, /binder_trade_cancelled/);
});
