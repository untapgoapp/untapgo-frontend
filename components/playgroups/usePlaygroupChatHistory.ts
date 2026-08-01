"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { mergeChatMessages, type PlaygroupChatMessage } from "@/lib/playgroup-communications";
import { getPlaygroupChatMessages } from "@/services/playgroup-chat";

export default function usePlaygroupChatHistory({
  playgroupId,
  enabled,
  onContractError,
}: {
  playgroupId: string;
  enabled: boolean;
  onContractError: (error: unknown) => void;
}) {
  const [items, setItems] = useState<PlaygroupChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<"initial" | "older" | "refresh" | null>(null);
  const [initialRevision, setInitialRevision] = useState(0);
  const sequence = useRef(0);
  const olderBusy = useRef(false);
  const refreshBusy = useRef(false);

  const loadInitial = useCallback(async () => {
    if (!enabled) return false;
    const requestId = ++sequence.current;
    setLoading(true);
    setError(null);
    try {
      const response = await getPlaygroupChatMessages(playgroupId);
      if (sequence.current !== requestId) return false;
      setItems((current) => mergeChatMessages(current, response.items));
      setHasMore(response.has_more);
      setNextBefore(response.next_before ?? null);
      setInitialRevision((current) => current + 1);
      return true;
    } catch (caught) {
      if (sequence.current !== requestId) return false;
      onContractError(caught);
      setError("initial");
      return false;
    } finally {
      if (sequence.current === requestId) setLoading(false);
    }
  }, [enabled, onContractError, playgroupId]);

  useEffect(() => {
    sequence.current += 1;
    olderBusy.current = false;
    refreshBusy.current = false;
    setItems([]);
    setHasMore(false);
    setNextBefore(null);
    setError(null);
    setLoading(enabled);
    if (enabled) void loadInitial();
    return () => { sequence.current += 1; };
  }, [enabled, loadInitial, playgroupId]);

  const loadOlder = useCallback(async () => {
    if (!enabled || !hasMore || !nextBefore || olderBusy.current) return false;
    olderBusy.current = true;
    setLoadingOlder(true);
    setError(null);
    const requestId = sequence.current;
    try {
      const response = await getPlaygroupChatMessages(playgroupId, nextBefore);
      if (sequence.current !== requestId) return false;
      setItems((current) => mergeChatMessages(response.items, current));
      setHasMore(response.has_more);
      setNextBefore(response.next_before ?? null);
      return true;
    } catch (caught) {
      if (sequence.current !== requestId) return false;
      onContractError(caught);
      setError("older");
      return false;
    } finally {
      olderBusy.current = false;
      if (sequence.current === requestId) setLoadingOlder(false);
    }
  }, [enabled, hasMore, nextBefore, onContractError, playgroupId]);

  const refreshLatest = useCallback(async () => {
    if (!enabled || refreshBusy.current) return false;
    refreshBusy.current = true;
    setRefreshing(true);
    const requestId = sequence.current;
    try {
      const response = await getPlaygroupChatMessages(playgroupId);
      if (sequence.current !== requestId) return false;
      setItems((current) => mergeChatMessages(current, response.items));
      setError((current) => current === "refresh" || current === "initial" ? null : current);
      return true;
    } catch (caught) {
      if (sequence.current !== requestId) return false;
      onContractError(caught);
      setError("refresh");
      return false;
    } finally {
      refreshBusy.current = false;
      if (sequence.current === requestId) setRefreshing(false);
    }
  }, [enabled, onContractError, playgroupId]);

  const upsert = useCallback((message: PlaygroupChatMessage) => {
    setItems((current) => mergeChatMessages(current, [message]));
  }, []);

  return {
    items,
    hasMore,
    loading,
    loadingOlder,
    refreshing,
    error,
    initialRevision,
    upsert,
    retryInitial: loadInitial,
    loadOlder,
    refreshLatest,
  };
}
