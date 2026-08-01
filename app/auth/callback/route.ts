import { NextResponse, type NextRequest } from "next/server";
import { getSafeNextPath } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function loginErrorRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"));
  url.pathname = "/";
  url.search = "";
  url.searchParams.set("auth", "login");
  url.searchParams.set("error", "oauth_callback_failed");
  if (nextPath !== "/home") url.searchParams.set("next", nextPath);

  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return loginErrorRedirect(request);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return loginErrorRedirect(request);
    }

    const destination = getSafeNextPath(
      request.nextUrl.searchParams.get("next"),
    );
    return NextResponse.redirect(new URL(destination, request.url));
  } catch {
    return loginErrorRedirect(request);
  }
}
