"use client";

import Link from "next/link";
import { ExternalLink, Minus, X } from "lucide-react";

import FloatingDirectChat from "@/components/messages/FloatingDirectChat";
import FloatingPlaygroupChat from "@/components/messages/FloatingPlaygroupChat";
import FloatingTradeChat from "@/components/messages/FloatingTradeChat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMessaging } from "@/components/messages/MessagingProvider";

export default function MessagingDock() {
  const messaging = useMessaging();
  const active = messaging.activeConversation;
  if (!active) return null;

  if (messaging.minimized) {
    return (
      <button
        type="button"
        onClick={messaging.restoreConversation}
        className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-[115] flex max-w-[260px] items-center gap-2 rounded-full border border-border/70 bg-surface px-3 py-2 shadow-overlay lg:bottom-4"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={active.avatarUrl ?? undefined} alt="" />
          <AvatarFallback>{active.title.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-semibold">{active.title}</span>
      </button>
    );
  }

  return (
    <section
      role="dialog"
      aria-label={`Conversation with ${active.title}`}
      className="fixed inset-0 z-[115] flex flex-col overflow-hidden bg-surface text-foreground sm:inset-auto sm:bottom-0 sm:right-5 sm:h-[min(590px,calc(100dvh-5rem))] sm:w-[390px] sm:rounded-t-[20px] sm:border sm:border-border/75 sm:shadow-overlay"
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/65 px-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={active.avatarUrl ?? undefined} alt="" />
          <AvatarFallback>{active.title.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-bold">{active.title}</h2>
          <p className="text-[11px] text-muted-foreground">
            {active.kind === "direct" ? "Direct message" : active.kind === "trade" ? "Trade conversation" : "Playgroup chat"}
          </p>
        </div>
        <Link
          href={active.href}
          aria-label="Open full conversation"
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Link>
        <button
          type="button"
          aria-label="Minimize conversation"
          onClick={messaging.minimizeConversation}
          className="hidden h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground sm:grid"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Close conversation"
          onClick={messaging.closeConversation}
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="min-h-0 flex-1">
        {active.kind === "direct" ? <FloatingDirectChat conversationId={active.id} onActivity={messaging.refresh} /> : null}
        {active.kind === "trade" ? <FloatingTradeChat threadId={active.id} onActivity={messaging.refresh} /> : null}
        {active.kind === "playgroup" ? <FloatingPlaygroupChat playgroupId={active.id} onActivity={messaging.refresh} /> : null}
      </div>
    </section>
  );
}
