"use client";

import { FunnelPlus, X } from "lucide-react";

type FloatingMapFiltersProps = {
  open: boolean;
  hint: boolean;
  format: string;
  power: string;
  openOnly: boolean;
  hasActiveFilters: boolean;
  onToggleFilters: () => void;
  onFormatChange: (value: string) => void;
  onPowerChange: (value: string) => void;
  onOpenOnlyChange: (value: boolean) => void;
  onReset: () => void;
};

const FORMAT_OPTIONS = [
  { value: "all", label: "All formats" },
  { value: "commander", label: "Commander" },
  { value: "cube", label: "Cube" },
  { value: "draft", label: "Draft" },
  { value: "legacy", label: "Legacy" },
  { value: "modern", label: "Modern" },
  { value: "pauper", label: "Pauper" },
  { value: "pioneer", label: "Pioneer" },
  { value: "premodern", label: "Premodern" },
  { value: "sealed", label: "Sealed" },
  { value: "standard", label: "Standard" },
  { value: "vintage", label: "Vintage" },
  { value: "other", label: "Other" },
];

const POWER_OPTIONS = [
  { value: "all", label: "All power" },
  { value: "Casual", label: "Casual" },
  { value: "Optimized", label: "Optimized" },
  { value: "Competitive", label: "Competitive" },
  { value: "cEDH", label: "cEDH" },
];

export default function FloatingMapFilters({
  open,
  hint,
  format,
  power,
  openOnly,
  hasActiveFilters,
  onToggleFilters,
  onFormatChange,
  onPowerChange,
  onOpenOnlyChange,
  onReset,
}: FloatingMapFiltersProps) {
  return (
    <div className="pointer-events-none fixed bottom-[86px] left-5 z-40">
      <div
        className={[
          "pointer-events-auto flex items-start border border-black/10 bg-white/[0.92] shadow-[0_16px_48px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all duration-300 ease-out",
          open
            ? "w-fit max-w-[calc(100vw-32px)] rounded-[1.45rem] p-2"
            : "h-[52px] w-[52px] rounded-full p-1",
          hint && !open ? "animate-[filterHint_1.6s_ease-in-out_1]" : "",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onToggleFilters}
          className={[
            "grid h-11 w-11 shrink-0 place-items-center rounded-full transition",
            open
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-black hover:text-white",
          ].join(" ")}
          aria-label={open ? "Close filters" : "Open filters"}
        >
          {open ? <X size={18} /> : <FunnelPlus size={19} />}
        </button>

        <div
          className={[
            "grid transition-all duration-300 ease-out",
            open
              ? "ml-2 max-w-[660px] grid-rows-[1fr] opacity-100"
              : "ml-0 max-w-0 grid-rows-[0fr] opacity-0",
          ].join(" ")}
        >
          <div className="min-w-0 overflow-hidden">
            <div className="flex max-w-[calc(100vw-104px)] flex-wrap items-center gap-2">
              <select
                value={format}
                onChange={(event) => onFormatChange(event.target.value)}
                className="h-9 shrink-0 rounded-full border border-black/10 bg-white px-3 text-sm text-zinc-700 outline-none transition hover:border-black/20 focus:border-[#6E5AA7]"
              >
                {FORMAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={power}
                onChange={(event) => onPowerChange(event.target.value)}
                className="h-9 shrink-0 rounded-full border border-black/10 bg-white px-3 text-sm text-zinc-700 outline-none transition hover:border-black/20 focus:border-[#6E5AA7]"
              >
                {POWER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onOpenOnlyChange(!openOnly)}
                className={[
                  "h-9 shrink-0 rounded-full border px-3 text-sm font-medium transition",
                  openOnly
                    ? "border-[#6E5AA7] bg-[#F0EBFF] text-[#6E5AA7]"
                    : "border-black/10 bg-white text-zinc-700 hover:border-black/20",
                ].join(" ")}
              >
                Open seats
              </button>

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={onReset}
                  className="h-9 shrink-0 rounded-full px-3 text-sm font-medium text-zinc-500 hover:text-black"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}