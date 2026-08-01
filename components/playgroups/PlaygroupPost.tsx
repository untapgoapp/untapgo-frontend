"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Pencil, Pin, PinOff, Trash2 } from "lucide-react";

import PlaygroupComments from "@/components/playgroups/PlaygroupComments";
import PlaygroupConfirmAction from "@/components/playgroups/PlaygroupConfirmAction";
import PlaygroupContentAvatar from "@/components/playgroups/PlaygroupContentAvatar";
import PlaygroupTimestamp from "@/components/playgroups/PlaygroupTimestamp";
import { Button } from "@/components/ui/button";
import {
  canDeleteCommunication,
  canEditCommunication,
  canPinPlaygroupPost,
  deletedPost,
  normalizeCommunicationBody,
  PLAYGROUP_POST_MAX_LENGTH,
  type CommunicationMembershipState,
  type PlaygroupPost as PlaygroupPostType,
} from "@/lib/playgroup-communications";
import {
  deletePlaygroupPost,
  setPlaygroupPostPinned,
  updatePlaygroupPost,
} from "@/services/playgroup-wall";

export default function PlaygroupPost({
  post,
  viewerId,
  membershipState,
  writable,
  initialCommentsOpen,
  likeBusy,
  onChanged,
  onToggleLike,
  onContractError,
}: {
  post: PlaygroupPostType;
  viewerId: string | null;
  membershipState: CommunicationMembershipState;
  writable: boolean;
  initialCommentsOpen: boolean;
  likeBusy: boolean;
  onChanged: (post: PlaygroupPostType) => void;
  onToggleLike: () => Promise<void>;
  onContractError: (error: unknown) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(post.body);
  const [mutationBusy, setMutationBusy] = useState(false);
  const [editError, setEditError] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [likeError, setLikeError] = useState(false);
  const nickname = post.author.nickname.trim() || "Player";
  const body = normalizeCommunicationBody(value, PLAYGROUP_POST_MAX_LENGTH);
  const canEdit = !post.is_deleted && canEditCommunication(post.author.id, viewerId, writable);
  const canDelete = !post.is_deleted && canDeleteCommunication(post.author.id, viewerId, membershipState, writable);
  const canPin = !post.is_deleted && canPinPlaygroupPost(membershipState, writable);

  async function save() {
    if (!body || mutationBusy) return;
    setMutationBusy(true);
    setEditError(false);
    try {
      onChanged(await updatePlaygroupPost(post.playgroup_id, post.id, body));
      setEditing(false);
    } catch (error) {
      onContractError(error);
      setEditError(true);
    } finally {
      setMutationBusy(false);
    }
  }

  async function pin() {
    if (mutationBusy) return;
    setMutationBusy(true);
    setActionError(false);
    try {
      onChanged(await setPlaygroupPostPinned(post.playgroup_id, post.id, !post.is_pinned));
    } catch (error) {
      onContractError(error);
      setActionError(true);
    } finally {
      setMutationBusy(false);
    }
  }

  return (
    <article data-playgroup-post-id={post.id} tabIndex={-1} className="rounded-row px-1 py-4 outline-none transition-colors hover:bg-surface/35 focus:bg-surface/45 sm:px-2">
      <div className="flex min-w-0 gap-3">
        <Link href={`/profile/${encodeURIComponent(post.author.id)}`} aria-label={nickname} className="h-fit rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20">
          <PlaygroupContentAvatar author={post.author} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href={`/profile/${encodeURIComponent(post.author.id)}`} className="text-sm font-bold hover:text-primary">{nickname}</Link>
            <span className="text-[11px] text-quiet-foreground"><PlaygroupTimestamp createdAt={post.created_at} updatedAt={post.updated_at} /></span>
            {post.is_pinned ? <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground"><Pin size={10} aria-hidden="true" />Pinned</span> : null}
          </div>

          {editing ? (
            <div className="mt-2">
              <textarea value={value} onChange={(event) => setValue(event.target.value)} maxLength={PLAYGROUP_POST_MAX_LENGTH} rows={4} className="block w-full resize-y rounded-control border border-border-strong bg-surface px-3 py-2.5 text-sm leading-6 outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/15" />
              <div className="mt-2 flex gap-2">
                <Button type="button" size="xs" disabled={!body || mutationBusy} onClick={() => void save()}>{mutationBusy ? "Saving…" : "Save"}</Button>
                <Button type="button" size="xs" variant="ghost" disabled={mutationBusy} onClick={() => { setEditing(false); setValue(post.body); setEditError(false); }}>Cancel</Button>
              </div>
              {editError ? <p role="alert" className="mt-2 text-xs text-destructive">This post could not be updated. Please try again.</p> : null}
            </div>
          ) : (
            <p className={post.is_deleted ? "mt-2 whitespace-pre-wrap break-words text-sm italic text-quiet-foreground" : "mt-2 whitespace-pre-wrap break-words text-[15px] leading-6"}>{post.body}</p>
          )}

          {!editing && !post.is_deleted ? (
            <div className="mt-2 flex flex-wrap items-start gap-1">
              <button type="button" disabled={!writable || likeBusy} onClick={() => { setLikeError(false); void onToggleLike().catch(() => setLikeError(true)); }} className={[
                "inline-flex min-h-9 items-center gap-1.5 rounded-control px-2 text-xs font-semibold transition-colors disabled:opacity-50",
                post.viewer_has_liked ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-secondary/55 hover:text-secondary-foreground",
              ].join(" ")}>
                <Heart size={14} fill={post.viewer_has_liked ? "currentColor" : "none"} aria-hidden="true" />
                Like{post.reaction_count > 0 ? ` · ${post.reaction_count}` : ""}
              </button>
              {canEdit ? <button type="button" disabled={mutationBusy} onClick={() => setEditing(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-control px-2 text-xs font-semibold text-muted-foreground hover:bg-secondary/55 hover:text-secondary-foreground"><Pencil size={13} aria-hidden="true" />Edit</button> : null}
              {canPin ? <button type="button" disabled={mutationBusy} onClick={() => void pin()} className="inline-flex min-h-9 items-center gap-1.5 rounded-control px-2 text-xs font-semibold text-muted-foreground hover:bg-secondary/55 hover:text-secondary-foreground">{post.is_pinned ? <PinOff size={13} aria-hidden="true" /> : <Pin size={13} aria-hidden="true" />}{post.is_pinned ? "Unpin" : "Pin"}</button> : null}
              {canDelete ? (
                <PlaygroupConfirmAction
                  trigger={<><Trash2 size={13} aria-hidden="true" />Delete</>}
                  title="Delete this post?"
                  description="The post will remain in the Wall sequence as removed content."
                  confirmLabel="Delete post"
                  busyLabel="Deleting…"
                  errorMessage="This post could not be deleted."
                  onConfirm={async () => {
                    try {
                      await deletePlaygroupPost(post.playgroup_id, post.id);
                      onChanged(deletedPost(post));
                    } catch (error) {
                      onContractError(error);
                      throw error;
                    }
                  }}
                />
              ) : null}
            </div>
          ) : null}
          {likeError ? <p role="alert" className="mt-1 text-xs text-destructive">Your Like could not be saved. It has been restored.</p> : null}
          {actionError ? <p role="alert" className="mt-1 text-xs text-destructive">This post action could not be completed. Please try again.</p> : null}
        </div>
      </div>

      {!post.is_deleted ? (
        <PlaygroupComments
          playgroupId={post.playgroup_id}
          postId={post.id}
          commentCount={post.comment_count}
          viewerId={viewerId}
          membershipState={membershipState}
          writable={writable}
          initialOpen={initialCommentsOpen}
          onCommentCountChange={(delta) => onChanged({ ...post, comment_count: Math.max(0, post.comment_count + delta) })}
          onContractError={onContractError}
        />
      ) : null}
    </article>
  );
}
