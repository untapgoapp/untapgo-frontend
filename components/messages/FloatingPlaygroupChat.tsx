"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { mergeChatMessages, type PlaygroupChatMessage } from "@/lib/playgroup-communications";
import { supabase } from "@/lib/supabase/client";
import {
  getPlaygroupChatMessages,
  getPlaygroupChatState,
  markPlaygroupChatRead,
  sendPlaygroupChatMessage,
} from "@/services/playgroup-chat";
import { getPlaygroup } from "@/services/playgroups";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([getPlaygroup(playgroupId), getPlaygroupChatMessages(playgroupId), getPlaygroupChatState(playgroupId)]).then(([group, history]) => {
      if (!active) return;
      setWritable(group.status === "active" && (group.membership_state === "owner" || group.membership_state === "joined"));
      setMessages(history.items);
      const latest = history.items.at(-1);
      if (latest) void markPlaygroupChatRead(playgroupId, latest.id).then(onActivity).catch(() => undefined);
      requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
    }).catch(() => { if (active) setError("Playgroup chat could not be loaded."); });
    return () => { active = false; };
  }, [onActivity, playgroupId]);

  useEffect(() => {
    let stopped = false;
    const channel = supabase.channel(`playgroup:${playgroupId}:chat`, { config: { private: true, broadcast: { ack: false, self: false } } });
    void supabase.auth.getSession().then(async ({ data }) => {
      if (stopped || !data.session) return;
      await supabase.realtime.setAuth(data.session.access_token);
      channel.on("broadcast", { event: "message" }, ({ payload }) => {
        if (stopped || !valid(payload, playgroupId)) return;
        setMessages((current) => mergeChatMessages(current, [payload]));
        requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }));
        void markPlaygroupChatRead(playgroupId, payload.id).then(onActivity).catch(() => undefined);
      }).on("broadcast", { event: "message_deleted" }, ({ payload }) => {
        if (!stopped && valid(payload, playgroupId)) setMessages((current) => mergeChatMessages(current, [payload]));
      }).subscribe((status) => {
        if (!stopped && status === "SUBSCRIBED") void getPlaygroupChatMessages(playgroupId).then((history) => setMessages((current) => mergeChatMessages(current, history.items)));
      });
    });
    return () => { stopped = true; void supabase.removeChannel(channel); };
  }, [onActivity, playgroupId]);

  async function send() {
    const body = value.trim();
    if (!body || sending || !writable) return;
    setSending(true);
    try {
      const message = await sendPlaygroupChatMessage(playgroupId, body);
      setMessages((current) => mergeChatMessages(current, [message]));
      setValue("");
      await onActivity();
    } catch {
      setError("Message could not be sent.");
    } finally {
      setSending(false);
    }
  }

  return <div className="flex h-full flex-col"><div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-3">{messages.map((message) => { const own = message.sender.id === user?.id; return <div key={message.id} className={`mb-2 flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}>{!own ? <Avatar className="h-7 w-7"><AvatarImage src={message.sender.avatar_url ?? undefined} alt="" /><AvatarFallback>{message.sender.nickname.slice(0,1).toUpperCase()}</AvatarFallback></Avatar> : null}<div className={`max-w-[78%] rounded-[18px] px-3 py-2 text-sm ${own ? "bg-primary text-primary-foreground" : "bg-secondary/75"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p><time className={`mt-1 block text-[9px] ${own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div></div>; })}</div>{error ? <p className="px-3 py-1 text-xs text-destructive">{error}</p> : null}{writable ? <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex items-end gap-2 border-t border-border/65 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"><textarea value={value} onChange={(event) => setValue(event.target.value)} rows={1} maxLength={2000} placeholder="Write to the Playgroup…" className="max-h-28 min-h-10 min-w-0 flex-1 resize-none rounded-[18px] border border-border-strong bg-surface px-3 py-2 text-sm outline-none" /><Button type="submit" size="icon" disabled={!value.trim() || sending} aria-label="Send message"><Send className="h-4 w-4" /></Button></form> : <p className="border-t border-border/65 p-3 text-xs text-muted-foreground">This chat is read-only.</p>}</div>;
}
