"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

import {
  createWallFeedState,
  wallFeedReducer,
  type PlaygroupPost,
} from "@/lib/playgroup-communications";
import { getPlaygroupPosts } from "@/services/playgroup-wall";

export default function usePlaygroupWallFeed({
  playgroupId,
  enabled,
  onContractError,
}: {
  playgroupId: string;
  enabled: boolean;
  onContractError: (error: unknown) => void;
}) {
  const scope = `wall:${playgroupId}`;
  const [state, dispatch] = useReducer(wallFeedReducer, undefined, () => createWallFeedState(scope, enabled));
  const sequence = useRef(0);

  const requestPage = useCallback(async (page: number) => {
    if (!enabled) return false;
    const requestId = ++sequence.current;
    dispatch({ type: "request_started", scope, page, requestId });
    try {
      const response = await getPlaygroupPosts(playgroupId, page);
      if (sequence.current !== requestId) return false;
      dispatch({ type: "request_succeeded", requestId, response });
      return true;
    } catch (error) {
      if (sequence.current !== requestId) return false;
      onContractError(error);
      dispatch({ type: "request_failed", requestId, page });
      return false;
    }
  }, [enabled, onContractError, playgroupId, scope]);

  useEffect(() => {
    const requestId = ++sequence.current;
    dispatch({ type: "reset", scope, enabled, requestId });
    if (enabled) void requestPage(1);
    return () => { sequence.current += 1; };
  }, [enabled, requestPage, scope]);

  const upsertPost = useCallback((post: PlaygroupPost) => {
    dispatch({ type: "post_upserted", post });
  }, []);

  const changePost = useCallback((id: string, update: (post: PlaygroupPost) => PlaygroupPost) => {
    dispatch({ type: "post_changed", id, update });
  }, []);

  return {
    state,
    upsertPost,
    changePost,
    retry: () => requestPage(state.failedPage ?? 1),
    loadMore: () => requestPage(state.page + 1),
    refresh: () => requestPage(1),
  };
}
