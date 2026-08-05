"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import DirectMessageButton from "@/components/profile/DirectMessageButton";
import ProfileFollowButton from "@/components/profile/social/ProfileFollowButton";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import {
  blockProfile,
  favoriteProfile,
  getBlockStatus,
  isFavoriteProfile,
  reportProfile,
  unblockProfile,
  unfavoriteProfile,
} from "@/services/profiles";

const REPORT_REASONS = ["Inappropriate behavior", "Harassment", "Spam", "Other"];

function useProfileActions(profileId: string) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedMe, setBlockedMe] = useState(false);
  const [blockStatusKnown, setBlockStatusKnown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      setBlockStatusKnown(false);
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id ?? null;
        if (!active) return;
        setCurrentUserId(userId);
        if (userId && userId !== profileId) {
          const [favorite, block] = await Promise.all([
            isFavoriteProfile(profileId),
            getBlockStatus(profileId),
          ]);
          if (!active) return;
          setIsFavorite(favorite);
          setBlockedByMe(block.blocked_by_me);
          setBlockedMe(block.blocked_me);
          setBlockStatusKnown(true);
        }
      } catch {
        if (active) setError("Profile actions are unavailable right now.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [profileId]);

  async function run(name: string, action: () => Promise<unknown>, success: string) {
    setBusy(name);
    setMessage(null);
    setError(null);
    try {
      await action();
      setMessage(success);
    } catch {
      setError("That action could not be completed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleFavorite() {
    const next = !isFavorite;
    setIsFavorite(next);
    await run("favorite", () => next ? favoriteProfile(profileId) : unfavoriteProfile(profileId), next ? "Added to favorites." : "Removed from favorites.");
  }

  async function toggleBlock() {
    if (!blockedByMe && !window.confirm("Block this user? You won’t see their events or profile anymore.")) return;
    await run(blockedByMe ? "unblock" : "block", async () => {
      if (blockedByMe) await unblockProfile(profileId);
      else await blockProfile(profileId);
      setBlockedByMe(!blockedByMe);
    }, blockedByMe ? "User unblocked." : "User blocked.");
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const reason = String(data.get("reason") || "").trim();
    const details = String(data.get("details") || "").trim();
    if (!reason) return setError("Reason is required.");
    await run("report", async () => {
      await reportProfile(profileId, { reason, details });
      setShowReport(false);
    }, "Report submitted.");
  }

  return {
    currentUserId, isFavorite, blockedByMe, blockedMe, blockStatusKnown,
    loading, busy,
    showReport, setShowReport, message, error, toggleFavorite, toggleBlock, submitReport,
  };
}

export default function ProfileActionsPanel({ profileId }: { profileId: string }) {
  const state = useProfileActions(profileId);
  const base = "mt-4 rounded-surface bg-surface/55 p-4";

  if (state.loading) return <section className={base}><p className="text-sm text-zinc-500">Loading profile actions...</p></section>;

  if (!state.currentUserId) {
    return (
      <section className={base}>
        <p className="text-sm text-zinc-600">Log in to favorite, report, or block players.</p>
        <Button asChild size="sm" className="mt-3"><Link href="/login">Log in</Link></Button>
      </section>
    );
  }

  if (state.currentUserId === profileId) {
    return (
      <section className={base}>
        <p className="text-sm font-semibold text-zinc-700">This is your public profile.</p>
        <Link href="/profile" className="mt-2 inline-flex text-sm font-semibold text-primary hover:underline">Go to my profile</Link>
      </section>
    );
  }

  return (
    <section className={base} aria-label="Profile actions">
      <div className="flex flex-wrap gap-2">
        <ProfileFollowButton
          key={profileId}
          currentUserId={state.currentUserId}
          profileId={profileId}
          blocked={
            !state.blockStatusKnown ||
            state.blockedByMe ||
            state.blockedMe
          }
        />
        <DirectMessageButton
          profileId={profileId}
          blocked={!state.blockStatusKnown || state.blockedByMe || state.blockedMe}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => void state.toggleFavorite()} disabled={state.busy !== null || state.blockedByMe || state.blockedMe}>
          {state.busy === "favorite" ? "Saving..." : state.isFavorite ? "♥ Favorited" : "♡ Favorite"}
        </Button>
        <Button type="button" variant={state.blockedByMe ? "outline" : "destructive"} size="sm" onClick={() => void state.toggleBlock()} disabled={state.busy !== null}>
          {state.busy === "block" ? "Blocking..." : state.busy === "unblock" ? "Unblocking..." : state.blockedByMe ? "Unblock user" : "Block user"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => state.setShowReport((value) => !value)} disabled={state.busy !== null}>Report user</Button>
      </div>

      {state.blockedMe ? <p className="mt-3 rounded-control bg-muted px-3 py-2 text-sm text-muted-foreground">This user has blocked you.</p> : null}
      {state.showReport ? (
        <form onSubmit={state.submitReport} className="mt-4 grid max-w-xl gap-3 rounded-row bg-surface-subtle p-3">
          <label className="grid gap-1.5 text-sm font-medium">Reason
            <select name="reason" defaultValue={REPORT_REASONS[0]} className="min-h-10 rounded-control border border-input bg-surface px-3 outline-none focus-visible:border-primary/45 focus-visible:ring-[3px] focus-visible:ring-ring/12">
              {REPORT_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">Details
            <textarea name="details" rows={3} placeholder="Optional details" className="rounded-control border border-input bg-surface px-3 py-2 outline-none focus-visible:border-primary/45 focus-visible:ring-[3px] focus-visible:ring-ring/12" />
          </label>
          <Button type="submit" size="sm" className="justify-self-start" disabled={state.busy !== null}>
            {state.busy === "report" ? "Submitting..." : "Submit report"}
          </Button>
        </form>
      ) : null}
      {state.message ? <p className="mt-3 rounded-control bg-success-subtle px-3 py-2 text-sm text-success">{state.message}</p> : null}
      {state.error ? <p className="mt-3 rounded-control bg-destructive-subtle px-3 py-2 text-sm text-destructive">{state.error}</p> : null}
    </section>
  );
}
