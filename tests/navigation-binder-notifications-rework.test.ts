import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("public Binder keeps history-aware Back while the normal profile view stays clean", () => {
  const back = source("../components/navigation/HistoryBackLink.tsx");
  const profile = source("../app/profile/[userId]/page.tsx");
  const binder = source("../components/binder/PublicBinder.tsx");

  assert.match(back, /router\.back\(\)/);
  assert.match(back, />\s*Back\s*</);
  assert.match(binder, /<HistoryBackLink fallbackHref="\/binder"/);
  assert.doesNotMatch(profile, /<HistoryBackLink fallbackHref="\/players" className="mt-4"/);
  assert.doesNotMatch(profile, /Back to events/i);
  assert.doesNotMatch(binder, /Back to Profile/i);
});

test("Community Binder rows are open surfaces with a quiet Open link", () => {
  const card = source("../components/binder/CommunityBinderCard.tsx");
  assert.match(card, /group min-w-0 py-2/);
  assert.match(card, />\s*Open\s*/);
  assert.match(card, /ArrowRight/);
  assert.doesNotMatch(card, /Open Binder/);
  assert.doesNotMatch(card, /<Button/);
});

test("Blocked users live in Settings rather than the profile dropdown", () => {
  const menu = source("../components/social-shell/SocialProfileMenu.tsx");
  const settings = source("../app/settings/page.tsx");
  const navigation = source("../components/social-shell/navigation.ts");

  assert.doesNotMatch(menu, /Blocked players|ShieldBan/);
  assert.match(settings, /Blocked users/);
  assert.match(settings, /\/profile\/blocked/);
  assert.match(navigation, /atRoot\(pathname, "\/profile\/blocked"\)/);
});

test("Binder interests include requested copy quantity end to end", () => {
  const dialog = source("../components/binder/InterestDialog.tsx");
  const api = source("../services/binder.ts");
  const types = source("../lib/binder.ts");

  assert.match(dialog, /Number of copies/);
  assert.match(dialog, /max=\{available\}/);
  assert.match(dialog, /onSubmit\(type, requestedQuantity, message\.trim\(\) \|\| null\)/);
  assert.match(api, /createInterest:\s*\([\s\S]*itemId: string,[\s\S]*interestType: InterestType,[\s\S]*quantity: number/);
  assert.match(api, /quantity: Math\.max\(1, Math\.trunc\(quantity\)\)/);
  assert.match(types, /quantity: number/);
  assert.match(types, /requested_quantity: number/);
});

test("Playgroup messages and push diagnostics connect to the notification surfaces", () => {
  const presentation = source("../lib/notification-presentation.ts");
  const push = source("../services/push.ts");
  const button = source("../components/notifications/PushPermissionButton.tsx");
  const bootstrap = source("../components/pwa/PwaBootstrap.tsx");

  assert.match(presentation, /playgroup_chat_message/);
  assert.match(push, /\/me\/push-token\/test/);
  assert.match(button, /Send test/);
  assert.match(button, /PUSH_BACKEND_NOT_CONFIGURED/);
  assert.match(bootstrap, /showNotification/);
  assert.match(bootstrap, /requestNotificationsRefresh/);
});
