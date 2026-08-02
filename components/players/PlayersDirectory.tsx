"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPlayerDirectoryEmptyCopy,
  initialPlayerDirectoryState,
  playerDirectoryReducer,
  shouldRemovePlayerAfterRelationship,
  type PlayerDirectoryItem,
  type PlayersView,
} from "@/lib/player-directory";
import { updateProfileFollowing } from "@/lib/profile-follow";
import { supabase } from "@/lib/supabase/client";
import {
  BLOCKED_PROFILES_CHANGED_EVENT,
  followProfile,
  getPlayersSection,
  unfollowProfile,
} from "@/services/profiles";

import PlayerDirectoryRow from "./PlayerDirectoryRow";

const SEARCH_DELAY_MS = 350;

export default function PlayersDirectory({ view }: { view: PlayersView }) {
  const [inputValue, setInputValue] = useState("");
  const [state, dispatch] = useReducer(playerDirectoryReducer, initialPlayerDirectoryState);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const requestSequence = useRef(0);
  const viewerId = useRef<string | null>(null);
  const busyIdsRef = useRef(new Set<string>());
  const searchReady = useRef(false);
  const mounted = useRef(true);

  const requestPage = useCallback(async (query: string, page: number, userId: string) => {
    const requestId = ++requestSequence.current;
    dispatch({ type: "request_started", query, page, requestId });
    try {
      const response = await getPlayersSection({ view, currentUserId: userId, query, page });
      if (mounted.current) dispatch({ type: "request_succeeded", requestId, response });
    } catch {
      if (mounted.current) dispatch({ type: "request_failed", requestId, page });
    }
  }, [view]);

  useEffect(() => {
    mounted.current = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted.current) return;
      if (error || !data.user) {
        const requestId = ++requestSequence.current;
        dispatch({ type: "request_started", query: "", page: 1, requestId });
        dispatch({ type: "request_failed", requestId, page: 1 });
        return;
      }
      viewerId.current = data.user.id;
      void requestPage("", 1, data.user.id);
    });
    return () => {
      mounted.current = false;
      requestSequence.current += 1;
    };
  }, [requestPage]);

  useEffect(() => {
    if (!searchReady.current) {
      searchReady.current = true;
      return;
    }
    const timeout = window.setTimeout(() => {
      if (viewerId.current) void requestPage(inputValue.trim(), 1, viewerId.current);
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [inputValue, requestPage]);

  useEffect(() => {
    const refreshAfterBlock = (event: Event) => {
      const detail = event instanceof CustomEvent
        ? event.detail as { profileId?: string; blocked?: boolean }
        : null;
      if (detail?.blocked && detail.profileId) {
        dispatch({ type: "player_removed", playerId: detail.profileId });
      }
      if (viewerId.current) void requestPage(inputValue.trim(), 1, viewerId.current);
    };
    window.addEventListener(BLOCKED_PROFILES_CHANGED_EVENT, refreshAfterBlock);
    return () => window.removeEventListener(BLOCKED_PROFILES_CHANGED_EVENT, refreshAfterBlock);
  }, [inputValue, requestPage]);

  function updateSearch(value: string) {
    setInputValue(value);
    dispatch({ type: "query_changed", query: value, requestId: ++requestSequence.current });
  }

  async function toggleRelationship(player: PlayerDirectoryItem) {
    if (busyIdsRef.current.has(player.id)) return;
    busyIdsRef.current.add(player.id);
    setBusyIds((current) => new Set(current).add(player.id));
    setRowErrors((current) => ({ ...current, [player.id]: "" }));
    const previousIndex = state.items.findIndex((item) => item.id === player.id);
    const optimistic = updateProfileFollowing(player.relationship, !player.relationship.is_following);
    dispatch({
      type: "player_changed", playerId: player.id, relationship: optimistic,
      remove: shouldRemovePlayerAfterRelationship(view, optimistic),
    });
    try {
      const result = player.relationship.is_following
        ? await unfollowProfile(player.id)
        : await followProfile(player.id);
      const confirmed = updateProfileFollowing(player.relationship, result.is_following);
      dispatch({
        type: "player_changed", playerId: player.id, relationship: confirmed,
        remove: shouldRemovePlayerAfterRelationship(view, confirmed),
      });
    } catch {
      dispatch({ type: "player_restored", player, index: previousIndex });
      setRowErrors((current) => ({ ...current, [player.id]: "Follow could not be updated. Try again." }));
    } finally {
      busyIdsRef.current.delete(player.id);
      setBusyIds((current) => {
        const next = new Set(current);
        next.delete(player.id);
        return next;
      });
    }
  }

  const initialLoading = state.items.length === 0 && (state.status === "loading" || state.status === "debouncing");
  const emptyCopy = getPlayerDirectoryEmptyCopy(view, state.query);

  return (
    <>
      <section aria-labelledby="player-search-label" className="py-4">
        <label id="player-search-label" htmlFor="player-search" className="text-sm font-semibold text-muted-foreground">Search players</label>
        <div className="relative mt-2 max-w-xl">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-quiet-foreground" aria-hidden="true" />
          <Input id="player-search" type="search" value={inputValue} onChange={(event) => updateSearch(event.target.value)} placeholder="Search by nickname" autoComplete="off" className="pl-10 pr-11" />
          {inputValue ? <Button type="button" variant="ghost" size="icon-xs" onClick={() => updateSearch("")} aria-label="Clear player search" className="absolute right-1.5 top-1/2 -translate-y-1/2"><X size={16} aria-hidden="true" /></Button> : null}
        </div>
      </section>

      <section aria-label="Player results" aria-busy={initialLoading || state.status === "loading_more"} className="py-3">
        {initialLoading ? <LoadingRows /> : null}
        {state.items.length ? (
          <div className="grid gap-x-4 gap-y-1 md:grid-cols-2">
            {state.items.map((player) => (
              <PlayerDirectoryRow key={player.id} player={player} busy={busyIds.has(player.id)} error={rowErrors[player.id]} onToggle={toggleRelationship} />
            ))}
          </div>
        ) : null}
        {state.status === "ready" && !state.items.length ? <div className="rounded-surface bg-surface-subtle px-4 py-5"><h2 className="text-sm font-bold">{emptyCopy.title}</h2><p className="mt-1 text-sm text-muted-foreground">{emptyCopy.detail}</p></div> : null}
        {state.status === "error" ? <div role="alert" className="rounded-surface bg-destructive-subtle px-4 py-4"><p className="text-sm font-bold text-destructive">This section could not be loaded.</p><Button type="button" onClick={() => viewerId.current && void requestPage(state.query, state.failedPage ?? 1, viewerId.current)} size="sm" className="mt-3">Retry</Button></div> : null}
        {state.hasMore && state.status !== "error" ? <div className="pt-5 text-center"><Button type="button" variant="outline" onClick={() => viewerId.current && void requestPage(state.query, state.page + 1, viewerId.current)} disabled={state.status === "loading_more"}>{state.status === "loading_more" ? "Loading players..." : "Load more"}</Button></div> : null}
      </section>
    </>
  );
}

function LoadingRows() {
  return <div className="grid gap-1 md:grid-cols-2">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-row bg-surface/40" />)}</div>;
}
