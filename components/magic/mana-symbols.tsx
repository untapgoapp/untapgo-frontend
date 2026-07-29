"use client";

import { useEffect, useMemo, useState } from "react";

import { decksApi } from "@/lib/decks-api";
import type { CardSymbol } from "@/types/decks";

type SymbolMap = Record<string, CardSymbol>;
type ManaSize = "xs" | "sm" | "md" | "lg";

const SIZE_CLASSES: Record<ManaSize, string> = {
  xs: "h-[15px] w-[15px]",
  sm: "h-[18px] w-[18px]",
  md: "h-[22px] w-[22px]",
  lg: "h-[28px] w-[28px]",
};

/**
 * Local assets already used by the Flutter app.
 * Keys use Scryfall's token format so they can share the same renderer.
 */
const LOCAL_SYMBOLS: Record<string, string> = {
  "{W}": "/mana/w.svg",
  "{U}": "/mana/u.svg",
  "{B}": "/mana/b.svg",
  "{R}": "/mana/r.svg",
  "{G}": "/mana/g.svg",
  "{C}": "/mana/c.svg",
};

const LOCAL_LABELS: Record<string, string> = {
  "{W}": "White mana",
  "{U}": "Blue mana",
  "{B}": "Black mana",
  "{R}": "Red mana",
  "{G}": "Green mana",
  "{C}": "Colourless mana",
};

let symbolCache: SymbolMap | null = null;
let symbolRequest: Promise<SymbolMap> | null = null;

function normalizeToken(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  return trimmed.startsWith("{") && trimmed.endsWith("}")
    ? trimmed.toUpperCase()
    : `{${trimmed.toUpperCase()}}`;
}

function plainToken(value: string): string {
  return normalizeToken(value).slice(1, -1);
}

function loadSymbols(): Promise<SymbolMap> {
  if (symbolCache) return Promise.resolve(symbolCache);
  if (symbolRequest) return symbolRequest;

  symbolRequest = decksApi
    .symbology()
    .then((response) => {
      symbolCache = Object.fromEntries(
        response.data.map((item) => [normalizeToken(item.symbol), item]),
      );
      return symbolCache;
    })
    .finally(() => {
      symbolRequest = null;
    });

  return symbolRequest;
}

function useSymbolMap(enabled: boolean): SymbolMap | null {
  const [symbols, setSymbols] = useState<SymbolMap | null>(symbolCache);

  useEffect(() => {
    if (!enabled || symbols) return;

    let cancelled = false;

    void loadSymbols()
      .then((result) => {
        if (!cancelled) setSymbols(result);
      })
      .catch(() => {
        // Local symbols and text fallbacks remain available.
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, symbols]);

  return symbols;
}

function tokenize(value: string): string[] {
  return value.match(/\{[^}]+\}|[^{}]+/g) ?? [];
}

export function ManaSymbol({
  symbol,
  size = "md",
  className = "",
}: {
  symbol: string;
  size?: ManaSize;
  className?: string;
}) {
  const normalized = normalizeToken(symbol);
  const localSource = LOCAL_SYMBOLS[normalized];
  const symbols = useSymbolMap(!localSource);
  const remoteItem = symbols?.[normalized];
  const source = localSource ?? remoteItem?.svg_uri;
  const label =
    LOCAL_LABELS[normalized] ?? remoteItem?.english ?? plainToken(normalized);
  const [failedSource, setFailedSource] = useState<string | null>(null);

  useEffect(() => {
    setFailedSource(null);
  }, [source]);

  if (source && failedSource !== source) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={source}
        alt={label}
        title={label}
        width={28}
        height={28}
        draggable={false}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSource(source)}
        className={`inline-block shrink-0 select-none align-[-0.16em] drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)] ${SIZE_CLASSES[size]} ${className}`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-black/15 bg-white font-semibold leading-none text-black/65 ${SIZE_CLASSES[size]} ${
        size === "xs"
          ? "text-[7px]"
          : size === "sm"
            ? "text-[8px]"
            : "text-[9px]"
      } ${className}`}
    >
      {plainToken(normalized)}
    </span>
  );
}

export function ManaCost({
  cost,
  size = "md",
  className = "",
}: {
  cost?: string | null;
  size?: ManaSize;
  className?: string;
}) {
  const parts = useMemo(() => tokenize(cost ?? ""), [cost]);
  if (!parts.length) return null;

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-[3px] ${className}`}
      aria-label={cost ?? undefined}
    >
      {parts.map((part, index) =>
        part.startsWith("{") ? (
          <ManaSymbol key={`${part}-${index}`} symbol={part} size={size} />
        ) : part.trim() ? (
          <span key={`${part}-${index}`}>{part}</span>
        ) : null,
      )}
    </span>
  );
}

export function ManaIdentity({
  colors,
  size = "md",
  className = "",
}: {
  colors: string[];
  size?: ManaSize;
  className?: string;
}) {
  if (!colors.length) return null;

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      {colors.map((color) => (
        <ManaSymbol key={color} symbol={color} size={size} />
      ))}
    </span>
  );
}

export function ManaText({
  text,
  size = "sm",
  className = "",
}: {
  text?: string | null;
  size?: ManaSize;
  className?: string;
}) {
  const lines = useMemo(() => (text ?? "").split("\n"), [text]);
  if (!text) return null;

  return (
    <span className={className}>
      {lines.map((line, lineIndex) => (
        <span key={`${line}-${lineIndex}`}>
          {tokenize(line).map((part, index) =>
            part.startsWith("{") ? (
              <ManaSymbol key={`${part}-${index}`} symbol={part} size={size} />
            ) : (
              <span key={`${part}-${index}`}>{part}</span>
            ),
          )}
          {lineIndex < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </span>
  );
}
