export const PROFILE_COLOR_OPTIONS = [
  { value: "W", label: "White" },
  { value: "U", label: "Blue" },
  { value: "B", label: "Black" },
  { value: "R", label: "Red" },
  { value: "G", label: "Green" },
  { value: "C", label: "Colorless" },
] as const;

export const PROFILE_FORMAT_OPTIONS = [
  { value: "commander", label: "Commander" },
  { value: "standard", label: "Standard" },
  { value: "pioneer", label: "Pioneer" },
  { value: "modern", label: "Modern" },
  { value: "legacy", label: "Legacy" },
  { value: "vintage", label: "Vintage" },
  { value: "pauper", label: "Pauper" },
  { value: "limited", label: "Limited" },
  { value: "brawl", label: "Brawl" },
  { value: "cedh", label: "cEDH" },
] as const;

export type ProfileColor = (typeof PROFILE_COLOR_OPTIONS)[number]["value"];

export function profileFormatLabel(value: string): string {
  return PROFILE_FORMAT_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
