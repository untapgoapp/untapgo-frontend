import assert from "node:assert/strict";
import test from "node:test";

import {
  PROFILE_FOLLOW_ACTION_ERROR,
  PROFILE_FOLLOW_LOAD_ERROR,
  canShowProfileFollow,
  canStartProfileFollowMutation,
  getProfileFollowMutationRequest,
  getProfileRelationshipLabel,
  initialProfileFollowState,
  profileFollowReducer,
  type ProfileRelationship,
} from "../lib/profile-follow.ts";

const viewerId = "viewer-id";
const profileId = "profile/id";

function relationship(
  values: Partial<ProfileRelationship> = {},
): ProfileRelationship {
  return {
    is_following: false,
    is_followed_by: false,
    is_mutual: false,
    ...values,
  };
}

function readyState(values: Partial<ProfileRelationship> = {}) {
  return profileFollowReducer(initialProfileFollowState, {
    type: "relationship_loaded",
    relationship: relationship(values),
  });
}

test("Follow is hidden on the owner profile and without authentication", () => {
  assert.equal(
    canShowProfileFollow({
      currentUserId: viewerId,
      profileId: viewerId,
      blocked: false,
    }),
    false,
  );
  assert.equal(
    canShowProfileFollow({
      currentUserId: null,
      profileId,
      blocked: false,
    }),
    false,
  );
});

test("existing relationship state is retained for presentation", () => {
  const state = readyState({ is_following: true });

  assert.equal(state.status, "ready");
  assert.equal(state.relationship?.is_following, true);
  assert.equal(canStartProfileFollowMutation(state), true);
});

test("Follow uses POST and updates the visible state", () => {
  const request = getProfileFollowMutationRequest(profileId, "follow");
  const started = profileFollowReducer(readyState(), {
    type: "mutation_started",
  });
  const completed = profileFollowReducer(started, {
    type: "mutation_succeeded",
    isFollowing: true,
  });

  assert.deepEqual(request, {
    method: "POST",
    path: "/profiles/profile%2Fid/follow",
  });
  assert.equal(completed.relationship?.is_following, true);
});

test("Following uses DELETE and updates the visible state", () => {
  const request = getProfileFollowMutationRequest(profileId, "unfollow");
  const started = profileFollowReducer(
    readyState({
      is_following: true,
      is_followed_by: true,
      is_mutual: true,
    }),
    { type: "mutation_started" },
  );
  const completed = profileFollowReducer(started, {
    type: "mutation_succeeded",
    isFollowing: false,
  });

  assert.equal(request.method, "DELETE");
  assert.equal(completed.relationship?.is_following, false);
  assert.equal(completed.relationship?.is_mutual, false);
});

test("a mutation cannot start again while one is already running", () => {
  const started = profileFollowReducer(readyState(), {
    type: "mutation_started",
  });
  const repeated = profileFollowReducer(started, {
    type: "mutation_started",
  });

  assert.equal(canStartProfileFollowMutation(started), false);
  assert.strictEqual(repeated, started);
});

test("relationship labels distinguish follows-you and mutual states", () => {
  assert.equal(
    getProfileRelationshipLabel(
      relationship({ is_followed_by: true }),
    ),
    "Follows you",
  );
  assert.equal(
    getProfileRelationshipLabel(
      relationship({
        is_following: true,
        is_followed_by: true,
        is_mutual: true,
      }),
    ),
    "Mutual follow",
  );
  assert.equal(getProfileRelationshipLabel(relationship()), null);
});

test("API failures use friendly fixed messages", () => {
  const loadFailed = profileFollowReducer(initialProfileFollowState, {
    type: "relationship_failed",
  });
  const mutationFailed = profileFollowReducer(readyState(), {
    type: "mutation_failed",
  });

  assert.equal(loadFailed.error, PROFILE_FOLLOW_LOAD_ERROR);
  assert.equal(mutationFailed.error, PROFILE_FOLLOW_ACTION_ERROR);
});

test("blocking hides and clears the visible relationship", () => {
  const loaded = readyState({ is_following: true });
  const cleared = profileFollowReducer(loaded, {
    type: "availability_changed",
    available: false,
  });

  assert.equal(
    canShowProfileFollow({
      currentUserId: viewerId,
      profileId,
      blocked: true,
    }),
    false,
  );
  assert.deepEqual(cleared, initialProfileFollowState);
});
