"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Ban, Eye, Heart, LogOut, Pencil, Settings2, ShieldCheck } from "lucide-react";

import CopyArenaTag from "@/components/profile/CopyArenaTag";
import { Button } from "@/components/ui/button";
import { getProfileNetworkHref } from "@/lib/profile-network";
import {
  getHostedCount,
  getPlayedCount,
  getProfileArenaUsername,
  getProfileAvatarUrl,
  getProfileId,
  getProfileNickname,
  type PublicProfile,
} from "@/services/profiles";

type SocialPlayerProfileProps = {
  profile: PublicProfile;
  isOwner: boolean;
  children: ReactNode;
  profileActions?: ReactNode;
  publicProfileHref?: string;
  networkProfileId?: string;
  signingOut?: boolean;
  onSignOut?: () => void;
};

const PROFILE_NAVIGATION = [
  ["Posts", "posts"],
  ["Decks", "decks"],
  ["Events", "events"],
  ["Trust", "trust"],
  ["About", "about"],
] as const;

type ProfileSectionId = (typeof PROFILE_NAVIGATION)[number][1];

function hasCount(profile: PublicProfile, key: "hosted" | "played"): boolean {
  return key === "hosted"
    ? profile.hosted_count != null || profile.hostedCount != null
    : profile.played_count != null || profile.playedCount != null;
}

function AboutRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 rounded-row px-3 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs font-semibold text-quiet-foreground">{label}</dt>
      <dd className="min-w-0 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{children}</dd>
    </div>
  );
}

function OwnerTools({ signingOut, onSignOut }: { signingOut: boolean; onSignOut?: () => void }) {
  const links = [
    ["Favorite players", "/profile/favorites", Heart],
    ["Blocked users", "/profile/blocked", Ban],
    ["Profile privacy", "/profile/privacy", ShieldCheck],
    ["Settings", "/settings", Settings2],
  ] as const;

  return (
    <div className="mt-5 rounded-surface bg-surface-subtle p-4">
      <p className="text-xs font-semibold text-quiet-foreground">Owner tools</p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-3">
        {links.map(([label, href, Icon]) => (
          <Link key={href} href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
            <Icon size={14} aria-hidden="true" /> {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary disabled:opacity-50"
        >
          <LogOut size={14} aria-hidden="true" /> {signingOut ? "Signing out..." : "Log out"}
        </button>
      </div>
    </div>
  );
}

export default function SocialPlayerProfile({
  profile,
  isOwner,
  children,
  profileActions,
  publicProfileHref,
  networkProfileId,
  signingOut = false,
  onSignOut,
}: SocialPlayerProfileProps) {
  const [activeSection, setActiveSection] = useState<ProfileSectionId>("posts");
  const nickname = getProfileNickname(profile);
  const avatarUrl = getProfileAvatarUrl(profile);
  const arenaUsername = getProfileArenaUsername(profile);
  const bio = profile.bio?.trim() || null;
  const profileId = networkProfileId || getProfileId(profile);
  const showStats = isOwner || profile.stats_visible !== false;
  const showHosted = showStats && hasCount(profile, "hosted");
  const showPlayed = showStats && hasCount(profile, "played");

  useEffect(() => {
    let frame = 0;

    function updateActiveSection() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const marker = Math.min(180, window.innerHeight * 0.28);
        let current: ProfileSectionId = "posts";

        PROFILE_NAVIGATION.forEach(([, id]) => {
          const section = document.getElementById(id);
          if (section && section.getBoundingClientRect().top <= marker) current = id;
        });

        const pageBottom = window.scrollY + window.innerHeight;
        if (pageBottom >= document.documentElement.scrollHeight - 2) current = "about";
        setActiveSection((previous) => previous === current ? previous : current);
      });
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, []);

  return (
    <main className="min-h-screen px-4 py-5 text-foreground sm:px-5 sm:py-7 lg:px-0 lg:py-8">
      <div className="w-full max-w-[1050px]">
        <section className="rounded-surface bg-surface/70 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-secondary sm:h-28 sm:w-28">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`${nickname} avatar`} className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center text-4xl font-bold text-primary">
                  {nickname.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                {isOwner ? "Your player profile" : "UntapGo player"}
              </p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">{nickname}</h1>
              {bio ? <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{bio}</p> : null}
              {arenaUsername ? <div className="mt-3"><CopyArenaTag arenaTag={arenaUsername} /></div> : null}
              {showHosted || showPlayed ? (
                <p className="mt-3 text-xs font-medium text-muted-foreground">
                  {showHosted ? `${getHostedCount(profile)} events hosted` : null}
                  {showHosted && showPlayed ? " · " : null}
                  {showPlayed ? `${getPlayedCount(profile)} games played` : null}
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
                  <span aria-hidden="true" className="text-border-strong">·</span>
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
                <Button asChild size="sm"><Link href="/profile/edit"><Pencil size={14} aria-hidden="true" /> Edit profile</Link></Button>
                {publicProfileHref ? (
                  <Button asChild size="sm" variant="outline"><Link href={publicProfileHref}><Eye size={14} aria-hidden="true" /> Public view</Link></Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <nav aria-label="Profile sections" className="mt-4 flex gap-1 overflow-x-auto">
          {PROFILE_NAVIGATION.map(([label, id]) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={activeSection === id ? "location" : undefined}
              onClick={() => setActiveSection(id)}
              className={[
                "shrink-0 rounded-control px-3 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15",
                activeSection === id
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </a>
          ))}
        </nav>

        {profileActions}
        {children}

        <section id="about" aria-labelledby="profile-about-title" className="scroll-mt-6 py-6">
          <h2 id="profile-about-title" className="text-lg font-semibold tracking-tight">About</h2>
          <dl className="mt-3 grid gap-1 rounded-surface bg-surface/55 p-1">
            <AboutRow label="Nickname">{nickname}</AboutRow>
            {arenaUsername ? <AboutRow label="MTG Arena">{arenaUsername}</AboutRow> : null}
            {bio ? <AboutRow label="Bio">{bio}</AboutRow> : null}
            {showHosted ? <AboutRow label="Events hosted">{getHostedCount(profile)}</AboutRow> : null}
            {showPlayed ? <AboutRow label="Games played">{getPlayedCount(profile)}</AboutRow> : null}
          </dl>
          {isOwner ? <OwnerTools signingOut={signingOut} onSignOut={onSignOut} /> : null}
        </section>
      </div>
    </main>
  );
}
