"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
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

type ProfileActionsPanelProps = {
  profileId: string;
};

const REPORT_REASONS = [
  "Inappropriate behavior",
  "Harassment",
  "Spam",
  "Other",
];

export default function ProfileActionsPanel({
  profileId,
}: ProfileActionsPanelProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedMe, setBlockedMe] = useState(false);

  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMe = Boolean(currentUserId && currentUserId === profileId);
  const isLoggedIn = Boolean(currentUserId);

  async function loadState() {
    setLoading(true);
    setError(null);

    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id ?? null;

      setCurrentUserId(userId);

      if (!userId || userId === profileId) {
        setLoading(false);
        return;
      }

      const [favorite, blockStatus] = await Promise.all([
        isFavoriteProfile(profileId),
        getBlockStatus(profileId),
      ]);

      setIsFavorite(favorite);
      setBlockedByMe(blockStatus.blocked_by_me);
      setBlockedMe(blockStatus.blocked_me);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load profile actions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  async function runAction({
    name,
    action,
    successMessage,
  }: {
    name: string;
    action: () => Promise<unknown>;
    successMessage: string;
  }) {
    setBusyAction(name);
    setMessage(null);
    setError(null);

    try {
      await action();
      setMessage(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleFavoriteToggle() {
    const nextValue = !isFavorite;

    setIsFavorite(nextValue);

    await runAction({
      name: "favorite",
      action: async () => {
        if (nextValue) {
          await favoriteProfile(profileId);
        } else {
          await unfavoriteProfile(profileId);
        }
      },
      successMessage: nextValue
        ? "Added to favorites."
        : "Removed from favorites.",
    });
  }

  async function handleBlock() {
    const confirmed = window.confirm(
      "Block this user? You won’t see their events or profile anymore."
    );

    if (!confirmed) return;

    await runAction({
      name: "block",
      action: async () => {
        await blockProfile(profileId);
        setBlockedByMe(true);
      },
      successMessage: "User blocked.",
    });
  }

  async function handleUnblock() {
    await runAction({
      name: "unblock",
      action: async () => {
        await unblockProfile(profileId);
        setBlockedByMe(false);
      },
      successMessage: "User unblocked.",
    });
  }

  async function handleReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const reason = String(form.get("reason") || "").trim();
    const details = String(form.get("details") || "").trim();

    if (!reason) {
      setError("Reason is required.");
      return;
    }

    await runAction({
      name: "report",
      action: async () => {
        await reportProfile(profileId, {
          reason,
          details,
        });
        setShowReport(false);
      },
      successMessage: "Report submitted.",
    });
  }

  if (loading) {
    return (
      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm text-zinc-500">Loading profile actions...</p>
      </section>
    );
  }

  if (!isLoggedIn) {
    return (
      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Profile actions</h2>

        <p className="mt-2 text-sm text-zinc-500">
          Log in to favorite, report, or block users.
        </p>

        <Link
          href="/login"
          className="mt-4 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
        >
          Log in
        </Link>
      </section>
    );
  }

  if (isMe) {
    return (
      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">This is your profile</h2>

        <p className="mt-2 text-sm text-zinc-500">
          Edit profile and deck management come next.
        </p>

        <Link
          href="/profile"
          className="mt-4 inline-flex rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold"
        >
          Go to my profile
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleFavoriteToggle}
          disabled={busyAction !== null || blockedByMe || blockedMe}
          className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyAction === "favorite"
            ? "Saving..."
            : isFavorite
              ? "♥ Favorited"
              : "♡ Favorite"}
        </button>

        {blockedByMe ? (
          <button
            type="button"
            onClick={handleUnblock}
            disabled={busyAction !== null}
            className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busyAction === "unblock" ? "Unblocking..." : "Unblock user"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBlock}
            disabled={busyAction !== null}
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busyAction === "block" ? "Blocking..." : "Block user"}
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowReport((value) => !value)}
          disabled={busyAction !== null}
          className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Report user
        </button>
      </div>

      {blockedMe ? (
        <p className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
          This user has blocked you.
        </p>
      ) : null}

      {showReport ? (
        <form onSubmit={handleReport} className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Reason</span>

            <select
              name="reason"
              defaultValue="Inappropriate behavior"
              className="rounded-xl border border-zinc-300 px-4 py-3"
            >
              {REPORT_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">Details</span>

            <textarea
              name="details"
              rows={3}
              placeholder="Optional details"
              className="rounded-xl border border-zinc-300 px-4 py-3"
            />
          </label>

          <button
            type="submit"
            disabled={busyAction !== null}
            className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busyAction === "report" ? "Submitting..." : "Submit report"}
          </button>
        </form>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      {error ? (
        <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </pre>
      ) : null}
    </section>
  );
}