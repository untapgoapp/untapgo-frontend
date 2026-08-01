import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("authenticated shell renders one global top bar while the auth gate bypasses it", () => {
  const shell = source("../components/social-shell/SocialAppShell.tsx");
  const router = source("../components/social-shell/SocialLayoutRouter.tsx");
  const authLanding = source("../components/auth/AuthLanding.tsx");
  assert.equal((shell.match(/<SocialTopBar \/>/g) ?? []).length, 1);
  assert.match(router, /else content = <SocialAppShell/);
  assert.ok(router.indexOf("return <AuthGatePage>") < router.indexOf("<NotificationRealtimeProvider>"));
  assert.doesNotMatch(authLanding, /SocialTopBar|SocialAppShell/);
});

test("top bar contains real activity controls and no fake global search", () => {
  const topBar = source("../components/social-shell/SocialTopBar.tsx");
  assert.match(topBar, /data-social-top-bar/);
  assert.match(topBar, /href="\/home"/);
  assert.match(topBar, /<SocialMessagingMenu/);
  assert.match(topBar, /<NotificationBell \/>/);
  assert.match(topBar, /<SocialProfileMenu/);
  assert.doesNotMatch(topBar, /placeholder=.*Search|type="search"/);
});

test("desktop shell uses open three-column proportions and omits an empty right rail", () => {
  const shell = source("../components/social-shell/SocialAppShell.tsx");
  const rightRail = source("../components/social-shell/SocialRightSidebar.tsx");
  assert.match(shell, /max-w-\[1580px\]/);
  assert.match(shell, /232px_minmax\(0,1fr\)_304px/);
  assert.match(shell, /hasRightSidebar \?/);
  assert.match(shell, /\{hasRightSidebar \? \(/);
  assert.match(rightRail, /hidden xl:block/);
  assert.match(rightRail, /sticky top-16/);
});

test("notification popover shares live state and restores trigger focus", () => {
  const bell = source("../components/notifications/NotificationBell.tsx");
  const panel = source("../components/notifications/NotificationsPanel.tsx");
  assert.match(bell, /useNotifications\(\)/);
  assert.match(bell, /items\.slice\(0, 8\)/);
  assert.match(bell, /aria-haspopup="dialog"/);
  assert.match(bell, /event\.key === "Escape"/);
  assert.match(bell, /triggerRef\.current\?\.focus\(\)/);
  assert.match(bell, /wrapperRef\.current\?\.contains/);
  assert.match(panel, />\s*See all notifications\s*</);
  assert.match(panel, /href="\/notifications"/);
  assert.match(panel, /safe-area-inset-bottom/);
  assert.doesNotMatch(bell, /listNotifications|useNotificationRealtimeChannel|supabase\.channel/);
});

test("messaging panel lists only authorized Playgroup chat destinations", () => {
  const messages = source("../components/social-shell/SocialMessagingMenu.tsx");
  assert.match(messages, /getMyPlaygroups\("owned", 1\)/);
  assert.match(messages, /getMyPlaygroups\("joined", 1\)/);
  assert.match(messages, /\?section=chat/);
  assert.match(messages, /group\.name/);
  assert.match(messages, /aria-label="Open messages"/);
  assert.match(messages, /event\.key === "Escape"/);
  assert.match(messages, /triggerRef\.current\?\.focus\(\)/);
  assert.doesNotMatch(messages, /unread_count|supabase\.channel|setInterval|trade conversation/i);
});

test("Home right rail keeps real context and no longer duplicates Notifications", () => {
  const home = source("../app/home/page.tsx");
  const rail = source("../components/home/HomeRightSidebar.tsx");
  assert.match(home, /nextEvent \|\| \(pendingRequests \?\? 0\) > 0/);
  assert.match(rail, /Next event/);
  assert.match(rail, /Pending requests/);
  assert.doesNotMatch(rail, /Unread notifications|href="\/notifications"/);
});
