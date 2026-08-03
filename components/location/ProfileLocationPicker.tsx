"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Search, Trash2 } from "lucide-react";

import type {
  LocationVisibility,
  ProfileLocationPayload,
} from "@/services/profiles";

export type ProfileLocationDraft = ProfileLocationPayload;

type ProfileLocationPickerProps = {
  value: ProfileLocationDraft | null;
  onChange: (value: ProfileLocationDraft | null) => void;
  disabled?: boolean;
};

type MapboxContext = {
  id?: string;
  text?: string;
  short_code?: string;
};

type MapboxFeature = {
  id?: string;
  text?: string;
  place_name?: string;
  place_type?: string[];
  center?: [number, number];
  properties?: { short_code?: string };
  context?: MapboxContext[];
};

type MapboxResponse = {
  features?: MapboxFeature[];
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

function emptyLocation(): ProfileLocationDraft {
  return {
    city: "",
    region: null,
    country: "",
    country_code: null,
    place_id: null,
    latitude_approx: null,
    longitude_approx: null,
    visibility: "public",
    discovery_enabled: true,
  };
}

function findContext(
  feature: MapboxFeature,
  prefix: "place" | "locality" | "region" | "country",
): MapboxContext | undefined {
  if (feature.place_type?.includes(prefix)) {
    return {
      id: feature.id,
      text: feature.text,
      short_code: feature.properties?.short_code,
    };
  }

  return feature.context?.find((item) => item.id?.startsWith(`${prefix}.`));
}

function featureToLocation(feature: MapboxFeature): ProfileLocationDraft | null {
  const cityContext =
    findContext(feature, "place") || findContext(feature, "locality");
  const regionContext = findContext(feature, "region");
  const countryContext = findContext(feature, "country");
  const city = cityContext?.text?.trim() || "";
  const country = countryContext?.text?.trim() || "";

  if (!city || !country) {
    return null;
  }

  const countryCode = countryContext?.short_code
    ?.replace(/^country-/i, "")
    .toUpperCase() || null;
  const center = feature.center;

  return {
    city,
    region: regionContext?.text?.trim() || null,
    country,
    country_code: countryCode,
    place_id: feature.id || null,
    latitude_approx: center?.[1] ?? null,
    longitude_approx: center?.[0] ?? null,
    visibility: "public",
    discovery_enabled: true,
  };
}

function mergePreservedPreferences(
  next: ProfileLocationDraft,
  previous: ProfileLocationDraft | null,
): ProfileLocationDraft {
  if (!previous) return next;

  return {
    ...next,
    visibility: previous.visibility,
    discovery_enabled: previous.discovery_enabled,
  };
}

export default function ProfileLocationPicker({
  value,
  onChange,
  disabled = false,
}: ProfileLocationPickerProps) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const cleanSearch = search.trim();

    if (!value || cleanSearch.length < 2 || !MAPBOX_TOKEN) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setSearching(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          access_token: MAPBOX_TOKEN,
          autocomplete: "true",
          types: "place,locality",
          limit: "5",
          language: "en",
        });
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cleanSearch)}.json?${params.toString()}`,
          { signal: abortRef.current.signal },
        );

        if (!response.ok) {
          throw new Error("Could not search locations.");
        }

        const data = (await response.json()) as MapboxResponse;
        setSuggestions(data.features || []);
      } catch (searchError) {
        if (searchError instanceof DOMException && searchError.name === "AbortError") {
          return;
        }
        setError(
          searchError instanceof Error
            ? searchError.message
            : "Could not search locations.",
        );
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, value]);

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("This browser does not support geolocation.");
      return;
    }

    if (!MAPBOX_TOKEN) {
      setError("Location search is unavailable because the Mapbox token is missing.");
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const params = new URLSearchParams({
            access_token: MAPBOX_TOKEN,
            types: "place,locality",
            limit: "1",
            language: "en",
          });
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?${params.toString()}`,
          );

          if (!response.ok) {
            throw new Error("Could not identify your city.");
          }

          const data = (await response.json()) as MapboxResponse;
          const location = data.features?.[0]
            ? featureToLocation(data.features[0])
            : null;

          if (!location) {
            throw new Error("Could not identify a city from your current location.");
          }

          onChange(mergePreservedPreferences(location, value));
          setSearch("");
          setSuggestions([]);
        } catch (locationError) {
          setError(
            locationError instanceof Error
              ? locationError.message
              : "Could not identify your city.",
          );
        } finally {
          setLocating(false);
        }
      },
      (locationError) => {
        setLocating(false);
        setError(
          locationError.code === locationError.PERMISSION_DENIED
            ? "Location permission was denied. You can enter your city manually."
            : "Could not read your current location.",
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }

  function selectSuggestion(feature: MapboxFeature) {
    const location = featureToLocation(feature);
    if (!location) {
      setError("That result did not include a city and country.");
      return;
    }

    onChange(mergePreservedPreferences(location, value));
    setSearch("");
    setSuggestions([]);
    setError(null);
  }

  function updateText(
    field: "city" | "region" | "country",
    nextValue: string,
  ) {
    if (!value) return;

    onChange({
      ...value,
      [field]: nextValue,
      country_code: field === "country" ? null : value.country_code,
      place_id: null,
      latitude_approx: null,
      longitude_approx: null,
    });
  }

  if (!value) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EEE8FF] text-[#6E5AA7]">
            <MapPin size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">Location</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-600">
              Add your city, state or region, and country. Exact coordinates are never shown publicly.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void useCurrentLocation()}
                disabled={disabled || locating}
                className="inline-flex items-center gap-2 rounded-xl bg-[#6E5AA7] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                <LocateFixed size={16} aria-hidden="true" />
                {locating ? "Finding city..." : "Use current location"}
              </button>
              <button
                type="button"
                onClick={() => onChange(emptyLocation())}
                disabled={disabled}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 disabled:opacity-60"
              >
                Enter manually
              </button>
            </div>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Location</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Show where you play without sharing an exact address.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 disabled:opacity-60"
        >
          <Trash2 size={15} aria-hidden="true" /> Remove
        </button>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="relative">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3.5 text-zinc-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search for a city"
            disabled={disabled}
            className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#6E5AA7] disabled:opacity-60"
          />
          {suggestions.length > 0 ? (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
              {suggestions.map((feature) => (
                <button
                  key={feature.id || feature.place_name}
                  type="button"
                  onClick={() => selectSuggestion(feature)}
                  className="block w-full border-b border-zinc-100 px-4 py-3 text-left last:border-b-0 hover:bg-[#F5F1FF]"
                >
                  <span className="block text-sm font-semibold text-zinc-900">
                    {feature.text || "Location"}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    {feature.place_name}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {searching ? <p className="text-xs text-zinc-500">Searching...</p> : null}

        <button
          type="button"
          onClick={() => void useCurrentLocation()}
          disabled={disabled || locating}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#6E5AA7] disabled:opacity-60"
        >
          <LocateFixed size={16} aria-hidden="true" />
          {locating ? "Finding city..." : "Use my current location"}
        </button>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">City</span>
            <input
              value={value.city}
              onChange={(event) => updateText("city", event.target.value)}
              disabled={disabled}
              required
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 disabled:opacity-60"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium">State / Region</span>
            <input
              value={value.region || ""}
              onChange={(event) => updateText("region", event.target.value)}
              disabled={disabled}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 disabled:opacity-60"
            />
          </label>

          <label className="grid gap-2 sm:col-span-2">
            <span className="text-sm font-medium">Country</span>
            <input
              value={value.country}
              onChange={(event) => updateText("country", event.target.value)}
              disabled={disabled}
              required
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 disabled:opacity-60"
            />
          </label>
        </div>

        <div className="grid gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Who can see this?</span>
            <select
              value={value.visibility}
              onChange={(event) =>
                onChange({
                  ...value,
                  visibility: event.target.value as LocationVisibility,
                })
              }
              disabled={disabled}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 disabled:opacity-60"
            >
              <option value="public">Public</option>
              <option value="connections">Connections</option>
              <option value="private">Only me</option>
            </select>
          </label>

          <label className="flex items-start gap-3 rounded-xl bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={value.discovery_enabled}
              onChange={(event) =>
                onChange({ ...value, discovery_enabled: event.target.checked })
              }
              disabled={disabled}
              className="mt-1 h-4 w-4 accent-[#6E5AA7]"
            />
            <span>
              <span className="block text-sm font-medium">Use for nearby results</span>
              <span className="mt-1 block text-xs leading-5 text-zinc-500">
                Helps sort nearby Binder cards and future local suggestions. Coordinates stay private.
              </span>
            </span>
          </label>
        </div>

        {value.latitude_approx != null && value.longitude_approx != null ? (
          <p className="text-xs text-zinc-500">
            Approximate coordinates are available for nearby sorting and are never shown on profiles.
          </p>
        ) : (
          <p className="text-xs text-zinc-500">
            Manual text will still appear on your profile. Select a search result or use current location for distance sorting.
          </p>
        )}

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>
    </section>
  );
}
