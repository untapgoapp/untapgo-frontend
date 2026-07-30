"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function getNextDestination() {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("next") ?? params.get("redirect");

    if (!value || !value.startsWith("/") || value.startsWith("//")) {
      return "/profile";
    }

    return value;
  }

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");

    if (code === "oauth_callback_failed") {
      setError("Google sign-in could not be completed. Please try again.");
    }
  }, []);

  async function handleGoogleSignIn() {
    if (googleLoading) {
      return;
    }

    setGoogleLoading(true);
    setError(null);
    setMessage(null);

    const nextPath = getNextDestination();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (oauthError) {
      setError("Google sign-in could not be started. Please try again.");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        setMessage("Account created. Check your email if confirmation is required.");
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      router.push(getNextDestination());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FBF7F1] px-6 py-10 text-black">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-medium text-[#6E5AA7]">
          ← Back home
        </Link>

        <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black">
            {mode === "login" ? "Log in" : "Create account"}
          </h1>

          <p className="mt-2 text-zinc-600">
            {mode === "login"
              ? "Welcome back to UntapGo."
              : "Create your UntapGo account."}
          </p>

          <button
            type="button"
            onClick={() => {
              void handleGoogleSignIn();
            }}
            disabled={googleLoading || loading}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 active:scale-[0.99] active:bg-zinc-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/25 disabled:cursor-wait disabled:opacity-60"
          >
            {googleLoading ? (
              <span
                aria-hidden="true"
                className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-zinc-300 border-t-[#6E5AA7]"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/google-g.svg" alt="" width="18" height="18" />
            )}
            {googleLoading ? "Connecting to Google…" : "Continue with Google"}
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-zinc-400" aria-hidden="true">
            <span className="h-px flex-1 bg-zinc-200" />
            <span>or continue with email</span>
            <span className="h-px flex-1 bg-zinc-200" />
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Email</span>
              <input
                name="email"
                type="email"
                required
                className="rounded-xl border border-zinc-300 px-4 py-3"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium">Password</span>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="rounded-xl border border-zinc-300 px-4 py-3"
              />
            </label>

            {error ? (
              <pre className="whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </pre>
            ) : null}

            {message ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading
                ? "Working..."
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>

            {mode === "signup" ? (
              <p className="text-xs leading-5 text-zinc-500">
                By creating an account, you agree to the{" "}
                <Link className="font-medium text-[#6E5AA7] underline underline-offset-2" href="/terms">
                  Terms of Service
                </Link>{" "}
                and acknowledge the{" "}
                <Link className="font-medium text-[#6E5AA7] underline underline-offset-2" href="/privacy">
                  Privacy Policy
                </Link>.
              </p>
            ) : null}
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
              setMessage(null);
            }}
            className="mt-5 text-sm font-medium text-[#6E5AA7]"
          >
            {mode === "login"
              ? "Need an account? Sign up"
              : "Already have an account? Log in"}
          </button>
        </section>
      </div>
    </main>
  );
}
