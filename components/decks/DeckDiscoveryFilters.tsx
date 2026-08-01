"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DeckDiscoveryFilters as FilterValues, DeckDiscoverySort, ManaColor } from "@/types/decks";

export const EMPTY_DECK_FILTERS: FilterValues = { q: "", format: "", colors: [], sort: "recent" };
const colors: ManaColor[] = ["W", "U", "B", "R", "G", "C"];
const selectClass = "h-10 rounded-control border border-input bg-surface px-3 text-sm outline-none focus:border-primary/45 focus:ring-[3px] focus:ring-ring/12";

export default function DeckDiscoveryFilters({ value, onChange }: {
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

  function toggleColor(color: ManaColor) {
    const next = value.colors.includes(color)
      ? value.colors.filter((item) => item !== color)
      : [...value.colors, color];
    onChange({ ...value, colors: next });
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_10rem_10rem_auto]">
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-quiet-foreground" />
        <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search deck names" className="h-10 pl-9 pr-9" />
        {search ? <Button type="button" variant="ghost" size="icon-xs" aria-label="Clear search" className="absolute right-1 top-1" onClick={() => { setSearch(""); onChange({ ...value, q: "" }); }}><X aria-hidden="true" /></Button> : null}
      </div>
      <Input aria-label="Deck format" value={value.format} onChange={(event) => onChange({ ...value, format: event.target.value })} placeholder="Format" className="h-10" />
      <select aria-label="Sort Community Decks" value={value.sort} onChange={(event) => onChange({ ...value, sort: event.target.value as DeckDiscoverySort })} className={selectClass}>
        <option value="recent">Recently added</option><option value="updated">Recently updated</option><option value="name">Deck name</option>
      </select>
      <fieldset className="flex min-h-10 flex-wrap items-center gap-1" aria-label="Color identity">
        {colors.map((color) => <button key={color} type="button" aria-pressed={value.colors.includes(color)} onClick={() => toggleColor(color)} className={`grid h-9 w-9 place-items-center rounded-full border text-xs font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15 ${value.colors.includes(color) ? "border-primary/30 bg-secondary text-primary" : "border-border bg-surface text-muted-foreground"}`}>{color}</button>)}
      </fieldset>
    </div>
  );
}
