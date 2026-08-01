export type AuthMode = "login" | "signup" | "recover";
export type AuthAction = AuthMode | "google" | "update-password";

export const PROTECTED_ROUTE_ROOTS = [
  "/home",
  "/events",
  "/create",
  "/check-in",
  "/decks",
  "/binder",
  "/notifications",
  "/playgroups",
  "/players",
  "/profile",
  "/settings",
] as const;

const AUTH_ENTRY_PATHS = new Set(["/", "/login", "/signup"]);
const SAFE_BASE = new URL("https://untapgo.local");

function firstValue(value: string | string[] | null | undefined): string | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export function normalizeAuthMode(
  value: string | string[] | null | undefined,
  fallback: AuthMode = "login",
): AuthMode {
  const candidate = firstValue(value);
  return candidate === "login" || candidate === "signup" || candidate === "recover"
    ? candidate
    : fallback;
}

export function getSafeNextPath(
  value: string | string[] | null | undefined,
  fallback = "/home",
): string {
  const candidate = firstValue(value);
  if (
    !candidate
    || !candidate.startsWith("/")
    || candidate.startsWith("//")
    || candidate.includes("\\")
    || /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return fallback;
  }

  try {
    const destination = new URL(candidate, SAFE_BASE);
    const decodedPath = decodeURIComponent(destination.pathname);
    if (
      destination.origin !== SAFE_BASE.origin
      || decodedPath.startsWith("//")
      || decodedPath.includes("\\")
      || /[\u0000-\u001f\u007f]/.test(decodedPath)
      || AUTH_ENTRY_PATHS.has(destination.pathname)
      || destination.pathname.startsWith("/auth/")
    ) {
      return fallback;
    }
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

export function isAuthEntryRoute(pathname: string): boolean {
  return AUTH_ENTRY_PATHS.has(pathname);
}

export function isExistingSignupUser(user: {
  identities?: unknown[] | null;
} | null): boolean {
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
}

export function friendlyAuthError(error: unknown, action: AuthAction): string {
  const candidate = error && typeof error === "object"
    ? error as { code?: unknown; message?: unknown; status?: unknown }
    : null;
  const code = String(candidate?.code ?? "").toLowerCase();
  const message = String(candidate?.message ?? "").toLowerCase();
  const combined = `${code} ${message}`;

  if (/invalid_credentials|invalid login credentials|wrong password/.test(combined)) {
    return "Email or password is incorrect.";
  }
  if (/email_not_confirmed|email not confirmed/.test(combined)) {
    return "Confirm your email before logging in.";
  }
  if (/already registered|user_already_exists|email_exists/.test(combined)) {
    return "An account with this email already exists. Try logging in.";
  }
  if (/email_address_invalid|email address.*invalid/.test(combined)) {
    return "Enter a valid email address.";
  }
  if (/weak_password|password.*weak/.test(combined)) {
    return "Choose a stronger password and try again.";
  }
  if (/over_email_send_rate_limit|rate limit|too many requests/.test(combined)) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (/error sending|send.*email|email.*send/.test(combined)) {
    return "Email could not be sent right now. Please try again later.";
  }
  if (/fetch|network|connection|timeout/.test(combined) || error instanceof TypeError) {
    return "Could not connect. Check your connection and try again.";
  }
  if (/expired|invalid.*token|session.*missing/.test(combined)) {
    return action === "update-password"
      ? "This reset link is invalid or has expired. Request a new one."
      : "Your session has expired. Please try again.";
  }

  if (action === "signup") return "Your account could not be created. Please try again.";
  if (action === "recover") return "Reset instructions could not be sent. Please try again.";
  if (action === "google") return "Google sign-in could not be started. Please try again.";
  if (action === "update-password") return "Your password could not be updated. Please try again.";
  return "Login could not be completed. Please try again.";
}
