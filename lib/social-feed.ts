export const SOCIAL_FEED_PAGE_SIZE = 20;
export const SOCIAL_POST_MAX_LENGTH = 4000;

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
  can_delete: boolean;
};

export type SocialPostPage = {
  items: SocialPost[];
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
