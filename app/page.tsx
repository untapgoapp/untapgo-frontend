import type { Metadata } from "next";

import AuthLanding from "@/components/auth/AuthLanding";
import { getSafeNextPath, normalizeAuthMode } from "@/lib/auth";

export const metadata: Metadata = {
  title: "UntapGo · Your Magic community",
  description: "Find players, join games and keep your Magic community together.",
  alternates: { canonical: "https://untapgo.com" },
};

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return (
    <AuthLanding
      initialMode={normalizeAuthMode(query.auth)}
      nextPath={getSafeNextPath(query.next)}
      oauthFailed={query.error === "oauth_callback_failed"}
    />
  );
}
