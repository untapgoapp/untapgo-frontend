"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { ApiError } from "@/lib/api";
import {
  BLOCKED_PROFILES_CHANGED_EVENT,
  getBlockedProfileAvatarUrl,
  getBlockedProfileId,
  getBlockedProfileNickname,
  getBlockedProfiles,
  unblockProfile,
  type BlockedProfile,
} from "@/services/profiles";

export default function BlockedProfilesPage() {
  const [profiles, setProfiles] = useState<BlockedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(
    null,
  );
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const result = await getBlockedProfiles();

      setUnauthorized(false);
      setProfiles(result);
    } catch (loadError) {
      if (
        loadError instanceof ApiError &&
        loadError.status === 401
      ) {
        setUnauthorized(true);
        setProfiles([]);
        return;
      }

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load blocked users.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    function handleBlockedProfilesChanged() {
      void loadProfiles(true);
    }

    window.addEventListener(
      BLOCKED_PROFILES_CHANGED_EVENT,
      handleBlockedProfilesChanged,
    );

    return () => {
      window.removeEventListener(
        BLOCKED_PROFILES_CHANGED_EVENT,
        handleBlockedProfilesChanged,
      );
    };
  }, [loadProfiles]);

  async function handleUnblock(profileId: string) {
    if (unblockingId) {
      return;
    }

    const confirmed = window.confirm(
      "Unblock this user? You may see each other’s profiles and events again.",
    );

    if (!confirmed) {
      return;
    }

    setUnblockingId(profileId);
    setError(null);

    try {
      await unblockProfile(profileId);

      setProfiles((currentProfiles) =>
        currentProfiles.filter(
          (profile) =>
            getBlockedProfileId(profile) !== profileId,
        ),
      );
    } catch (unblockError) {
      setError(
        unblockError instanceof Error
          ? unblockError.message
          : "Could not unblock user.",
      );
    } finally {
      setUnblockingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-black"
        >
          <ArrowLeft size={16} />
          Back to profile
        </Link>

        <header className="mt-8 flex flex-col gap-5 border-b border-black/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-700">
                <Ban size={20} />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-700">
                  Safety
                </p>

                <h1 className="text-3xl font-black tracking-tight">
                  Blocked users
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600">
              Blocked users cannot view your profile, join your
              hosted events, or interact with you through UntapGo.
            </p>
          </div>

          {!unauthorized ? (
            <button
              type="button"
              onClick={() => {
                void loadProfiles(true);
              }}
              disabled={loading || refreshing}
              aria-label="Refresh blocked users"
              className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white text-zinc-500 transition hover:border-black/20 hover:text-black disabled:opacity-50"
            >
              <RefreshCw
                className={
                  refreshing
                    ? "h-4 w-4 animate-spin"
                    : "h-4 w-4"
                }
              />
            </button>
          ) : null}
        </header>

        {unauthorized ? <LoginState /> : null}

        {!unauthorized && error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {error}
          </div>
        ) : null}

        {!unauthorized && loading ? <LoadingList /> : null}

        {!unauthorized &&
        !loading &&
        !error &&
        profiles.length === 0 ? (
          <EmptyState />
        ) : null}

        {!unauthorized &&
        !loading &&
        profiles.length > 0 ? (
          <div className="mt-7 grid gap-3">
            {profiles.map((profile) => {
              const profileId = getBlockedProfileId(profile);

              if (!profileId) {
                return null;
              }

              return (
                <BlockedProfileCard
                  key={profileId}
                  profile={profile}
                  unblocking={unblockingId === profileId}
                  onUnblock={() => {
                    void handleUnblock(profileId);
                  }}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function BlockedProfileCard({
  profile,
  unblocking,
  onUnblock,
}: {
  profile: BlockedProfile;
  unblocking: boolean;
  onUnblock: () => void;
}) {
  const nickname = getBlockedProfileNickname(profile);
  const avatarUrl = getBlockedProfileAvatarUrl(profile);
  const bio = profile.bio?.trim() || "";

  return (
    <article className="flex items-center gap-4 rounded-[1.25rem] border border-black/10 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-black/5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${nickname} avatar`}
            className="h-full w-full object-cover grayscale"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-lg font-black text-zinc-500">
            {nickname.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate font-bold text-zinc-950">
          {nickname}
        </h2>

        <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">
          {bio || "Unblock this user to view their public profile again."}
        </p>
      </div>

      <button
        type="button"
        onClick={onUnblock}
        disabled={unblocking}
        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-black/10 px-4 text-sm font-semibold text-zinc-700 transition hover:border-[#6E5AA7]/30 hover:bg-[#F0EBFF] hover:text-[#6E5AA7] disabled:cursor-wait disabled:opacity-50"
      >
        {unblocking ? "Unblocking..." : "Unblock"}
      </button>
    </article>
  );
}

function LoginState() {
  return (
    <section className="mt-8 rounded-[1.35rem] border border-black/10 bg-white p-8 text-center">
      <Ban className="mx-auto h-7 w-7 text-red-600" />

      <h2 className="mt-4 text-lg font-bold">
        Log in to manage blocked users
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        Your safety settings are linked to your UntapGo account.
      </p>

      <Link
        href="/login?next=%2Fprofile%2Fblocked"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-black px-5 text-sm font-semibold text-white"
      >
        Log in
      </Link>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="mt-8 rounded-[1.35rem] border border-black/10 bg-white p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-700">
        <ShieldCheck size={20} />
      </div>

      <h2 className="mt-4 font-bold">
        No blocked users
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        Players you block from their public profile will appear
        here.
      </p>

      <Link
        href="/events"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#6E5AA7] px-5 text-sm font-semibold text-white"
      >
        Explore events
      </Link>
    </section>
  );
}

function LoadingList() {
  return (
    <div className="mt-7 grid gap-3">
      <LoadingCard />
      <LoadingCard />
      <LoadingCard />
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="flex items-center gap-4 rounded-[1.25rem] border border-black/10 bg-white p-4">
      <div className="h-14 w-14 animate-pulse rounded-full bg-black/10" />

      <div className="flex-1">
        <div className="h-4 w-32 animate-pulse rounded-full bg-black/10" />
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded-full bg-black/[0.06]" />
      </div>
    </div>
  );
}
