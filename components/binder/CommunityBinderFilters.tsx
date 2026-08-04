"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AVAILABILITY_LABELS,
  CARD_LANGUAGE_LABELS,
  type BinderAvailability,
  type CommunityBinderFilters as FilterValues,
  type CommunityBinderSort,
} from "@/lib/binder";

const selectClass = "h-10 rounded-control border border-input bg-surface px-3 text-sm outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/12";

export const EMPTY_COMMUNITY_BINDER_FILTERS: FilterValues = {
  q: "",
  availability: "",
  condition: "",
  finish: "",
  set_code: "",
  language: "",
  min_price: "",
  max_price: "",
  sort: "nearest",
};

export default function CommunityBinderFilters({
  value,
  onChange,
}: {
  value: FilterValues;
  onChange: (value: FilterValues) => void;
}) {
  const [search, setSearch] = useState(value.q);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const q = search.trim();
      if (q !== value.q) onChange({ ...value, q });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [onChange, search, value]);

  function patch(changes: Partial<FilterValues>) {
    onChange({ ...value, ...changes });
  }

  return (
    <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px] xl:grid-cols-[minmax(0,1fr)_180px_180px_180px]">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-quiet-foreground"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search players or cards"
          className="h-10 pl-9 pr-9"
        />
        {search ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Clear search"
            className="absolute right-1 top-1"
            onClick={() => {
              setSearch("");
              patch({ q: "" });
            }}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <select
        aria-label="Sort Community Binders"
        value={value.sort}
        onChange={(event) => patch({ sort: event.target.value as CommunityBinderSort })}
        className={selectClass}
      >
        <option value="nearest">Nearest</option>
        <option value="recent">Recently updated</option>
        <option value="player_name">Player name</option>
        <option value="most_cards">Most cards</option>
      </select>

      <select
        aria-label="Cards available for"
        value={value.availability}
        onChange={(event) => patch({
          availability: event.target.value as "" | BinderAvailability,
        })}
        className={selectClass}
      >
        <option value="">Any availability</option>
        {Object.entries(AVAILABILITY_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>

      <select
        aria-label="Card language"
        value={value.language}
        onChange={(event) => patch({ language: event.target.value })}
        className={selectClass}
      >
        <option value="">Any language</option>
        {Object.entries(CARD_LANGUAGE_LABELS).map(([key, label]) => (
          <option key={key} value={key}>{label}</option>
        ))}
      </select>
    </div>
  );
}
