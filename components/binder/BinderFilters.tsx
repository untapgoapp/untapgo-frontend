"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AVAILABILITY_LABELS,
  CONDITION_LABELS,
  FINISH_LABELS,
  type BinderFilters as BinderFilterValues,
  type BinderAvailability,
  type BinderStatus,
  type CardCondition,
  type CardFinish,
} from "@/lib/binder";

const selectClass = "h-10 rounded-control border border-input bg-surface px-3 text-sm outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/12";

export const EMPTY_BINDER_FILTERS: BinderFilterValues = {
  q: "", availability: "", condition: "", finish: "", set_code: "", status: "",
};

export default function BinderFilters({
  value,
  onChange,
  owner = false,
}: {
  value: BinderFilterValues;
  onChange: (value: BinderFilterValues) => void;
  owner?: boolean;
}) {
  const [search, setSearch] = useState(value.q);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim() !== value.q) onChange({ ...value, q: search.trim() });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [onChange, search, value]);

  function patch(changes: Partial<BinderFilterValues>) {
    onChange({ ...value, ...changes });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <div className="relative min-w-0 flex-1 sm:min-w-[15rem]">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-quiet-foreground" aria-hidden="true" />
        <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search card names" className="h-10 pl-9 pr-9" />
        {search ? <Button type="button" variant="ghost" size="icon-xs" className="absolute right-1 top-1" aria-label="Clear search" onClick={() => { setSearch(""); patch({ q: "" }); }}><X aria-hidden="true" /></Button> : null}
      </div>
      <select aria-label="Availability" value={value.availability} onChange={(event) => patch({ availability: event.target.value as "" | BinderAvailability })} className={selectClass}>
        <option value="">Any availability</option>{Object.entries(AVAILABILITY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <select aria-label="Condition" value={value.condition} onChange={(event) => patch({ condition: event.target.value as "" | CardCondition })} className={selectClass}>
        <option value="">Any condition</option>{Object.entries(CONDITION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <select aria-label="Finish" value={value.finish} onChange={(event) => patch({ finish: event.target.value as "" | CardFinish })} className={selectClass}>
        <option value="">Any finish</option>{Object.entries(FINISH_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <Input aria-label="Set code" value={value.set_code} onChange={(event) => patch({ set_code: event.target.value })} placeholder="Set" maxLength={12} className="h-10 w-full uppercase sm:w-24" />
      {owner ? <select aria-label="Status" value={value.status} onChange={(event) => patch({ status: event.target.value as "" | BinderStatus })} className={selectClass}><option value="">Any status</option><option value="active">Active</option><option value="reserved">Reserved</option><option value="completed">Completed</option><option value="withdrawn">Withdrawn</option></select> : null}
    </div>
  );
}
