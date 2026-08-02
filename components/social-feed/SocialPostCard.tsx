"use client";

import Link from "next/link";
import { useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { formatSocialPostTime, type SocialPost } from "@/lib/social-feed";

type SocialPostCardProps = {
  post: SocialPost;
  onDelete?: (postId: string) => Promise<void>;
};

function getInitial(value: string): string {
  return value.trim().charAt(0).toUpperCase() || "P";
}

export default function SocialPostCard({
  post,
  onDelete,
}: SocialPostCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  async function removePost() {
    if (!onDelete || deleting) return;
    setDeleting(true);
    setError(false);

    try {
      await onDelete(post.id);
    } catch {
      setError(true);
      setDeleting(false);
    }
  }

  return (
    <article className="rounded-surface bg-surface px-4 py-4 sm:px-5 sm:py-5">
      <header className="flex items-start gap-3">
        <Link
          href={`/profile/${encodeURIComponent(post.author.id)}`}
          className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
        >
          <Avatar className="h-10 w-10">
            {post.author.avatar_url ? (
              <AvatarImage src={post.author.avatar_url} alt="" />
            ) : null}
            <AvatarFallback>{getInitial(post.author.nickname)}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${encodeURIComponent(post.author.id)}`}
            className="block truncate text-sm font-bold hover:text-primary hover:underline"
          >
            {post.author.nickname}
          </Link>
          <time
            dateTime={post.created_at}
            className="mt-0.5 block text-xs text-muted-foreground"
          >
            {formatSocialPostTime(post.created_at)}
          </time>
        </div>

        {post.can_delete && onDelete ? (
          <details className="relative shrink-0">
            <summary
              aria-label="Post options"
              className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15 [&::-webkit-details-marker]:hidden"
            >
              <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 top-10 z-20 min-w-40 rounded-control border border-border/80 bg-surface p-1 shadow-lg">
              <button
                type="button"
                disabled={deleting}
                onClick={() => void removePost()}
                className="flex min-h-10 w-full items-center gap-2 rounded-row px-3 text-left text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {deleting ? "Deleting…" : "Delete post"}
              </button>
            </div>
          </details>
        ) : null}
      </header>

      <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-6 text-foreground">
        {post.body}
      </p>

      {error ? (
        <p className="mt-3 text-sm font-medium text-red-700">
          The post could not be deleted. Please try again.
        </p>
      ) : null}
    </article>
  );
}
