"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";

import PlaygroupCommentRow from "@/components/playgroups/PlaygroupCommentRow";
import usePlaygroupComments from "@/components/playgroups/usePlaygroupComments";
import { Button } from "@/components/ui/button";
import {
  canDeleteCommunication,
  canEditCommunication,
  deletedComment,
  normalizeCommunicationBody,
  PLAYGROUP_COMMENT_MAX_LENGTH,
  type CommunicationMembershipState,
} from "@/lib/playgroup-communications";
import {
  createPlaygroupPostComment,
  deletePlaygroupPostComment,
  updatePlaygroupPostComment,
} from "@/services/playgroup-wall";

export default function PlaygroupComments({
  playgroupId,
  postId,
  commentCount,
  viewerId,
  membershipState,
  writable,
  initialOpen,
  onCommentCountChange,
  onContractError,
}: {
  playgroupId: string;
  postId: string;
  commentCount: number;
  viewerId: string | null;
  membershipState: CommunicationMembershipState;
  writable: boolean;
  initialOpen: boolean;
  onCommentCountChange: (delta: number) => void;
  onContractError: (error: unknown) => void;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const sendingRef = useRef(false);
  const resource = usePlaygroupComments({ playgroupId, postId, enabled: open, onContractError });
  const body = normalizeCommunicationBody(value, PLAYGROUP_COMMENT_MAX_LENGTH);

  useEffect(() => {
    if (initialOpen) setOpen(true);
  }, [initialOpen]);

  async function createComment() {
    if (!body || sendingRef.current || !writable) return;
    sendingRef.current = true;
    setSending(true);
    setSendError(false);
    try {
      const comment = await createPlaygroupPostComment(playgroupId, postId, body);
      resource.upsert(comment);
      onCommentCountChange(1);
      setValue("");
    } catch (error) {
      onContractError(error);
      setSendError(true);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-control px-2 text-xs font-semibold text-muted-foreground hover:bg-secondary/55 hover:text-secondary-foreground">
        <MessageSquare size={14} aria-hidden="true" /> View comments{commentCount > 0 ? ` (${commentCount})` : ""}
      </button>
    );
  }

  return (
    <section aria-label="Post comments" className="mt-2 rounded-row bg-surface-subtle/55 px-3 py-2.5 sm:ml-11">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-muted-foreground">Comments{commentCount > 0 ? ` · ${commentCount}` : ""}</p>
        <button type="button" onClick={() => setOpen(false)} className="min-h-8 rounded-control px-2 text-xs font-semibold text-muted-foreground hover:bg-secondary/55">Hide</button>
      </div>

      {resource.status === "loading" ? <p className="py-3 text-sm text-muted-foreground">Loading comments…</p> : null}
      {resource.items.map((comment) => (
        <PlaygroupCommentRow
          key={comment.id}
          comment={comment}
          canEdit={!comment.is_deleted && canEditCommunication(comment.author.id, viewerId, writable)}
          canDelete={!comment.is_deleted && canDeleteCommunication(comment.author.id, viewerId, membershipState, writable)}
          onEdit={async (nextBody) => {
            try {
              resource.upsert(await updatePlaygroupPostComment(playgroupId, postId, comment.id, nextBody));
            } catch (error) {
              onContractError(error);
              throw error;
            }
          }}
          onDelete={async () => {
            try {
              await deletePlaygroupPostComment(playgroupId, postId, comment.id);
              resource.upsert(deletedComment(comment));
              onCommentCountChange(-1);
            } catch (error) {
              onContractError(error);
              throw error;
            }
          }}
        />
      ))}

      {resource.status === "ready" && resource.items.length === 0 ? <p className="py-2 text-sm text-muted-foreground">No comments yet.</p> : null}
      {resource.status === "error" ? (
        <div role="alert" className="py-2">
          <p className="text-sm text-destructive">Comments could not be loaded.</p>
          <Button type="button" variant="ghost" size="xs" onClick={() => void resource.retry()} className="mt-1">Retry comments</Button>
        </div>
      ) : null}
      {resource.hasMore && resource.status !== "error" ? (
        <Button type="button" variant="ghost" size="xs" disabled={resource.status === "loading_more"} onClick={() => void resource.loadMore()} className="my-1">
          {resource.status === "loading_more" ? "Loading…" : "Load more comments"}
        </Button>
      ) : null}

      {writable ? (
        <form onSubmit={(event) => { event.preventDefault(); void createComment(); }} className="mt-2 flex min-w-0 items-end gap-2 border-t border-border/50 pt-3">
          <label htmlFor={`comment-${postId}`} className="sr-only">Add a comment</label>
          <textarea id={`comment-${postId}`} value={value} onChange={(event) => { setValue(event.target.value); setSendError(false); }} maxLength={PLAYGROUP_COMMENT_MAX_LENGTH} rows={1} placeholder="Add a comment" className="min-h-10 min-w-0 flex-1 resize-y rounded-control border border-border-strong bg-surface px-3 py-2 text-sm outline-none placeholder:text-quiet-foreground focus:border-primary/45 focus:ring-[3px] focus:ring-ring/15" />
          <Button type="submit" size="icon" aria-label="Post comment" disabled={!body || sending}><Send aria-hidden="true" /></Button>
        </form>
      ) : null}
      {sendError ? <p role="alert" className="mt-2 text-xs text-destructive">Your comment could not be added. Please try again.</p> : null}
    </section>
  );
}
