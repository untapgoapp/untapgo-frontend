"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";

import PlaygroupList from "@/components/playgroups/PlaygroupList";
import usePaginatedResource from "@/components/playgroups/usePaginatedResource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { discoverPlaygroups } from "@/services/playgroups";

const SEARCH_DELAY_MS = 350;

export default function DiscoverPlaygroupsView() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [applied, setApplied] = useState({ query: "", city: "" });
  const filterEffectReady = useRef(false);
  const scope = useMemo(() => `discover:${applied.query}:${applied.city}`, [applied]);
  const load = useCallback(
    (page: number) => discoverPlaygroups(applied.query, applied.city, page),
    [applied],
  );
  const { state, invalidate, retry, loadMore } = usePaginatedResource(scope, load);

  useEffect(() => {
    if (!filterEffectReady.current) {
      filterEffectReady.current = true;
      return;
    }
    const nextScope = `discover:${query.trim()}:${city.trim()}`;
    invalidate(nextScope);
    const timeout = window.setTimeout(() => {
      setApplied({ query: query.trim(), city: city.trim() });
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [query, city, invalidate]);

  function clearFilters() {
    setQuery("");
    setCity("");
  }

  return (
    <div>
      <div className="grid max-w-3xl gap-3 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)_auto] sm:items-end">
        <label className="grid gap-1.5 text-sm font-semibold text-muted-foreground">
          Search playgroups
          <span className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-quiet-foreground" aria-hidden="true" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape" && (query || city)) {
                  event.preventDefault();
                  clearFilters();
                }
              }}
              placeholder="Search by group name"
              autoComplete="off"
              className="pl-10"
            />
          </span>
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-muted-foreground">
          City
          <span className="relative">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-quiet-foreground" aria-hidden="true" />
            <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Any city" autoComplete="address-level2" className="pl-10" />
          </span>
        </label>

        {query || city ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="justify-self-start sm:mb-0.5">
            <X size={14} aria-hidden="true" /> Clear
          </Button>
        ) : <span className="hidden sm:block" />}
      </div>

      <div className="mt-6">
        <PlaygroupList
          state={state}
          emptyTitle={applied.query || applied.city ? "No playgroups found" : "No playgroups yet"}
          emptyDetail={applied.query || applied.city ? "Try a different name or city." : "Create the first playgroup in your community."}
          onRetry={() => void retry()}
          onLoadMore={() => void loadMore()}
        />
      </div>
    </div>
  );
}
