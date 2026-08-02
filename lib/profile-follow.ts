export type ProfileRelationship = {
  is_following: boolean;
  is_followed_by: boolean;
  is_mutual: boolean;
};

export type ProfileFollowMutationResponse = {
  ok: boolean;
  is_following: boolean;
};

export type ProfileFollowStatus =
  | "unavailable"
  | "loading"
  | "ready"
  | "mutating"
  | "error";

export type ProfileFollowState = {
  relationship: ProfileRelationship | null;
  status: ProfileFollowStatus;
  error: string | null;
};

export type ProfileFollowAction =
  | { type: "availability_changed"; available: boolean }
  | { type: "relationship_loaded"; relationship: ProfileRelationship }
  | { type: "relationship_failed" }
  | { type: "mutation_started" }
  | { type: "mutation_succeeded"; isFollowing: boolean }
  | { type: "mutation_failed" };

export const PROFILE_FOLLOW_LOAD_ERROR =
  "Follow is unavailable right now.";

export const PROFILE_FOLLOW_ACTION_ERROR =
  "Could not update follow right now. Please try again.";

export const initialProfileFollowState: ProfileFollowState = {
  relationship: null,
  status: "unavailable",
  error: null,
};

export function canShowProfileFollow({
  currentUserId,
  profileId,
  blocked,
}: {
  currentUserId: string | null;
  profileId: string;
  blocked: boolean;
}): boolean {
  return Boolean(
    currentUserId &&
      currentUserId !== profileId &&
      !blocked,
  );
}

export function buildProfileFollowPath(profileId: string): string {
  return `/profiles/${encodeURIComponent(profileId)}/follow`;
}

export function buildProfileRelationshipPath(profileId: string): string {
  return `/profiles/${encodeURIComponent(profileId)}/relationship`;
}

export function getProfileFollowMutationRequest(
  profileId: string,
  mutation: "follow" | "unfollow",
): {
  method: "POST" | "DELETE";
  path: string;
} {
  return {
    method: mutation === "follow" ? "POST" : "DELETE",
    path: buildProfileFollowPath(profileId),
  };
}

export function getProfileRelationshipLabel(
  relationship: ProfileRelationship,
): string | null {
  if (relationship.is_followed_by && !relationship.is_following) {
    return "Follows you";
  }

  return null;
}

export function getProfileFollowActionLabel(
  relationship: ProfileRelationship,
): "Follow" | "Follow back" | "Following" | "Connected" {
  if (relationship.is_mutual) return "Connected";
  if (relationship.is_following) return "Following";
  if (relationship.is_followed_by) return "Follow back";
  return "Follow";
}

export function canStartProfileFollowMutation(
  state: ProfileFollowState,
): boolean {
  return state.status === "ready" && state.relationship !== null;
}

export function updateProfileFollowing(
  relationship: ProfileRelationship,
  isFollowing: boolean,
): ProfileRelationship {
  return {
    ...relationship,
    is_following: isFollowing,
    is_mutual: isFollowing && relationship.is_followed_by,
  };
}

export function profileFollowReducer(
  state: ProfileFollowState,
  action: ProfileFollowAction,
): ProfileFollowState {
  if (action.type === "availability_changed") {
    return action.available
      ? { relationship: null, status: "loading", error: null }
      : initialProfileFollowState;
  }

  if (action.type === "relationship_loaded") {
    return {
      relationship: action.relationship,
      status: "ready",
      error: null,
    };
  }

  if (action.type === "relationship_failed") {
    return {
      relationship: null,
      status: "error",
      error: PROFILE_FOLLOW_LOAD_ERROR,
    };
  }

  if (action.type === "mutation_started") {
    return canStartProfileFollowMutation(state)
      ? { ...state, status: "mutating", error: null }
      : state;
  }

  if (action.type === "mutation_succeeded" && state.relationship) {
    return {
      relationship: updateProfileFollowing(
        state.relationship,
        action.isFollowing,
      ),
      status: "ready",
      error: null,
    };
  }

  if (action.type === "mutation_failed") {
    return {
      ...state,
      status: state.relationship ? "ready" : "error",
      error: PROFILE_FOLLOW_ACTION_ERROR,
    };
  }

  return state;
}
