"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase/client";
import {
  DISTANCE_UNIT_CHANGED_EVENT,
  getMyDisplayPreferences,
  type DistanceUnit,
} from "@/services/profiles";

type DistanceUnitContextValue = {
  distanceUnit: DistanceUnit;
};

const DistanceUnitContext =
  createContext<DistanceUnitContextValue>({
    distanceUnit: "km",
  });

export function DistanceUnitProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [distanceUnit, setDistanceUnit] =
    useState<DistanceUnit>("km");

  useEffect(() => {
    let active = true;

    async function loadPreference() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (!session) {
        setDistanceUnit("km");
        return;
      }

      try {
        const preference =
          await getMyDisplayPreferences();

        if (active) {
          setDistanceUnit(
            preference.distance_unit,
          );
        }
      } catch {
        if (active) {
          setDistanceUnit("km");
        }
      }
    }

    function handleDistanceUnitChanged(
      event: Event,
    ) {
      const nextUnit = (
        event as CustomEvent<DistanceUnit>
      ).detail;

      setDistanceUnit(
        nextUnit === "mi" ? "mi" : "km",
      );
    }

    void loadPreference();

    window.addEventListener(
      DISTANCE_UNIT_CHANGED_EVENT,
      handleDistanceUnitChanged,
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setDistanceUnit("km");
          return;
        }

        if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED"
        ) {
          void loadPreference();
        }
      },
    );

    return () => {
      active = false;

      window.removeEventListener(
        DISTANCE_UNIT_CHANGED_EVENT,
        handleDistanceUnitChanged,
      );

      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      distanceUnit,
    }),
    [distanceUnit],
  );

  return (
    <DistanceUnitContext.Provider value={value}>
      {children}
    </DistanceUnitContext.Provider>
  );
}

export function useDistanceUnit(): DistanceUnit {
  return useContext(
    DistanceUnitContext,
  ).distanceUnit;
}
