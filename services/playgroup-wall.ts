import { api } from "@/lib/api";
import {
  PLAYGROUP_COMMENT_PAGE_SIZE,
  PLAYGROUP_WALL_PAGE_SIZE,
  type PlaygroupComment,
  type PlaygroupCommentPage,
  type PlaygroupPost,
  type PlaygroupPostPage,
  type PlaygroupReactionState,
} from "@/lib/playgroup-communications";

function wallPath(playgroupId: string, suffix = ""): string {
  return `/playgroups/${encodeURIComponent(playgroupId)}${suffix}`;
}

function postPath(playgroupId: string, postId: string, suffix = ""): string {
  return wallPath(playgroupId, `/posts/${encodeURIComponent(postId)}${suffix}`);
}

function commentPath(playgroupId: string, postId: string, commentId?: string): string {
  return postPath(
    playgroupId,
    postId,
    `/comments${commentId ? `/${encodeURIComponent(commentId)}` : ""}`,
  );
}

export function getPlaygroupPosts(playgroupId: string, page: number): Promise<PlaygroupPostPage> {
  const parameters = new URLSearchParams({
    page: String(page),
    page_size: String(PLAYGROUP_WALL_PAGE_SIZE),
  });
  return api.get<PlaygroupPostPage>(`${wallPath(playgroupId, "/posts")}?${parameters}`);
}

export function createPlaygroupPost(playgroupId: string, body: string): Promise<PlaygroupPost> {
  return api.post<PlaygroupPost>(wallPath(playgroupId, "/posts"), { body });
}

export function updatePlaygroupPost(
  playgroupId: string,
  postId: string,
  body: string,
): Promise<PlaygroupPost> {
  return api.patch<PlaygroupPost>(postPath(playgroupId, postId), { body });
}

export function deletePlaygroupPost(playgroupId: string, postId: string): Promise<void> {
  return api.delete<void>(postPath(playgroupId, postId));
}

export function setPlaygroupPostPinned(
  playgroupId: string,
  postId: string,
  pinned: boolean,
): Promise<PlaygroupPost> {
  const path = postPath(playgroupId, postId, "/pin");
  return pinned ? api.post<PlaygroupPost>(path) : api.delete<PlaygroupPost>(path);
}

export function setPlaygroupPostLiked(
  playgroupId: string,
  postId: string,
  liked: boolean,
): Promise<PlaygroupReactionState> {
  const path = postPath(playgroupId, postId, "/like");
  return liked ? api.post<PlaygroupReactionState>(path) : api.delete<PlaygroupReactionState>(path);
}

export function getPlaygroupPostComments(
  playgroupId: string,
  postId: string,
  page: number,
): Promise<PlaygroupCommentPage> {
  const parameters = new URLSearchParams({
    page: String(page),
    page_size: String(PLAYGROUP_COMMENT_PAGE_SIZE),
  });
  return api.get<PlaygroupCommentPage>(`${commentPath(playgroupId, postId)}?${parameters}`);
}

export function createPlaygroupPostComment(
  playgroupId: string,
  postId: string,
  body: string,
): Promise<PlaygroupComment> {
  return api.post<PlaygroupComment>(commentPath(playgroupId, postId), { body });
}

export function updatePlaygroupPostComment(
  playgroupId: string,
  postId: string,
  commentId: string,
  body: string,
): Promise<PlaygroupComment> {
  return api.patch<PlaygroupComment>(commentPath(playgroupId, postId, commentId), { body });
}

export function deletePlaygroupPostComment(
  playgroupId: string,
  postId: string,
  commentId: string,
): Promise<void> {
  return api.delete<void>(commentPath(playgroupId, postId, commentId));
}
