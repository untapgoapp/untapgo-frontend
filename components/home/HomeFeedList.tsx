"use client";

import HomeFeedEmptyState from "@/components/home/HomeFeedEmptyState";
import SocialPostCard from "@/components/social-feed/SocialPostCard";
import { Button } from "@/components/ui/button";
import type { SocialFeedView, SocialPost } from "@/lib/social-feed";

type HomeFeedListProps = {
  view: SocialFeedView;
  items: SocialPost[];
  loading: boolean;
  loadingMore: boolean;
  error: boolean;
  hasMore: boolean;
  onRetry: () => void;
  onLoadMore: () => void;
  onChange: (post: SocialPost) => void;
  onDelete: (postId: string) => Promise<void>;
};

function FeedSkeleton() {
  return (
    <div className="grid gap-3 bg-background py-3">
      {[0, 1].map((item) => (
        <div key={item} className="rounded-surface bg-surface px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-black/[0.08]" />
            <div className="flex-1">
              <div className="h-4 w-32 animate-pulse rounded-full bg-black/[0.09]" />
              <div className="mt-2 h-3 w-20 animate-pulse rounded-full bg-black/[0.06]" />
            </div>
          </div>
          <div className="mt-5 h-4 w-5/6 animate-pulse rounded-full bg-black/[0.07]" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-black/[0.06]" />
        </div>
      ))}
    </div>
  );
}

export default function HomeFeedList({
  view,
  items,
  loading,
  loadingMore,
  error,
  hasMore,
  onRetry,
  onLoadMore,
  onChange,
  onDelete,
}: HomeFeedListProps) {
  if (loading) return <FeedSkeleton />;

  if (error && items.length === 0) {
    return (
      <section className="px-5 py-12 text-center">
        <h2 className="text-lg font-bold">The feed could not load</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please try again in a moment.
        </p>
        <Button className="mt-5" size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </section>
    );
  }

  if (items.length === 0) return <HomeFeedEmptyState view={view} />;

  return (
    <div className="bg-background">
      <div className="grid gap-3 py-3">
        {items.map((post) => (
          <SocialPostCard
            key={post.id}
            post={post}
            onChange={onChange}
            onDelete={onDelete}
          />
        ))}
      </div>

      {error ? (
        <div className="pb-3 text-center text-sm text-red-700">
          More posts could not be loaded.
        </div>
      ) : null}

      {hasMore ? (
        <div className="pb-4 text-center">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
