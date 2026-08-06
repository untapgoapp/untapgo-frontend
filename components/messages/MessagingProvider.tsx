"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";

import MessagingDock from "@/components/messages/MessagingDock";
import type { BinderTradeThread } from "@/lib/binder";
import type { DirectConversation } from "@/lib/direct-messages";
import {
  ACTIVE_CONVERSATION_STORAGE_KEY,
  MESSAGING_REFRESH_REQUESTED_EVENT,
  conversationKey,
  parseConversationTarget,
  type ActiveConversation,
  type ConversationSummary,
} from "@/lib/messaging";
import type { PlaygroupListItem } from "@/lib/playgroups";
import { supabase } from "@/lib/supabase/client";
import { binderApi } from "@/services/binder";
import { directMessagesApi } from "@/services/direct-messages";
import {
  getPlaygroupChatMessages,
  getPlaygroupChatState,
} from "@/services/playgroup-chat";
import { getMyPlaygroups } from "@/services/playgroups";

type MessagingContextValue = {
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  conversations: ConversationSummary[];
  unreadCount: number;
  activeConversation: ActiveConversation | null;
  minimized: boolean;
  refresh: () => Promise<void>;
  openConversation: (conversation: ActiveConversation | ConversationSummary) => void;
  closeConversation: () => void;
  minimizeConversation: () => void;
  restoreConversation: () => void;
};

const noop = async () => {};
const MessagingContext = createContext<MessagingContextValue>({
  authenticated: false,
  loading: true,
  error: null,
  conversations: [],
  unreadCount: 0,
  activeConversation: null,
  minimized: false,
  refresh: noop,
  openConversation: () => undefined,
  closeConversation: () => undefined,
  minimizeConversation: () => undefined,
  restoreConversation: () => undefined,
});

export function useMessaging(): MessagingContextValue {
  return useContext(MessagingContext);
}

function directSummary(item: DirectConversation): ConversationSummary {
  return {
    key: conversationKey("direct", item.id),
    kind: "direct",
    id: item.id,
    title: item.other_user.nickname,
    subtitle: item.last_message?.body ?? "Start a conversation",
    avatarUrl: item.other_user.avatar_url,
    href: `/messages/${encodeURIComponent(item.id)}`,
    unreadCount: item.unread_count,
    updatedAt: item.last_message?.created_at ?? item.updated_at,
  };
}

function tradeSummary(item: BinderTradeThread): ConversationSummary {
  return {
    key: conversationKey("trade", item.id),
    kind: "trade",
    id: item.id,
    title: item.binder_item.printed_name || item.binder_item.card_name,
    subtitle: item.last_message?.body ?? `Trade with ${item.other_user.nickname}`,
    avatarUrl: item.other_user.avatar_url ?? null,
    href: `/trades/${encodeURIComponent(item.id)}`,
    unreadCount: item.unread_count,
    updatedAt: item.last_message?.created_at ?? item.updated_at,
  };
}

async function playgroupSummary(item: PlaygroupListItem): Promise<ConversationSummary> {
  const [state, history] = await Promise.all([
    getPlaygroupChatState(item.id),
    getPlaygroupChatMessages(item.id).catch(() => ({ items: [], has_more: false, next_before: null })),
  ]);
  const latest = history.items.at(-1);
  return {
    key: conversationKey("playgroup", item.id),
    kind: "playgroup",
    id: item.id,
    title: item.name,
    subtitle: latest ? `${latest.sender.nickname}: ${latest.body}` : "Playgroup chat",
    avatarUrl: item.avatar_url ?? null,
    href: `/playgroups/${encodeURIComponent(item.id)}?section=chat`,
    unreadCount: state.unread_count,
    updatedAt: latest?.created_at ?? "1970-01-01T00:00:00.000Z",
  };
}

function sortConversations(items: ConversationSummary[]): ConversationSummary[] {
  return [...items].sort((left, right) => {
    const time = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
    return time || left.title.localeCompare(right.title);
  });
}

export default function MessagingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);
  const [minimized, setMinimized] = useState(false);
  const refreshRevision = useRef(0);
  const consumedChatTarget = useRef<string | null>(null);
  const userId = session?.user.id ?? null;

  const refresh = useCallback(async () => {
    if (!userId) return;
    const revision = ++refreshRevision.current;
    try {
      const [directResult, tradeResult, ownedResult, joinedResult] = await Promise.allSettled([
        directMessagesApi.conversations(1, 20),
        binderApi.trades(1, "active"),
        getMyPlaygroups("owned", 1),
        getMyPlaygroups("joined", 1),
      ]);
      if (revision !== refreshRevision.current) return;

      const next: ConversationSummary[] = [];
      if (directResult.status === "fulfilled") next.push(...directResult.value.items.map(directSummary));
      if (tradeResult.status === "fulfilled") next.push(...tradeResult.value.items.map(tradeSummary));

      const groups = new Map<string, PlaygroupListItem>();
      if (ownedResult.status === "fulfilled") {
        for (const item of ownedResult.value.items) groups.set(item.id, item);
      }
      if (joinedResult.status === "fulfilled") {
        for (const item of joinedResult.value.items) groups.set(item.id, item);
      }
      const groupSummaries = await Promise.allSettled([...groups.values()].slice(0, 12).map(playgroupSummary));
      if (revision !== refreshRevision.current) return;
      for (const item of groupSummaries) {
        if (item.status === "fulfilled") next.push(item.value);
      }

      setConversations(sortConversations(next));
      setError(null);
    } catch {
      if (revision === refreshRevision.current) setError("Messages could not be refreshed.");
    } finally {
      if (revision === refreshRevision.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setAuthReady(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    refreshRevision.current += 1;
    setConversations([]);
    setError(null);
    setLoading(Boolean(userId));
    if (userId) void refresh();
  }, [refresh, userId]);

  useEffect(() => {
    if (!userId || !session) return;
    let stopped = false;
    let channel: RealtimeChannel | null = null;

    void (async () => {
      await supabase.realtime.setAuth(session.access_token);
      if (stopped) return;
      channel = supabase.channel(`user:${userId}:conversations`, {
        config: { private: true, broadcast: { ack: false, self: false } },
      });
      channel
        .on("broadcast", { event: "conversation_updated" }, () => {
          if (!stopped) void refresh();
        })
        .subscribe((status) => {
          if (!stopped && status === "SUBSCRIBED") void refresh();
        });
    })().catch(() => {
      if (!stopped) setError("Live message updates are unavailable.");
    });

    return () => {
      stopped = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [refresh, session, userId]);

  useEffect(() => {
    const requestRefresh = () => { void refresh(); };
    window.addEventListener(MESSAGING_REFRESH_REQUESTED_EVENT, requestRefresh);
    return () => window.removeEventListener(MESSAGING_REFRESH_REQUESTED_EVENT, requestRefresh);
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeConversation && !minimized) {
      window.localStorage.setItem(
        ACTIVE_CONVERSATION_STORAGE_KEY,
        conversationKey(activeConversation.kind, activeConversation.id),
      );
    } else {
      window.localStorage.removeItem(ACTIVE_CONVERSATION_STORAGE_KEY);
    }
    return () => window.localStorage.removeItem(ACTIVE_CONVERSATION_STORAGE_KEY);
  }, [activeConversation, minimized]);

  useEffect(() => {
    if (!authReady || !userId || typeof window === "undefined") return;
    const rawTarget = new URLSearchParams(window.location.search).get("chat");
    if (!rawTarget || consumedChatTarget.current === rawTarget) return;
    const target = parseConversationTarget(rawTarget);
    if (!target) return;
    consumedChatTarget.current = rawTarget;
    const known = conversations.find((item) => item.kind === target.kind && item.id === target.id);
    setActiveConversation(known ?? target);
    setMinimized(false);
  }, [authReady, conversations, pathname, userId]);

  const openConversation = useCallback((conversation: ActiveConversation | ConversationSummary) => {
    setActiveConversation({
      kind: conversation.kind,
      id: conversation.id,
      title: conversation.title,
      avatarUrl: conversation.avatarUrl,
      href: conversation.href,
    });
    setMinimized(false);
  }, []);

  const closeConversation = useCallback(() => {
    setActiveConversation(null);
    setMinimized(false);
    void refresh();
  }, [refresh]);

  const value = useMemo<MessagingContextValue>(() => ({
    authenticated: Boolean(session),
    loading: !authReady || loading,
    error,
    conversations,
    unreadCount: conversations.reduce((total, item) => total + item.unreadCount, 0),
    activeConversation,
    minimized,
    refresh,
    openConversation,
    closeConversation,
    minimizeConversation: () => setMinimized(true),
    restoreConversation: () => setMinimized(false),
  }), [activeConversation, authReady, closeConversation, conversations, error, loading, minimized, openConversation, refresh, session]);

  return (
    <MessagingContext.Provider value={value}>
      {children}
      <MessagingDock />
    </MessagingContext.Provider>
  );
}
