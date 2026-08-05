"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Handshake, MessageCircle, UsersRound, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { BinderTradeThread } from "@/lib/binder";
import type { DirectConversation } from "@/lib/direct-messages";
import { supabase } from "@/lib/supabase/client";
import { binderApi } from "@/services/binder";
import { directMessagesApi } from "@/services/direct-messages";
import {
  getMyPlaygroups,
  type PlaygroupListItem,
} from "@/services/playgroups";

type LoadState = "idle" | "loading" | "ready" | "error";

export default function SocialMessagingMenu({ viewerKey }: { viewerKey: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>("idle");
  const [directState, setDirectState] = useState<LoadState>("idle");
  const [playgroups, setPlaygroups] = useState<PlaygroupListItem[]>([]);
  const [trades, setTrades] = useState<BinderTradeThread[]>([]);
  const [directs, setDirects] = useState<DirectConversation[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const loadDirects = useCallback(async () => {
    if (!viewerKey) return;
    setDirectState("loading");
    try {
      const result = await directMessagesApi.conversations(1, 8);
      setDirects(result.items);
      setDirectState("ready");
    } catch {
      setDirectState("error");
    }
  }, [viewerKey]);

  useEffect(() => { close(); }, [close, pathname]);
  useEffect(() => {
    close();
    setPlaygroups([]);
    setTrades([]);
    setDirects([]);
    setState("idle");
    setDirectState("idle");
    if (viewerKey) void loadDirects();
  }, [close, loadDirects, viewerKey]);

  useEffect(() => {
    if (!viewerKey) return;
    let stopped = false;
    const channel = supabase.channel(`user:${viewerKey}:conversations`, {
      config: { private: true, broadcast: { ack: false, self: false } },
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      if (stopped || !data.session) return;
      await supabase.realtime.setAuth(data.session.access_token);
      channel
        .on("broadcast", { event: "conversation_updated" }, () => {
          if (!stopped) void loadDirects();
        })
        .subscribe();
    });

    return () => {
      stopped = true;
      void supabase.removeChannel(channel);
    };
  }, [loadDirects, viewerKey]);

  useEffect(() => {
    if (!open || !viewerKey) return;
    let active = true;
    setState("loading");
    void Promise.allSettled([
      getMyPlaygroups("owned", 1),
      getMyPlaygroups("joined", 1),
      binderApi.trades(1, "active"),
      directMessagesApi.conversations(1, 8),
    ]).then((results) => {
      if (!active) return;
      const [ownedResult, joinedResult, tradeResult, directResult] = results;
      const playgroupPages: Array<{ items: PlaygroupListItem[] }> = [];
      if (ownedResult.status === "fulfilled") playgroupPages.push(ownedResult.value);
      if (joinedResult.status === "fulfilled") playgroupPages.push(joinedResult.value);
      const tradePage: { items: BinderTradeThread[] } | null = tradeResult.status === "fulfilled"
        ? tradeResult.value
        : null;
      if (directResult.status === "fulfilled") {
        setDirects(directResult.value.items.slice(0, 8));
        setDirectState("ready");
      }
      if (!playgroupPages.length && !tradePage && directResult.status === "rejected") {
        setState("error");
        return;
      }
      const unique = new Map<string, PlaygroupListItem>();
      for (const item of playgroupPages.flatMap((page) => page.items)) unique.set(item.id, item);
      setPlaygroups([...unique.values()].slice(0, 6));
      setTrades((tradePage?.items ?? []).slice(0, 6));
      setState("ready");
    });
    return () => { active = false; };
  }, [open, viewerKey]);

  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) close(true);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    }
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  const unreadCount = useMemo(
    () => directs.reduce((total, item) => total + item.unread_count, 0)
      + trades.reduce((total, item) => total + item.unread_count, 0),
    [directs, trades],
  );

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open messages"
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={!viewerKey}
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-10 w-10 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary/65 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/15 disabled:opacity-50"
      >
        <MessageCircle aria-hidden="true" className="h-[18px] w-[18px]" />
        {unreadCount > 0 ? (
          <span className="absolute right-0 top-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          role="dialog"
          aria-label="Messages"
          className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] top-[4.5rem] z-[95] flex flex-col overflow-hidden rounded-surface border border-border/80 bg-surface shadow-overlay sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:max-h-[min(620px,calc(100dvh-5.5rem))] sm:w-[390px]"
        >
          <header className="flex items-start justify-between gap-4 border-b border-border/70 px-4 py-4">
            <div>
              <h2 className="text-base font-bold tracking-tight">Messages</h2>
              <p className="mt-1 text-xs text-muted-foreground">Direct, trade and Playgroup conversations</p>
            </div>
            <button
              type="button"
              aria-label="Close messages"
              onClick={() => close(true)}
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/15"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            <SectionLabel>Direct</SectionLabel>
            {directState === "loading" || directState === "idle" ? <LoadingRows count={2} /> : null}
            {directState === "error" ? <p className="px-3 py-3 text-xs text-muted-foreground">Direct messages could not be loaded.</p> : null}
            {directState === "ready" && directs.length === 0 ? <p className="px-3 py-3 text-xs text-muted-foreground">Message a Connection from their profile.</p> : null}
            {directState === "ready" ? directs.slice(0, 6).map((conversation) => (
              <Link
                key={conversation.id}
                href={`/messages/${encodeURIComponent(conversation.id)}`}
                onClick={() => close()}
                className="flex min-h-14 items-center gap-3 rounded-row px-3 py-2 outline-none hover:bg-secondary/55 focus-visible:bg-secondary"
              >
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={conversation.other_user.avatar_url ?? undefined} alt="" />
                  <AvatarFallback>{conversation.other_user.nickname.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{conversation.other_user.nickname}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{conversation.last_message?.body ?? "Start a conversation"}</span>
                </span>
                {conversation.unread_count > 0 ? <UnreadBadge count={conversation.unread_count} /> : null}
              </Link>
            )) : null}

            <SectionLabel>Trades</SectionLabel>
            {state === "ready" && trades.length === 0 ? <p className="px-3 py-3 text-xs text-muted-foreground">Accepted Binder requests will appear here.</p> : null}
            {state === "ready" ? trades.map((trade) => (
              <Link key={trade.id} href={`/trades/${encodeURIComponent(trade.id)}`} onClick={() => close()} className="flex min-h-14 items-center gap-3 rounded-row px-3 py-2 outline-none hover:bg-secondary/55 focus-visible:bg-secondary">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Handshake aria-hidden="true" className="h-[18px] w-[18px]" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{trade.binder_item.printed_name || trade.binder_item.card_name}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{trade.other_user.nickname}{trade.last_message ? ` · ${trade.last_message.body}` : ""}</span>
                </span>
                {trade.unread_count > 0 ? <UnreadBadge count={trade.unread_count} /> : null}
              </Link>
            )) : null}

            <SectionLabel>Playgroups</SectionLabel>
            {state === "loading" || state === "idle" ? <LoadingRows count={3} /> : null}
            {state === "error" ? <p role="status" className="px-3 py-8 text-center text-sm leading-6 text-muted-foreground">Conversations could not be loaded right now.</p> : null}
            {state === "ready" && playgroups.length === 0 ? <p className="px-3 py-8 text-center text-sm leading-6 text-muted-foreground">Join or create a Playgroup to start using its chat.</p> : null}
            {state === "ready" ? playgroups.map((group) => (
              <Link
                key={group.id}
                href={`/playgroups/${encodeURIComponent(group.id)}?section=chat`}
                onClick={() => close()}
                className="flex min-h-14 items-center gap-3 rounded-row px-3 py-2 outline-none hover:bg-secondary/55 focus-visible:bg-secondary"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-secondary-foreground">
                  {group.avatar_url ? <img src={group.avatar_url} alt="" className="h-full w-full object-cover" /> : <UsersRound aria-hidden="true" className="h-[18px] w-[18px]" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">{group.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">Open Playgroup chat</span>
                </span>
              </Link>
            )) : null}
          </div>

          <footer className="border-t border-border/70 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3">
            <Link href="/messages" onClick={() => close()} className="flex min-h-10 items-center justify-center rounded-control text-sm font-semibold text-primary hover:bg-secondary/55">View all messages</Link>
          </footer>
        </section>
      ) : null}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-quiet-foreground">{children}</p>;
}

function UnreadBadge({ count }: { count: number }) {
  return <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{count > 99 ? "99+" : count}</span>;
}

function LoadingRows({ count }: { count: number }) {
  return <div className="grid gap-1 p-2">{Array.from({ length: count }, (_, index) => <div key={index} className="h-14 animate-pulse rounded-row bg-muted/70" />)}</div>;
}
