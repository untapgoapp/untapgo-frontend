"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Heart, MapPin, X } from "lucide-react";

import PlayerRelationshipAction from "@/components/players/PlayerRelationshipAction";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import {
  mergeSocialPostLikeUsers,
  type SocialPostLikeUser,
} from "@/lib/social-feed";
import { updateProfileFollowing } from "@/lib/profile-follow";
import {
  followProfile,
  unfollowProfile,
} from "@/services/profiles";
import { getSocialPostLikes } from "@/services/social";

type PostReactionsDialogProps = {
  postId: string;
  likeCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type LoadState = "idle" | "loading" | "loading-more" | "ready" | "error";

function getInitial(value: string): string {
  return value.trim().charAt(0).toUpperCase() || "P";
}

export default function PostReactionsDialog({
  postId,
  likeCount,
  open,
  onOpenChange,
}: PostReactionsDialogProps) {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<SocialPostLikeUser[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<LoadState>("idle");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const requestIdRef = useRef(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const loadPage = useCallback(async (
    nextPage: number,
    append: boolean,
  ) => {
    const requestId = ++requestIdRef.current;
    setStatus(append ? "loading-more" : "loading");

    try {
      const response = await getSocialPostLikes(postId, nextPage);
      if (requestId !== requestIdRef.current) return;

      setItems((current) => (
        mergeSocialPostLikeUsers(append ? current : [], response.items)
      ));
      setPage(response.page);
      setHasMore(response.has_more);
      setStatus("ready");
    } catch {
      if (requestId !== requestIdRef.current) return;
      setStatus("error");
    }
  }, [postId]);

  useEffect(() => {
    if (!open) return;
    setItems([]);
    setPage(0);
    setHasMore(false);
    setRowErrors({});
    void loadPage(1, false);

    return () => {
      requestIdRef.current += 1;
    };
  }, [likeCount, loadPage, open]);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onOpenChange(false);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) {
        window.requestAnimationFrame(() => previousFocus.focus());
      }
    };
  }, [onOpenChange, open]);

  async function toggleFollow(target: SocialPostLikeUser) {
    if (busyUserId) return;

    const previous = target.relationship;
    const nextFollowing = !previous.is_following;
    setBusyUserId(target.id);
    setRowErrors((current) => ({ ...current, [target.id]: "" }));
    setItems((current) => current.map((item) => (
      item.id === target.id
        ? {
            ...item,
            relationship: updateProfileFollowing(
              previous,
              nextFollowing,
            ),
          }
        : item
    )));

    try {
      const result = nextFollowing
        ? await followProfile(target.id)
        : await unfollowProfile(target.id);

      setItems((current) => current.map((item) => (
        item.id === target.id
          ? {
              ...item,
              relationship: updateProfileFollowing(
                previous,
                result.is_following,
              ),
            }
          : item
      )));
    } catch {
      setItems((current) => current.map((item) => (
        item.id === target.id
          ? { ...item, relationship: previous }
          : item
      )));
      setRowErrors((current) => ({
        ...current,
        [target.id]: "Could not update Follow.",
      }));
    } finally {
      setBusyUserId(null);
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/35 p-0 backdrop-blur-[1px] sm:items-center sm:p-4"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`post-likes-title-${postId}`}
        className="flex max-h-[min(78dvh,620px)] w-full flex-col rounded-t-[22px] bg-surface shadow-2xl sm:max-w-md sm:rounded-surface"
      >
        <header className="flex items-center justify-between border-b border-border/65 px-4 py-3.5 sm:px-5">
          <div>
            <h2
              id={`post-likes-title-${postId}`}
              className="text-base font-bold"
            >
              Likes
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {likeCount} {likeCount === 1 ? "player" : "players"}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close Likes"
            onClick={() => onOpenChange(false)}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
          {status === "loading" ? (
            <div
              aria-label="Loading Likes"
              className="space-y-2 px-2 py-3"
            >
              {[1, 2, 3].map((key) => (
                <div
                  key={key}
                  className="h-16 animate-pulse rounded-row bg-muted"
                />
              ))}
            </div>
          ) : null}

          {status === "error" && items.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold">
                Likes could not be loaded.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => void loadPage(1, false)}
              >
                Retry
              </Button>
            </div>
          ) : null}

          {status === "ready" && items.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Heart
                className="mx-auto h-6 w-6 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold">No Likes yet.</p>
            </div>
          ) : null}

          {items.map((item) => {
            const location = item.location?.display_name?.trim() || null;
            return (
              <div
                key={item.id}
                className="flex min-h-16 items-center gap-3 rounded-row px-2.5 py-2 transition-colors hover:bg-surface-subtle"
              >
                <Link
                  href={`/profile/${encodeURIComponent(item.id)}`}
                  onClick={() => onOpenChange(false)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-control focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20"
                >
                  <Avatar className="h-11 w-11 shrink-0">
                    {item.avatar_url ? (
                      <AvatarImage src={item.avatar_url} alt="" />
                    ) : null}
                    <AvatarFallback>
                      {getInitial(item.nickname)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">
                      {item.nickname}
                    </span>
                    {location ? (
                      <span className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                        <MapPin
                          className="h-3 w-3 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate">{location}</span>
                      </span>
                    ) : null}
                  </span>
                </Link>

                {user?.id !== item.id ? (
                  <PlayerRelationshipAction
                    relationship={item.relationship}
                    busy={busyUserId === item.id}
                    blocked={false}
                    error={rowErrors[item.id]}
                    onToggle={() => void toggleFollow(item)}
                  />
                ) : null}
              </div>
            );
          })}

          {items.length > 0 && (hasMore || status === "error") ? (
            <div className="px-3 py-3 text-center">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={status === "loading-more"}
                onClick={() => void loadPage(page + 1, true)}
              >
                {status === "loading-more" ? "Loading…" : (
                  status === "error" ? "Retry" : "Load more"
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  );
}
