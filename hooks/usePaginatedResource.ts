"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PagedResponse<T> = {
  items: T[];
  page: number;
  page_size: number;
  has_more: boolean;
};

type PageState<T> = {
  items: T[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  response: PagedResponse<T> | null;
};

const emptyState = <T,>(): PageState<T> => ({
  items: [], page: 0, hasMore: false, loading: true,
  loadingMore: false, error: null, response: null,
});

function mergeUnique<T>(current: T[], incoming: T[], identity: (item: T) => string): T[] {
  const result = new Map<string, T>();
  for (const item of [...current, ...incoming]) result.set(identity(item), item);
  return [...result.values()];
}

export default function usePaginatedResource<T>(
  scope: string,
  loader: (page: number) => Promise<PagedResponse<T>>,
  identity: (item: T) => string,
) {
  const [state, setState] = useState<PageState<T>>(emptyState);
  const sequence = useRef(0);
  const mounted = useRef(true);
  const activeScope = useRef(scope);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const requestPage = useCallback(async (page: number) => {
    const requestId = ++sequence.current;
    const changed = activeScope.current !== scope;
    activeScope.current = scope;
    setState((current) => ({
      ...(changed || page === 1 ? emptyState<T>() : current),
      loading: page === 1,
      loadingMore: page > 1,
      error: null,
    }));

    try {
      const response = await loader(page);
      if (!mounted.current || requestId !== sequence.current) return;
      setState((current) => ({
        items: mergeUnique(page > 1 ? current.items : [], response.items, identity),
        page: response.page,
        hasMore: response.has_more,
        loading: false,
        loadingMore: false,
        error: null,
        response,
      }));
    } catch {
      if (!mounted.current || requestId !== sequence.current) return;
      setState((current) => ({
        ...current, loading: false, loadingMore: false,
        error: "This section could not be loaded.",
      }));
    }
  }, [identity, loader, scope]);

  useEffect(() => { void requestPage(1); }, [requestPage]);

  const updateItems = useCallback((updater: (items: T[]) => T[]) => {
    setState((current) => ({ ...current, items: updater(current.items) }));
  }, []);

  return {
    ...state,
    loadMore: () => requestPage(state.page + 1),
    retry: () => requestPage(state.page || 1),
    refresh: () => requestPage(1),
    updateItems,
  };
}
