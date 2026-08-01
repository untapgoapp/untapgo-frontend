"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import PlaygroupChatHistory from "@/components/playgroups/PlaygroupChatHistory";
import PlaygroupChatStatus from "@/components/playgroups/PlaygroupChatStatus";
import usePlaygroupChatHistory from "@/components/playgroups/usePlaygroupChatHistory";
import usePlaygroupChatRealtime from "@/components/playgroups/usePlaygroupChatRealtime";
import {
  deletedChatMessage,
  isNearChatBottom,
  shouldMarkChatRead,
  type CommunicationMembershipState,
  type PlaygroupChatMessage as ChatMessage,
} from "@/lib/playgroup-communications";
import {
  deletePlaygroupChatMessage,
  markPlaygroupChatRead,
  sendPlaygroupChatMessage,
} from "@/services/playgroup-chat";

export default function PlaygroupChat({
  playgroupId,
  viewerId,
  membershipState,
  archived,
  chatStateLoaded,
  lastReadMessageId,
  onContractError,
  onMembershipCheck,
  onMarkedRead,
  onRefreshUnread,
}: {
  playgroupId: string;
  viewerId: string;
  membershipState: CommunicationMembershipState;
  archived: boolean;
  chatStateLoaded: boolean;
  lastReadMessageId: string | null;
  onContractError: (error: unknown) => void;
  onMembershipCheck: () => void;
  onMarkedRead: (messageId: string) => void;
  onRefreshUnread: () => void;
}) {
  const history = usePlaygroupChatHistory({ playgroupId, enabled: true, onContractError });
  const upsertMessage = history.upsert;
  const refreshLatest = history.refreshLatest;
  const [newMessages, setNewMessages] = useState(false);
  const [realtimeRetry, setRealtimeRetry] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nearBottomRef = useRef(true);
  const scrollAfterUpdateRef = useRef(false);
  const knownIdsRef = useRef(new Set<string>());
  const lastMarkedRef = useRef<string | null>(null);
  const initialScrollRevisionRef = useRef(0);
  const writable = !archived;

  useEffect(() => {
    knownIdsRef.current = new Set(history.items.map((message) => message.id));
  }, [history.items]);

  useEffect(() => {
    knownIdsRef.current.clear();
    lastMarkedRef.current = null;
    nearBottomRef.current = true;
    setNewMessages(false);
  }, [playgroupId]);

  useEffect(() => {
    lastMarkedRef.current = lastReadMessageId;
  }, [lastReadMessageId]);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
    nearBottomRef.current = true;
    setNewMessages(false);
  }, []);

  const handleRealtimeMessage = useCallback((message: ChatMessage) => {
    const isNew = !knownIdsRef.current.has(message.id);
    knownIdsRef.current.add(message.id);
    const shouldFollow = nearBottomRef.current;
    upsertMessage(message);
    if (!isNew) return;
    if (shouldFollow) scrollAfterUpdateRef.current = true;
    else {
      setNewMessages(true);
      onRefreshUnread();
    }
  }, [onRefreshUnread, upsertMessage]);

  const handleDeletedMessage = useCallback((message: ChatMessage) => {
    knownIdsRef.current.add(message.id);
    upsertMessage(deletedChatMessage(message));
  }, [upsertMessage]);

  const handleReconnect = useCallback(() => {
    void refreshLatest();
  }, [refreshLatest]);

  const realtimeStatus = usePlaygroupChatRealtime({
    playgroupId,
    viewerId,
    enabled: membershipState === "owner" || membershipState === "joined",
    retryKey: realtimeRetry,
    onMessage: handleRealtimeMessage,
    onDeleted: handleDeletedMessage,
    onReconnect: handleReconnect,
    onChannelFailure: onMembershipCheck,
  });

  useLayoutEffect(() => {
    if (history.initialRevision <= initialScrollRevisionRef.current || history.loading) return;
    initialScrollRevisionRef.current = history.initialRevision;
    scrollToLatest("auto");
  }, [history.initialRevision, history.loading, scrollToLatest]);

  useLayoutEffect(() => {
    if (!scrollAfterUpdateRef.current) return;
    scrollAfterUpdateRef.current = false;
    scrollToLatest("smooth");
  }, [history.items.length, scrollToLatest]);

  const markLatestRead = useCallback(() => {
    if (!chatStateLoaded) return;
    const latest = history.items.at(-1) ?? null;
    const container = scrollRef.current;
    const newestVisible = Boolean(container && isNearChatBottom(
      container.scrollHeight,
      container.scrollTop,
      container.clientHeight,
      40,
    ));
    if (!shouldMarkChatRead({
      active: true,
      newestVisible,
      latestMessageId: latest?.id ?? null,
      lastMarkedMessageId: lastMarkedRef.current,
    }) || !latest) return;

    lastMarkedRef.current = latest.id;
    void markPlaygroupChatRead(playgroupId, latest.id)
      .then(() => onMarkedRead(latest.id))
      .catch((error) => {
        if (lastMarkedRef.current === latest.id) lastMarkedRef.current = null;
        onContractError(error);
      });
  }, [chatStateLoaded, history.items, onContractError, onMarkedRead, playgroupId]);

  useEffect(() => {
    if (history.loading || history.items.length === 0) return;
    const frame = requestAnimationFrame(markLatestRead);
    return () => cancelAnimationFrame(frame);
  }, [history.items, history.loading, markLatestRead]);

  async function loadOlder() {
    const container = scrollRef.current;
    const anchor = container?.querySelector<HTMLElement>("[data-chat-message-id]") ?? null;
    const anchorId = anchor?.dataset.chatMessageId ?? null;
    const anchorOffset = anchor && container
      ? anchor.getBoundingClientRect().top - container.getBoundingClientRect().top
      : 0;
    const loaded = await history.loadOlder();
    if (!loaded || !container || !anchorId) return;
    requestAnimationFrame(() => {
      const nextAnchor = [...container.querySelectorAll<HTMLElement>("[data-chat-message-id]")]
        .find((message) => message.dataset.chatMessageId === anchorId);
      if (nextAnchor) {
        const nextOffset = nextAnchor.getBoundingClientRect().top - container.getBoundingClientRect().top;
        container.scrollTop += nextOffset - anchorOffset;
      }
    });
  }

  async function send(body: string) {
    try {
      const message = await sendPlaygroupChatMessage(playgroupId, body);
      knownIdsRef.current.add(message.id);
      scrollAfterUpdateRef.current = true;
      upsertMessage(message);
    } catch (error) {
      onContractError(error);
      throw error;
    }
  }

  async function remove(message: ChatMessage) {
    try {
      await deletePlaygroupChatMessage(playgroupId, message.id);
      upsertMessage(deletedChatMessage(message));
    } catch (error) {
      onContractError(error);
      throw error;
    }
  }

  return (
    <section aria-labelledby="playgroup-chat-title" className="py-6">
      <PlaygroupChatStatus archived={archived} realtimeStatus={realtimeStatus} refreshing={history.refreshing} onRefresh={() => { void history.refreshLatest(); setRealtimeRetry((value) => value + 1); }} />

      <PlaygroupChatHistory
        scrollRef={scrollRef}
        items={history.items}
        loading={history.loading}
        loadingOlder={history.loadingOlder}
        hasMore={history.hasMore}
        error={history.error}
        newMessages={newMessages}
        viewerId={viewerId}
        membershipState={membershipState}
        writable={writable}
        onScroll={(event) => {
          const element = event.currentTarget;
          const nearBottom = isNearChatBottom(element.scrollHeight, element.scrollTop, element.clientHeight);
          nearBottomRef.current = nearBottom;
          if (nearBottom) {
            setNewMessages(false);
            markLatestRead();
          }
        }}
        onLoadOlder={() => void loadOlder()}
        onRetryInitial={() => void history.retryInitial()}
        onDelete={remove}
        onSend={send}
        onShowLatest={() => { scrollToLatest(); requestAnimationFrame(markLatestRead); }}
      />
    </section>
  );
}
