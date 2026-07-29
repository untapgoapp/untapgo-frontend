"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type LocationValue = {
  address_text: string;
  place_id: string;
  lat: number;
  lng: number;
};

type LocationPickerProps = {
  value?: LocationValue | null;
  onChange: (location: LocationValue | null) => void;
  label?: string;
  placeholder?: string;
};

type MapboxSuggestion = {
  mapbox_id?: string;
  name?: string;
  full_address?: string;
  place_formatted?: string;
  address?: string;
};

type MapboxSuggestResponse = {
  suggestions?: MapboxSuggestion[];
};

type MapboxRetrieveFeature = {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: [number, number];
  };
  properties?: {
    mapbox_id?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
    address?: string;
  };
};

type MapboxRetrieveResponse = {
  features?: MapboxRetrieveFeature[];
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

function createSessionToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSuggestionLabel(suggestion: MapboxSuggestion) {
  const name = suggestion.name?.trim();
  const fullAddress = suggestion.full_address?.trim();
  const formatted = suggestion.place_formatted?.trim();
  const address = suggestion.address?.trim();

  if (fullAddress) return fullAddress;

  if (name && formatted) {
    return `${name}, ${formatted}`;
  }

  if (name && address) {
    return `${name}, ${address}`;
  }

  return name || address || formatted || "Unnamed location";
}

function getFeatureLabel(feature: MapboxRetrieveFeature) {
  const properties = feature.properties || {};

  const name = properties.name?.trim();
  const fullAddress = properties.full_address?.trim();
  const formatted = properties.place_formatted?.trim();
  const address = properties.address?.trim();

  if (fullAddress) return fullAddress;

  if (name && formatted) {
    return `${name}, ${formatted}`;
  }

  if (name && address) {
    return `${name}, ${address}`;
  }

  return name || address || formatted || "Unnamed location";
}

export default function LocationPicker({
  value,
  onChange,
  label = "Location",
  placeholder = "Search for a store, cafe, address...",
}: LocationPickerProps) {
  const [query, setQuery] = useState(value?.address_text || "");
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrievingId, setRetrievingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionTokenRef = useRef(createSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const selectedLabel = useMemo(() => {
    if (!value) return null;

    return `${value.address_text} · ${value.lat.toFixed(5)}, ${value.lng.toFixed(
      5
    )}`;
  }, [value]);

  useEffect(() => {
    if (value?.address_text) {
      setQuery(value.address_text);
    }
  }, [value?.address_text]);

  useEffect(() => {
    const cleanQuery = query.trim();

    if (!MAPBOX_TOKEN) {
      setError("Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.");
      return;
    }

    if (cleanQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    if (value?.address_text === cleanQuery) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const params = new URLSearchParams({
          q: cleanQuery,
          access_token: MAPBOX_TOKEN,
          session_token: sessionTokenRef.current,
          limit: "6",
          language: "en",
          proximity: "ip",
        });

        const response = await fetch(
          `https://api.mapbox.com/search/searchbox/v1/suggest?${params.toString()}`,
          {
            signal: abortRef.current.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Mapbox suggest failed: ${response.status}`);
        }

        const data = (await response.json()) as MapboxSuggestResponse;

        setSuggestions(data.suggestions || []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError(
          err instanceof Error ? err.message : "Could not search location."
        );
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, value?.address_text]);

  async function handleSelectSuggestion(suggestion: MapboxSuggestion) {
    const mapboxId = suggestion.mapbox_id;

    if (!mapboxId) {
      setError("This location is missing a Mapbox ID.");
      return;
    }

    setRetrievingId(mapboxId);
    setError(null);

    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        session_token: sessionTokenRef.current,
      });

      const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(
          mapboxId
        )}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox retrieve failed: ${response.status}`);
      }

      const data = (await response.json()) as MapboxRetrieveResponse;
      const feature = data.features?.[0];

      const coordinates = feature?.geometry?.coordinates;

      if (!feature || !coordinates) {
        throw new Error("Mapbox did not return coordinates for this location.");
      }

      const [lng, lat] = coordinates;
      const addressText = getFeatureLabel(feature);
      const placeId = feature.properties?.mapbox_id || mapboxId;

      onChange({
        address_text: addressText,
        place_id: placeId,
        lat,
        lng,
      });

      setQuery(addressText);
      setSuggestions([]);

      sessionTokenRef.current = createSessionToken();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not select location."
      );
    } finally {
      setRetrievingId(null);
    }
  }

  function handleClear() {
    onChange(null);
    setQuery("");
    setSuggestions([]);
    setError(null);
    sessionTokenRef.current = createSessionToken();
  }

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">{label}</label>

      <div className="relative">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange(null);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 pr-24 text-black outline-none focus:border-black"
        />

        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-600"
          >
            Clear
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-xs text-zinc-500">Searching locations...</p>
      ) : null}

      {selectedLabel ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">Selected location</p>
          <p className="mt-1">{selectedLabel}</p>
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          {suggestions.map((suggestion) => {
            const mapboxId = suggestion.mapbox_id || getSuggestionLabel(suggestion);
            const busy = retrievingId === suggestion.mapbox_id;

            return (
              <button
                key={mapboxId}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                disabled={Boolean(retrievingId)}
                className="block w-full border-b border-zinc-100 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-zinc-50 disabled:opacity-60"
              >
                <span className="font-medium">
                  {busy ? "Selecting..." : suggestion.name || "Location"}
                </span>

                <span className="mt-1 block text-xs text-zinc-500">
                  {getSuggestionLabel(suggestion)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {error ? (
        <pre className="whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </pre>
      ) : null}
    </div>
  );
}