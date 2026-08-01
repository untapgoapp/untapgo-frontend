import type { Metadata } from "next";

import AuthLanding from "@/components/auth/AuthLanding";
import { getSafeNextPath, normalizeAuthMode } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in · UntapGo" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return (
    <AuthLanding
      initialMode={normalizeAuthMode(query.auth ?? query.mode)}
      nextPath={getSafeNextPath(query.next ?? query.redirect)}
      oauthFailed={query.error === "oauth_callback_failed"}
    />
  );
}
