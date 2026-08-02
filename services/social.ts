import { api } from "@/lib/api";
import {
  SOCIAL_FEED_PAGE_SIZE,
  getSocialFeedScope,
  type SocialFeedView,
  type SocialPost,
  type SocialPostPage,
} from "@/lib/social-feed";

export function getSocialFeed(
  view: SocialFeedView,
  page: number,
): Promise<SocialPostPage> {
  const parameters = new URLSearchParams({
    scope: getSocialFeedScope(view),
    page: String(page),
    page_size: String(SOCIAL_FEED_PAGE_SIZE),
  });

  return api.get<SocialPostPage>(`/social/feed?${parameters}`);
}

export function getProfileSocialPosts(
  profileId: string,
  page: number,
): Promise<SocialPostPage> {
  const parameters = new URLSearchParams({
    page: String(page),
    page_size: String(SOCIAL_FEED_PAGE_SIZE),
  });

  return api.get<SocialPostPage>(
    `/profiles/${encodeURIComponent(profileId)}/posts?${parameters}`,
  );
}

export function createSocialPost(body: string): Promise<SocialPost> {
  return api.post<SocialPost>("/social/posts", { body });
}

export function deleteSocialPost(postId: string): Promise<void> {
  return api.delete<void>(`/social/posts/${encodeURIComponent(postId)}`);
}
