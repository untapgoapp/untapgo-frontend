import type { DistanceUnit } from "@/services/profiles";


const KILOMETRES_PER_MILE = 1.609344;


export function kilometresToMiles(
  kilometres: number,
): number {
  return kilometres / KILOMETRES_PER_MILE;
}


export function milesToKilometres(
  miles: number,
): number {
  return miles * KILOMETRES_PER_MILE;
}


export function distanceFromKilometres(
  distanceKm: number,
  unit: DistanceUnit,
): number {
  return unit === "mi"
    ? kilometresToMiles(distanceKm)
    : distanceKm;
}


export function distanceToKilometres(
  distance: number,
  unit: DistanceUnit,
): number {
  return unit === "mi"
    ? milesToKilometres(distance)
    : distance;
}


export function formatDistanceAway(
  distanceKm: number | null | undefined,
  unit: DistanceUnit,
): string | null {
  if (
    typeof distanceKm !== "number" ||
    !Number.isFinite(distanceKm) ||
    distanceKm < 0
  ) {
    return null;
  }

  if (unit === "mi") {
    const miles = kilometresToMiles(distanceKm);

    return `${miles.toFixed(
      miles < 10 ? 1 : 0,
    )} mi away`;
  }

  if (distanceKm < 1) {
    return `${Math.max(
      1,
      Math.round(distanceKm * 1000),
    )} m away`;
  }

  return `${distanceKm.toFixed(
    distanceKm < 10 ? 1 : 0,
  )} km away`;
}


export function formatSearchDistance(
  distanceKm: number,
  unit: DistanceUnit,
): string {
  const displayValue =
    distanceFromKilometres(
      distanceKm,
      unit,
    );

  const rounded =
    displayValue >= 10
      ? Math.round(displayValue)
      : Math.round(displayValue * 10) / 10;

  return `${rounded} ${unit}`;
}
