"use client";

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Coordinates = {
  lat: number;
  lng: number;
};

type LocationContextType = {
  coords: Coordinates | null;
  locationLabel: string;
  setLocationLabel: (value: string) => void;
  radius: number;
  setRadius: (value: number) => void;
  loadingLocation: boolean;
  applyLocation: (
    coords: Coordinates,
    label?: string,
    nextRadius?: number
  ) => void;
  requestLocation: () => Promise<Coordinates | null>;
};

const LocationContext = createContext<LocationContextType | null>(null);

const COORDS_KEY = "untapgo_coords";
const RADIUS_KEY = "untapgo_radius";
const LABEL_KEY = "untapgo_location_label";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState("Choose area");
  const [radius, setRadiusState] = useState(25);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    const savedCoords = localStorage.getItem(COORDS_KEY);
    const savedRadius = localStorage.getItem(RADIUS_KEY);
    const savedLabel = localStorage.getItem(LABEL_KEY);

    if (savedCoords) {
      try {
        const parsed = JSON.parse(savedCoords);

        if (
          typeof parsed.lat === "number" &&
          typeof parsed.lng === "number"
        ) {
          setCoords(parsed);
        }
      } catch {
        console.warn("Invalid saved UntapGo coords");
      }
    }

    if (savedRadius) {
      const parsedRadius = Number(savedRadius);
      if (Number.isFinite(parsedRadius)) {
        setRadiusState(parsedRadius);
      }
    }

    if (savedLabel) {
      setLocationLabel(savedLabel);
    }
  }, []);

  const setRadius = useCallback(
    (value: number) => {
      setRadiusState(value);
      localStorage.setItem(
        RADIUS_KEY,
        String(value),
      );
    },
    [],
  );

  const applyLocation =
    useCallback(
      (
        nextCoords: Coordinates,
        label = "Selected area",
        nextRadius = radius,
      ) => {
        setCoords(nextCoords);
        setLocationLabel(label);
        setRadiusState(
          nextRadius,
        );

        localStorage.setItem(
          COORDS_KEY,
          JSON.stringify(
            nextCoords,
          ),
        );
        localStorage.setItem(
          LABEL_KEY,
          label,
        );
        localStorage.setItem(
          RADIUS_KEY,
          String(nextRadius),
        );
      },
      [radius],
    );

  const requestLocation =
    useCallback(() => {
      return new Promise<Coordinates | null>(
        (resolve) => {
          if (
            !navigator.geolocation
          ) {
            resolve(null);
            return;
          }

          setLoadingLocation(
            true,
          );

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const nextCoords = {
                lat: position
                  .coords.latitude,
                lng: position
                  .coords.longitude,
              };

              applyLocation(
                nextCoords,
                "Current location",
              );
              setLoadingLocation(
                false,
              );
              resolve(
                nextCoords,
              );
            },
            (error) => {
              console.warn(
                "Location error",
                error,
              );
              setLoadingLocation(
                false,
              );
              resolve(null);
            },
            {
              enableHighAccuracy:
                true,
              timeout: 10000,
            },
          );
        },
      );
    }, [applyLocation]);

  const value = useMemo(
    () => ({
      coords,
      locationLabel,
      setLocationLabel,
      radius,
      setRadius,
      loadingLocation,
      applyLocation,
      requestLocation,
    }),
    [
      applyLocation,
      coords,
      loadingLocation,
      locationLabel,
      radius,
      requestLocation,
      setRadius,
    ]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error("useLocation must be used inside LocationProvider");
  }

  return context;
}
