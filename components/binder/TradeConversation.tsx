/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Send, Trash2, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { binderDisplayName, type BinderTradeMessage, type BinderTradeThread } from "@/lib/binder";
import { supabase } from "@/lib/supabase/client";
import { binderApi, binderErrorMessage } from "@/services/binder";
import { useUser } from "@/hooks/useUser";

const MAX_MESSAGE = 2000;

function mergeMessages(current: BinderTradeMessage[], incoming: BinderTradeMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((left, right) => {
    const time = Date.parse(left.created_at) - Date.parse(right.created_at);
    return time || left.id.localeCompare(right.id);
  });
}

function isTradeMessage(value: unknown, threadId: string): value is BinderTradeMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  const sender = message.sender as Record<string, unknown> | null;
  return message.thread_id === threadId
    && typeof message.id === "string"
    && typeof message.body === "string"
    && typeof message.created_at === "string"
    && Boolean(sender)
    && typeof sender?.id === "string"
    && typeof sender?.nickname === "string";
}

export default function TradeConversation({ threadId }: { threadId: string }) {
  const { user, loading: authLoading } = useUser();
  const [thread, setThread] = useState<BinderTradeThread | null>(null);
  const [messages, setMessages] = useState<BinderTradeMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [threadResult, history] = await Promise.all([
        binderApi.trade(threadId),
        binderApi.tradeMessages(threadId),
      ]);
      setThread(threadResult);
      setMessages(history.items);
      setHasMore(history.has_more);
      setNextBefore(history.next_before ?? null);
      const latest = history.items.at(-1);
      if (latest) void binderApi.markTradeRead(threadId, latest.id).catch(() => undefined);
      requestAnimationFrame(() => {
        const node = scrollRef.current;
        if (node) node.scrollTo({ top: node.scrollHeight });
      });
    } catch (caught) {
      setError(binderErrorMessage(caught, "This trade conversation could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    if (!authLoading && user) void load();
  }, [authLoading, load, user]);

  useEffect(() => {
    if (!user || !threadId) return;
    let stopped = false;
    let channel = supabase.channel(`trade:${threadId}:chat`, {
      config: { private: true, broadcast: { ack: false, self: false } },
    });
    void supabase.auth.getSession().then(async ({ data }) => {
      if (stopped || !data.session) return;
      await supabase.realtime.setAuth(data.session.access_token);
      channel
        .on("broadcast", { event: "message" }, ({ payload }) => {
          if (stopped || !isTradeMessage(payload, threadId)) return;
          setMessages((current) => mergeMessages(current, [payload]));
          requestAnimationFrame(() => {
            const node = scrollRef.current;
            if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
          });
          void binderApi.markTradeRead(threadId, payload.id).catch(() => undefined);
        })
        .on("broadcast", { event: "message_deleted" }, ({ payload }) => {
          if (stopped || !isTradeMessage(payload, threadId)) return;
          setMessages((current) => mergeMessages(current, [payload]));
        })
        .on("broadcast", { event: "trade_completed" }, () => setThread((current) => current ? { ...current, status: "completed" } : current))
        .on("broadcast", { event: "trade_cancelled" }, () => setThread((current) => current ? { ...current, status: "cancelled" } : current))
        .subscribe();
    });
    return () => {
      stopped = true;
      void supabase.removeChannel(channel);
    };
  }, [threadId, user]);

  async function loadOlder() {
    if (!nextBefore || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const history = await binderApi.tradeMessages(threadId, nextBefore);
      setMessages((current) => mergeMessages(current, history.items));
      setHasMore(history.has_more);
      setNextBefore(history.next_before ?? null);
    } catch (caught) {
      setError(binderErrorMessage(caught, "Older messages could not be loaded."));
    } finally {
      setLoadingOlder(false);
    }
  }

  async function send() {
    const body = value.trim();
    if (!body || body.length > MAX_MESSAGE || sending || thread?.status !== "active") return;
    setSending(true);
    setError(null);
    try {
      const message = await binderApi.sendTradeMessage(threadId, body);
      setMessages((current) => mergeMessages(current, [message]));
      setValue("");
      requestAnimationFrame(() => {
        const node = scrollRef.current;
        if (node) node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
      });
    } catch (caught) {
      setError(binderErrorMessage(caught, "Your message was not sent."));
    } finally {
      setSending(false);
    }
  }

  async function removeMessage(message: BinderTradeMessage) {
    if (!window.confirm("Delete this message?")) return;
    try {
      await binderApi.deleteTradeMessage(threadId, message.id);
      setMessages((current) => current.map((value) => value.id === message.id ? { ...value, body: "Message removed" } : value));
    } catch (caught) {
      setError(binderErrorMessage(caught, "Message could not be deleted."));
    }
  }

  async function finish(action: "complete" | "cancel") {
    if (actionBusy || !thread) return;
    const label = action === "complete" ? "complete" : "cancel";
    const failureMessage = action === "complete" ? "Trade could not be completed." : "Trade could not be cancelled.";
    if (!window.confirm(`${label[0].toUpperCase()}${label.slice(1)} this trade?`)) return;
    setActionBusy(true);
    try {
      const result = action === "complete"
        ? await binderApi.completeTrade(threadId)
        : await binderApi.cancelTrade(threadId);
      setThread((current) => current ? { ...current, status: result.status } : current);
    } catch (caught) {
      setError(binderErrorMessage(caught, failureMessage));
    } finally {
      setActionBusy(false);
    }
  }

  const title = useMemo(() => thread ? binderDisplayName(thread.binder_item) : "Trade", [thread]);

  if (loading) return <main className="min-h-screen px-4 py-8 lg:px-0"><div className="h-[34rem] animate-pulse rounded-surface bg-muted" /></main>;
  if (!thread) return <main className="min-h-screen px-4 py-8 lg:px-0"><p className="text-sm text-destructive">{error ?? "Trade not found."}</p></main>;

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[980px]">
        <Link href="/binder?view=trades" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to trades</Link>
        <header className="mt-4 flex flex-wrap items-center justify-between gap-4 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            {thread.binder_item.image_url ? <img src={thread.binder_item.image_url} alt="" className="h-20 w-14 rounded-[0.35rem] object-cover" /> : <div className="h-20 w-14 rounded-[0.35rem] bg-muted" />}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">Private trade</p>
              <h1 className="truncate text-2xl font-bold">{title}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {thread.requested_quantity ?? 1} {(thread.requested_quantity ?? 1) === 1 ? "copy" : "copies"} requested
              </p>
              <Link href={`/profile/${encodeURIComponent(thread.other_user.id)}`} className="mt-1 inline-flex items-center gap-2 text-sm font-semibold hover:text-primary">
                <Avatar className="h-6 w-6"><AvatarImage src={thread.other_user.avatar_url ?? undefined} alt="" /><AvatarFallback>{thread.other_user.nickname.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
                {thread.other_user.nickname}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={thread.status === "active" ? "secondary" : "outline"}>{thread.status}</Badge>
            {thread.status === "active" ? <><Button type="button" size="sm" variant="outline" disabled={actionBusy} onClick={() => void finish("cancel")}><X aria-hidden="true" />Cancel</Button><Button type="button" size="sm" disabled={actionBusy} onClick={() => void finish("complete")}><Check aria-hidden="true" />Complete</Button></> : null}
          </div>
        </header>

        <section className="overflow-hidden rounded-surface bg-surface/55">
          <div ref={scrollRef} className="h-[min(58dvh,38rem)] overflow-y-auto px-3 pb-4">
            <div className="sticky top-0 z-10 flex justify-center bg-surface/90 py-2 backdrop-blur-sm">
              {hasMore ? <Button type="button" size="xs" variant="ghost" disabled={loadingOlder} onClick={() => void loadOlder()}>{loadingOlder ? "Loading…" : "Load older messages"}</Button> : <span className="text-[11px] text-quiet-foreground">Start of conversation</span>}
            </div>
            {!messages.length ? <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Say hello and arrange the trade.</p> : null}
            {messages.map((message) => {
              const own = message.sender.id === user?.id;
              return (
                <article key={message.id} className="group flex gap-2.5 pt-4">
                  <Link href={`/profile/${encodeURIComponent(message.sender.id)}`}><Avatar className="h-8 w-8"><AvatarImage src={message.sender.avatar_url ?? undefined} alt="" /><AvatarFallback>{message.sender.nickname.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar></Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2"><span className="text-xs font-bold">{message.sender.nickname}{own ? " · You" : ""}</span><time className="text-[10px] text-quiet-foreground">{new Date(message.created_at).toLocaleString()}</time></div>
                    <div className="flex items-start gap-2"><p className={message.body === "Message removed" ? "min-w-0 flex-1 whitespace-pre-wrap break-words text-sm italic text-quiet-foreground" : "min-w-0 flex-1 whitespace-pre-wrap break-words text-sm"}>{message.body}</p>{own && message.body !== "Message removed" && thread.status === "active" ? <button type="button" aria-label="Delete message" onClick={() => void removeMessage(message)} className="opacity-0 text-muted-foreground group-hover:opacity-100 hover:text-destructive"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" /></button> : null}</div>
                  </div>
                </article>
              );
            })}
          </div>
          {thread.status === "active" ? (
            <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="border-t border-border/60 bg-background p-3">
              <div className="flex items-end gap-2">
                <textarea value={value} onChange={(event) => setValue(event.target.value)} maxLength={MAX_MESSAGE} rows={1} placeholder="Message about this trade" className="max-h-32 min-h-11 min-w-0 flex-1 resize-y rounded-control border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/15" />
                <Button type="submit" size="icon-lg" aria-label="Send message" disabled={!value.trim() || sending}><Send aria-hidden="true" /></Button>
              </div>
            </form>
          ) : <p className="border-t border-border/60 px-4 py-3 text-sm text-muted-foreground">This trade is {thread.status}. The conversation is read-only.</p>}
        </section>
        {error ? <p role="alert" className="mt-3 text-sm text-destructive">{error}</p> : null}
      </div>
    </main>
  );
}
