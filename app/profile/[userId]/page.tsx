"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  useParams,
} from "next/navigation";

import CopyArenaTag from "@/components/profile/CopyArenaTag";
import ProfileActionsPanel from "@/components/profile/ProfileActionsPanel";
import {
  getDeckColors,
  getDeckCommanderName,
  getDeckExportText,
  getDeckFormatSlug,
  getDeckImageUrl,
  getDeckUrl,
  getHostedCount,
  getPlayedCount,
  getProfileArenaUsername,
  getProfileAvatarUrl,
  getProfileNickname,
  getPublicProfile,
  getPublicProfileDecks,
  type PublicDeck,
  type PublicProfile,
} from "@/services/profiles";

const CARD_BACK =
  "https://cards.scryfall.io/card-back.jpg";

export default function PublicProfilePage() {
  const params =
    useParams<{
      userId: string;
    }>();

  const userId =
    params.userId;

  const [
    profile,
    setProfile,
  ] =
    useState<PublicProfile | null>(
      null,
    );

  const [
    decks,
    setDecks,
  ] = useState<PublicDeck[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const loadProfile =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          loadedProfile,
          loadedDecks,
        ] =
          await Promise.all([
            getPublicProfile(
              userId,
              {
                asPublic: true,
              },
            ),
            getPublicProfileDecks(
              userId,
              {
                asPublic: true,
              },
            ),
          ]);

        setProfile(
          loadedProfile,
        );

        setDecks(
          loadedDecks.slice(
            0,
            10,
          ),
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load profile.",
        );
      } finally {
        setLoading(false);
      }
    }, [userId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FBF7F1] px-6 py-10 text-black">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm text-zinc-500">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  if (
    error ||
    !profile
  ) {
    return (
      <main className="min-h-screen bg-[#FBF7F1] px-6 py-10 text-black">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/events"
            className="text-sm font-medium text-[#6E5AA7]"
          >
            ← Back
          </Link>

          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-800">
              Could not load profile
            </p>

            {error ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-red-700">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBF7F1] px-6 py-10 text-black">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/events"
          className="text-sm font-medium text-[#6E5AA7]"
        >
          ← Back
        </Link>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <ProfileHeader
            profile={profile}
          />
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Decks
            </h2>

            <span className="text-sm text-zinc-500">
              {decks.length}/10
            </span>
          </div>

          {decks.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              {profile.public_decks_visible ===
              false
                ? "This player keeps their decks private."
                : "No public decks yet."}
            </p>
          ) : (
            <div className="mt-5 grid gap-4">
              {decks.map(
                (deck) => (
                  <DeckCard
                    key={
                      deck.id
                    }
                    deck={
                      deck
                    }
                  />
                ),
              )}
            </div>
          )}
        </section>

        <ProfileActionsPanel
          profileId={userId}
        />
      </div>
    </main>
  );
}

function ProfileHeader({
  profile,
}: {
  profile: PublicProfile;
}) {
  const nickname =
    getProfileNickname(
      profile,
    );

  const avatarUrl =
    getProfileAvatarUrl(
      profile,
    );

  const arenaUsername =
    getProfileArenaUsername(
      profile,
    );

  const bio =
    profile.bio?.trim() ||
    "";

  const statsVisible =
    profile.stats_visible !==
    false;

  return (
    <div className="text-center">
      <div className="mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-zinc-100 shadow-[0_0_30px_rgba(110,90,167,0.18)]">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${nickname} avatar`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-4xl font-black text-[#6E5AA7]">
            {nickname
              .slice(0, 1)
              .toUpperCase()}
          </span>
        )}
      </div>

      <h1 className="mt-5 text-3xl font-bold text-[#6E5AA7]">
        {nickname}
      </h1>

      {arenaUsername ? (
        <div className="mt-3 flex justify-center">
          <CopyArenaTag
            arenaTag={
              arenaUsername
            }
          />
        </div>
      ) : null}

      {bio ? (
        <p className="mx-auto mt-4 max-w-xl whitespace-pre-wrap text-zinc-700">
          {bio}
        </p>
      ) : null}

      {statsVisible ? (
        <div className="mt-6 flex justify-center gap-12">
          <Stat
            label="Hosted"
            value={
              getHostedCount(
                profile,
              )
            }
          />

          <Stat
            label="Played"
            value={
              getPlayedCount(
                profile,
              )
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <p className="text-xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function DeckCard({
  deck,
}: {
  deck: PublicDeck;
}) {
  const commanderName =
    getDeckCommanderName(
      deck,
    );

  const deckUrl =
    getDeckUrl(deck);

  const formatSlug =
    getDeckFormatSlug(
      deck,
    );

  const exportText =
    getDeckExportText(
      deck,
    );

  const imageUrl =
    getDeckImageUrl(
      deck,
    );

  const colors =
    getDeckColors(deck);

  const [
    mainDeck,
    sideboard,
  ] = useMemo(() => {
    if (!exportText) {
      return [
        null,
        null,
      ];
    }

    const parts =
      exportText.split(
        "Sideboard",
      );

    const main =
      parts[0]
        .replace(
          /^Deck/i,
          "",
        )
        .trim();

    const side =
      parts.length > 1
        ? parts[1].trim()
        : null;

    return [
      main || null,
      side || null,
    ];
  }, [exportText]);

  const safeImageUrl =
    imageUrl?.startsWith(
      "http",
    )
      ? imageUrl
      : CARD_BACK;

  return (
    <details className="rounded-2xl border border-zinc-200 bg-[#FBF7F1] p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center gap-4">
          <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
            <img
              src={safeImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">
              {commanderName}
            </p>

            {formatSlug ? (
              <p className="mt-1 text-sm capitalize text-zinc-500">
                {formatSlug}
              </p>
            ) : null}

            <div className="mt-2 flex gap-1">
              {colors.map(
                (color) => (
                  <ManaDot
                    key={color}
                    value={
                      color
                    }
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </summary>

      <div className="mt-4 border-t border-zinc-200 pt-4">
        {deckUrl ? (
          <a
            href={deckUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-[#6E5AA7]"
          >
            Open deck link
          </a>
        ) : null}

        {mainDeck ? (
          <div className="mt-4 rounded-xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Deck
            </p>

            <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
              {mainDeck}
            </pre>
          </div>
        ) : null}

        {sideboard ? (
          <div className="mt-4 rounded-xl bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Sideboard
            </p>

            <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
              {sideboard}
            </pre>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function ManaDot({
  value,
}: {
  value: string;
}) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold shadow-sm">
      {value}
    </span>
  );
}