"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AVAILABILITY_LABELS,
  CONDITION_LABELS,
  FINISH_LABELS,
  type BinderAvailability,
  type CardCondition,
  type CardFinish,
  type CommunityBinderFilters as FilterValues,
  type CommunityBinderSort,
} from "@/lib/binder";

const selectClass = "h-10 rounded-control border border-input bg-surface px-3 text-sm outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/12";

export const EMPTY_COMMUNITY_BINDER_FILTERS: FilterValues = {
  q: "", availability: "", condition: "", finish: "", set_code: "",
  language: "", min_price: "", max_price: "", sort: "nearest",
};

export default function CommunityBinderFilters({ value, onChange }: {
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
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <div className="relative sm:col-span-2 xl:col-span-2">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-quiet-foreground" />
        <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search card names" className="h-10 pl-9 pr-9" />
        {search ? <Button type="button" variant="ghost" size="icon-xs" aria-label="Clear search" className="absolute right-1 top-1" onClick={() => { setSearch(""); patch({ q: "" }); }}><X aria-hidden="true" /></Button> : null}
      </div>
      <select aria-label="Sort Community Binders" value={value.sort} onChange={(event) => patch({ sort: event.target.value as CommunityBinderSort })} className={selectClass}>
        <option value="nearest">Nearest</option><option value="recent">Recently added</option><option value="card_name">Card name</option><option value="price_low">Price: low to high</option><option value="price_high">Price: high to low</option>
      </select>
      <select aria-label="Availability" value={value.availability} onChange={(event) => patch({ availability: event.target.value as "" | BinderAvailability })} className={selectClass}>
        <option value="">Any availability</option>{Object.entries(AVAILABILITY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <select aria-label="Condition" value={value.condition} onChange={(event) => patch({ condition: event.target.value as "" | CardCondition })} className={selectClass}>
        <option value="">Any condition</option>{Object.entries(CONDITION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <select aria-label="Finish" value={value.finish} onChange={(event) => patch({ finish: event.target.value as "" | CardFinish })} className={selectClass}>
        <option value="">Any finish</option>{Object.entries(FINISH_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <Input aria-label="Set code" value={value.set_code} onChange={(event) => patch({ set_code: event.target.value })} placeholder="Set code" maxLength={12} className="h-10 uppercase" />
      <select aria-label="Language" value={value.language} onChange={(event) => patch({ language: event.target.value })} className={selectClass}>
        <option value="">Any language</option><option value="en">English</option><option value="de">German</option><option value="es">Spanish</option><option value="fr">French</option><option value="it">Italian</option><option value="ja">Japanese</option><option value="pt">Portuguese</option>
      </select>
      <Input aria-label="Minimum price" type="number" min="0.01" step="0.01" value={value.min_price} onChange={(event) => patch({ min_price: event.target.value })} placeholder="Min price" className="h-10" />
      <Input aria-label="Maximum price" type="number" min="0.01" step="0.01" value={value.max_price} onChange={(event) => patch({ max_price: event.target.value })} placeholder="Max price" className="h-10" />
    </div>
  );
}
