"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";

import SocialPostComments from "@/components/social-feed/SocialPostComments";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  SOCIAL_POST_MAX_LENGTH,
  formatSocialCount,
  formatSocialPostTime,
  type SocialPost,
} from "@/lib/social-feed";
import {
  likeSocialPost,
  saveSocialPost,
  unlikeSocialPost,
  unsaveSocialPost,
  updateSocialPost,
} from "@/services/social";

type SocialPostCardProps = {
  post: SocialPost;
  onChange?: (post: SocialPost) => void;
  onDelete?: (postId: string) => Promise<void>;
  onUnsave?: (postId: string) => void;
};

function getInitial(value: string): string {
  return value.trim().charAt(0).toUpperCase() || "P";
}

export default function SocialPostCard({
  post,
  onChange,
  onDelete,
  onUnsave,
}: SocialPostCardProps) {
  const [current, setCurrent] = useState(post);
  const currentRef = useRef(post);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDetailsElement>(null);
  const optionsTriggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    currentRef.current = post;
    setCurrent(post);
    setEditBody(post.body);
  }, [post]);

  useEffect(() => {
    if (!optionsOpen) return;

    function closeOptions(restoreFocus = false) {
      optionsRef.current?.removeAttribute("open");
      setOptionsOpen(false);

      if (restoreFocus) {
        window.requestAnimationFrame(() => optionsTriggerRef.current?.focus());
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!optionsRef.current?.contains(target)) closeOptions();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeOptions(true);
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [optionsOpen]);

  function commit(next: SocialPost) {
    currentRef.current = next;
    setCurrent(next);
    onChange?.(next);
  }

  async function submitEdit() {
    const body = editBody.trim();
    if (!body || busy) return;
    setBusy("edit");
    setMessage(null);
    try {
      const updated = await updateSocialPost(current.id, body);
      commit(updated);
      setEditing(false);
    } catch {
      setMessage("The post could not be updated.");
    } finally {
      setBusy(null);
    }
  }

  async function removePost() {
    if (!onDelete || busy) return;
    setBusy("delete");
    setMessage(null);
    try {
      await onDelete(current.id);
    } catch {
      setMessage("The post could not be deleted.");
      setBusy(null);
    }
  }

  async function toggleLike() {
    if (busy) return;
    const previous = current;
    const nextLiked = !previous.is_liked;
    commit({
      ...previous,
      is_liked: nextLiked,
      like_count: Math.max(0, previous.like_count + (nextLiked ? 1 : -1)),
    });
    setBusy("like");
    setMessage(null);

    try {
      const state = nextLiked
        ? await likeSocialPost(previous.id)
        : await unlikeSocialPost(previous.id);
      commit({ ...currentRef.current, ...state });
    } catch {
      commit({
        ...currentRef.current,
        is_liked: previous.is_liked,
        like_count: previous.like_count,
      });
      setMessage("Your Like could not be updated.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleSave() {
    if (busy) return;
    const previous = current;
    const nextSaved = !previous.is_saved;
    commit({ ...previous, is_saved: nextSaved });
    setBusy("save");
    setMessage(null);

    try {
      const state = nextSaved
        ? await saveSocialPost(previous.id)
        : await unsaveSocialPost(previous.id);
      commit({ ...currentRef.current, ...state });
      if (!state.is_saved) onUnsave?.(previous.id);
    } catch {
      commit({ ...currentRef.current, is_saved: previous.is_saved });
      setMessage("The saved state could not be updated.");
    } finally {
      setBusy(null);
    }
  }

  async function sharePost() {
    const url = `${window.location.origin}/post/${encodeURIComponent(current.id)}`;
    setMessage(null);
    try {
      if (navigator.share) {
        await navigator.share({ title: `${current.author.nickname} on UntapGo`, url });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("textarea");
        input.value = url;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        input.remove();
      }
      setMessage("Link copied.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("The post link could not be shared.");
    }
  }

  return (
    <article className="overflow-hidden rounded-surface bg-surface">
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <header className="flex items-start gap-3">
          <Link
            href={`/profile/${encodeURIComponent(current.author.id)}`}
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
          >
            <Avatar className="h-10 w-10">
              {current.author.avatar_url ? (
                <AvatarImage src={current.author.avatar_url} alt="" />
              ) : null}
              <AvatarFallback>{getInitial(current.author.nickname)}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${encodeURIComponent(current.author.id)}`}
              className="block truncate text-sm font-bold hover:text-primary hover:underline"
            >
              {current.author.nickname}
            </Link>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href={`/post/${encodeURIComponent(current.id)}`} className="hover:underline">
                {formatSocialPostTime(current.created_at)}
              </Link>
              {current.edited_at ? <span>· Edited</span> : null}
            </div>
          </div>

          {(current.can_edit || current.can_delete) ? (
            <details
              ref={optionsRef}
              className="relative shrink-0"
              onToggle={(event) => setOptionsOpen(event.currentTarget.open)}
            >
              <summary
                ref={optionsTriggerRef}
                aria-label="Post options"
                className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15 [&::-webkit-details-marker]:hidden"
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
              </summary>
              <div className="absolute right-0 top-10 z-20 min-w-40 rounded-control border border-border/80 bg-surface p-1 shadow-lg">
                {current.can_edit ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(true);
                      setEditBody(current.body);
                      optionsRef.current?.removeAttribute("open");
                    }}
                    className="flex min-h-10 w-full items-center gap-2 rounded-row px-3 text-left text-sm font-semibold hover:bg-surface-subtle"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit post
                  </button>
                ) : null}
                {current.can_delete && onDelete ? (
                  <button
                    type="button"
                    disabled={busy === "delete"}
                    onClick={() => void removePost()}
                    className="flex min-h-10 w-full items-center gap-2 rounded-row px-3 text-left text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {busy === "delete" ? "Deleting…" : "Delete post"}
                  </button>
                ) : null}
              </div>
            </details>
          ) : null}
        </header>

        {editing ? (
          <div className="mt-4">
            <textarea
              autoFocus
              value={editBody}
              maxLength={SOCIAL_POST_MAX_LENGTH}
              onChange={(event) => setEditBody(event.target.value)}
              className="min-h-28 w-full resize-y rounded-control border border-border bg-background px-4 py-3 text-[15px] leading-6 outline-none focus:border-primary/50 focus:ring-[3px] focus:ring-ring/15"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {editBody.length}/{SOCIAL_POST_MAX_LENGTH}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy === "edit"}
                  onClick={() => {
                    setEditing(false);
                    setEditBody(current.body);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!editBody.trim() || busy === "edit"}
                  onClick={() => void submitEdit()}
                >
                  {busy === "edit" ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-6 text-foreground">
            {current.body}
          </p>
        )}

        {(current.like_count > 0 || current.comment_count > 0) ? (
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{current.like_count > 0 ? formatSocialCount(current.like_count, "like", "likes") : ""}</span>
            {current.comment_count > 0 ? (
              <button type="button" onClick={() => setCommentsOpen(true)} className="hover:underline">
                {formatSocialCount(current.comment_count, "comment", "comments")}
              </button>
            ) : null}
          </div>
        ) : null}

        {message ? (
          <p className={`mt-3 text-sm ${message === "Link copied." ? "text-primary" : "text-red-700"}`}>
            {message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-4 border-t border-border/65 px-2 py-1.5">
        <PostAction
          label={current.is_liked ? "Liked" : "Like"}
          active={current.is_liked}
          icon={Heart}
          disabled={busy !== null}
          onClick={() => void toggleLike()}
        />
        <PostAction
          label="Comment"
          active={commentsOpen}
          icon={MessageCircle}
          onClick={() => setCommentsOpen((value) => !value)}
        />
        <PostAction label="Share" icon={Share2} onClick={() => void sharePost()} />
        <PostAction
          label={current.is_saved ? "Saved" : "Save"}
          active={current.is_saved}
          icon={Bookmark}
          disabled={busy !== null}
          onClick={() => void toggleSave()}
        />
      </div>

      {commentsOpen ? (
        <SocialPostComments
          postId={current.id}
          initialCount={current.comment_count}
          onCountChange={(commentCount) => commit({ ...currentRef.current, comment_count: commentCount })}
        />
      ) : null}
    </article>
  );
}

function PostAction({
  label,
  icon: Icon,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex min-h-10 items-center justify-center gap-2 rounded-control px-2 text-sm font-semibold transition-colors disabled:opacity-50",
        active
          ? "bg-secondary/70 text-primary"
          : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" fill={active && label === "Liked" ? "currentColor" : "none"} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}