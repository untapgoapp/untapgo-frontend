"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Trash2, UserRound, X } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

export default function FavoritePlayersView() {
  const [profiles, setProfiles] = useState<FavoriteProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setProfiles(await getFavoriteProfiles());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load favorite players.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => void load(true);
    window.addEventListener(FAVORITE_PROFILES_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(FAVORITE_PROFILES_CHANGED_EVENT, refresh);
  }, [load]);

  async function remove(profileId: string) {
    if (removingId) return;
    const previous = profiles;
    setRemovingId(profileId);
    setProfiles((current) => current.filter((profile) => getFavoriteProfileId(profile) !== profileId));
    try {
      await unfavoriteProfile(profileId);
    } catch {
      setProfiles(previous);
      setError("Could not remove favorite player.");
    } finally {
      setRemovingId(null);
    }
  }

  async function clear() {
    if (clearing || profiles.length === 0) return;
    if (!window.confirm("Remove all favorite players?")) return;
    const previous = profiles;
    setClearing(true);
    setProfiles([]);
    try {
      await clearFavoriteProfiles();
    } catch {
      setProfiles(previous);
      setError("Could not clear favorite players.");
    } finally {
      setClearing(false);
    }
  }

  if (loading) {
    return <div className="mt-5 h-44 animate-pulse rounded-surface bg-black/[0.05]" />;
  }

  return (
    <section className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Keep players you enjoyed meeting close at hand.
        </p>
        <div className="flex gap-2">
          <Button size="icon-sm" variant="outline" disabled={refreshing} onClick={() => void load(true)}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            <span className="sr-only">Refresh favorite players</span>
          </Button>
          <Button size="sm" variant="outline" disabled={clearing || profiles.length === 0} onClick={() => void clear()}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear all
          </Button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {profiles.length === 0 ? (
        <div className="mt-5 rounded-surface bg-surface px-6 py-10 text-center">
          <UserRound className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-bold">No favorite players</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Open a public profile and use Favorite to keep that player here.
          </p>
          <Button asChild size="sm" className="mt-5">
            <Link href="/players">Discover players</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-5 grid gap-2">
          {profiles.map((profile) => {
            const id = getFavoriteProfileId(profile);
            if (!id) return null;
            const nickname = getFavoriteProfileNickname(profile);
            const avatar = getFavoriteProfileAvatarUrl(profile);
            return (
              <article key={id} className="flex items-center gap-3 rounded-surface bg-surface px-4 py-3">
                <Link href={`/profile/${encodeURIComponent(id)}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar className="h-11 w-11">
                    {avatar ? <AvatarImage src={avatar} alt="" /> : null}
                    <AvatarFallback>{nickname.charAt(0).toUpperCase() || "P"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold">{nickname}</h2>
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                      {profile.bio?.trim() || "View public profile"}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  disabled={removingId === id}
                  onClick={() => void remove(id)}
                  className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  aria-label={`Remove ${nickname} from favorites`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
