"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Send, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import useResilientPrivateBroadcastChannel from "@/hooks/useResilientPrivateBroadcastChannel";
import {
  isDirectMessage,
  mergeDirectMessages,
  type DirectConversation as DirectConversationType,
  type DirectMessage,
} from "@/lib/direct-messages";
import { directMessagesApi } from "@/services/direct-messages";

const MAX_MESSAGE = 2000;

export default function DirectConversation({ conversationId }: { conversationId: string }) {
  const { user } = useUser();
  const [conversation, setConversation] = useState<DirectConversationType | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void Promise.all([
      directMessagesApi.conversation(conversationId),
      directMessagesApi.messages(conversationId),
    ])
      .then(([loadedConversation, history]) => {
        if (!active) return;
        setConversation(loadedConversation);
        setMessages(history.items);
        setHasMore(history.has_more);
        setNextBefore(history.next_before ?? null);
        const latest = history.items.at(-1);
        if (latest) void directMessagesApi.markRead(conversationId, latest.id).catch(() => undefined);
        requestAnimationFrame(() => {
          const node = scrollRef.current;
          if (node) node.scrollTop = node.scrollHeight;
        });
      })
      .catch(() => {
        if (active) setError("Conversation could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [conversationId]);

  const reconcileMessages = useCallback(async () => {
    try {
      const history = await directMessagesApi.messages(conversationId);
      setMessages((current) => mergeDirectMessages(current, history.items));
      const latest = history.items.at(-1);
      if (latest) await directMessagesApi.markRead(conversationId, latest.id).catch(() => undefined);
    } catch {
      // Keep rendered history; the next reconnect or manual navigation retries.
    }
  }, [conversationId]);

  const realtimeEvents = useMemo(() => ({
    message: (payload: unknown) => {
      if (!isDirectMessage(payload, conversationId)) return;
      setMessages((current) => mergeDirectMessages(current, [payload]));
      requestAnimationFrame(() => {
        const node = scrollRef.current;
        if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
      });
      void directMessagesApi.markRead(conversationId, payload.id).catch(() => undefined);
    },
    message_deleted: (payload: unknown) => {
      if (!isDirectMessage(payload, conversationId)) return;
      setMessages((current) => mergeDirectMessages(current, [payload]));
    },
  }), [conversationId]);

  useResilientPrivateBroadcastChannel({
    topic: `direct:${conversationId}:chat`,
    userId: user?.id ?? null,
    enabled: Boolean(user),
    events: realtimeEvents,
    onSubscribed: (reason) => { if (reason !== "recovery") void reconcileMessages(); },
    onRecovery: () => { void reconcileMessages(); },
    onFailure: () => setError("Live messages are reconnecting. You can keep using the conversation."),
  });

  async function loadOlder() {
    if (!nextBefore || loadingOlder) return;
    setLoadingOlder(true);
    setError(null);
    try {
      const history = await directMessagesApi.messages(conversationId, nextBefore);
      setMessages((current) => mergeDirectMessages(current, history.items));
      setHasMore(history.has_more);
      setNextBefore(history.next_before ?? null);
    } catch {
      setError("Older messages could not be loaded.");
    } finally {
      setLoadingOlder(false);
    }
  }

  async function send() {
    const body = value.trim();
    if (!body || body.length > MAX_MESSAGE || sending || !conversation?.can_message) return;
    setSending(true);
    setError(null);
    try {
      const message = await directMessagesApi.send(conversationId, body);
      setMessages((current) => mergeDirectMessages(current, [message]));
      setValue("");
      requestAnimationFrame(() => {
        const node = scrollRef.current;
        if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
      });
    } catch {
      setError("Your message was not sent. You may no longer be Connected.");
    } finally {
      setSending(false);
    }
  }

  async function removeMessage(message: DirectMessage) {
    if (!window.confirm("Delete this message?")) return;
    setError(null);
    try {
      await directMessagesApi.remove(conversationId, message.id);
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, body: "Message removed" } : item));
    } catch {
      setError("Message could not be deleted.");
    }
  }

  const title = useMemo(() => conversation?.other_user.nickname ?? "Message", [conversation]);

  if (loading) {
    return <main className="min-h-screen px-4 py-8 lg:px-0"><div className="h-[34rem] animate-pulse rounded-surface bg-muted" /></main>;
  }

  if (!conversation) {
    return <main className="min-h-screen px-4 py-8 lg:px-0"><p className="text-sm text-destructive">{error ?? "Conversation not found."}</p></main>;
  }

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[920px]">
        <Link href="/messages" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Messages
        </Link>

        <header className="mt-4 flex items-center gap-3 pb-4">
          <Link href={`/profile/${encodeURIComponent(conversation.other_user.id)}`}>
            <Avatar className="h-12 w-12">
              <AvatarImage src={conversation.other_user.avatar_url ?? undefined} alt="" />
              <AvatarFallback>{conversation.other_user.nickname.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{title}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {conversation.can_message ? "Direct message · Connection" : "Conversation history · messaging unavailable"}
            </p>
          </div>
        </header>

        <section className="overflow-hidden rounded-surface bg-surface/55">
          <div ref={scrollRef} className="h-[min(62dvh,42rem)] overflow-y-auto px-3 pb-4">
            <div className="sticky top-0 z-10 flex justify-center bg-surface/90 py-2 backdrop-blur-sm">
              {hasMore ? (
                <Button type="button" size="xs" variant="ghost" disabled={loadingOlder} onClick={() => void loadOlder()}>
                  {loadingOlder ? "Loading…" : "Load older messages"}
                </Button>
              ) : <span className="text-[11px] text-quiet-foreground">Start of conversation</span>}
            </div>

            {!messages.length ? <p className="py-12 text-center text-sm text-muted-foreground">No messages yet. Say hello.</p> : null}

            {messages.map((message) => {
              const own = message.sender.id === user?.id;
              const removed = message.body === "Message removed";
              return (
                <article key={message.id} className="group flex gap-2.5 pt-4">
                  <Link href={`/profile/${encodeURIComponent(message.sender.id)}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.avatar_url ?? undefined} alt="" />
                      <AvatarFallback>{message.sender.nickname.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-xs font-bold">{message.sender.nickname}{own ? " · You" : ""}</span>
                      <time className="text-[10px] text-quiet-foreground">{new Date(message.created_at).toLocaleString()}</time>
                    </div>
                    <div className="flex items-start gap-2">
                      <p className={removed ? "min-w-0 flex-1 whitespace-pre-wrap break-words text-sm italic text-quiet-foreground" : "min-w-0 flex-1 whitespace-pre-wrap break-words text-sm"}>{message.body}</p>
                      {own && !removed && conversation.can_message ? (
                        <button type="button" aria-label="Delete message" onClick={() => void removeMessage(message)} className="opacity-0 text-muted-foreground group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100">
                          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {conversation.can_message ? (
            <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="border-t border-border/60 bg-background p-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  maxLength={MAX_MESSAGE}
                  rows={1}
                  placeholder={`Message ${conversation.other_user.nickname}`}
                  className="max-h-32 min-h-11 min-w-0 flex-1 resize-y rounded-control border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/15"
                />
                <Button type="submit" size="icon-lg" aria-label="Send message" disabled={!value.trim() || sending}>
                  <Send aria-hidden="true" />
                </Button>
              </div>
            </form>
          ) : (
            <p className="border-t border-border/60 px-4 py-3 text-sm text-muted-foreground">
              Direct messages are available while both players remain Connected and neither has blocked the other.
            </p>
          )}
        </section>
        {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
      </div>
    </main>
  );
}
