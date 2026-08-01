"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import PlaygroupConfirmAction from "@/components/playgroups/PlaygroupConfirmAction";
import PlaygroupContentAvatar from "@/components/playgroups/PlaygroupContentAvatar";
import PlaygroupTimestamp from "@/components/playgroups/PlaygroupTimestamp";
import { Button } from "@/components/ui/button";
import {
  normalizeCommunicationBody,
  PLAYGROUP_COMMENT_MAX_LENGTH,
  type PlaygroupComment,
} from "@/lib/playgroup-communications";

export default function PlaygroupCommentRow({
  comment,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  comment: PlaygroupComment;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (body: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(comment.body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const nickname = comment.author.nickname.trim() || "Player";
  const body = normalizeCommunicationBody(value, PLAYGROUP_COMMENT_MAX_LENGTH);

  async function save() {
    if (!body || busy) return;
    setBusy(true);
    setError(false);
    try {
      await onEdit(body);
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex min-w-0 gap-2.5 py-2.5">
      <PlaygroupContentAvatar author={comment.author} className="h-8 w-8" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xs font-bold">{nickname}</span>
          <span className="text-[11px] text-quiet-foreground">
            <PlaygroupTimestamp createdAt={comment.created_at} updatedAt={comment.updated_at} />
          </span>
        </div>

        {editing ? (
          <div className="mt-1.5">
            <textarea value={value} onChange={(event) => setValue(event.target.value)} maxLength={PLAYGROUP_COMMENT_MAX_LENGTH} rows={2} className="block w-full resize-y rounded-control border border-border-strong bg-surface px-2.5 py-2 text-sm outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/15" />
            <div className="mt-2 flex gap-2">
              <Button type="button" size="xs" disabled={!body || busy} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</Button>
              <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={() => { setEditing(false); setValue(comment.body); setError(false); }}>Cancel</Button>
            </div>
            {error ? <p role="alert" className="mt-1.5 text-xs text-destructive">This comment could not be updated.</p> : null}
          </div>
        ) : (
          <p className={comment.is_deleted ? "mt-1 break-words text-sm italic text-quiet-foreground" : "mt-1 whitespace-pre-wrap break-words text-sm leading-5.5"}>{comment.body}</p>
        )}

        {!editing && (canEdit || canDelete) ? (
          <div className="mt-1 flex flex-wrap items-start gap-1">
            {canEdit ? <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-8 items-center gap-1 rounded-control px-2 text-xs font-semibold text-muted-foreground hover:bg-secondary/60 hover:text-secondary-foreground"><Pencil size={12} aria-hidden="true" />Edit</button> : null}
            {canDelete ? (
              <PlaygroupConfirmAction
                trigger={<><Trash2 size={12} aria-hidden="true" />Delete</>}
                title="Delete this comment?"
                description="Its place in the conversation will remain as a removed comment."
                confirmLabel="Delete comment"
                busyLabel="Deleting…"
                errorMessage="This comment could not be deleted."
                onConfirm={onDelete}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
