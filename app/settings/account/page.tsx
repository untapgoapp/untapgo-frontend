"use client";

import Link from "next/link";
import {
  ArrowLeft,
  LoaderCircle,
  LogOut,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  api,
} from "@/lib/api";
import {
  supabase,
} from "@/lib/supabase/client";
import {
  unregisterPushBeforeSignOut,
} from "@/services/push";

export default function AccountSettingsPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      const {
        data,
        error: authError,
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (authError || !data.user) {
        router.replace("/login?next=%2Fsettings%2Faccount");
        return;
      }

      setEmail(data.user.email ?? null);
      setLoading(false);
    }

    void loadAccount();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setError(null);

    try {
      await unregisterPushBeforeSignOut();

      const {
        error: signOutError,
      } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      router.replace("/");
      router.refresh();
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Could not log out.",
      );

      setSigningOut(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleting) {
      return;
    }

    const confirmation = window.prompt(
      'This permanently deletes your UntapGo account. Type DELETE to continue.',
    );

    if (confirmation !== "DELETE") {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await api.delete<{ success?: boolean }>("/me");
      await supabase.auth.signOut();

      router.replace("/");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete account.",
      );

      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-black">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-zinc-500">
            Loading account...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-black">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6E5AA7]"
        >
          <ArrowLeft size={16} />
          Back to settings
        </Link>

        <header className="mt-8 border-b border-black/10 pb-7">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#EEE9FF] text-[#6E5AA7]">
              <UserRound size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#6E5AA7]">
                Settings
              </p>

              <h1 className="text-3xl font-black tracking-tight">
                Account
              </h1>
            </div>
          </div>
        </header>

        <section className="mt-7 rounded-3xl border border-black/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Signed in as
          </p>

          <p className="mt-2 break-all font-semibold text-zinc-950">
            {email || "Email unavailable"}
          </p>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-black/10 bg-white">
          <button
            type="button"
            onClick={() => {
              void handleSignOut();
            }}
            disabled={signingOut || deleting}
            className="flex w-full items-center gap-4 border-b border-black/10 px-5 py-5 text-left transition hover:bg-black/[0.025] disabled:cursor-wait disabled:opacity-60"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/[0.045] text-zinc-600">
              {signingOut ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <LogOut size={18} />
              )}
            </span>

            <span>
              <span className="block font-semibold">
                {signingOut ? "Signing out..." : "Log out"}
              </span>

              <span className="mt-1 block text-sm text-zinc-500">
                Sign out of UntapGo on this browser
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              void handleDeleteAccount();
            }}
            disabled={signingOut || deleting}
            className="flex w-full items-center gap-4 px-5 py-5 text-left text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-50">
              {deleting ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
            </span>

            <span>
              <span className="block font-semibold">
                {deleting ? "Deleting account..." : "Delete account"}
              </span>

              <span className="mt-1 block text-sm text-red-600">
                Permanently delete your profile and account data
              </span>
            </span>
          </button>
        </section>

        {error ? (
          <pre className="mt-5 whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </pre>
        ) : null}
      </div>
    </main>
  );
}
