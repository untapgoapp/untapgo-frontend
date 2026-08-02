import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getSocialFeedScope,
  mergeSocialPosts,
  type SocialPost,
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
    can_delete: true,
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

test("Home composer and feed use real social endpoints", () => {
  const composer = readFileSync("components/home/HomeFeedComposer.tsx", "utf8");
  const dashboard = readFileSync("components/home/HomeDashboardContent.tsx", "utf8");
  const service = readFileSync("services/social.ts", "utf8");

  assert.match(composer, /What’s happening at your table\?/);
  assert.match(composer, /onCreate/);
  assert.match(dashboard, /useSocialFeed/);
  assert.match(service, /\/social\/feed/);
  assert.match(service, /\/social\/posts/);
});
