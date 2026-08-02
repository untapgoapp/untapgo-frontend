"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  mergeSocialPosts,
  replaceSocialPost,
  type SocialFeedView,
  type SocialPost,
} from "@/lib/social-feed";
import {
  createSocialPost,
  deleteSocialPost,
  getSocialFeed,
} from "@/services/social";

export default function useSocialFeed(view: SocialFeedView) {
  const [items, setItems] = useState<SocialPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async (pageNumber: number, replace: boolean) => {
    const currentRequest = ++requestId.current;
    if (replace) {
      setLoading(true);
      setError(false);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await getSocialFeed(view, pageNumber);
      if (currentRequest !== requestId.current) return;

      setItems((current) => (
        replace ? response.items : mergeSocialPosts(current, response.items)
      ));
      setPage(response.page);
      setHasMore(response.has_more);
    } catch {
      if (currentRequest !== requestId.current) return;
      setError(true);
      if (replace) setItems([]);
    } finally {
      if (currentRequest !== requestId.current) return;
      setLoading(false);
      setLoadingMore(false);
    }
  }, [view]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(false);
    void load(1, true);

    return () => {
      requestId.current += 1;
    };
  }, [load]);

  const create = useCallback(async (body: string) => {
    const post = await createSocialPost(body);
    setItems((current) => [post, ...current.filter((item) => item.id !== post.id)]);
    return post;
  }, []);

  const update = useCallback((post: SocialPost) => {
    setItems((current) => replaceSocialPost(current, post));
  }, []);

  const remove = useCallback(async (postId: string) => {
    let removed: SocialPost | undefined;
    let removedIndex = -1;

    setItems((current) => {
      removedIndex = current.findIndex((post) => post.id === postId);
      removed = removedIndex >= 0 ? current[removedIndex] : undefined;
      return current.filter((post) => post.id !== postId);
    });

    try {
      await deleteSocialPost(postId);
    } catch (cause) {
      if (removed) {
        setItems((current) => {
          if (current.some((post) => post.id === postId)) return current;
          const next = [...current];
          next.splice(Math.max(0, removedIndex), 0, removed!);
          return next;
        });
      }
      throw cause;
    }
  }, []);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    create,
    update,
    remove,
    retry: () => load(1, true),
    loadMore: () => {
      if (!loadingMore && hasMore) void load(page + 1, false);
    },
  };
}
