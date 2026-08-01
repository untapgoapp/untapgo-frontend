import type { Metadata } from "next";

import AuthLanding from "@/components/auth/AuthLanding";
import { getSafeNextPath } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account · UntapGo" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return <AuthLanding initialMode="signup" nextPath={getSafeNextPath(query.next)} />;
}
