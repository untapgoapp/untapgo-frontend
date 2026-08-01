"use client";

import { useEffect, useReducer, useRef } from "react";

import {
  canShowProfileFollow,
  canStartProfileFollowMutation,
  getProfileRelationshipLabel,
  initialProfileFollowState,
  profileFollowReducer,
} from "@/lib/profile-follow";
import {
  followProfile,
  getProfileRelationship,
  unfollowProfile,
} from "@/services/profiles";

type ProfileFollowButtonProps = {
  currentUserId: string | null;
  profileId: string;
  blocked: boolean;
};

export default function ProfileFollowButton({
  currentUserId,
  profileId,
  blocked,
}: ProfileFollowButtonProps) {
  const [state, dispatch] = useReducer(
    profileFollowReducer,
    initialProfileFollowState,
  );
  const [reloadSequence, retryLoad] = useReducer(
    (value: number) => value + 1,
    0,
  );
  const requestSequence = useRef(0);
  const mutationInFlight = useRef(false);
  const available = canShowProfileFollow({
    currentUserId,
    profileId,
    blocked,
  });
  useEffect(() => {
    const requestId = ++requestSequence.current;
    dispatch({ type: "availability_changed", available });

    if (!available) return;

    async function loadRelationship() {
      try {
        const relationship = await getProfileRelationship(profileId);
        if (requestId !== requestSequence.current) return;
        dispatch({ type: "relationship_loaded", relationship });
      } catch {
        if (requestId !== requestSequence.current) return;
        dispatch({ type: "relationship_failed" });
      }
    }

    void loadRelationship();
    return () => {
      requestSequence.current += 1;
    };
  }, [available, profileId, reloadSequence]);

  if (!available) return null;

  if (state.status === "loading") {
    return (
      <button
        type="button"
        disabled
        className="min-h-9 rounded-lg bg-[#EEE9FF] px-3 text-sm font-semibold text-[#6E5AA7] opacity-70"
      >
        Loading follow...
      </button>
    );
  }

  if (!state.relationship) {
    return (
      <div className="flex min-h-9 items-center gap-2 text-xs text-zinc-500">
        <span role="alert">{state.error}</span>
        <button
          type="button"
          onClick={retryLoad}
          className="font-semibold text-[#6E5AA7] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const isFollowing = state.relationship.is_following;
  const isMutating = state.status === "mutating";
  const relationshipLabel = getProfileRelationshipLabel(
    state.relationship,
  );

  async function toggleFollow() {
    if (
      mutationInFlight.current ||
      !canStartProfileFollowMutation(state)
    ) return;

    mutationInFlight.current = true;
    dispatch({ type: "mutation_started" });
    const mutationRequestId = requestSequence.current;

    try {
      const result = isFollowing
        ? await unfollowProfile(profileId)
        : await followProfile(profileId);
      if (requestSequence.current !== mutationRequestId) return;
      dispatch({
        type: "mutation_succeeded",
        isFollowing: result.is_following,
      });
    } catch {
      if (requestSequence.current === mutationRequestId) {
        dispatch({ type: "mutation_failed" });
      }
    } finally {
      mutationInFlight.current = false;
    }
  }

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-x-2 gap-y-1">
      <button
        type="button"
        onClick={() => void toggleFollow()}
        disabled={isMutating}
        aria-pressed={isFollowing}
        aria-busy={isMutating}
        className={[
          "min-h-9 rounded-lg border px-3 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60",
          isFollowing
            ? "border-[#6E5AA7]/20 bg-[#EEE9FF] text-[#5D498E] hover:border-[#6E5AA7]/35"
            : "border-[#6E5AA7] bg-[#6E5AA7] text-white hover:bg-[#5F4E94]",
        ].join(" ")}
      >
        {isMutating
          ? isFollowing ? "Unfollowing..." : "Following..."
          : isFollowing ? "Following" : "Follow"}
      </button>
      {relationshipLabel ? (
        <span className="text-xs font-medium text-zinc-500">
          {relationshipLabel}
        </span>
      ) : null}
      {state.error ? (
        <span role="alert" className="basis-full text-xs text-red-700">
          {state.error}
        </span>
      ) : null}
    </div>
  );
}
