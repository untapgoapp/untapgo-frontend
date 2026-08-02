"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import SocialPostCard from "@/components/social-feed/SocialPostCard";
import { Button } from "@/components/ui/button";
import type { SocialPost } from "@/lib/social-feed";
import { deleteSocialPost, getSocialPost } from "@/services/social";

type SocialPostDetailProps = {
  postId: string;
};

export default function SocialPostDetail({ postId }: SocialPostDetailProps) {
  const [post, setPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setPost(await getSocialPost(postId));
    } catch {
      setError(true);
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove() {
    await deleteSocialPost(postId);
    window.location.assign("/home");
  }

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[760px]">
        <Link href="/home" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to feed
        </Link>

        <header className="mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">Community</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Post</h1>
        </header>

        {loading ? (
          <div className="mt-6 h-48 animate-pulse rounded-surface bg-black/[0.05]" />
        ) : null}

        {!loading && error ? (
          <div className="mt-6 rounded-surface bg-surface px-6 py-10 text-center">
            <h2 className="font-bold">This post is unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              It may have been removed, or you may not have permission to view it.
            </p>
            <Button size="sm" variant="outline" className="mt-5" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        ) : null}

        {post ? (
          <div className="mt-6">
            <SocialPostCard
              post={post}
              onChange={setPost}
              onDelete={post.can_delete ? remove : undefined}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
