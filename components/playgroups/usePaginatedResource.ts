"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createPaginatedState,
  paginatedReducer,
  type PaginatedResponse,
  type PaginatedState,
} from "@/lib/playgroups";

export default function usePaginatedResource<T extends { id: string }>(
  scope: string,
  load: (page: number) => Promise<PaginatedResponse<T>>,
) {
  const [state, setState] = useState<PaginatedState<T>>(() => createPaginatedState(scope));
  const sequence = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const requestPage = useCallback(async (page: number) => {
    const requestId = ++sequence.current;
    setState((current) => paginatedReducer(current, {
      type: "request_started",
      scope,
      page,
      requestId,
    }));

    try {
      const response = await load(page);
      if (!mounted.current) return;
      setState((current) => paginatedReducer(current, {
        type: "request_succeeded",
        requestId,
        response,
      }));
    } catch {
      if (!mounted.current) return;
      setState((current) => paginatedReducer(current, {
        type: "request_failed",
        requestId,
        page,
      }));
    }
  }, [load, scope]);

  useEffect(() => {
    void requestPage(1);
  }, [requestPage]);

  const invalidate = useCallback((nextScope: string) => {
    const requestId = ++sequence.current;
    setState((current) => paginatedReducer(current, {
      type: "scope_changed",
      scope: nextScope,
      requestId,
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setState((current) => paginatedReducer(current, { type: "item_removed", id }));
  }, []);

  return {
    state,
    requestPage,
    invalidate,
    removeItem,
    retry: () => requestPage(state.failedPage ?? 1),
    loadMore: () => requestPage(state.page + 1),
  };
}
