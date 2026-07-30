"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  CalendarDays,
  ChevronRight,
  Compass,
  Eye,
  Heart,
  Library,
  LogOut,
  Pencil,
  Settings2,
  UserRound,
} from "lucide-react";

import CopyArenaTag from "@/components/profile/CopyArenaTag";
import { supabase } from "@/lib/supabase/client";
import {
  getHostedCount,
  getPlayedCount,
  getProfileArenaUsername,
  getProfileAvatarUrl,
  getProfileId,
  getProfileNickname,
  getPublicProfile,
  type PublicProfile,
} from "@/services/profiles";
import {
  unregisterPushBeforeSignOut,
} from "@/services/push";

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const {
          data,
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        const user = data.user;

        if (!user) {
          router.replace("/login?next=%2Fprofile");
          return;
        }

        if (!active) {
          return;
        }

        setUserEmail(user.email ?? null);

        const loadedProfile = await getPublicProfile(user.id);

        if (!active) {
          return;
        }

        setProfile(loadedProfile);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your profile.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  async function signOut() {
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

      router.push("/");
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-black">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm text-zinc-500">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-black">
        <div className="mx-auto max-w-2xl">
          <div className="border-y border-black/10 py-6">
            <p className="font-semibold">
              Something went wrong.
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              {error}
            </p>

            <Link
              href="/profile/edit"
              className="mt-5 inline-flex rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
            >
              Edit profile
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  const profileId = getProfileId(profile);
  const nickname = getProfileNickname(profile);
  const avatarUrl = getProfileAvatarUrl(profile);
  const arenaUsername = getProfileArenaUsername(profile);
  const hostedCount = getHostedCount(profile);
  const playedCount = getPlayedCount(profile);

  const publicProfileHref = profileId
    ? `/profile/${encodeURIComponent(profileId)}`
    : "/profile";

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-5 py-12 text-black">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6E5AA7]">
            Account
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Profile
          </h1>
        </header>

        <section className="flex items-center gap-5 border-b border-black/10 pb-8">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[#EDE7FF] ring-1 ring-black/5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${nickname} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-3xl font-black text-[#6E5AA7]">
                {nickname.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-black tracking-tight">
              {nickname}
            </h2>

            {userEmail ? (
              <p className="mt-1 truncate text-sm text-zinc-500">
                {userEmail}
              </p>
            ) : null}

            {arenaUsername ? (
              <div className="mt-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                  MTG Arena
                </p>

                <CopyArenaTag arenaTag={arenaUsername} />
              </div>
            ) : null}

            <p className="mt-3 text-sm text-zinc-500">
              {hostedCount} hosted · {playedCount} played
            </p>
          </div>

          {profileId ? (
            <Link
              href={publicProfileHref}
              className="hidden shrink-0 items-center gap-2 rounded-full bg-black px-4 py-2.5 text-sm font-semibold text-white sm:inline-flex"
            >
              <Eye size={15} />
              Public view
            </Link>
          ) : null}
        </section>

        <div className="mt-10 space-y-10">
          <LineGroup title="Play">
            <LineRow
              href="/events/mine"
              icon={<CalendarDays size={18} />}
              title="My events"
              subtitle="Upcoming, requests, and history"
            />

            <LineRow
              href="/profile/decks"
              icon={<Library size={18} />}
              title="My decks"
              subtitle="Commanders, lists, and links"
            />
          </LineGroup>

          <LineGroup title="Community">
            <LineRow
              href="/profile/favorites"
              icon={<Heart size={18} />}
              title="Favorite players"
              subtitle="Players you want to find again"
            />

            <LineRow
              href="/events"
              icon={<Compass size={18} />}
              title="Explore games"
              subtitle="Find open tables near you"
            />
          </LineGroup>

          <LineGroup title="Manage">
            <LineRow
              href="/profile/edit"
              icon={<Pencil size={18} />}
              title="Edit profile"
              subtitle="Nickname, bio, avatar, and MTG details"
            />

            {profileId ? (
              <LineRow
                href={publicProfileHref}
                icon={<UserRound size={18} />}
                title="Public profile"
                subtitle="See what other players see"
              />
            ) : null}

            <LineRow
              href="/profile/blocked"
              icon={<Ban size={18} />}
              title="Blocked users"
              subtitle="Review and manage blocked players"
            />

            <LineRow
              href="/settings"
              icon={<Settings2 size={18} />}
              title="Settings"
              subtitle="Privacy, notifications, and account"
            />
          </LineGroup>

          <section className="border-y border-black/10">
            <button
              type="button"
              onClick={() => {
                void signOut();
              }}
              disabled={signingOut}
              className="group flex w-full items-center gap-4 py-5 text-left disabled:opacity-60"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/70 text-zinc-500 ring-1 ring-black/5">
                <LogOut size={18} />
              </span>

              <span className="min-w-0 flex-1 font-semibold">
                {signingOut ? "Signing out..." : "Log out"}
              </span>

              <ChevronRight
                size={18}
                className="text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500"
              />
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

function LineGroup({
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

      <div className="border-y border-black/10">
        {children}
      </div>
    </section>
  );
}

function LineRow({
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
        <span className="block font-semibold">
          {title}
        </span>

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
