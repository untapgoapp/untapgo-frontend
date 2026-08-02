"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import SocialPostCard from "@/components/social-feed/SocialPostCard";
import { Button } from "@/components/ui/button";
import {
  mergeSocialPosts,
  replaceSocialPost,
  type SocialPost,
} from "@/lib/social-feed";
import {
  deleteSocialPost,
  getProfileSocialPosts,
} from "@/services/social";

type ProfilePostsSectionProps = {
  profileId: string;
  isOwner: boolean;
};

export default function ProfilePostsSection({
  profileId,
  isOwner,
}: ProfilePostsSectionProps) {
  const [items, setItems] = useState<SocialPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async (pageNumber: number, replace: boolean) => {
    const currentRequest = ++requestId.current;
    if (replace) {
      setLoading(true);
      setFailed(false);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await getProfileSocialPosts(profileId, pageNumber);
      if (requestId.current !== currentRequest) return;
      setItems((current) => (
        replace ? response.items : mergeSocialPosts(current, response.items)
      ));
      setPage(response.page);
      setHasMore(response.has_more);
    } catch {
      if (requestId.current !== currentRequest) return;
      setFailed(true);
      if (replace) setItems([]);
    } finally {
      if (requestId.current !== currentRequest) return;
      setLoading(false);
      setLoadingMore(false);
    }
  }, [profileId]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(false);
    void load(1, true);

    return () => {
      requestId.current += 1;
    };
  }, [load]);

  async function remove(postId: string) {
    const previous = items;
    setItems((current) => current.filter((post) => post.id !== postId));

    try {
      await deleteSocialPost(postId);
    } catch (cause) {
      setItems(previous);
      throw cause;
    }
  }

  return (
    <section id="posts" aria-labelledby="profile-posts-title" className="scroll-mt-6 py-6">
      <div>
        <h2 id="profile-posts-title" className="text-lg font-semibold tracking-tight">
          Posts
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isOwner ? "What you have shared on UntapGo." : "Public posts shared by this player."}
        </p>
      </div>

      {loading ? (
        <div className="mt-3 rounded-surface bg-surface px-5 py-5">
          <div className="h-4 w-32 animate-pulse rounded-full bg-black/[0.09]" />
          <div className="mt-5 h-4 w-5/6 animate-pulse rounded-full bg-black/[0.07]" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-black/[0.06]" />
        </div>
      ) : null}

      {!loading && failed && items.length === 0 ? (
        <div className="mt-3 rounded-surface bg-surface-subtle px-4 py-5 text-sm text-muted-foreground">
          Posts could not be loaded right now.
          <button
            type="button"
            className="ml-2 font-semibold text-primary hover:text-primary-hover"
            onClick={() => void load(1, true)}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !failed && items.length === 0 ? (
        <div className="mt-3 rounded-surface bg-surface-subtle px-4 py-5 text-sm text-muted-foreground">
          {isOwner ? "You have not shared a post yet." : "This player has not shared any posts yet."}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-3 grid gap-3">
          {items.map((post) => (
            <SocialPostCard
              key={post.id}
              post={post}
              onChange={(updated) => setItems((current) => replaceSocialPost(current, updated))}
              onDelete={post.can_delete ? remove : undefined}
            />
          ))}
        </div>
      ) : null}

      {hasMore ? (
        <div className="mt-4 text-center">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loadingMore}
            onClick={() => void load(page + 1, false)}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
