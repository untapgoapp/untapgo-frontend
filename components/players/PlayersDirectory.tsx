"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { Search, X } from "lucide-react";

import PlayerDirectoryRow from "@/components/players/PlayerDirectoryRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPlayerDirectoryEmptyCopy,
  initialPlayerDirectoryState,
  playerDirectoryReducer,
} from "@/lib/player-directory";
import { getPlayerDirectory } from "@/services/profiles";

const SEARCH_DELAY_MS = 350;

function renderLoadingRows() {
  return Array.from({ length: 6 }, (_, index) => (
    <div key={index} className="flex min-h-[88px] animate-pulse items-center gap-3 rounded-row bg-surface/35 px-4 py-3.5">
      <div className="h-12 w-12 rounded-full bg-secondary" />
      <div className="min-w-0 flex-1">
        <div className="h-4 w-2/5 rounded bg-black/10" />
        <div className="mt-2 h-3 w-4/5 rounded bg-black/[0.06]" />
      </div>
    </div>
  ));
}

export default function PlayersDirectory() {
  const [inputValue, setInputValue] = useState("");
  const [state, dispatch] = useReducer(
    playerDirectoryReducer,
    initialPlayerDirectoryState,
  );
  const requestSequence = useRef(0);
  const searchEffectReady = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const requestPage = useCallback(async (query: string, page: number) => {
    const requestId = ++requestSequence.current;
    dispatch({ type: "request_started", query, page, requestId });

    try {
      const response = await getPlayerDirectory({ query, page });
      if (!mounted.current) return;
      dispatch({ type: "request_succeeded", requestId, response });
    } catch {
      if (!mounted.current) return;
      dispatch({ type: "request_failed", requestId, page });
    }
  }, []);

  useEffect(() => {
    void requestPage("", 1);
  }, [requestPage]);

  useEffect(() => {
    if (!searchEffectReady.current) {
      searchEffectReady.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      void requestPage(inputValue.trim(), 1);
    }, SEARCH_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [inputValue, requestPage]);

  const initialLoading =
    state.items.length === 0 &&
    (state.status === "loading" || state.status === "debouncing");
  const emptyCopy = getPlayerDirectoryEmptyCopy(state.query);

  function updateSearch(value: string) {
    setInputValue(value);
    const requestId = ++requestSequence.current;
    dispatch({ type: "query_changed", query: value, requestId });
  }

  function clearSearch() {
    if (inputValue) updateSearch("");
  }

  function retry() {
    void requestPage(state.query, state.failedPage ?? 1);
  }

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[1050px]">
        <header className="pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Community</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.035em]">Players</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Find other Magic players on UntapGo.</p>
        </header>

        <section aria-labelledby="player-search-label" className="py-5">
          <label id="player-search-label" htmlFor="player-search" className="text-sm font-semibold text-muted-foreground">
            Search players
          </label>
          <div className="relative mt-2 max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-quiet-foreground" aria-hidden="true" />
            <Input
              id="player-search"
              type="search"
              value={inputValue}
              onChange={(event) => updateSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && inputValue) {
                  event.preventDefault();
                  clearSearch();
                }
              }}
              placeholder="Search by nickname"
              autoComplete="off"
              className="pl-10 pr-11"
            />
            {inputValue ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={clearSearch}
                aria-label="Clear player search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
              >
                <X size={16} aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </section>

        <section aria-label="Player results" aria-busy={initialLoading || state.status === "loading_more"} className="py-5">
          <p className="sr-only" role="status" aria-live="polite">
            {initialLoading ? "Loading players" : state.status === "loading_more" ? "Loading more players" : ""}
          </p>

          {initialLoading ? (
            <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
              {renderLoadingRows()}
            </div>
          ) : null}

          {state.items.length > 0 ? (
            <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
              {state.items.map((player) => <PlayerDirectoryRow key={player.id} player={player} />)}
            </div>
          ) : null}

          {state.status === "ready" && state.items.length === 0 ? (
            <div className="rounded-surface bg-surface-subtle px-4 py-5">
              <h2 className="text-sm font-bold">{emptyCopy.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{emptyCopy.detail}</p>
            </div>
          ) : null}

          {state.status === "error" ? (
            <div role="alert" className="rounded-surface bg-destructive-subtle px-4 py-4">
              <p className="text-sm font-bold text-destructive">Players could not be loaded.</p>
              <p className="mt-1 text-sm text-destructive/85">Please try again in a moment.</p>
              <Button type="button" onClick={retry} size="sm" className="mt-3">
                Retry
              </Button>
            </div>
          ) : null}

          {state.hasMore && state.status !== "error" ? (
            <div className="pt-5 text-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => void requestPage(state.query, state.page + 1)}
                disabled={state.status === "loading_more"}
              >
                {state.status === "loading_more" ? "Loading players..." : "Load more players"}
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
