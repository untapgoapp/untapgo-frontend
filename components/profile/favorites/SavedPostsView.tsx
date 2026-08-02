"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark } from "lucide-react";

import SocialPostCard from "@/components/social-feed/SocialPostCard";
import { Button } from "@/components/ui/button";
import {
  mergeSocialPosts,
  replaceSocialPost,
  type SocialPost,
} from "@/lib/social-feed";
import { deleteSocialPost, getSavedSocialPosts } from "@/services/social";

export default function SavedPostsView() {
  const [items, setItems] = useState<SocialPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async (pageNumber: number, replace: boolean) => {
    const active = ++requestId.current;
    if (replace) setLoading(true);
    else setLoadingMore(true);
    setError(false);
    try {
      const response = await getSavedSocialPosts(pageNumber);
      if (active !== requestId.current) return;
      setItems((current) => replace ? response.items : mergeSocialPosts(current, response.items));
      setPage(response.page);
      setHasMore(response.has_more);
    } catch {
      if (active !== requestId.current) return;
      setError(true);
    } finally {
      if (active !== requestId.current) return;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
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

  if (loading) {
    return <div className="mt-5 h-44 animate-pulse rounded-surface bg-black/[0.05]" />;
  }

  if (error && items.length === 0) {
    return (
      <div className="mt-5 rounded-surface bg-surface px-6 py-10 text-center">
        <h2 className="font-bold">Saved posts could not load</h2>
        <Button size="sm" variant="outline" className="mt-4" onClick={() => void load(1, true)}>
          Retry
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-5 rounded-surface bg-surface px-6 py-10 text-center">
        <Bookmark className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-3 font-bold">No saved posts</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Save useful posts from your feed and they will appear here.
        </p>
        <Button asChild size="sm" className="mt-5">
          <Link href="/home">Open feed</Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="mt-5">
      <p className="text-sm text-muted-foreground">Posts saved privately for later.</p>
      <div className="mt-4 grid gap-3">
        {items.map((post) => (
          <SocialPostCard
            key={post.id}
            post={post}
            onChange={(updated) => setItems((current) => replaceSocialPost(current, updated))}
            onDelete={post.can_delete ? remove : undefined}
            onUnsave={(postId) => setItems((current) => current.filter((item) => item.id !== postId))}
          />
        ))}
      </div>
      {hasMore ? (
        <div className="mt-4 text-center">
          <Button size="sm" variant="outline" disabled={loadingMore} onClick={() => void load(page + 1, false)}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
