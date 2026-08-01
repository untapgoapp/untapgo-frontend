"use client";

import { useCallback } from "react";

import PlaygroupPersonRow from "@/components/playgroups/PlaygroupPersonRow";
import usePaginatedResource from "@/components/playgroups/usePaginatedResource";
import { Button } from "@/components/ui/button";
import { getPlaygroupMembers } from "@/services/playgroups";

export default function PlaygroupMembers({
  playgroupId,
  refreshKey,
}: {
  playgroupId: string;
  refreshKey: number;
}) {
  const load = useCallback(
    (page: number) => getPlaygroupMembers(playgroupId, page),
    [playgroupId],
  );
  const resource = usePaginatedResource(`members:${playgroupId}:${refreshKey}`, load);
  const initialLoading = resource.state.items.length === 0 && resource.state.status === "loading";
  const loadingMore = resource.state.status === "loading_more";

  return (
    <section aria-labelledby="playgroup-members-title" className="py-7">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="playgroup-members-title" className="text-lg font-semibold tracking-tight">Members</h2>
      </div>
      <div className="mt-3" aria-busy={initialLoading || loadingMore}>
        {initialLoading ? (
          <div className="grid gap-1 sm:grid-cols-2 sm:gap-x-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex min-h-[82px] animate-pulse items-center gap-3 rounded-row bg-surface/35 px-3 py-3">
                <div className="h-12 w-12 rounded-full bg-secondary" />
                <div className="flex-1"><div className="h-4 w-2/5 rounded bg-black/10" /><div className="mt-2 h-3 w-3/5 rounded bg-black/[0.06]" /></div>
              </div>
            ))}
          </div>
        ) : null}

        {resource.state.items.length > 0 ? (
          <div className="grid gap-1 sm:grid-cols-2 sm:gap-x-4">
            {resource.state.items.map((member) => <PlaygroupPersonRow key={member.id} person={member} />)}
          </div>
        ) : null}

        {resource.state.status === "ready" && resource.state.items.length === 0 ? (
          <p className="rounded-surface bg-surface-subtle px-4 py-4 text-sm text-muted-foreground">No members to show yet.</p>
        ) : null}

        {resource.state.status === "error" ? (
          <div role="alert" className="rounded-surface bg-destructive-subtle px-4 py-4">
            <p className="text-sm font-bold text-destructive">Members could not be loaded.</p>
            <p className="mt-1 text-sm text-destructive/85">The rest of the playgroup is still available.</p>
            <Button type="button" size="sm" onClick={() => void resource.retry()} className="mt-3">Retry</Button>
          </div>
        ) : null}

        {resource.state.hasMore && resource.state.status !== "error" ? (
          <div className="pt-5 text-center">
            <Button type="button" variant="outline" onClick={() => void resource.loadMore()} disabled={loadingMore}>
              {loadingMore ? "Loading members..." : "Load more members"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
