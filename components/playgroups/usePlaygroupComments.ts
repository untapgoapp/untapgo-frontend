"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { mergeComments, type PlaygroupComment } from "@/lib/playgroup-communications";
import { getPlaygroupPostComments } from "@/services/playgroup-wall";

type CommentStatus = "idle" | "loading" | "loading_more" | "ready" | "error";

export default function usePlaygroupComments({
  playgroupId,
  postId,
  enabled,
  onContractError,
}: {
  playgroupId: string;
  postId: string;
  enabled: boolean;
  onContractError: (error: unknown) => void;
}) {
  const [items, setItems] = useState<PlaygroupComment[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState<CommentStatus>("idle");
  const [failedPage, setFailedPage] = useState<number | null>(null);
  const sequence = useRef(0);

  const requestPage = useCallback(async (nextPage: number) => {
    if (!enabled) return false;
    const requestId = ++sequence.current;
    setStatus(nextPage === 1 ? "loading" : "loading_more");
    setFailedPage(null);
    try {
      const response = await getPlaygroupPostComments(playgroupId, postId, nextPage);
      if (sequence.current !== requestId) return false;
      setItems((current) => mergeComments(nextPage > 1 ? current : [], response.items));
      setPage(response.page);
      setHasMore(response.has_more);
      setStatus("ready");
      return true;
    } catch (error) {
      if (sequence.current !== requestId) return false;
      onContractError(error);
      setFailedPage(nextPage);
      setStatus("error");
      return false;
    }
  }, [enabled, onContractError, playgroupId, postId]);

  useEffect(() => {
    sequence.current += 1;
    setItems([]);
    setPage(0);
    setHasMore(false);
    setFailedPage(null);
    setStatus(enabled ? "loading" : "idle");
    if (enabled) void requestPage(1);
    return () => { sequence.current += 1; };
  }, [enabled, requestPage]);

  return {
    items,
    page,
    hasMore,
    status,
    upsert: (comment: PlaygroupComment) => setItems((current) => mergeComments(current, [comment])),
    retry: () => requestPage(failedPage ?? 1),
    loadMore: () => requestPage(page + 1),
  };
}
