"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import useResilientPrivateBroadcastChannel from "@/hooks/useResilientPrivateBroadcastChannel";
import type { DirectConversation } from "@/lib/direct-messages";
import { supabase } from "@/lib/supabase/client";
import { directMessagesApi } from "@/services/direct-messages";
import { useMessaging } from "@/components/messages/MessagingProvider";

export default function DirectThreadsView() {
  const messaging = useMessaging();
  const [items, setItems] = useState<DirectConversation[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);

  const load = useCallback(async (nextPage = 1, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await directMessagesApi.conversations(nextPage);
      setItems((current) => {
        const source = append ? [...current, ...result.items] : result.items;
        return [...new Map(source.map((item) => [item.id, item])).values()];
      });
      setPage(nextPage);
      setHasMore(result.has_more);
    } catch {
      setError("Messages could not be loaded.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void supabase.auth.getUser().then(({ data }) => setViewerId(data.user?.id ?? null));
  }, [load]);

  const realtimeEvents = useMemo(() => ({
    conversation_updated: () => { void load(1, false); },
  }), [load]);

  useResilientPrivateBroadcastChannel({
    topic: viewerId ? `user:${viewerId}:conversations` : null,
    userId: viewerId,
    enabled: Boolean(viewerId),
    events: realtimeEvents,
    onSubscribed: (reason) => { if (reason !== "recovery") void load(1, false); },
    onRecovery: () => { void load(1, false); },
  });

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[820px]">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">Private conversations with your Connections.</p>

        <section className="mt-6 overflow-hidden rounded-surface bg-surface/55">
          {loading ? <div className="grid gap-1 p-3">{[1, 2, 3].map((key) => <div key={key} className="h-16 animate-pulse rounded-row bg-muted" />)}</div> : null}
          {!loading && error ? <div className="p-6 text-center"><p className="text-sm text-destructive">{error}</p><Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => void load()}>Retry</Button></div> : null}
          {!loading && !error && !items.length ? <p className="p-8 text-center text-sm text-muted-foreground">No direct conversations yet. Open a Connection’s profile and choose Message.</p> : null}
          {!loading && !error ? items.map((conversation) => (
            <button
              type="button"
              key={conversation.id}
              onClick={() => messaging.openConversation({
                kind: "direct",
                id: conversation.id,
                title: conversation.other_user.nickname,
                avatarUrl: conversation.other_user.avatar_url,
                href: `/messages/${encodeURIComponent(conversation.id)}`,
              })}
              className="flex w-full min-h-16 items-center gap-3 border-b border-border/50 px-4 py-3 text-left outline-none last:border-b-0 hover:bg-secondary/45 focus-visible:bg-secondary"
            >
              <Avatar className="h-11 w-11 shrink-0">
                <AvatarImage src={conversation.other_user.avatar_url ?? undefined} alt="" />
                <AvatarFallback>{conversation.other_user.nickname.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{conversation.other_user.nickname}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {conversation.last_message?.body ?? "Start a conversation"}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                {conversation.last_message ? <time className="text-[10px] text-quiet-foreground">{new Date(conversation.last_message.created_at).toLocaleDateString()}</time> : null}
                {conversation.unread_count > 0 ? <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{conversation.unread_count}</span> : null}
              </span>
            </button>
          )) : null}
        </section>
        {hasMore ? <Button type="button" variant="outline" className="mt-4" disabled={loadingMore} onClick={() => void load(page + 1, true)}>{loadingMore ? "Loading…" : "Load more"}</Button> : null}
      </div>
    </main>
  );
}
