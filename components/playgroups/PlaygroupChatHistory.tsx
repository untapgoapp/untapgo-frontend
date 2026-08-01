"use client";

import type { RefObject, UIEventHandler } from "react";
import { ArrowDown } from "lucide-react";

import PlaygroupChatComposer from "@/components/playgroups/PlaygroupChatComposer";
import PlaygroupChatMessage from "@/components/playgroups/PlaygroupChatMessage";
import { Button } from "@/components/ui/button";
import {
  canDeleteCommunication,
  shouldGroupChatMessage,
  type CommunicationMembershipState,
  type PlaygroupChatMessage as ChatMessage,
} from "@/lib/playgroup-communications";

export default function PlaygroupChatHistory({
  scrollRef,
  items,
  loading,
  loadingOlder,
  hasMore,
  error,
  newMessages,
  viewerId,
  membershipState,
  writable,
  onScroll,
  onLoadOlder,
  onRetryInitial,
  onDelete,
  onSend,
  onShowLatest,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  items: ChatMessage[];
  loading: boolean;
  loadingOlder: boolean;
  hasMore: boolean;
  error: "initial" | "older" | "refresh" | null;
  newMessages: boolean;
  viewerId: string;
  membershipState: CommunicationMembershipState;
  writable: boolean;
  onScroll: UIEventHandler<HTMLDivElement>;
  onLoadOlder: () => void;
  onRetryInitial: () => void;
  onDelete: (message: ChatMessage) => Promise<void>;
  onSend: (body: string) => Promise<void>;
  onShowLatest: () => void;
}) {
  return (
    <div className="flex h-[calc(100dvh_-_9rem_-_env(safe-area-inset-bottom))] min-h-72 max-h-[46rem] flex-col overflow-hidden rounded-surface bg-surface/45">
      <div ref={scrollRef} onScroll={onScroll} className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-1 pb-4">
        <div className="sticky top-0 z-10 flex min-h-11 items-center justify-center bg-surface/90 py-1.5 backdrop-blur-sm">
          {hasMore ? <Button type="button" variant="ghost" size="xs" disabled={loadingOlder} onClick={onLoadOlder}>{loadingOlder ? "Loading…" : "Load older messages"}</Button> : <span className="text-[11px] text-quiet-foreground">Start of conversation</span>}
        </div>

        {loading && items.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted-foreground">Loading messages…</p> : null}
        {error === "initial" && items.length === 0 ? (
          <div role="alert" className="px-3 py-8 text-center">
            <p className="text-sm text-destructive">Chat history could not be loaded.</p>
            <Button type="button" size="sm" onClick={onRetryInitial} className="mt-3">Retry</Button>
          </div>
        ) : null}
        {error === "older" ? <p role="alert" className="px-3 py-2 text-center text-xs text-destructive">Older messages could not be loaded. Try again.</p> : null}
        {error === "refresh" && items.length > 0 ? <p role="alert" className="px-3 py-2 text-center text-xs text-destructive">The latest history could not be refreshed.</p> : null}
        {!loading && !error && items.length === 0 ? <p className="px-3 py-8 text-center text-sm text-muted-foreground">No messages yet. Say hello when you’re ready.</p> : null}

        {items.map((message, index) => (
          <PlaygroupChatMessage
            key={message.id}
            message={message}
            grouped={shouldGroupChatMessage(items[index - 1] ?? null, message)}
            own={message.sender.id === viewerId}
            canDelete={canDeleteCommunication(message.sender.id, viewerId, membershipState, writable)}
            onDelete={() => onDelete(message)}
          />
        ))}

        {newMessages ? (
          <div className="sticky bottom-2 z-20 flex justify-center pt-3">
            <Button type="button" size="sm" onClick={onShowLatest}><ArrowDown aria-hidden="true" />New messages</Button>
          </div>
        ) : null}
      </div>
      {writable ? <PlaygroupChatComposer onSend={onSend} /> : null}
    </div>
  );
}
