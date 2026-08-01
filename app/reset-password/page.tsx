import type { Metadata } from "next";

import AuthLanding from "@/components/auth/AuthLanding";
import { getSafeNextPath } from "@/lib/auth";

export const metadata: Metadata = { title: "Reset password · UntapGo" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return <AuthLanding passwordCompletion nextPath={getSafeNextPath(query.next)} />;
}
