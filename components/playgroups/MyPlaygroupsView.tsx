"use client";

import { useCallback } from "react";

import PlaygroupList from "@/components/playgroups/PlaygroupList";
import usePaginatedResource from "@/components/playgroups/usePaginatedResource";
import { getMyPlaygroups } from "@/services/playgroups";

export default function MyPlaygroupsView() {
  const loadOwned = useCallback((page: number) => getMyPlaygroups("owned", page), []);
  const loadJoined = useCallback((page: number) => getMyPlaygroups("joined", page), []);
  const owned = usePaginatedResource("mine:owned", loadOwned);
  const joined = usePaginatedResource("mine:joined", loadJoined);
  const bothReady = owned.state.status === "ready" && joined.state.status === "ready";
  const bothEmpty = bothReady && owned.state.items.length === 0 && joined.state.items.length === 0;

  if (bothEmpty) {
    return (
      <div className="rounded-surface bg-surface-subtle px-4 py-5">
        <h2 className="text-sm font-bold">No groups yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Join a public playgroup or create one for your regular table.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      {owned.state.status !== "ready" || owned.state.items.length > 0 ? (
        <section aria-labelledby="owned-groups-title">
          <h2 id="owned-groups-title" className="mb-3 text-lg font-semibold tracking-tight">Owned groups</h2>
          <PlaygroupList
            state={owned.state}
            emptyTitle="No owned groups"
            emptyDetail="Create a playgroup when you are ready to bring a regular table together."
            onRetry={() => void owned.retry()}
            onLoadMore={() => void owned.loadMore()}
            hideEmpty
          />
        </section>
      ) : null}

      {joined.state.status !== "ready" || joined.state.items.length > 0 ? (
        <section aria-labelledby="joined-groups-title">
          <h2 id="joined-groups-title" className="mb-3 text-lg font-semibold tracking-tight">Joined groups</h2>
          <PlaygroupList
            state={joined.state}
            emptyTitle="No joined groups"
            emptyDetail="Discover a group that fits your regular games."
            onRetry={() => void joined.retry()}
            onLoadMore={() => void joined.loadMore()}
            hideEmpty
          />
        </section>
      ) : null}
    </div>
  );
}
