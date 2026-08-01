"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { ArrowLeft } from "lucide-react";

import PlayerDirectoryRow from "@/components/players/PlayerDirectoryRow";
import { Button } from "@/components/ui/button";
import {
  createProfileNetworkState,
  getProfileNetworkEmptyText,
  getProfileNetworkHref,
  profileNetworkReducer,
  type ProfileNetworkTab,
} from "@/lib/profile-network";
import {
  getProfileFollowers,
  getProfileFollowing,
} from "@/services/profiles";

type ProfileNetworkListProps = {
  profileId: string;
  tab: ProfileNetworkTab;
};

function renderLoadingRows() {
  return Array.from({ length: 6 }, (_, index) => (
    <div
      key={index}
      className="flex min-h-[88px] animate-pulse items-center gap-3 rounded-row bg-surface/35 px-4 py-3.5"
    >
      <div className="h-12 w-12 rounded-full bg-secondary" />
      <div className="min-w-0 flex-1">
        <div className="h-4 w-2/5 rounded bg-black/10" />
        <div className="mt-2 h-3 w-4/5 rounded bg-black/[0.06]" />
      </div>
    </div>
  ));
}

export default function ProfileNetworkList({
  profileId,
  tab,
}: ProfileNetworkListProps) {
  const [state, dispatch] = useReducer(
    profileNetworkReducer,
    createProfileNetworkState(profileId, tab),
  );
  const requestSequence = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const requestPage = useCallback(async (page: number) => {
    const requestId = ++requestSequence.current;
    dispatch({
      type: "request_started",
      profileId,
      tab,
      page,
      requestId,
    });

    try {
      const response = tab === "followers"
        ? await getProfileFollowers(profileId, page)
        : await getProfileFollowing(profileId, page);
      if (
        !mounted.current ||
        requestSequence.current !== requestId
      ) return;
      dispatch({ type: "request_succeeded", requestId, response });
    } catch {
      if (
        !mounted.current ||
        requestSequence.current !== requestId
      ) return;
      dispatch({ type: "request_failed", requestId, page });
    }
  }, [profileId, tab]);

  useEffect(() => {
    void requestPage(1);
  }, [requestPage]);

  const initialLoading =
    state.items.length === 0 && state.status === "loading";
  const loadingMore = state.status === "loading_more";

  return (
    <main className="min-h-screen px-4 py-6 text-foreground sm:px-5 sm:py-8 lg:px-0">
      <div className="w-full max-w-[1050px]">
        <header className="pb-5">
          <Link
            href={`/profile/${encodeURIComponent(profileId)}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={15} aria-hidden="true" /> Back to profile
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Player network
          </h1>
        </header>

        <nav
          aria-label="Profile network"
          className="flex gap-1"
        >
          {(["followers", "following"] as const).map((item) => (
            <Link
              key={item}
              href={getProfileNetworkHref(profileId, item)}
              aria-current={tab === item ? "page" : undefined}
              className={[
                "rounded-control px-3 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15",
                tab === item
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
              ].join(" ")}
            >
              {item === "followers" ? "Followers" : "Following"}
            </Link>
          ))}
        </nav>

        <section
          aria-label={tab === "followers" ? "Followers" : "Following"}
          aria-busy={initialLoading || loadingMore}
          className="py-5"
        >
          <p className="sr-only" role="status" aria-live="polite">
            {initialLoading
              ? `Loading ${tab}`
              : loadingMore ? `Loading more ${tab}` : ""}
          </p>

          {initialLoading ? (
            <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
              {renderLoadingRows()}
            </div>
          ) : null}

          {state.items.length > 0 ? (
            <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
              {state.items.map((player) => (
                <PlayerDirectoryRow key={player.id} player={player} />
              ))}
            </div>
          ) : null}

          {state.status === "ready" && state.items.length === 0 ? (
            <p className="rounded-surface bg-surface-subtle px-4 py-5 text-sm text-muted-foreground">
              {getProfileNetworkEmptyText(tab)}
            </p>
          ) : null}

          {state.status === "error" ? (
            <div role="alert" className="rounded-surface bg-destructive-subtle px-4 py-4">
              <p className="text-sm font-bold text-destructive">
                This list could not be loaded.
              </p>
              <p className="mt-1 text-sm text-destructive/85">
                Please try again in a moment.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => void requestPage(state.failedPage ?? 1)}
                className="mt-3"
              >
                Retry
              </Button>
            </div>
          ) : null}

          {state.hasMore && state.status !== "error" ? (
            <div className="pt-5 text-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => void requestPage(state.page + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading players..." : "Load more"}
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
