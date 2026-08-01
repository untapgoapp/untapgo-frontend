"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  normalizeCommunicationBody,
  PLAYGROUP_POST_MAX_LENGTH,
  shouldShowRemainingCharacters,
  type PlaygroupPost,
} from "@/lib/playgroup-communications";
import { createPlaygroupPost } from "@/services/playgroup-wall";

export default function PlaygroupWallComposer({
  playgroupId,
  onCreated,
  onContractError,
}: {
  playgroupId: string;
  onCreated: (post: PlaygroupPost) => void;
  onContractError: (error: unknown) => void;
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const submittingRef = useRef(false);
  const body = normalizeCommunicationBody(value, PLAYGROUP_POST_MAX_LENGTH);
  const remaining = PLAYGROUP_POST_MAX_LENGTH - value.length;

  async function submit() {
    if (!body || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(false);
    try {
      const post = await createPlaygroupPost(playgroupId, body);
      onCreated(post);
      setValue("");
    } catch (caught) {
      onContractError(caught);
      setError(true);
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="border-b border-border/60 pb-5">
      <label htmlFor="playgroup-wall-post" className="text-sm font-bold">Share with the Playgroup</label>
      <textarea
        id="playgroup-wall-post"
        value={value}
        onChange={(event) => { setValue(event.target.value); setError(false); }}
        maxLength={PLAYGROUP_POST_MAX_LENGTH}
        rows={3}
        placeholder="What would you like the group to know?"
        className="mt-2 block w-full resize-y rounded-control border border-border-strong bg-surface/70 px-3 py-2.5 text-sm leading-6 outline-none transition-colors placeholder:text-quiet-foreground focus:border-primary/45 focus:ring-[3px] focus:ring-ring/15"
      />
      <div className="mt-2 flex min-h-9 items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {error ? <span role="alert" className="text-destructive">Your post could not be shared. Please try again.</span> : null}
          {!error && shouldShowRemainingCharacters(value.length, PLAYGROUP_POST_MAX_LENGTH) ? `${remaining} characters left` : null}
        </span>
        <Button type="submit" size="sm" disabled={!body || submitting}>
          <Send aria-hidden="true" /> {submitting ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}
