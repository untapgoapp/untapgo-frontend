"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import {
  Ban,
  Eye,
  Heart,
  LogOut,
  MapPin,
  Pencil,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { ManaIdentity } from "@/components/magic/mana-symbols";
import CopyArenaTag from "@/components/profile/CopyArenaTag";
import { Button } from "@/components/ui/button";
import { profileFormatLabel } from "@/lib/profile-magic";
import { getProfileNetworkHref } from "@/lib/profile-network";
import {
  getHostedCount,
  getPlayedCount,
  getProfileArenaUsername,
  getProfileAvatarUrl,
  getProfileFavoriteColors,
  getProfileFavoriteFormats,
  getProfileFirstSetName,
  getProfileId,
  getProfileLocationDisplay,
  getProfileNickname,
  getProfilePlayingSinceYear,
  type PublicProfile,
} from "@/services/profiles";

export const PROFILE_TABS = [
  ["Posts", "posts"],
  ["Decks", "decks"],
  ["Events", "events"],
  ["Trust", "trust"],
  ["About", "about"],
] as const;

export type ProfileTabId = (typeof PROFILE_TABS)[number][1];

type SocialPlayerProfileProps = {
  profile: PublicProfile;
  isOwner: boolean;
  sections: Partial<Record<Exclude<ProfileTabId, "about">, ReactNode>>;
  profileActions?: ReactNode;
  publicProfileHref?: string;
  networkProfileId?: string;
  signingOut?: boolean;
  onSignOut?: () => void;
};

function selectedTab(value: string | null): ProfileTabId {
  return PROFILE_TABS.some(([, id]) => id === value)
    ? (value as ProfileTabId)
    : "posts";
}

function hasCount(profile: PublicProfile, key: "hosted" | "played"): boolean {
  return key === "hosted"
    ? profile.hosted_count != null || profile.hostedCount != null
    : profile.played_count != null || profile.playedCount != null;
}

function AboutItem({
  label,
  children,
  muted = false,
}: {
  label: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-quiet-foreground">
        {label}
      </dt>
      <dd
        className={[
          "mt-1.5 min-w-0 whitespace-pre-wrap text-sm leading-6",
          muted ? "text-quiet-foreground" : "text-foreground",
        ].join(" ")}
      >
        {children}
      </dd>
    </div>
  );
}

function OwnerTools({
  signingOut,
  onSignOut,
}: {
  signingOut: boolean;
  onSignOut?: () => void;
}) {
  const links = [
    ["Favorite players", "/profile/favorites", Heart],
    ["Blocked users", "/profile/blocked", Ban],
    ["Profile privacy", "/profile/privacy", ShieldCheck],
    ["Settings", "/settings", Settings2],
  ] as const;

  return (
    <div className="mt-9">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-quiet-foreground">
        Owner tools
      </p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
        {links.map(([label, href, Icon]) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
          >
            <Icon size={14} aria-hidden="true" /> {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary disabled:opacity-50"
        >
          <LogOut size={14} aria-hidden="true" />
          {signingOut ? "Signing out..." : "Log out"}
        </button>
      </div>
    </div>
  );
}

export default function SocialPlayerProfile({
  profile,
  isOwner,
  sections,
  profileActions,
  publicProfileHref,
  networkProfileId,
  signingOut = false,
  onSignOut,
}: SocialPlayerProfileProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = selectedTab(searchParams.get("tab"));
  const nickname = getProfileNickname(profile);
  const avatarUrl = getProfileAvatarUrl(profile);
  const arenaUsername = getProfileArenaUsername(profile);
  const bio = profile.bio?.trim() || null;
  const locationDisplay = getProfileLocationDisplay(profile);
  const profileId = networkProfileId || getProfileId(profile);
  const showStats = isOwner || profile.stats_visible !== false;
  const showHosted = showStats && hasCount(profile, "hosted");
  const showPlayed = showStats && hasCount(profile, "played");
  const favoriteColors = getProfileFavoriteColors(profile);
  const favoriteFormats = getProfileFavoriteFormats(profile);
  const playingSinceYear = getProfilePlayingSinceYear(profile);
  const firstSetName = getProfileFirstSetName(profile);
  const playingSince = [playingSinceYear, firstSetName]
    .filter(Boolean)
    .join(" · ");
  const hasMagicProfile = Boolean(
    playingSince || favoriteColors.length || favoriteFormats.length,
  );

  function tabHref(tab: ProfileTabId): string {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "posts") params.delete("tab");
    else params.set("tab", tab);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <main className="min-h-screen px-4 py-5 text-foreground sm:px-5 sm:py-7 lg:px-0 lg:py-8">
      <div className="w-full max-w-[1050px]">
        <section className="rounded-surface bg-surface/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-secondary sm:h-28 sm:w-28">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${nickname} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-4xl font-bold text-primary">
                  {nickname.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                {nickname}
              </h1>
              {bio ? (
                <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {bio}
                </p>
              ) : null}
              {locationDisplay ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <MapPin size={15} aria-hidden="true" />
                  {locationDisplay}
                </p>
              ) : null}
              {arenaUsername ? (
                <div className="mt-3">
                  <CopyArenaTag arenaTag={arenaUsername} />
                </div>
              ) : null}
              {showHosted || showPlayed ? (
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  {showHosted
                    ? `${getHostedCount(profile)} events hosted`
                    : null}
                  {showHosted && showPlayed ? " · " : null}
                  {showPlayed
                    ? `${getPlayedCount(profile)} games played`
                    : null}
                </p>
              ) : null}
              {profileId ? (
                <div className="mt-3 flex items-center gap-3 text-sm font-semibold">
                  <Link
                    href={getProfileNetworkHref(profileId, "followers")}
                    className="text-muted-foreground hover:text-primary hover:underline"
                  >
                    Followers
                  </Link>
                  <span aria-hidden="true" className="text-border-strong">
                    ·
                  </span>
                  <Link
                    href={getProfileNetworkHref(profileId, "following")}
                    className="text-muted-foreground hover:text-primary hover:underline"
                  >
                    Following
                  </Link>
                </div>
              ) : null}
            </div>

            {isOwner ? (
              <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                <Button asChild size="sm">
                  <Link href="/profile/edit">
                    <Pencil size={14} aria-hidden="true" /> Edit profile
                  </Link>
                </Button>
                {publicProfileHref ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={publicProfileHref}>
                      <Eye size={14} aria-hidden="true" /> Public view
                    </Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <nav
          aria-label="Profile sections"
          className="mt-4 flex gap-1 overflow-x-auto py-1"
        >
          {PROFILE_TABS.map(([label, id]) => (
            <Link
              key={id}
              href={tabHref(id)}
              aria-current={activeTab === id ? "page" : undefined}
              className={[
                "shrink-0 rounded-lg px-3 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15",
                activeTab === id
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-secondary/55 hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </nav>

        {profileActions}

        {activeTab !== "about" ? (
          sections[activeTab] ?? null
        ) : (
          <section aria-labelledby="profile-about-title" className="py-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="profile-about-title"
                  className="text-lg font-semibold tracking-tight"
                >
                  About
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Player details and Magic preferences.
                </p>
              </div>
              {isOwner && !hasMagicProfile ? (
                <Link
                  href="/profile/edit"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Add Magic preferences
                </Link>
              ) : null}
            </div>

            <div className="mt-7 grid gap-x-12 gap-y-10 lg:grid-cols-2">
              <section aria-labelledby="player-information-title">
                <h3
                  id="player-information-title"
                  className="text-sm font-bold"
                >
                  Player information
                </h3>
                <dl className="mt-5 grid gap-6">
                  <AboutItem label="Nickname">{nickname}</AboutItem>
                  <AboutItem label="Bio" muted={!bio}>
                    {bio || "Not added yet"}
                  </AboutItem>
                  <AboutItem label="Location" muted={!locationDisplay}>
                    {locationDisplay || "Not added yet"}
                  </AboutItem>
                  <AboutItem label="MTG Arena" muted={!arenaUsername}>
                    {arenaUsername || "Not added yet"}
                  </AboutItem>
                </dl>
              </section>

              <section aria-labelledby="magic-profile-title">
                <h3 id="magic-profile-title" className="text-sm font-bold">
                  Magic profile
                </h3>
                <dl className="mt-5 grid gap-6">
                  <AboutItem label="Playing since" muted={!playingSince}>
                    {playingSince || "Not added yet"}
                  </AboutItem>

                  <AboutItem
                    label="Favorite colors"
                    muted={!favoriteColors.length}
                  >
                    {favoriteColors.length ? (
                      <ManaIdentity colors={favoriteColors} size="lg" />
                    ) : (
                      "Not added yet"
                    )}
                  </AboutItem>

                  <AboutItem
                    label="Favorite formats"
                    muted={!favoriteFormats.length}
                  >
                    {favoriteFormats.length ? (
                      <span className="flex flex-wrap gap-2">
                        {favoriteFormats.map((format) => (
                          <span
                            key={format}
                            className="rounded-full bg-secondary/70 px-3 py-1 text-xs font-semibold text-foreground"
                          >
                            {profileFormatLabel(format)}
                          </span>
                        ))}
                      </span>
                    ) : (
                      "Not added yet"
                    )}
                  </AboutItem>

                  {(showHosted || showPlayed) && (
                    <AboutItem label="Activity">
                      <span className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                        {showHosted ? (
                          <span>{getHostedCount(profile)} events hosted</span>
                        ) : null}
                        {showPlayed ? (
                          <span>{getPlayedCount(profile)} games played</span>
                        ) : null}
                      </span>
                    </AboutItem>
                  )}
                </dl>
              </section>
            </div>

            {isOwner ? (
              <OwnerTools signingOut={signingOut} onSignOut={onSignOut} />
            ) : null}
          </section>
        )}
      </div>
    </main>
  );
}
