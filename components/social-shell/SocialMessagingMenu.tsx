"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Handshake, MessageCircle, UsersRound, X } from "lucide-react";

import { useMessaging } from "@/components/messages/MessagingProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConversationKind, ConversationSummary } from "@/lib/messaging";

export default function SocialMessagingMenu({ viewerKey }: { viewerKey: string | null }) {
  const messaging = useMessaging();
  const refreshMessages = messaging.refresh;
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    void refreshMessages();
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) close(true);
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", keydown);
    };
  }, [close, open, refreshMessages]);

  function select(item: ConversationSummary) {
    messaging.openConversation(item);
    close();
  }

  const groups: Array<{ kind: ConversationKind; label: string; empty: string }> = [
    { kind: "direct", label: "Direct", empty: "Message a Connection from their profile." },
    { kind: "trade", label: "Trades", empty: "Accepted Binder requests will appear here." },
    { kind: "playgroup", label: "Playgroups", empty: "Join a Playgroup to use its chat." },
  ];

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={messaging.unreadCount ? `${messaging.unreadCount} unread messages` : "Open messages"}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={!viewerKey}
        onClick={() => setOpen((current) => !current)}
        className="relative grid h-10 w-10 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-secondary/65 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/15 disabled:opacity-50"
      >
        <MessageCircle aria-hidden="true" className="h-[18px] w-[18px]" />
        {messaging.unreadCount > 0 ? (
          <span className="absolute right-0 top-0 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {messaging.unreadCount > 99 ? "99+" : messaging.unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          role="dialog"
          aria-label="Messages"
          className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] top-[4.5rem] z-[105] flex flex-col overflow-hidden rounded-surface border border-border/80 bg-surface shadow-overlay sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:max-h-[min(620px,calc(100dvh-5.5rem))] sm:w-[390px]"
        >
          <header className="flex items-start justify-between gap-4 border-b border-border/70 px-4 py-4">
            <div>
              <h2 className="text-base font-bold tracking-tight">Messages</h2>
              <p className="mt-1 text-xs text-muted-foreground">Direct, trade and Playgroup conversations</p>
            </div>
            <button type="button" aria-label="Close messages" onClick={() => close(true)} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {messaging.loading && messaging.conversations.length === 0 ? <LoadingRows /> : null}
            {messaging.error ? <p className="px-3 py-2 text-xs text-destructive">{messaging.error}</p> : null}
            {groups.map((group) => {
              const items = messaging.conversations.filter((item) => item.kind === group.kind).slice(0, 8);
              return (
                <div key={group.kind}>
                  <SectionLabel>{group.label}</SectionLabel>
                  {!messaging.loading && items.length === 0 ? <p className="px-3 py-3 text-xs text-muted-foreground">{group.empty}</p> : null}
                  {items.map((item) => <ConversationRow key={item.key} item={item} onSelect={() => select(item)} />)}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ConversationRow({ item, onSelect }: { item: ConversationSummary; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className="flex w-full min-h-14 items-center gap-3 rounded-row px-3 py-2 text-left outline-none hover:bg-secondary/55 focus-visible:bg-secondary">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={item.avatarUrl ?? undefined} alt="" />
        <AvatarFallback>
          {item.kind === "trade" ? <Handshake className="h-4 w-4" /> : item.kind === "playgroup" ? <UsersRound className="h-4 w-4" /> : item.title.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{item.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.subtitle}</span>
      </span>
      {item.unreadCount > 0 ? <UnreadBadge count={item.unreadCount} /> : null}
    </button>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-quiet-foreground first:pt-2">{children}</p>;
}

function UnreadBadge({ count }: { count: number }) {
  return <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{count > 99 ? "99+" : count}</span>;
}

function LoadingRows() {
  return <div className="space-y-2 p-2">{[1, 2, 3].map((key) => <div key={key} className="h-14 animate-pulse rounded-row bg-muted" />)}</div>;
}
