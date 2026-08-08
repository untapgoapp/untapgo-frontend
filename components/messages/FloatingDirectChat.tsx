"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import useResilientPrivateBroadcastChannel from "@/hooks/useResilientPrivateBroadcastChannel";
import {
  isDirectMessage,
  mergeDirectMessages,
  type DirectConversation,
  type DirectMessage,
} from "@/lib/direct-messages";
import { directMessagesApi } from "@/services/direct-messages";

export default function FloatingDirectChat({ conversationId, onActivity }: { conversationId: string; onActivity: () => Promise<void> }) {
  const { user } = useUser();
  const [conversation, setConversation] = useState<DirectConversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
    });
  }, []);

  const reconcileMessages = useCallback(async () => {
    try {
      const history = await directMessagesApi.messages(conversationId);
      setMessages((current) => mergeDirectMessages(current, history.items));
      const latest = history.items.at(-1);
      if (latest) {
        await directMessagesApi.markRead(conversationId, latest.id).catch(() => undefined);
        await onActivity().catch(() => undefined);
      }
      scrollToLatest("auto");
    } catch {
      // Keep the already rendered history. A later retry/resume reconciles it.
    }
  }, [conversationId, onActivity, scrollToLatest]);

  useEffect(() => {
    let active = true;
    void Promise.all([directMessagesApi.conversation(conversationId), directMessagesApi.messages(conversationId)])
      .then(([loaded, history]) => {
        if (!active) return;
        setConversation(loaded);
        setMessages(history.items);
        setError(null);
        const latest = history.items.at(-1);
        if (latest) void directMessagesApi.markRead(conversationId, latest.id).then(onActivity).catch(() => undefined);
        scrollToLatest("auto");
      })
      .catch(() => { if (active) setError("Conversation could not be loaded."); });
    return () => { active = false; };
  }, [conversationId, onActivity, scrollToLatest]);

  const realtimeEvents = useMemo(() => ({
    message: (payload: unknown) => {
      if (!isDirectMessage(payload, conversationId)) return;
      setMessages((current) => mergeDirectMessages(current, [payload]));
      scrollToLatest("smooth");
      void directMessagesApi.markRead(conversationId, payload.id).then(onActivity).catch(() => undefined);
    },
    message_deleted: (payload: unknown) => {
      if (!isDirectMessage(payload, conversationId)) return;
      setMessages((current) => mergeDirectMessages(current, [payload]));
    },
  }), [conversationId, onActivity, scrollToLatest]);

  useResilientPrivateBroadcastChannel({
    topic: `direct:${conversationId}:chat`,
    userId: user?.id ?? null,
    enabled: Boolean(user),
    events: realtimeEvents,
    onSubscribed: (reason) => { if (reason !== "recovery") void reconcileMessages(); },
    onRecovery: () => { void reconcileMessages(); },
    onFailure: () => setError("Live messages are reconnecting. You can keep using the chat."),
  });

  async function send() {
    const body = value.trim();
    if (!body || sending || !conversation?.can_message) return;
    setSending(true);
    setError(null);
    try {
      const message = await directMessagesApi.send(conversationId, body);
      setMessages((current) => mergeDirectMessages(current, [message]));
      setValue("");
      await onActivity();
      scrollToLatest("smooth");
    } catch {
      setError("Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {!messages.length && !error ? <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Say hello.</p> : null}
        {messages.map((message) => {
          const own = message.sender.id === user?.id;
          return (
            <div key={message.id} className={`mb-2 flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}>
              {!own ? (
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={message.sender.avatar_url ?? undefined} alt="" />
                  <AvatarFallback>{message.sender.nickname.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
              ) : null}
              <div className={`max-w-[78%] rounded-[18px] px-3 py-2 text-sm ${own ? "bg-primary text-primary-foreground" : "bg-secondary/75 text-foreground"}`}>
                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                <time className={`mt-1 block text-[9px] ${own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
              </div>
            </div>
          );
        })}
      </div>
      {error ? <p role="alert" className="px-3 py-1 text-xs text-destructive">{error}</p> : null}
      {conversation?.can_message ? (
        <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex items-end gap-2 border-t border-border/65 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <textarea value={value} onChange={(event) => setValue(event.target.value)} rows={1} maxLength={2000} placeholder="Write a message…" className="max-h-28 min-h-10 min-w-0 flex-1 resize-none rounded-[18px] border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:border-primary/45" />
          <Button type="submit" size="icon" disabled={!value.trim() || sending} aria-label="Send message"><Send className="h-4 w-4" /></Button>
        </form>
      ) : <p className="border-t border-border/65 p-3 text-xs text-muted-foreground">Messaging is unavailable unless both players remain Connected.</p>}
    </div>
  );
}
