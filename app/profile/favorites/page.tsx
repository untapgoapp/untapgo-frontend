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
  Heart,
  RefreshCw,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { ApiError } from "@/lib/api";
import {
  clearFavoriteProfiles,
  FAVORITE_PROFILES_CHANGED_EVENT,
  getFavoriteProfileAvatarUrl,
  getFavoriteProfileId,
  getFavoriteProfileNickname,
  getFavoriteProfiles,
  unfavoriteProfile,
  type FavoriteProfile,
} from "@/services/profiles";

export default function FavoriteProfilesPage() {
  const [
    profiles,
    setProfiles,
  ] = useState<FavoriteProfile[]>(
    [],
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    clearing,
    setClearing,
  ] = useState(false);

  const [
    removingProfileId,
    setRemovingProfileId,
  ] = useState<string | null>(
    null,
  );

  const [
    unauthorized,
    setUnauthorized,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const loadProfiles =
    useCallback(
      async (
        silent = false,
      ) => {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        try {
          const result =
            await getFavoriteProfiles();

          setUnauthorized(false);
          setProfiles(result);
        } catch (loadError) {
          if (
            loadError instanceof
              ApiError &&
            loadError.status === 401
          ) {
            setUnauthorized(true);
            setProfiles([]);

            return;
          }

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load favorite players.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    function handleFavoritesChanged() {
      void loadProfiles(true);
    }

    window.addEventListener(
      FAVORITE_PROFILES_CHANGED_EVENT,
      handleFavoritesChanged,
    );

    return () => {
      window.removeEventListener(
        FAVORITE_PROFILES_CHANGED_EVENT,
        handleFavoritesChanged,
      );
    };
  }, [loadProfiles]);

  async function handleRemove(
    profileId: string,
  ) {
    if (removingProfileId) {
      return;
    }

    setRemovingProfileId(
      profileId,
    );

    setError(null);

    try {
      await unfavoriteProfile(
        profileId,
      );

      setProfiles(
        (currentProfiles) =>
          currentProfiles.filter(
            (profile) =>
              getFavoriteProfileId(
                profile,
              ) !== profileId,
          ),
      );
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Could not remove favorite player.",
      );
    } finally {
      setRemovingProfileId(
        null,
      );
    }
  }

  async function handleClearAll() {
    if (
      clearing ||
      profiles.length === 0
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Remove all favorite players?",
      );

    if (!confirmed) {
      return;
    }

    setClearing(true);
    setError(null);

    try {
      await clearFavoriteProfiles();
      setProfiles([]);
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Could not clear favorite players.",
      );
    } finally {
      setClearing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F5EF] px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-black"
        >
          <ArrowLeft
            size={16}
          />
          Back to profile
        </Link>

        <header className="mt-8 flex flex-col gap-5 border-b border-black/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#F0EBFF] text-[#6E5AA7]">
                <Heart
                  size={20}
                  fill="currentColor"
                />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#6E5AA7]">
                  Community
                </p>

                <h1 className="text-3xl font-black tracking-tight">
                  Favorite players
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-600">
              Keep players you enjoyed
              meeting close at hand.
            </p>
          </div>

          {!unauthorized ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void loadProfiles(true);
                }}
                disabled={
                  loading ||
                  refreshing
                }
                aria-label="Refresh favorite players"
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

              <button
                type="button"
                onClick={() => {
                  void handleClearAll();
                }}
                disabled={
                  clearing ||
                  profiles.length === 0
                }
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={15} />

                {clearing
                  ? "Clearing..."
                  : "Clear all"}
              </button>
            </div>
          ) : null}
        </header>

        {unauthorized ? (
          <LoginState />
        ) : null}

        {!unauthorized &&
        error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
            {error}
          </div>
        ) : null}

        {!unauthorized &&
        loading ? (
          <LoadingList />
        ) : null}

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
            {profiles.map(
              (profile) => {
                const profileId =
                  getFavoriteProfileId(
                    profile,
                  );

                if (!profileId) {
                  return null;
                }

                return (
                  <FavoritePlayerCard
                    key={profileId}
                    profile={profile}
                    removing={
                      removingProfileId ===
                      profileId
                    }
                    onRemove={() => {
                      void handleRemove(
                        profileId,
                      );
                    }}
                  />
                );
              },
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function FavoritePlayerCard({
  profile,
  removing,
  onRemove,
}: {
  profile: FavoriteProfile;
  removing: boolean;
  onRemove: () => void;
}) {
  const profileId =
    getFavoriteProfileId(
      profile,
    );

  const nickname =
    getFavoriteProfileNickname(
      profile,
    );

  const avatarUrl =
    getFavoriteProfileAvatarUrl(
      profile,
    );

  const bio =
    profile.bio?.trim() ||
    "";

  return (
    <article className="flex items-center gap-4 rounded-[1.25rem] border border-black/10 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <Link
        href={`/profile/${encodeURIComponent(
          profileId,
        )}`}
        className="flex min-w-0 flex-1 items-center gap-4 rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20"
      >
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#EDE7FF] ring-1 ring-black/5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${nickname} avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-lg font-black text-[#6E5AA7]">
              {nickname
                .slice(0, 1)
                .toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-bold text-zinc-950">
            {nickname}
          </h2>

          {bio ? (
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">
              {bio}
            </p>
          ) : (
            <p className="mt-1 text-sm text-zinc-400">
              View public profile
            </p>
          )}
        </div>
      </Link>

      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        aria-label={`Remove ${nickname} from favorites`}
        title="Remove from favorites"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/10 text-zinc-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-wait disabled:opacity-50"
      >
        <X size={16} />
      </button>
    </article>
  );
}

function LoginState() {
  return (
    <section className="mt-8 rounded-[1.35rem] border border-black/10 bg-white p-8 text-center">
      <Heart className="mx-auto h-7 w-7 text-[#6E5AA7]" />

      <h2 className="mt-4 text-lg font-bold">
        Log in to see favorite players
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        Your favorite players are
        linked to your UntapGo account.
      </p>

      <Link
        href="/login?next=%2Fprofile%2Ffavorites"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#6E5AA7] px-5 text-sm font-semibold text-white transition hover:bg-[#5F4E94]"
      >
        Log in
      </Link>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="mt-8 rounded-[1.35rem] border border-black/10 bg-white p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-black/[0.045] text-zinc-400">
        <UserRound size={20} />
      </div>

      <h2 className="mt-4 font-bold">
        No favorite players
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        Open a public profile and tap
        Favorite to keep that player here.
      </p>

      <Link
        href="/events"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#6E5AA7] px-5 text-sm font-semibold text-white transition hover:bg-[#5F4E94]"
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