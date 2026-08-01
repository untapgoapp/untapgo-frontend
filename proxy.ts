import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { isAuthEntryRoute, isProtectedRoute } from "@/lib/auth";

function redirectWithCookies(destination: URL, authResponse: NextResponse) {
  const response = NextResponse.redirect(destination);
  for (const cookie of authResponse.cookies.getAll()) response.cookies.set(cookie);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function proxy(request: NextRequest) {
  let authResponse = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return authResponse;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        authResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          authResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  let authenticated = false;
  try {
    const { data } = await supabase.auth.getClaims();
    authenticated = Boolean(data?.claims?.sub);
  } catch {
    authenticated = false;
  }
  const { pathname, search } = request.nextUrl;

  if (authenticated && isAuthEntryRoute(pathname)) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/home";
    destination.search = "";
    return redirectWithCookies(destination, authResponse);
  }

  if (!authenticated && isProtectedRoute(pathname)) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/";
    destination.search = "";
    destination.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(destination, authResponse);
  }

  authResponse.headers.set("Cache-Control", "private, no-store");
  return authResponse;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/home/:path*",
    "/events/:path*",
    "/create/:path*",
    "/check-in/:path*",
    "/decks/:path*",
    "/binder/:path*",
    "/notifications/:path*",
    "/playgroups/:path*",
    "/players/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
