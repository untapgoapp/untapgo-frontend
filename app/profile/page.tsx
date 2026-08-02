"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ProfileDeckSection from "@/components/profile/social/ProfileDeckSection";
import ProfileBinderLinks from "@/components/profile/ProfileBinderLinks";
import ProfileEventSections from "@/components/profile/social/ProfileEventSections";
import ProfileLoadingState from "@/components/profile/social/ProfileLoadingState";
import ProfilePostsSection from "@/components/profile/social/ProfilePostsSection";
import ProfileTrustSection from "@/components/profile/social/ProfileTrustSection";
import SocialPlayerProfile from "@/components/profile/social/SocialPlayerProfile";
import {
  normalizeOwnerDeck,
  selectOwnerProfileEvents,
  type ProfileDeckView,
  type ProfileEventView,
} from "@/components/profile/social/profile-view-data";
import { decksApi } from "@/lib/decks-api";
import { supabase } from "@/lib/supabase/client";
import { getMyEvents } from "@/services/events";
import {
  getProfileId,
  getProfileTrustSummary,
  getPublicProfile,
  type ProfileTrustSummary,
  type PublicProfile,
} from "@/services/profiles";
import { unregisterPushBeforeSignOut } from "@/services/push";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [decks, setDecks] = useState<ProfileDeckView[] | null>(null);
  const [upcoming, setUpcoming] = useState<ProfileEventView[] | null>(null);
  const [recent, setRecent] = useState<ProfileEventView[] | null>(null);
  const [trust, setTrust] = useState<ProfileTrustSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFailed, setProfileFailed] = useState(false);
  const [decksFailed, setDecksFailed] = useState(false);
  const [eventsFailed, setEventsFailed] = useState(false);
  const [trustFailed, setTrustFailed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [actionError, setActionError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSections(id: string) {
      const [deckResult, eventResult, trustResult] = await Promise.allSettled([
        decksApi.list(),
        getMyEvents(),
        getProfileTrustSummary(id),
      ]);
      if (!active) return;

      if (deckResult.status === "fulfilled") {
        setDecks(deckResult.value.decks.map(normalizeOwnerDeck));
      } else {
        setDecksFailed(true);
      }

      if (eventResult.status === "fulfilled") {
        const selected = selectOwnerProfileEvents(eventResult.value, id);
        setUpcoming(selected.upcoming);
        setRecent(selected.recent);
      } else {
        setEventsFailed(true);
      }

      if (trustResult.status === "fulfilled") {
        setTrust(trustResult.value);
      } else {
        setTrustFailed(true);
      }
    }

    async function loadProfile() {
      setLoading(true);
      setProfileFailed(false);

      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data.user) {
          router.replace("/login?next=%2Fprofile");
          return;
        }

        const loadedProfile = await getPublicProfile(data.user.id);
        if (!active) return;

        setUserId(data.user.id);
        setProfile(loadedProfile);
        setLoading(false);
        void loadSections(data.user.id);
      } catch {
        if (active) setProfileFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
    };
  }, [router]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setActionError(false);

    try {
      await unregisterPushBeforeSignOut();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch {
      setActionError(true);
      setSigningOut(false);
    }
  }

  if (loading) return <ProfileLoadingState />;

  if (profileFailed || !profile || !userId) {
    return (
      <main className="min-h-screen bg-[#F8F5EF] px-4 py-8 text-zinc-950 lg:px-0">
        <div className="w-full max-w-[1050px] border-y border-black/10 py-6">
          <h1 className="text-xl font-bold">Could not load your profile</h1>
          <p className="mt-2 text-sm text-zinc-500">Please try again in a moment.</p>
          <Link href="/profile/edit" className="mt-4 inline-flex text-sm font-semibold text-[#6E5AA7]">
            Edit profile
          </Link>
        </div>
      </main>
    );
  }

  const profileId = getProfileId(profile) || userId;

  return (
    <SocialPlayerProfile
      profile={profile}
      isOwner
      networkProfileId={profileId}
      publicProfileHref={`/profile/${encodeURIComponent(profileId)}`}
      signingOut={signingOut}
      onSignOut={() => void signOut()}
      profileActions={<><ProfileBinderLinks profileId={profileId} owner />{actionError ? (
        <p className="mt-4 border-y border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">Could not log out. Please try again.</p>
      ) : null}</>}
    >
      <ProfilePostsSection profileId={profileId} isOwner />
      <ProfileDeckSection decks={decks} failed={decksFailed} isOwner />
      <ProfileEventSections
        upcoming={upcoming}
        recent={recent}
        failed={eventsFailed}
        isOwner
      />
      <ProfileTrustSection summary={trust} failed={trustFailed} />
    </SocialPlayerProfile>
  );
}
