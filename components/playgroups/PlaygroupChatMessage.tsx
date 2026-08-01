"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

import PlaygroupConfirmAction from "@/components/playgroups/PlaygroupConfirmAction";
import PlaygroupContentAvatar from "@/components/playgroups/PlaygroupContentAvatar";
import PlaygroupTimestamp from "@/components/playgroups/PlaygroupTimestamp";
import {
  isDeletedChatMessage,
  type PlaygroupChatMessage as PlaygroupChatMessageType,
} from "@/lib/playgroup-communications";

export default function PlaygroupChatMessage({
  message,
  grouped,
  own,
  canDelete,
  onDelete,
}: {
  message: PlaygroupChatMessageType;
  grouped: boolean;
  own: boolean;
  canDelete: boolean;
  onDelete: () => Promise<void>;
}) {
  const nickname = message.sender.nickname.trim() || "Player";
  const deleted = isDeletedChatMessage(message);

  return (
    <article data-chat-message-id={message.id} className={`group flex min-w-0 gap-2.5 px-2 ${grouped ? "pt-1" : "pt-4"}`}>
      {grouped ? <span className="w-9 shrink-0" aria-hidden="true" /> : (
        <Link href={`/profile/${encodeURIComponent(message.sender.id)}`} aria-label={nickname} className="h-fit rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20">
          <PlaygroupContentAvatar author={message.sender} className="h-9 w-9" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        {!grouped ? (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <Link href={`/profile/${encodeURIComponent(message.sender.id)}`} className="text-xs font-bold hover:text-primary">{nickname}{own ? " · You" : ""}</Link>
            <span className="text-[10px] text-quiet-foreground"><PlaygroupTimestamp createdAt={message.created_at} /></span>
          </div>
        ) : null}
        <div className="flex min-w-0 items-start gap-1">
          <p className={deleted ? "min-w-0 flex-1 break-words py-0.5 text-sm italic leading-5.5 text-quiet-foreground" : "min-w-0 flex-1 whitespace-pre-wrap break-words py-0.5 text-sm leading-5.5"}>
            {message.body}
          </p>
          {canDelete && !deleted ? (
            <div className="shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
              <PlaygroupConfirmAction
                trigger={<><Trash2 size={12} aria-hidden="true" /><span className="sr-only">Delete message</span></>}
                title="Delete this message?"
                description="It will stay in the conversation as “Message removed”."
                confirmLabel="Delete message"
                busyLabel="Deleting…"
                errorMessage="This message could not be deleted."
                onConfirm={onDelete}
              />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
