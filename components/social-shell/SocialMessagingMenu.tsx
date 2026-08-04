"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Handshake, MessageCircle, UsersRound, X } from "lucide-react";

import { binderApi } from "@/services/binder";
import type { BinderTradeThread } from "@/lib/binder";

import {
  getMyPlaygroups,
  type PlaygroupListItem,
} from "@/services/playgroups";

type LoadState = "idle" | "loading" | "ready" | "error";

export default function SocialMessagingMenu({ viewerKey }: { viewerKey: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>("idle");
  const [playgroups, setPlaygroups] = useState<PlaygroupListItem[]>([]);
  const [trades, setTrades] = useState<BinderTradeThread[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => { close(); }, [close, pathname]);
  useEffect(() => {
    close();
    setPlaygroups([]);
    setTrades([]);
    setState("idle");
  }, [close, viewerKey]);

  useEffect(() => {
    if (!open || !viewerKey) return;
    let active = true;
    setState("loading");
    void Promise.allSettled([
      getMyPlaygroups("owned", 1),
      getMyPlaygroups("joined", 1),
      binderApi.trades(1, "active"),
    ]).then((results) => {
      if (!active) return;
      const [ownedResult, joinedResult, tradeResult] = results;
      const playgroupPages: Array<{ items: PlaygroupListItem[] }> = [];
      if (ownedResult?.status === "fulfilled") playgroupPages.push(ownedResult.value);
      if (joinedResult?.status === "fulfilled") playgroupPages.push(joinedResult.value);
      const tradePage: { items: BinderTradeThread[] } | null = tradeResult?.status === "fulfilled"
        ? tradeResult.value
        : null;
      if (!playgroupPages.length && !tradePage) {
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
        className="grid h-10 w-10 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary/65 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/15 disabled:opacity-50"
      >
        <MessageCircle aria-hidden="true" className="h-[18px] w-[18px]" />
      </button>

      {open ? (
        <section
          role="dialog"
          aria-label="Messages"
          className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] top-[4.5rem] z-[95] flex flex-col overflow-hidden rounded-surface border border-border/80 bg-surface shadow-overlay sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:max-h-[min(560px,calc(100dvh-5.5rem))] sm:w-[380px]"
        >
          <header className="flex items-start justify-between gap-4 border-b border-border/70 px-4 py-4">
            <div>
              <h2 className="text-base font-bold tracking-tight">Messages</h2>
              <p className="mt-1 text-xs text-muted-foreground">Playgroup and trade conversations</p>
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
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-quiet-foreground">Trades</p>
            {state === "ready" && trades.length === 0 ? <p className="px-3 py-3 text-xs text-muted-foreground">Accepted Binder requests will appear here.</p> : null}
            {state === "ready" ? trades.map((trade) => (
              <Link key={trade.id} href={`/trades/${encodeURIComponent(trade.id)}`} onClick={() => close()} className="flex min-h-14 items-center gap-3 rounded-row px-3 py-2 outline-none hover:bg-secondary/55 focus-visible:bg-secondary">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Handshake aria-hidden="true" className="h-[18px] w-[18px]" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{trade.binder_item.printed_name || trade.binder_item.card_name}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{trade.other_user.nickname}{trade.last_message ? ` · ${trade.last_message.body}` : ""}</span>
                </span>
                {trade.unread_count > 0 ? <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{trade.unread_count}</span> : null}
              </Link>
            )) : null}
            <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-quiet-foreground">Playgroups</p>
            {state === "loading" || state === "idle" ? <LoadingRows /> : null}
            {state === "error" ? (
              <p role="status" className="px-3 py-8 text-center text-sm leading-6 text-muted-foreground">Playgroup chats could not be loaded right now.</p>
            ) : null}
            {state === "ready" && playgroups.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm leading-6 text-muted-foreground">Join or create a Playgroup to start using its chat.</p>
            ) : null}
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
            <div className="grid grid-cols-2 gap-2"><Link href="/binder?view=trades" onClick={() => close()} className="flex min-h-10 items-center justify-center rounded-control text-sm font-semibold text-primary hover:bg-secondary/55">View trades</Link><Link href="/playgroups?view=mine" onClick={() => close()} className="flex min-h-10 items-center justify-center rounded-control text-sm font-semibold text-primary hover:bg-secondary/55">Playgroups</Link></div>
          </footer>
        </section>
      ) : null}
    </div>
  );
}

function LoadingRows() {
  return <div className="grid gap-1 p-2">{[1, 2, 3].map((key) => <div key={key} className="h-14 animate-pulse rounded-row bg-muted/70" />)}</div>;
}
