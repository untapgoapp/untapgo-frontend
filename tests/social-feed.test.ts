import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getSocialFeedScope,
  mergeSocialComments,
  mergeSocialPostLikeUsers,
  mergeSocialPosts,
  replaceSocialPost,
  type SocialComment,
  type SocialPost,
  type SocialPostLikeUser,
} from "../lib/social-feed.ts";

function post(id: string, body = id): SocialPost {
  return {
    id,
    body,
    author: {
      id: "10000000-0000-4000-8000-000000000001",
      nickname: "Player",
      avatar_url: null,
    },
    created_at: "2026-08-02T10:00:00+00:00",
    updated_at: "2026-08-02T10:00:00+00:00",
    edited_at: null,
    can_edit: true,
    can_delete: true,
    like_count: 0,
    comment_count: 0,
    is_liked: false,
    is_saved: false,
  };
}

function comment(id: string): SocialComment {
  return {
    id,
    post_id: "post",
    body: id,
    author: post("author").author,
    created_at: "2026-08-02T10:00:00+00:00",
    updated_at: "2026-08-02T10:00:00+00:00",
    edited_at: null,
    can_delete: true,
  };
}

function likeUser(id: string): SocialPostLikeUser {
  return {
    id,
    nickname: id,
    avatar_url: null,
    location: null,
    relationship: {
      is_following: false,
      is_followed_by: false,
      is_mutual: false,
    },
    liked_at: "2026-08-03T12:00:00+00:00",
  };
}

test("feed views map to backend scopes", () => {
  assert.equal(getSocialFeedScope("for-you"), "for_you");
  assert.equal(getSocialFeedScope("following"), "following");
});

test("feed pagination deduplicates posts while preserving order", () => {
  const result = mergeSocialPosts(
    [post("one"), post("two", "old")],
    [post("two", "new"), post("three")],
  );
  assert.deepEqual(result.map((item) => item.id), ["one", "two", "three"]);
  assert.equal(result[1].body, "new");
});

test("post, comment and Like pagination keep stable identities", () => {
  assert.equal(replaceSocialPost([post("one"), post("two")], post("two", "edited"))[1].body, "edited");
  assert.deepEqual(
    mergeSocialComments([comment("one"), comment("two")], [comment("two"), comment("three")]).map((item) => item.id),
    ["one", "two", "three"],
  );
  assert.deepEqual(
    mergeSocialPostLikeUsers(
      [likeUser("one"), likeUser("two")],
      [likeUser("two"), likeUser("three")],
    ).map((item) => item.id),
    ["one", "two", "three"],
  );
});

test("social card exposes edit, Like, comments, Share and Save", () => {
  const card = readFileSync("components/social-feed/SocialPostCard.tsx", "utf8");
  const comments = readFileSync("components/social-feed/SocialPostComments.tsx", "utf8");
  const reactions = readFileSync("components/social-feed/PostReactionsDialog.tsx", "utf8");
  const service = readFileSync("services/social.ts", "utf8");

  assert.match(card, /Edit post/);
  assert.match(card, /Liked/);
  assert.match(card, /Comment/);
  assert.match(card, /Share/);
  assert.match(card, /Saved/);
  assert.match(comments, /Write a comment/);
  assert.match(service, /\/social\/posts\/saved/);
  assert.match(service, /\/like/);
  assert.match(service, /\/save/);
  assert.match(service, /\/comments/);
  assert.match(service, /\/likes/);
  assert.match(reactions, /aria-modal="true"/);
  assert.match(reactions, /Follow/);
  assert.match(reactions, /Load more/);
});

test("saved posts and individual post routes exist", () => {
  const favorites = readFileSync("app/profile/favorites/page.tsx", "utf8");
  const detail = readFileSync("app/post/[postId]/page.tsx", "utf8");
  const navigation = readFileSync("components/social-shell/navigation.ts", "utf8");

  assert.match(favorites, /Saved posts/);
  assert.match(detail, /SocialPostDetail/);
  assert.match(navigation, /"\/post"/);
});


test("profile header omits the redundant purple player label", () => {
  const profile = readFileSync(
    "components/profile/social/SocialPlayerProfile.tsx",
    "utf8",
  );

  assert.doesNotMatch(profile, /UntapGo player/);
  assert.doesNotMatch(profile, /Your player profile/);
});
