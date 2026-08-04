"use client";

import { useCallback, useState } from "react";

import type {
  CommunityBinderFilters as FilterValues,
  CommunityBinderResponse,
  CommunityBinderSummary,
} from "@/lib/binder";
import { binderApi } from "@/services/binder";

import { BinderEmpty, BinderError, LoadMore } from "./BinderFeedback";
import CommunityBinderCard from "./CommunityBinderCard";
import CommunityBinderFilters, {
  EMPTY_COMMUNITY_BINDER_FILTERS,
} from "./CommunityBinderFilters";
import useBinderPage from "./useBinderPage";

const byOwner = (binder: CommunityBinderSummary) => binder.owner.id;

export default function CommunityBinderView() {
  const [filters, setFilters] = useState<FilterValues>(EMPTY_COMMUNITY_BINDER_FILTERS);
  const scope = JSON.stringify(filters);
  const loader = useCallback(
    (page: number) => binderApi.community(filters, page),
    [filters],
  );
  const resource = useBinderPage(scope, loader, byOwner);
  const response = resource.response as CommunityBinderResponse | null;

  return (
    <section aria-labelledby="community-binder-results">
      <h2 id="community-binder-results" className="sr-only">Community Binders</h2>
      <CommunityBinderFilters value={filters} onChange={setFilters} />

      {response?.nearest_fallback ? (
        <p role="status" className="mt-3 text-xs text-muted-foreground">
          Add your approximate location to see nearby Binders. Showing recently updated Binders instead.
        </p>
      ) : null}

      <div className="mt-6">
        {resource.loading ? <CommunityBinderLoading /> : null}
        {resource.error ? <BinderError message={resource.error} onRetry={resource.retry} /> : null}
        {!resource.loading && !resource.error && !resource.items.length ? (
          <BinderEmpty
            title="No Community Binders found"
            detail="Try another player, card, language or availability filter."
          />
        ) : null}
        {resource.items.length ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {resource.items.map((binder) => (
              <CommunityBinderCard key={binder.owner.id} binder={binder} />
            ))}
          </div>
        ) : null}
        {resource.hasMore ? (
          <LoadMore loading={resource.loadingMore} onClick={resource.loadMore} />
        ) : null}
      </div>
    </section>
  );
}

function CommunityBinderLoading() {
  return (
    <div aria-label="Loading Community Binders" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="animate-pulse rounded-[18px] border border-border/40 bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-muted" />
            <div className="flex-1">
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {Array.from({ length: 4 }, (_, card) => (
              <div key={card} className="aspect-[5/7] rounded-lg bg-muted" />
            ))}
          </div>
          <div className="mt-4 h-9 rounded-control bg-muted" />
        </div>
      ))}
    </div>
  );
}
