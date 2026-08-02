import { api } from "@/lib/api";
import {
  SOCIAL_FEED_PAGE_SIZE,
  getSocialFeedScope,
  type SocialComment,
  type SocialCommentPage,
  type SocialFeedView,
  type SocialPost,
  type SocialPostLikeState,
  type SocialPostPage,
  type SocialPostSaveState,
} from "@/lib/social-feed";

function pageParameters(page: number): URLSearchParams {
  return new URLSearchParams({
    page: String(page),
    page_size: String(SOCIAL_FEED_PAGE_SIZE),
  });
}

export function getSocialFeed(
  view: SocialFeedView,
  page: number,
): Promise<SocialPostPage> {
  const parameters = pageParameters(page);
  parameters.set("scope", getSocialFeedScope(view));
  return api.get<SocialPostPage>(`/social/feed?${parameters}`);
}

export function getProfileSocialPosts(
  profileId: string,
  page: number,
): Promise<SocialPostPage> {
  return api.get<SocialPostPage>(
    `/profiles/${encodeURIComponent(profileId)}/posts?${pageParameters(page)}`,
  );
}

export function getSavedSocialPosts(page: number): Promise<SocialPostPage> {
  return api.get<SocialPostPage>(`/social/posts/saved?${pageParameters(page)}`);
}

export function getSocialPost(postId: string): Promise<SocialPost> {
  return api.get<SocialPost>(`/social/posts/${encodeURIComponent(postId)}`);
}

export function createSocialPost(body: string): Promise<SocialPost> {
  return api.post<SocialPost>("/social/posts", { body });
}

export function updateSocialPost(postId: string, body: string): Promise<SocialPost> {
  return api.patch<SocialPost>(`/social/posts/${encodeURIComponent(postId)}`, { body });
}

export function deleteSocialPost(postId: string): Promise<void> {
  return api.delete<void>(`/social/posts/${encodeURIComponent(postId)}`);
}

export function likeSocialPost(postId: string): Promise<SocialPostLikeState> {
  return api.post<SocialPostLikeState>(
    `/social/posts/${encodeURIComponent(postId)}/like`,
  );
}

export function unlikeSocialPost(postId: string): Promise<SocialPostLikeState> {
  return api.delete<SocialPostLikeState>(
    `/social/posts/${encodeURIComponent(postId)}/like`,
  );
}

export function saveSocialPost(postId: string): Promise<SocialPostSaveState> {
  return api.post<SocialPostSaveState>(
    `/social/posts/${encodeURIComponent(postId)}/save`,
  );
}

export function unsaveSocialPost(postId: string): Promise<SocialPostSaveState> {
  return api.delete<SocialPostSaveState>(
    `/social/posts/${encodeURIComponent(postId)}/save`,
  );
}

export function getSocialPostComments(
  postId: string,
  page: number,
): Promise<SocialCommentPage> {
  return api.get<SocialCommentPage>(
    `/social/posts/${encodeURIComponent(postId)}/comments?${pageParameters(page)}`,
  );
}

export function createSocialPostComment(
  postId: string,
  body: string,
): Promise<SocialComment> {
  return api.post<SocialComment>(
    `/social/posts/${encodeURIComponent(postId)}/comments`,
    { body },
  );
}

export function deleteSocialComment(commentId: string): Promise<void> {
  return api.delete<void>(`/social/comments/${encodeURIComponent(commentId)}`);
}
