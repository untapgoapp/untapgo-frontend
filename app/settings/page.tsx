"use client";

import Link from "next/link";
import {
  BellRing,
  ChevronRight,
  LockKeyhole,
  Shield,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  supabase,
} from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkAuthentication() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!active) return;

        if (error) {
          setAuthError(
            "Could not verify your session. Check your connection and try again.",
          );
          setLoading(false);
          return;
        }

        if (!session) {
          router.replace("/login?next=%2Fsettings");
          return;
        }

        setAuthError(null);
        setLoading(false);
      } catch (error) {
        console.warn("Settings authentication check failed", error);

        if (!active) return;

        setAuthError(
          "Could not reach the authentication service. Check your connection and try again.",
        );
        setLoading(false);
      }
    }

    void checkAuthentication();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "SIGNED_OUT" || !session) {
        router.replace("/login?next=%2Fsettings");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-black">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-zinc-500">Loading settings...</p>
        </div>
      </main>
    );
  }

  if (authError) {
    return (
      <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-black">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-semibold text-red-700">
            {authError}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-black">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6E5AA7]">
            Account
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Settings
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
            Manage privacy, notifications, safety, and your UntapGo account.
          </p>
        </header>

        <div className="space-y-10">
          <SettingsGroup title="Preferences">
            <SettingsRow
              href="/settings/privacy"
              icon={<LockKeyhole size={18} />}
              title="Privacy"
              subtitle="Control what other players can see"
            />

            <SettingsRow
              href="/settings/notifications"
              icon={<BellRing size={18} />}
              title="Notifications"
              subtitle="Manage push notifications on this device"
            />
          </SettingsGroup>

          <SettingsGroup title="Safety">
            <SettingsRow
              href="/profile/blocked"
              icon={<Shield size={18} />}
              title="Blocked users"
              subtitle="Review and unblock players"
            />
          </SettingsGroup>

          <SettingsGroup title="Account">
            <SettingsRow
              href="/profile/edit"
              icon={<UserRound size={18} />}
              title="Profile details"
              subtitle="Nickname, avatar, bio, and Arena tag"
            />

            <SettingsRow
              href="/settings/account"
              icon={<SlidersHorizontal size={18} />}
              title="Account"
              subtitle="Email, log out, or delete your account"
            />
          </SettingsGroup>
        </div>
      </div>
    </main>
  );
}

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
        {title}
      </p>

      <div className="border-y border-black/10">{children}</div>
    </section>
  );
}

function SettingsRow({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 border-b border-black/10 py-5 last:border-b-0"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/70 text-zinc-500 ring-1 ring-black/5">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="mt-0.5 block truncate text-sm text-zinc-500">
          {subtitle}
        </span>
      </span>

      <ChevronRight
        size={18}
        className="shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500"
      />
    </Link>
  );
}