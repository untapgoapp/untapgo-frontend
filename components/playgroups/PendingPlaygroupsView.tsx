"use client";

import { useCallback, useState } from "react";

import PlaygroupList from "@/components/playgroups/PlaygroupList";
import usePaginatedResource from "@/components/playgroups/usePaginatedResource";
import { Button } from "@/components/ui/button";
import { getMyPlaygroups, leavePlaygroup } from "@/services/playgroups";

export default function PendingPlaygroupsView() {
  const load = useCallback((page: number) => getMyPlaygroups("pending", page), []);
  const resource = usePaginatedResource("mine:pending", load);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function cancelRequest(playgroupId: string) {
    if (busyId) return;
    setBusyId(playgroupId);
    setErrors((current) => ({ ...current, [playgroupId]: "" }));
    try {
      await leavePlaygroup(playgroupId);
      resource.removeItem(playgroupId);
    } catch {
      setErrors((current) => ({ ...current, [playgroupId]: "Could not cancel this request. Please try again." }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PlaygroupList
      state={resource.state}
      emptyTitle="No pending requests"
      emptyDetail="Groups that require owner approval will appear here while you wait."
      onRetry={() => void resource.retry()}
      onLoadMore={() => void resource.loadMore()}
      actionFor={(group) => (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          disabled={busyId !== null}
          onClick={() => void cancelRequest(group.id)}
        >
          {busyId === group.id ? "Cancelling..." : "Cancel"}
        </Button>
      )}
      actionErrorFor={(group) => errors[group.id] || null}
    />
  );
}
