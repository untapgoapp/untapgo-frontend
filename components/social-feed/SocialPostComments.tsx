"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Trash2 } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  SOCIAL_COMMENT_MAX_LENGTH,
  formatSocialPostTime,
  mergeSocialComments,
  type SocialComment,
} from "@/lib/social-feed";
import {
  createSocialPostComment,
  deleteSocialComment,
  getSocialPostComments,
} from "@/services/social";

type SocialPostCommentsProps = {
  postId: string;
  initialCount: number;
  onCountChange: (count: number) => void;
};

function initial(value: string): string {
  return value.trim().charAt(0).toUpperCase() || "P";
}

export default function SocialPostComments({
  postId,
  initialCount,
  onCountChange,
}: SocialPostCommentsProps) {
  const [items, setItems] = useState<SocialComment[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async (pageNumber: number, replace: boolean) => {
    const activeRequest = ++requestId.current;
    if (replace) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const response = await getSocialPostComments(postId, pageNumber);
      if (activeRequest !== requestId.current) return;
      setItems((current) => (
        replace ? response.items : mergeSocialComments(current, response.items)
      ));
      setPage(response.page);
      setHasMore(response.has_more);
    } catch {
      if (activeRequest !== requestId.current) return;
      setError("Comments could not be loaded.");
    } finally {
      if (activeRequest !== requestId.current) return;
      setLoading(false);
      setLoadingMore(false);
    }
  }, [postId]);

  useEffect(() => {
    void load(1, true);
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  async function submit() {
    const value = body.trim();
    if (!value || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const comment = await createSocialPostComment(postId, value);
      setItems((current) => [...current, comment]);
      onCountChange(initialCount + 1);
      setBody("");
    } catch {
      setError("Your comment could not be posted.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(comment: SocialComment) {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== comment.id));
    onCountChange(Math.max(0, initialCount - 1));

    try {
      await deleteSocialComment(comment.id);
    } catch {
      setItems(previous);
      onCountChange(initialCount);
      setError("The comment could not be deleted.");
    }
  }

  return (
    <section className="border-t border-border/65 px-4 pb-4 pt-3 sm:px-5">
      <div className="flex items-end gap-2">
        <label htmlFor={`comment-${postId}`} className="sr-only">
          Write a comment
        </label>
        <textarea
          id={`comment-${postId}`}
          value={body}
          rows={1}
          maxLength={SOCIAL_COMMENT_MAX_LENGTH}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="Write a comment…"
          className="min-h-10 flex-1 resize-none rounded-control border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/50 focus:ring-[3px] focus:ring-ring/15"
        />
        <Button
          type="button"
          size="icon-sm"
          disabled={!body.trim() || submitting}
          aria-label="Post comment"
          onClick={() => void submit()}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="mt-4 grid gap-3">
          <div className="h-14 animate-pulse rounded-control bg-black/[0.05]" />
          <div className="h-14 animate-pulse rounded-control bg-black/[0.04]" />
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No comments yet.</p>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {items.map((comment) => (
            <article key={comment.id} className="flex items-start gap-2.5">
              <Link href={`/profile/${encodeURIComponent(comment.author.id)}`}>
                <Avatar className="h-8 w-8">
                  {comment.author.avatar_url ? (
                    <AvatarImage src={comment.author.avatar_url} alt="" />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {initial(comment.author.nickname)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1 rounded-control bg-surface-subtle px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${encodeURIComponent(comment.author.id)}`}
                      className="block truncate text-xs font-bold hover:text-primary"
                    >
                      {comment.author.nickname}
                    </Link>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5">
                      {comment.body}
                    </p>
                    <time className="mt-1 block text-[11px] text-muted-foreground">
                      {formatSocialPostTime(comment.created_at)}
                    </time>
                  </div>
                  {comment.can_delete ? (
                    <button
                      type="button"
                      onClick={() => void remove(comment)}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-700"
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {hasMore ? (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => void load(page + 1, false)}
          className="mt-4 text-sm font-semibold text-primary hover:text-primary-hover disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "View more comments"}
        </button>
      ) : null}
    </section>
  );
}
