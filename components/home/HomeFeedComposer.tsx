"use client";

import { useState } from "react";
import {
  CalendarDays,
  Image as ImageIcon,
  Layers3,
  LibraryBig,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SOCIAL_POST_MAX_LENGTH } from "@/lib/social-feed";

const composerActions = [
  { label: "Photo", icon: ImageIcon },
  { label: "Deck", icon: Layers3 },
  { label: "Event", icon: CalendarDays },
  { label: "Binder card", icon: LibraryBig },
] as const;

type HomeFeedComposerProps = {
  nickname: string;
  avatarUrl: string | null;
  onCreate: (body: string) => Promise<unknown>;
};

function getInitial(value: string): string {
  return value.trim().charAt(0).toUpperCase() || "P";
}

export default function HomeFeedComposer({
  nickname,
  avatarUrl,
  onCreate,
}: HomeFeedComposerProps) {
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const trimmedBody = body.trim();

  function closeComposer() {
    if (submitting) return;
    setExpanded(false);
    setBody("");
    setError(false);
  }

  async function submitPost() {
    if (!trimmedBody || submitting) return;
    setSubmitting(true);
    setError(false);

    try {
      await onCreate(trimmedBody);
      setBody("");
      setExpanded(false);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-label="Create a post"
      className="overflow-hidden rounded-surface border border-border/75 bg-surface"
    >
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <Avatar className="h-11 w-11 shrink-0">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
          <AvatarFallback>{getInitial(nickname)}</AvatarFallback>
        </Avatar>

        {expanded ? (
          <div className="min-w-0 flex-1">
            <label htmlFor="home-social-post" className="sr-only">
              Post text
            </label>
            <textarea
              id="home-social-post"
              autoFocus
              value={body}
              maxLength={SOCIAL_POST_MAX_LENGTH}
              onChange={(event) => setBody(event.target.value)}
              placeholder="What’s happening at your table?"
              className="min-h-28 w-full resize-y rounded-control border border-border bg-background px-4 py-3 text-[15px] leading-6 outline-none transition focus:border-primary/50 focus:ring-[3px] focus:ring-ring/15"
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {body.length}/{SOCIAL_POST_MAX_LENGTH}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={submitting}
                  onClick={closeComposer}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!trimmedBody || submitting}
                  onClick={() => void submitPost()}
                >
                  {submitting ? "Posting…" : "Post"}
                </Button>
              </div>
            </div>

            {error ? (
              <p className="mt-3 text-sm font-medium text-red-700">
                Your post could not be published. Please try again.
              </p>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-h-11 min-w-0 flex-1 items-center rounded-full bg-surface-subtle px-4 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15"
          >
            What’s happening at your table?
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 border-t border-border/65 px-2 py-2 sm:grid-cols-4">
        {composerActions.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            disabled
            title={`${label} posts are coming next`}
            className="flex min-h-10 cursor-not-allowed items-center justify-center gap-2 rounded-control px-2 text-sm font-semibold text-muted-foreground opacity-70"
          >
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
