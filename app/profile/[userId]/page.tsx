"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import ProfileActionsPanel from "@/components/profile/ProfileActionsPanel";
import ProfileBinderLinks from "@/components/profile/ProfileBinderLinks";
import ProfileDeckSection from "@/components/profile/social/ProfileDeckSection";
import ProfileEventSections from "@/components/profile/social/ProfileEventSections";
import ProfileLoadingState from "@/components/profile/social/ProfileLoadingState";
import ProfilePostsSection from "@/components/profile/social/ProfilePostsSection";
import ProfileTrustSection from "@/components/profile/social/ProfileTrustSection";
import SocialPlayerProfile from "@/components/profile/social/SocialPlayerProfile";
import {
  normalizePublicDeck,
  selectPublicHostedEvents,
  type ProfileDeckView,
  type ProfileEventView,
} from "@/components/profile/social/profile-view-data";
import { getEvents } from "@/services/events";
import {
  getPublicProfile,
  getPublicProfileDecks,
  getProfileTrustSummary,
  type ProfileTrustSummary,
  type PublicProfile,
} from "@/services/profiles";

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [decks, setDecks] = useState<ProfileDeckView[] | null>(null);
  const [upcoming, setUpcoming] = useState<ProfileEventView[] | null>(null);
  const [trust, setTrust] = useState<ProfileTrustSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFailed, setProfileFailed] = useState(false);
  const [decksFailed, setDecksFailed] = useState(false);
  const [eventsFailed, setEventsFailed] = useState(false);
  const [trustFailed, setTrustFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setProfileFailed(false);
      setDecks(null);
      setUpcoming(null);
      setTrust(null);
      setDecksFailed(false);
      setEventsFailed(false);
      setTrustFailed(false);

      try {
        const loadedProfile = await getPublicProfile(userId, { asPublic: true });
        if (!active) return;
        setProfile(loadedProfile);
        setLoading(false);

        const [deckResult, eventResult, trustResult] = await Promise.allSettled([
          getPublicProfileDecks(userId, { asPublic: true }),
          getEvents(),
          getProfileTrustSummary(userId),
        ]);
        if (!active) return;

        if (deckResult.status === "fulfilled") {
          setDecks(deckResult.value.map(normalizePublicDeck));
        } else {
          setDecksFailed(true);
        }

        if (eventResult.status === "fulfilled") {
          setUpcoming(selectPublicHostedEvents(eventResult.value, userId));
        } else {
          setEventsFailed(true);
        }

        if (trustResult.status === "fulfilled") {
          setTrust(trustResult.value);
        } else {
          setTrustFailed(true);
        }
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
  }, [userId]);

  if (loading) return <ProfileLoadingState />;

  if (profileFailed || !profile) {
    return (
      <main className="min-h-screen bg-[#F8F5EF] px-4 py-8 text-zinc-950 lg:px-0">
        <div className="w-full max-w-[1050px] border-y border-black/10 py-6">
          <Link href="/events" className="text-sm font-semibold text-[#6E5AA7]">← Back to events</Link>
          <h1 className="mt-5 text-xl font-bold">Could not load profile</h1>
          <p className="mt-2 text-sm text-zinc-500">This player profile is unavailable right now.</p>
        </div>
      </main>
    );
  }

  return (
    <SocialPlayerProfile
      profile={profile}
      isOwner={false}
      networkProfileId={userId}
      profileActions={(
        <div>
          <ProfileBinderLinks profileId={userId} owner={false} />
          <Link href="/events" className="mt-4 inline-flex text-sm font-semibold text-[#6E5AA7] hover:underline">
            ← Back to events
          </Link>
          <ProfileActionsPanel profileId={userId} />
        </div>
      )}
      sections={{
        posts: <ProfilePostsSection profileId={userId} isOwner={false} />,
        decks: (
          <ProfileDeckSection
            decks={decks}
            failed={decksFailed}
            isOwner={false}
            publicDecksVisible={profile.public_decks_visible}
          />
        ),
        events: (
          <ProfileEventSections
            upcoming={upcoming}
            failed={eventsFailed}
            isOwner={false}
          />
        ),
        trust: <ProfileTrustSection summary={trust} failed={trustFailed} />,
      }}
    />
  );
}
