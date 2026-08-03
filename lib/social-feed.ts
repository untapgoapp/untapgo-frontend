export const SOCIAL_FEED_PAGE_SIZE = 20;
export const SOCIAL_POST_MAX_LENGTH = 4000;
export const SOCIAL_COMMENT_MAX_LENGTH = 2000;

export type SocialFeedView = "for-you" | "following";

export type SocialPostAuthor = {
  id: string;
  nickname: string;
  avatar_url: string | null;
};

export type SocialPost = {
  id: string;
  author: SocialPostAuthor;
  body: string;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  can_edit: boolean;
  can_delete: boolean;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  is_saved: boolean;
};

export type SocialPostPage = {
  items: SocialPost[];
  page: number;
  page_size: number;
  has_more: boolean;
};

export type SocialPostLikeState = {
  is_liked: boolean;
  like_count: number;
};

export type SocialPostLikeUser = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  location: {
    city: string;
    region: string | null;
    country: string;
    country_code: string | null;
    display_name: string;
  } | null;
  relationship: {
    is_following: boolean;
    is_followed_by: boolean;
    is_mutual: boolean;
  };
  liked_at: string;
};

export type SocialPostLikeUserPage = {
  items: SocialPostLikeUser[];
  page: number;
  page_size: number;
  has_more: boolean;
};

export type SocialPostSaveState = {
  is_saved: boolean;
};

export type SocialComment = {
  id: string;
  post_id: string;
  author: SocialPostAuthor;
  body: string;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  can_delete: boolean;
};

export type SocialCommentPage = {
  items: SocialComment[];
  page: number;
  page_size: number;
  has_more: boolean;
};

export function getSocialFeedScope(view: SocialFeedView): "for_you" | "following" {
  return view === "following" ? "following" : "for_you";
}

export function mergeSocialPosts(
  current: SocialPost[],
  incoming: SocialPost[],
): SocialPost[] {
  const byId = new Map<string, SocialPost>();
  current.forEach((post) => byId.set(post.id, post));
  incoming.forEach((post) => byId.set(post.id, post));
  return Array.from(byId.values());
}

export function replaceSocialPost(
  current: SocialPost[],
  replacement: SocialPost,
): SocialPost[] {
  return current.map((post) => (
    post.id === replacement.id ? replacement : post
  ));
}

export function mergeSocialComments(
  current: SocialComment[],
  incoming: SocialComment[],
): SocialComment[] {
  const byId = new Map<string, SocialComment>();
  current.forEach((comment) => byId.set(comment.id, comment));
  incoming.forEach((comment) => byId.set(comment.id, comment));
  return Array.from(byId.values());
}

export function mergeSocialPostLikeUsers(
  current: SocialPostLikeUser[],
  incoming: SocialPostLikeUser[],
): SocialPostLikeUser[] {
  const byId = new Map<string, SocialPostLikeUser>();
  current.forEach((user) => byId.set(user.id, user));
  incoming.forEach((user) => byId.set(user.id, user));
  return Array.from(byId.values());
}

export function formatSocialPostTime(value: string): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Just now";

  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const absolute = Math.abs(seconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absolute < 60) return formatter.format(seconds, "second");
  if (absolute < 60 * 60) return formatter.format(Math.round(seconds / 60), "minute");
  if (absolute < 60 * 60 * 24) return formatter.format(Math.round(seconds / 3600), "hour");
  if (absolute < 60 * 60 * 24 * 7) return formatter.format(Math.round(seconds / 86400), "day");

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: new Date(value).getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(new Date(value));
}

export function formatSocialCount(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}
