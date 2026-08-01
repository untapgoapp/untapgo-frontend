"use client";

import { useEffect, useRef, useState } from "react";
import { Archive, Pin } from "lucide-react";

import PlaygroupPost from "@/components/playgroups/PlaygroupPost";
import PlaygroupWallComposer from "@/components/playgroups/PlaygroupWallComposer";
import usePlaygroupWallFeed from "@/components/playgroups/usePlaygroupWallFeed";
import { Button } from "@/components/ui/button";
import {
  applyCanonicalLike,
  getDeepLinkLookupState,
  optimisticallyToggleLike,
  rollbackLike,
  type CommunicationMembershipState,
} from "@/lib/playgroup-communications";
import { setPlaygroupPostLiked } from "@/services/playgroup-wall";

export default function PlaygroupWall({
  playgroupId,
  viewerId,
  membershipState,
  archived,
  targetPostId,
  onContractError,
}: {
  playgroupId: string;
  viewerId: string | null;
  membershipState: CommunicationMembershipState;
  archived: boolean;
  targetPostId: string | null;
  onContractError: (error: unknown) => void;
}) {
  const feed = usePlaygroupWallFeed({ playgroupId, enabled: true, onContractError });
  const [likeBusyIds, setLikeBusyIds] = useState<Set<string>>(() => new Set());
  const [deepLinkUnavailable, setDeepLinkUnavailable] = useState(false);
  const likeBusyRef = useRef(new Set<string>());
  const focusedPostRef = useRef<string | null>(null);
  const writable = !archived && Boolean(viewerId);

  useEffect(() => {
    focusedPostRef.current = null;
    setDeepLinkUnavailable(false);
  }, [playgroupId, targetPostId]);

  useEffect(() => {
    if (!targetPostId || feed.state.status !== "ready" || focusedPostRef.current === targetPostId) return;
    const lookup = getDeepLinkLookupState(targetPostId, feed.state.items, feed.state.hasMore, feed.state.page);
    if (lookup === "load_more") {
      void feed.loadMore();
      return;
    }
    if (lookup === "unavailable") {
      setDeepLinkUnavailable(true);
      return;
    }
    focusedPostRef.current = targetPostId;
    setDeepLinkUnavailable(false);
    requestAnimationFrame(() => {
      const element = [...document.querySelectorAll<HTMLElement>("[data-playgroup-post-id]")]
        .find((candidate) => candidate.dataset.playgroupPostId === targetPostId);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      element?.focus({ preventScroll: true });
    });
  }, [feed, targetPostId]);

  async function toggleLike(postId: string) {
    if (!writable || likeBusyRef.current.has(postId)) return;
    const current = feed.state.items.find((post) => post.id === postId);
    if (!current) return;
    const optimistic = optimisticallyToggleLike(current);
    likeBusyRef.current.add(postId);
    setLikeBusyIds(new Set(likeBusyRef.current));
    feed.changePost(postId, () => optimistic.post);
    try {
      const canonical = await setPlaygroupPostLiked(playgroupId, postId, optimistic.post.viewer_has_liked);
      feed.changePost(postId, (post) => applyCanonicalLike(post, optimistic.snapshot, canonical.liked));
    } catch (error) {
      feed.changePost(postId, (post) => rollbackLike(post, optimistic.snapshot));
      onContractError(error);
      throw error;
    } finally {
      likeBusyRef.current.delete(postId);
      setLikeBusyIds(new Set(likeBusyRef.current));
    }
  }

  const initialLoading = feed.state.status === "loading" && feed.state.items.length === 0;

  return (
    <section aria-labelledby="playgroup-wall-title" className="py-6">
      <div className="mb-5">
        <h2 id="playgroup-wall-title" className="text-xl font-bold tracking-tight">Wall</h2>
        <p className="mt-1 text-sm text-muted-foreground">Updates and conversation shared with this Playgroup.</p>
      </div>

      {archived ? (
        <p className="mb-5 flex items-center gap-2 rounded-control bg-surface-subtle/75 px-3 py-2.5 text-sm text-muted-foreground">
          <Archive size={15} aria-hidden="true" /> This Playgroup is archived. Wall history is read-only.
        </p>
      ) : <PlaygroupWallComposer playgroupId={playgroupId} onCreated={feed.upsertPost} onContractError={onContractError} />}

      {deepLinkUnavailable ? <p className="mt-4 rounded-control bg-surface-subtle px-3 py-2.5 text-sm text-muted-foreground">That Wall post is no longer available.</p> : null}

      <div aria-busy={initialLoading || feed.state.status === "loading_more"} className="mt-3">
        {initialLoading ? (
          <div className="space-y-4 py-3">
            {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-row bg-surface/45" />)}
          </div>
        ) : null}

        {feed.state.items.map((post, index) => {
          const startsPinned = post.is_pinned && (index === 0 || !feed.state.items[index - 1]?.is_pinned);
          const startsRegular = !post.is_pinned && index > 0 && feed.state.items[index - 1]?.is_pinned;
          return (
            <div key={post.id}>
              {startsPinned ? <p className="mt-4 flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-quiet-foreground"><Pin size={12} aria-hidden="true" />Pinned</p> : null}
              {startsRegular ? <p className="mt-5 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-quiet-foreground">Recent</p> : null}
              <PlaygroupPost
                post={post}
                viewerId={viewerId}
                membershipState={membershipState}
                writable={writable}
                initialCommentsOpen={targetPostId === post.id}
                likeBusy={likeBusyIds.has(post.id)}
                onChanged={feed.upsertPost}
                onToggleLike={() => toggleLike(post.id)}
                onContractError={onContractError}
              />
            </div>
          );
        })}

        {feed.state.status === "ready" && feed.state.items.length === 0 ? <p className="py-8 text-sm text-muted-foreground">No posts yet. Start the conversation.</p> : null}

        {feed.state.status === "error" ? (
          <div role="alert" className="mt-4 rounded-surface bg-destructive-subtle px-4 py-4">
            <p className="text-sm font-bold text-destructive">Wall posts could not be loaded.</p>
            <p className="mt-1 text-sm text-destructive/85">The rest of the Playgroup is still available.</p>
            <Button type="button" size="sm" onClick={() => void feed.retry()} className="mt-3">Retry</Button>
          </div>
        ) : null}

        {feed.state.hasMore && feed.state.status !== "error" ? (
          <div className="pt-5 text-center">
            <Button type="button" variant="outline" disabled={feed.state.status === "loading_more"} onClick={() => void feed.loadMore()}>
              {feed.state.status === "loading_more" ? "Loading posts…" : "Load more posts"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
