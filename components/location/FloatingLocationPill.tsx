"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, Search, MapPin, X } from "lucide-react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import { useLocation } from "@/components/location/LocationContext";

type MapboxResult = {
  id: string;
  place_name: string;
  center: [number, number];
};

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const DEFAULT_COORDS = {
  lat: 40.7484,
  lng: -73.9857,
};

export default function FloatingLocationPill() {
  const {
    coords,
    radius,
    setRadius,
    applyLocation,
    requestLocation,
    loadingLocation,
  } = useLocation();

  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [tempLat, setTempLat] = useState(coords?.lat || DEFAULT_COORDS.lat);
  const [tempLng, setTempLng] = useState(coords?.lng || DEFAULT_COORDS.lng);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<MapboxResult[]>([]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    function openModal() {
      setOpen(true);
    }

    window.addEventListener("open-location-modal", openModal);

    return () => {
      window.removeEventListener("open-location-modal", openModal);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const nextCoords = coords || DEFAULT_COORDS;

    setTempLat(nextCoords.lat);
    setTempLng(nextCoords.lng);
  }, [open, coords]);

  useEffect(() => {
    if (!open) return;
    if (!mapContainerRef.current) return;
    if (!mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const startCoords = coords || DEFAULT_COORDS;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [startCoords.lng, startCoords.lat],
      zoom: getPreviewZoomForRadius(radius),
      minZoom: 3.5,
      projection: "mercator",
      attributionControl: false,
    });

    const markerElement = document.createElement("div");
    markerElement.className =
      "h-4 w-4 rounded-full border-2 border-white bg-black shadow-lg";

    const marker = new mapboxgl.Marker({
      element: markerElement,
      anchor: "center",
    })
      .setLngLat([startCoords.lng, startCoords.lat])
      .addTo(map);

    map.on("move", () => {
      const center = map.getCenter();
      marker.setLngLat([center.lng, center.lat]);
    });

    map.on("moveend", () => {
      const center = map.getCenter();

      setTempLat(center.lat);
      setTempLng(center.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [open, coords, radius]);

  async function searchLocation(value: string) {
    setSearch(value);

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    if (!mapboxToken) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          value
        )}.json?access_token=${mapboxToken}&limit=5`
      );

      const data = await response.json();

      setResults(data.features || []);
    } catch (error) {
      console.error("Location search failed", error);
    }
  }

  function flyToLocation(lat: number, lng: number) {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: getPreviewZoomForRadius(radius),
      duration: 900,
    });

    markerRef.current?.setLngLat([lng, lat]);
  }

  function applySelectedLocation() {
    const nextCoords = {
      lat: tempLat,
      lng: tempLng,
    };

    const label = search.trim() || "Selected area";

    applyLocation(nextCoords, label, radius);

    router.push(
      `/events?view=map&lat=${nextCoords.lat}&lng=${nextCoords.lng}&radius=${radius}`
    );

    setOpen(false);
  }

  return (
    <>
      <button
        data-floating-location-trigger
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Choose discovery area"
        className="fixed bottom-5 left-5 z-40 grid h-[52px] w-[52px] place-items-center rounded-full border border-black/10 bg-white/[0.92] text-black shadow-[0_16px_48px_rgba(0,0,0,0.12)] backdrop-blur-xl transition hover:bg-white"
      >
        <MapPin className="h-5 w-5" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close location modal"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[19999] bg-black/20 backdrop-blur-sm"
          />

          <div className="fixed left-1/2 top-1/2 z-[20000] w-[90%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-black/10 bg-[#FBF7F1] p-4 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-[22px] font-semibold leading-tight">
                  Discovery area
                </h2>

                <p className="mt-1 text-sm text-black/50">
                  Choose where to look for games.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 transition hover:bg-black/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mb-3">
              <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-3">
                <Search className="h-4 w-4 text-black/40" />

                <input
                  value={search}
                  onChange={(event) => searchLocation(event.target.value)}
                  placeholder="Search city or area"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>

              {results.length > 0 ? (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[99999] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
                  {results.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const lng = item.center[0];
                        const lat = item.center[1];

                        setTempLng(lng);
                        setTempLat(lat);
                        setSearch(item.place_name);
                        setResults([]);

                        flyToLocation(lat, lng);
                      }}
                      className="w-full border-b border-black/5 px-4 py-3 text-left text-sm transition last:border-b-0 hover:bg-black/5"
                    >
                      {item.place_name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative overflow-hidden rounded-[24px] border border-black/10">
              <div ref={mapContainerRef} className="h-[176px] w-full" />

              {!mapboxToken ? (
                <div className="absolute inset-0 grid place-items-center bg-white text-sm text-black/50">
                  Missing Mapbox token.
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={async () => {
                const nextCoords = await requestLocation();

                if (!nextCoords) return;

                setTempLat(nextCoords.lat);
                setTempLng(nextCoords.lng);
                setSearch("Current location");

                flyToLocation(nextCoords.lat, nextCoords.lng);
              }}
              disabled={loadingLocation}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3.5 text-sm font-medium text-white transition hover:opacity-95 disabled:opacity-50"
            >
              <Navigation className="h-4 w-4" />

              {loadingLocation ? "Detecting location..." : "Use current location"}
            </button>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-black/50">Search distance</span>

                <span className="text-sm font-medium">{radius} km</span>
              </div>

              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={radius}
                onChange={(event) => {
                  const nextRadius = Number(event.target.value);
                  setRadius(nextRadius);

                  mapRef.current?.easeTo({
                    zoom: getPreviewZoomForRadius(nextRadius),
                    duration: 300,
                  });
                }}
                style={{
                  background: `linear-gradient(to right, rgba(45,45,45,0.38) 0%, rgba(45,45,45,0.38) ${radius}%, rgba(0,0,0,0.08) ${radius}%, rgba(0,0,0,0.08) 100%)`,
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full accent-black"
              />
            </div>

            <button
              type="button"
              onClick={applySelectedLocation}
              className="mt-5 w-full rounded-2xl bg-black/5 px-4 py-3.5 text-sm font-medium text-black transition hover:bg-black/10"
            >
              Apply area
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}

function getPreviewZoomForRadius(radiusKm: number) {
  if (radiusKm <= 2) return 14;
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 25) return 10.8;
  if (radiusKm <= 50) return 9.6;
  if (radiusKm <= 75) return 8.8;
  return 8;
}
