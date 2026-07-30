"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function getNextDestination() {
    const value = new URLSearchParams(window.location.search).get("next");

    if (!value || !value.startsWith("/") || value.startsWith("//")) {
      return "/profile";
    }

    return value;
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

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
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
              disabled={loading}
              className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading
                ? "Working..."
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>
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
