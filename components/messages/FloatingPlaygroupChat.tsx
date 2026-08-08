"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import useResilientPrivateBroadcastChannel from "@/hooks/useResilientPrivateBroadcastChannel";
import { mergeChatMessages, type PlaygroupChatMessage } from "@/lib/playgroup-communications";
import {
  getPlaygroupChatMessages,
  getPlaygroupChatState,
  markPlaygroupChatRead,
  sendPlaygroupChatMessage,
} from "@/services/playgroup-chat";
import { getPlaygroup } from "@/services/playgroups";

const SAFETY_SYNC_MS = 3_000;

function valid(value: unknown, playgroupId: string): value is PlaygroupChatMessage {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PlaygroupChatMessage>;
  return item.playgroup_id === playgroupId && typeof item.id === "string" && typeof item.body === "string";
}

export default function FloatingPlaygroupChat({ playgroupId, onActivity }: { playgroupId: string; onActivity: () => Promise<void> }) {
  const { user } = useUser();
  const [messages, setMessages] = useState<PlaygroupChatMessage[]>([]);
  const [writable, setWritable] = useState(false);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLiveWarning, setShowLiveWarning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const renderedCountRef = useRef(0);
  const latestKnownIdRef = useRef<string | null>(null);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "auto") => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  const reconcileMessages = useCallback(async () => {
    try {
      const history = await getPlaygroupChatMessages(playgroupId);
      const latest = history.items.at(-1) ?? null;
      const previousLatestId = latestKnownIdRef.current;
      setMessages((current) => mergeChatMessages(current, history.items));
      if (latest) latestKnownIdRef.current = latest.id;
      if (latest && latest.id !== previousLatestId) {
        await markPlaygroupChatRead(playgroupId, latest.id).catch(() => undefined);
        await onActivity().catch(() => undefined);
      }
    } catch {
      // Keep rendered history. Realtime or the next safety sync will retry.
    }
  }, [onActivity, playgroupId]);

  useEffect(() => {
    let active = true;
    void Promise.all([getPlaygroup(playgroupId), getPlaygroupChatMessages(playgroupId), getPlaygroupChatState(playgroupId)]).then(([group, history]) => {
      if (!active) return;
      setWritable(group.status === "active" && (group.membership_state === "owner" || group.membership_state === "joined"));
      setMessages(history.items);
      setError(null);
      const latest = history.items.at(-1);
      latestKnownIdRef.current = latest?.id ?? null;
      if (latest) void markPlaygroupChatRead(playgroupId, latest.id).then(onActivity).catch(() => undefined);
    }).catch(() => { if (active) setError("Playgroup chat could not be loaded."); });
    return () => { active = false; };
  }, [onActivity, playgroupId]);

  useEffect(() => {
    if (!messages.length) return;
    const behavior: ScrollBehavior = renderedCountRef.current === 0 ? "auto" : "smooth";
    renderedCountRef.current = messages.length;
    scrollToLatest(behavior);
  }, [messages.length, scrollToLatest]);

  const realtimeEvents = useMemo(() => ({
    message: (payload: unknown) => {
      if (!valid(payload, playgroupId)) return;
      latestKnownIdRef.current = payload.id;
      setMessages((current) => mergeChatMessages(current, [payload]));
      void markPlaygroupChatRead(playgroupId, payload.id).then(onActivity).catch(() => undefined);
    },
    message_deleted: (payload: unknown) => {
      if (!valid(payload, playgroupId)) return;
      setMessages((current) => mergeChatMessages(current, [payload]));
    },
  }), [onActivity, playgroupId]);

  const realtimeStatus = useResilientPrivateBroadcastChannel({
    topic: `playgroup:${playgroupId}:chat`,
    userId: user?.id ?? null,
    enabled: Boolean(user),
    events: realtimeEvents,
    onSubscribed: () => { void reconcileMessages(); },
    onRecovery: () => { void reconcileMessages(); },
  });

  useEffect(() => {
    if (realtimeStatus === "connected" || realtimeStatus === "idle") {
      setShowLiveWarning(false);
      return;
    }
    const timer = window.setTimeout(() => setShowLiveWarning(true), 5_000);
    return () => window.clearTimeout(timer);
  }, [realtimeStatus]);

  useEffect(() => {
    if (!user) return;
    const syncIfVisible = () => {
      if (document.visibilityState === "visible") void reconcileMessages();
    };
    const timer = window.setInterval(syncIfVisible, SAFETY_SYNC_MS);
    document.addEventListener("visibilitychange", syncIfVisible);
    window.addEventListener("focus", syncIfVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", syncIfVisible);
      window.removeEventListener("focus", syncIfVisible);
    };
  }, [reconcileMessages, user]);

  async function send() {
    const body = value.trim();
    if (!body || sending || !writable) return;
    setSending(true);
    setError(null);
    try {
      const message = await sendPlaygroupChatMessage(playgroupId, body);
      latestKnownIdRef.current = message.id;
      setMessages((current) => mergeChatMessages(current, [message]));
      setValue("");
      await onActivity();
    } catch {
      setError("Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return <div className="flex h-full flex-col"><div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">{messages.map((message) => { const own = message.sender.id === user?.id; return <div key={message.id} className={`mb-2 flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}>{!own ? <Avatar className="h-7 w-7"><AvatarImage src={message.sender.avatar_url ?? undefined} alt="" /><AvatarFallback>{message.sender.nickname.slice(0,1).toUpperCase()}</AvatarFallback></Avatar> : null}<div className={`max-w-[78%] rounded-[18px] px-3 py-2 text-sm ${own ? "bg-primary text-primary-foreground" : "bg-secondary/75"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><time className={`mt-1 block text-[9px] ${own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div></div>; })}</div>{showLiveWarning ? <p className="px-3 py-1 text-xs text-muted-foreground">Reconnecting live messages…</p> : null}{error ? <p className="px-3 py-1 text-xs text-destructive">{error}</p> : null}{writable ? <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex items-end gap-2 border-t border-border/65 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"><textarea value={value} onChange={(event) => setValue(event.target.value)} rows={1} maxLength={2000} placeholder="Write to the Playgroup…" className="max-h-28 min-h-10 min-w-0 flex-1 resize-none rounded-[18px] border border-border-strong bg-surface px-3 py-2 text-sm outline-none" /><Button type="submit" size="icon" disabled={!value.trim() || sending} aria-label="Send message"><Send className="h-4 w-4" /></Button></form> : <p className="border-t border-border/65 p-3 text-xs text-muted-foreground">This chat is read-only.</p>}</div>;
}
