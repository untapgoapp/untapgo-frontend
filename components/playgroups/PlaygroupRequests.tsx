"use client";

import { useCallback, useState } from "react";

import PlaygroupPersonRow from "@/components/playgroups/PlaygroupPersonRow";
import usePaginatedResource from "@/components/playgroups/usePaginatedResource";
import { Button } from "@/components/ui/button";
import {
  approvePlaygroupRequest,
  getPlaygroupRequests,
  rejectPlaygroupRequest,
} from "@/services/playgroups";

export default function PlaygroupRequests({
  playgroupId,
  onApproved,
}: {
  playgroupId: string;
  onApproved: () => void;
}) {
  const load = useCallback(
    (page: number) => getPlaygroupRequests(playgroupId, page),
    [playgroupId],
  );
  const resource = usePaginatedResource(`requests:${playgroupId}`, load);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const initialLoading = resource.state.items.length === 0 && resource.state.status === "loading";

  async function decide(userId: string, decision: "approve" | "reject") {
    if (busyId) return;
    setBusyId(userId);
    setErrors((current) => ({ ...current, [userId]: "" }));
    try {
      if (decision === "approve") await approvePlaygroupRequest(playgroupId, userId);
      else await rejectPlaygroupRequest(playgroupId, userId);
      resource.removeItem(userId);
      if (decision === "approve") onApproved();
    } catch {
      setErrors((current) => ({
        ...current,
        [userId]: decision === "approve"
          ? "Could not approve this request. Please try again."
          : "Could not decline this request. Please try again.",
      }));
    } finally {
      setBusyId(null);
    }
  }

  if (resource.state.status === "ready" && resource.state.items.length === 0) return null;

  return (
    <section aria-labelledby="playgroup-requests-title" className="rounded-surface bg-surface-subtle/70 px-3 py-5 sm:px-4">
      <h2 id="playgroup-requests-title" className="text-base font-semibold tracking-tight">Join requests</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">Review players who asked to join this group.</p>

      {initialLoading ? <p className="mt-4 text-sm text-muted-foreground">Loading requests...</p> : null}

      {resource.state.items.length > 0 ? (
        <div className="mt-3 grid gap-1">
          {resource.state.items.map((person) => (
            <PlaygroupPersonRow
              key={person.id}
              person={person}
              error={errors[person.id] || null}
              actions={(
                <div className="flex flex-col gap-1 sm:flex-row">
                  <Button type="button" size="xs" disabled={busyId !== null} onClick={() => void decide(person.id, "approve")}>{busyId === person.id ? "Working..." : "Approve"}</Button>
                  <Button type="button" variant="ghost" size="xs" disabled={busyId !== null} onClick={() => void decide(person.id, "reject")}>Decline</Button>
                </div>
              )}
            />
          ))}
        </div>
      ) : null}

      {resource.state.status === "error" ? (
        <div role="alert" className="mt-3 rounded-control bg-destructive-subtle px-3 py-3">
          <p className="text-sm text-destructive">Join requests could not be loaded.</p>
          <Button type="button" variant="ghost" size="xs" onClick={() => void resource.retry()} className="mt-2">Retry</Button>
        </div>
      ) : null}

      {resource.state.hasMore && resource.state.status !== "error" ? (
        <Button type="button" variant="outline" size="sm" onClick={() => void resource.loadMore()} disabled={resource.state.status === "loading_more"} className="mt-4">
          {resource.state.status === "loading_more" ? "Loading requests..." : "Load more requests"}
        </Button>
      ) : null}
    </section>
  );
}
