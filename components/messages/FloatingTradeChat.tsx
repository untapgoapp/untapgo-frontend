"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import type { BinderTradeMessage, BinderTradeThread } from "@/lib/binder";
import { supabase } from "@/lib/supabase/client";
import { binderApi } from "@/services/binder";

function merge(current: BinderTradeMessage[], incoming: BinderTradeMessage[]) {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id));
}

function valid(value: unknown, threadId: string): value is BinderTradeMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<BinderTradeMessage>;
  return item.thread_id === threadId && typeof item.id === "string" && typeof item.body === "string";
}

export default function FloatingTradeChat({ threadId, onActivity }: { threadId: string; onActivity: () => Promise<void> }) {
  const { user } = useUser();
  const [thread, setThread] = useState<BinderTradeThread | null>(null);
  const [messages, setMessages] = useState<BinderTradeMessage[]>([]);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([binderApi.trade(threadId), binderApi.tradeMessages(threadId)]).then(([loaded, history]) => {
      if (!active) return;
      setThread(loaded);
      setMessages(history.items);
      const latest = history.items.at(-1);
      if (latest) void binderApi.markTradeRead(threadId, latest.id).then(onActivity).catch(() => undefined);
      requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
    }).catch(() => { if (active) setError("Trade conversation could not be loaded."); });
    return () => { active = false; };
  }, [onActivity, threadId]);

  useEffect(() => {
    let stopped = false;
    const channel = supabase.channel(`trade:${threadId}:chat`, { config: { private: true, broadcast: { ack: false, self: false } } });
    void supabase.auth.getSession().then(async ({ data }) => {
      if (stopped || !data.session) return;
      await supabase.realtime.setAuth(data.session.access_token);
      channel
        .on("broadcast", { event: "message" }, ({ payload }) => {
          if (stopped || !valid(payload, threadId)) return;
          setMessages((current) => merge(current, [payload]));
          requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
          void binderApi.markTradeRead(threadId, payload.id).then(onActivity).catch(() => undefined);
        })
        .on("broadcast", { event: "message_deleted" }, ({ payload }) => {
          if (!stopped && valid(payload, threadId)) setMessages((current) => merge(current, [payload]));
        })
        .subscribe((status) => {
          if (!stopped && status === "SUBSCRIBED") void binderApi.tradeMessages(threadId).then((history) => setMessages((current) => merge(current, history.items)));
        });
    });
    return () => { stopped = true; void supabase.removeChannel(channel); };
  }, [onActivity, threadId]);

  async function send() {
    const body = value.trim();
    if (!body || sending || thread?.status !== "active") return;
    setSending(true);
    try {
      const message = await binderApi.sendTradeMessage(threadId, body);
      setMessages((current) => merge(current, [message]));
      setValue("");
      await onActivity();
    } catch {
      setError("Trade message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {thread ? <div className="border-b border-border/55 px-3 py-2 text-xs text-muted-foreground">{thread.requested_quantity}× {thread.binder_item.printed_name || thread.binder_item.card_name} · {thread.status}</div> : null}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {messages.map((message) => {
          const own = message.sender.id === user?.id;
          return <div key={message.id} className={`mb-2 flex ${own ? "justify-end" : "justify-start"}`}><div className={`max-w-[78%] rounded-[18px] px-3 py-2 text-sm ${own ? "bg-primary text-primary-foreground" : "bg-secondary/75"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><time className={`mt-1 block text-[9px] ${own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div></div>;
        })}
      </div>
      {error ? <p className="px-3 py-1 text-xs text-destructive">{error}</p> : null}
      {thread?.status === "active" ? <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex items-end gap-2 border-t border-border/65 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"><textarea value={value} onChange={(event) => setValue(event.target.value)} rows={1} maxLength={2000} placeholder="Write a trade message…" className="max-h-28 min-h-10 min-w-0 flex-1 resize-none rounded-[18px] border border-border-strong bg-surface px-3 py-2 text-sm outline-none" /><Button type="submit" size="icon" disabled={!value.trim() || sending} aria-label="Send message"><Send className="h-4 w-4" /></Button></form> : <p className="border-t border-border/65 p-3 text-xs text-muted-foreground">This trade is closed. The conversation is read-only.</p>}
    </div>
  );
}
