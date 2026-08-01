import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  friendlyAuthError,
  getSafeNextPath,
  isAuthEntryRoute,
  isExistingSignupUser,
  isProtectedRoute,
  normalizeAuthMode,
} from "../lib/auth.ts";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

test("the public root renders the focused authentication landing", () => {
  const page = source("../app/page.tsx");
  const landing = source("../components/auth/AuthLanding.tsx");
  assert.match(page, /<AuthLanding/);
  assert.match(landing, /data-auth-landing/);
  assert.match(landing, /Your Magic community, all in one place\./);
  assert.match(landing, /Find players, join games and keep your Magic community together\./);
  assert.doesNotMatch(landing, /SocialAppShell|SocialBottomNavigation|SocialDesktopSidebar/);
});

test("authenticated auth-entry requests redirect early to home", () => {
  const proxy = source("../proxy.ts");
  assert.equal(isAuthEntryRoute("/"), true);
  assert.equal(isAuthEntryRoute("/login"), true);
  assert.equal(isAuthEntryRoute("/signup"), true);
  assert.match(proxy, /supabase\.auth\.getClaims\(\)/);
  assert.match(proxy, /authenticated && isAuthEntryRoute\(pathname\)/);
  assert.match(proxy, /destination\.pathname = "\/home"/);
});

test("login and signup submit through the existing Supabase auth flow", () => {
  const panel = source("../components/auth/AuthPanel.tsx");
  assert.match(panel, /supabase\.auth\.signInWithPassword/);
  assert.match(panel, /supabase\.auth\.signUp/);
  assert.match(panel, /supabase\.auth\.signInWithOAuth/);
  assert.match(panel, /provider: "google"/);
  assert.match(panel, /if \(pending\) return/);
  assert.match(panel, /disabled=\{Boolean\(pending\)\}/);
});

test("auth errors are friendly and never expose provider details", () => {
  assert.equal(
    friendlyAuthError({ code: "invalid_credentials", message: "raw provider detail" }, "login"),
    "Email or password is incorrect.",
  );
  assert.equal(
    friendlyAuthError({ code: "email_not_confirmed" }, "login"),
    "Confirm your email before logging in.",
  );
  assert.equal(
    friendlyAuthError({ message: "User already registered" }, "signup"),
    "An account with this email already exists. Try logging in.",
  );
  assert.equal(
    friendlyAuthError({ code: "over_email_send_rate_limit" }, "recover"),
    "Too many attempts. Wait a moment and try again.",
  );
  assert.equal(isExistingSignupUser({ identities: [] }), true);
  assert.equal(isExistingSignupUser({ identities: [{}] }), false);
});

test("signup distinguishes immediate sessions from email verification", () => {
  const panel = source("../components/auth/AuthPanel.tsx");
  assert.match(panel, /if \(data\.session\) finishAuthentication\(\)/);
  assert.match(panel, /else setVerificationEmail\(normalizedEmail\)/);
  assert.match(panel, /Account verification/);
  assert.match(panel, /Check your email/);
  assert.match(panel, /aria-live="polite"/);
});

test("password reset entry and completion remain connected through the callback", () => {
  const panel = source("../components/auth/AuthPanel.tsx");
  const reset = source("../components/auth/ResetPasswordPanel.tsx");
  const callback = source("../app/auth/callback/route.ts");
  const resetPage = source("../app/reset-password/page.tsx");
  assert.match(panel, /supabase\.auth\.resetPasswordForEmail/);
  assert.match(panel, /\/auth\/callback\?next=/);
  assert.match(panel, /\/reset-password\?next=/);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(reset, /supabase\.auth\.updateUser\(\{ password \}\)/);
  assert.match(resetPage, /passwordCompletion/);
});

test("safe next paths preserve internal destinations and reject open redirects", () => {
  assert.equal(getSafeNextPath("/playgroups/abc?section=chat"), "/playgroups/abc?section=chat");
  assert.equal(getSafeNextPath("/events/one#details"), "/events/one#details");
  for (const unsafe of [
    "https://evil.example/steal",
    "//evil.example/steal",
    "/\\evil.example/steal",
    "/%5C%5Cevil.example/steal",
    "/%0Aevil.example/steal",
    "javascript:alert(1)",
    " /home",
    "/login",
    "/auth/callback",
    "/",
  ]) {
    assert.equal(getSafeNextPath(unsafe), "/home");
  }
});

test("login and signup URLs remain compatible aliases of the same panel", () => {
  const login = source("../app/login/page.tsx");
  const signup = source("../app/signup/page.tsx");
  assert.match(login, /<AuthLanding/);
  assert.match(signup, /<AuthLanding initialMode="signup"/);
  assert.equal(normalizeAuthMode("recover"), "recover");
  assert.equal(normalizeAuthMode("unknown"), "login");
});

test("platform routes are gated while legal destinations remain public", () => {
  const proxy = source("../proxy.ts");
  for (const path of [
    "/home",
    "/events/one",
    "/playgroups/abc",
    "/binder",
    "/profile/settings",
  ]) {
    assert.equal(isProtectedRoute(path), true);
  }
  for (const path of ["/terms", "/privacy", "/cookies", "/legal-notice"]) {
    assert.equal(isProtectedRoute(path), false);
  }
  assert.match(proxy, /!authenticated && isProtectedRoute\(pathname\)/);
  assert.match(proxy, /destination\.searchParams\.set\("next", `\$\{pathname\}\$\{search\}`\)/);
});

test("the auth gate bypasses authenticated navigation chrome", () => {
  const router = source("../components/social-shell/SocialLayoutRouter.tsx");
  const authCheck = router.indexOf('["/", "/login", "/signup", "/reset-password"]');
  const socialCheck = router.indexOf("isSocialAppRoute(pathname)");
  assert.ok(authCheck >= 0 && authCheck < socialCheck);
  assert.match(router, /return <AuthGatePage>\{props\.children\}<\/AuthGatePage>/);
});

test("mobile auth layout avoids horizontal overflow and forms are keyboard accessible", () => {
  const styles = source("../components/auth/AuthLanding.module.css");
  const panel = source("../components/auth/AuthPanel.tsx");
  assert.match(styles, /overflow-x: hidden/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /width: min\(1180px, 100%\)/);
  assert.match(panel, /<label htmlFor="auth-email">Email<\/label>/);
  assert.match(panel, /<label htmlFor="auth-password">Password<\/label>/);
  assert.match(panel, /autoComplete="email"/);
  assert.match(panel, /"current-password" : "new-password"/);
  assert.match(panel, /role="alert"/);
});
