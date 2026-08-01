"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";

import NotificationBell from "@/components/notifications/NotificationBell";
import { useUser } from "@/hooks/useUser";
import {
  getProfileAvatarUrl,
  getProfileNickname,
  getPublicProfile,
  type PublicProfile,
} from "@/services/profiles";

import SocialMessagingMenu from "./SocialMessagingMenu";
import SocialProfileMenu from "./SocialProfileMenu";

export default function SocialTopBar() {
  const { user } = useUser();
  const [profile, setProfile] = useState<PublicProfile | null>(null);

  useEffect(() => {
    let active = true;
    setProfile(null);
    if (user?.id) {
      void getPublicProfile(user.id).then(
        (value) => { if (active) setProfile(value); },
        () => { if (active) setProfile(null); },
      );
    }
    return () => { active = false; };
  }, [user?.id]);

  return (
    <header
      data-social-top-bar
      className="sticky top-0 z-[80] border-b border-border/75 bg-background"
    >
      <div className="mx-auto flex h-16 w-full max-w-[1580px] items-center justify-between gap-4 px-4 sm:px-5 lg:px-6">
        <Link
          href="/home"
          aria-label="UntapGo home"
          className="flex min-h-11 items-center gap-2 rounded-control text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15"
        >
          <span className="grid h-9 w-9 place-items-center rounded-control bg-secondary/75">
            <img src="/logo.png" alt="" className="h-7 w-7 object-contain" />
          </span>
          <span className="text-base font-black tracking-[-0.04em] sm:text-[17px]">UntapGo</span>
        </Link>

        <div className="flex items-center gap-1.5" aria-label="Account activity">
          <SocialMessagingMenu viewerKey={user?.id ?? null} />
          <NotificationBell />
          <SocialProfileMenu
            nickname={profile ? getProfileNickname(profile) : "Player"}
            avatarUrl={profile ? getProfileAvatarUrl(profile) : null}
          />
        </div>
      </div>
    </header>
  );
}
