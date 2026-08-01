import type { ReactNode } from "react";

import PlaygroupRow from "@/components/playgroups/PlaygroupRow";
import { Button } from "@/components/ui/button";
import type { PaginatedState, PlaygroupListItem } from "@/lib/playgroups";

export default function PlaygroupList({
  state,
  emptyTitle,
  emptyDetail,
  onRetry,
  onLoadMore,
  actionFor,
  actionErrorFor,
  hideEmpty = false,
}: {
  state: PaginatedState<PlaygroupListItem>;
  emptyTitle: string;
  emptyDetail: string;
  onRetry: () => void;
  onLoadMore: () => void;
  actionFor?: (group: PlaygroupListItem) => ReactNode;
  actionErrorFor?: (group: PlaygroupListItem) => string | null;
  hideEmpty?: boolean;
}) {
  const initialLoading = state.items.length === 0 && (state.status === "loading" || state.status === "debouncing");
  const loadingMore = state.status === "loading_more";

  return (
    <div aria-busy={initialLoading || loadingMore}>
      <p className="sr-only" role="status" aria-live="polite">
        {initialLoading ? "Loading playgroups" : loadingMore ? "Loading more playgroups" : ""}
      </p>

      {initialLoading ? (
        <div className="grid gap-1 sm:grid-cols-2 sm:gap-x-4">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex min-h-[104px] animate-pulse items-center gap-3 rounded-row bg-surface/35 px-4 py-3">
              <div className="h-14 w-14 rounded-row bg-secondary" />
              <div className="flex-1"><div className="h-4 w-2/5 rounded bg-black/10" /><div className="mt-2 h-3 w-4/5 rounded bg-black/[0.06]" /></div>
            </div>
          ))}
        </div>
      ) : null}

      {state.items.length > 0 ? (
        <div className="grid gap-1 sm:grid-cols-2 sm:gap-x-4">
          {state.items.map((group) => (
            <PlaygroupRow key={group.id} group={group} action={actionFor?.(group)} actionError={actionErrorFor?.(group)} />
          ))}
        </div>
      ) : null}

      {!hideEmpty && state.status === "ready" && state.items.length === 0 ? (
        <div className="rounded-surface bg-surface-subtle px-4 py-5">
          <h2 className="text-sm font-bold">{emptyTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{emptyDetail}</p>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div role="alert" className="mt-3 rounded-surface bg-destructive-subtle px-4 py-4">
          <p className="text-sm font-bold text-destructive">This playgroup list could not be loaded.</p>
          <p className="mt-1 text-sm text-destructive/85">Please try again in a moment.</p>
          <Button type="button" size="sm" onClick={onRetry} className="mt-3">Retry</Button>
        </div>
      ) : null}

      {state.hasMore && state.status !== "error" ? (
        <div className="pt-5 text-center">
          <Button type="button" variant="outline" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading playgroups..." : "Load more playgroups"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
