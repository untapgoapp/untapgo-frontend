import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CircleUserRound,
  Ellipsis,
  Heart,
  House,
  Layers3,
  Library,
  Settings,
  ShieldBan,
  UserRoundSearch,
  UsersRound,
} from "lucide-react";

export type SocialNavigationKey =
  | "home"
  | "events"
  | "playgroups"
  | "players"
  | "decks"
  | "binder"
  | "profile"
  | "favorites"
  | "settings"
  | "blocked";

export type SocialNavigationItem = {
  key: SocialNavigationKey;
  label: string;
  href: string;
  icon: LucideIcon;
  desktopPrimary?: number;
  desktopSecondary?: number;
  mobilePrimary?: number;
  mobileSecondary?: number;
  matches: (pathname: string) => boolean;
};

const atRoot = (pathname: string, root: string) => (
  pathname === root || pathname.startsWith(`${root}/`)
);

export const socialNavigationItems: readonly SocialNavigationItem[] = [
  {
    key: "home", label: "Home", href: "/home", icon: House, desktopPrimary: 1,
    mobilePrimary: 1, matches: (pathname) => pathname === "/home",
  },
  {
    key: "events", label: "Events", href: "/events", icon: CalendarDays, desktopPrimary: 2,
    mobilePrimary: 2,
    matches: (pathname) => pathname === "/create" || pathname === "/check-in" || atRoot(pathname, "/events"),
  },
  {
    key: "players", label: "Players", href: "/players", icon: UserRoundSearch,
    desktopPrimary: 3, mobilePrimary: 4, matches: (pathname) => atRoot(pathname, "/players"),
  },
  {
    key: "playgroups", label: "Playgroups", href: "/playgroups", icon: UsersRound,
    desktopPrimary: 4, mobilePrimary: 3, matches: (pathname) => atRoot(pathname, "/playgroups"),
  },
  {
    key: "binder", label: "Binder", href: "/binder", icon: Library, desktopPrimary: 5,
    mobileSecondary: 1,
    matches: (pathname) => atRoot(pathname, "/binder") || /^\/profile\/[^/]+\/binder(?:\/|$)/.test(pathname),
  },
  {
    key: "decks", label: "Decks", href: "/decks", icon: Layers3, desktopPrimary: 6,
    mobileSecondary: 2,
    matches: (pathname) => atRoot(pathname, "/decks") || atRoot(pathname, "/profile/decks"),
  },
  {
    key: "profile", label: "Profile", href: "/profile", icon: CircleUserRound,
    desktopSecondary: 1, mobileSecondary: 3,
    matches: (pathname) => atRoot(pathname, "/profile"),
  },
  {
    key: "favorites", label: "Favorites", href: "/profile/favorites", icon: Heart,
    desktopSecondary: 2, mobileSecondary: 4,
    matches: (pathname) => atRoot(pathname, "/profile/favorites"),
  },
  {
    key: "settings", label: "Settings", href: "/settings", icon: Settings,
    desktopSecondary: 3, mobileSecondary: 5,
    matches: (pathname) => atRoot(pathname, "/settings"),
  },
  {
    key: "blocked", label: "Blocked players", href: "/profile/blocked", icon: ShieldBan,
    desktopSecondary: 4, mobileSecondary: 6,
    matches: (pathname) => atRoot(pathname, "/profile/blocked"),
  },
];

export const mobileMoreNavigationItem = {
  key: "more" as const,
  label: "More",
  icon: Ellipsis,
};

export const desktopNavigationItems = socialNavigationItems
  .filter((item) => item.desktopPrimary !== undefined)
  .sort((left, right) => left.desktopPrimary! - right.desktopPrimary!);
export const desktopSecondaryNavigationItems = socialNavigationItems
  .filter((item) => item.desktopSecondary !== undefined)
  .sort((left, right) => left.desktopSecondary! - right.desktopSecondary!);
export const mobilePrimaryNavigationItems = socialNavigationItems
  .filter((item) => item.mobilePrimary !== undefined)
  .sort((left, right) => left.mobilePrimary! - right.mobilePrimary!);
export const mobileSecondaryNavigationItems = socialNavigationItems
  .filter((item) => item.mobileSecondary !== undefined)
  .sort((left, right) => left.mobileSecondary! - right.mobileSecondary!);

const socialRouteRoots = [
  "/home", "/events", "/create", "/check-in", "/decks", "/binder",
  "/notifications", "/playgroups", "/players", "/profile", "/settings",
];

export function isSocialAppRoute(pathname: string): boolean {
  return socialRouteRoots.some((root) => atRoot(pathname, root));
}

export function getActiveSocialNavigationKey(pathname: string): SocialNavigationKey | null {
  const primaryMatch = desktopNavigationItems.find((item) => item.matches(pathname));
  if (primaryMatch) return primaryMatch.key;
  const specificSecondaryMatch = desktopSecondaryNavigationItems.find(
    (item) => item.key !== "profile" && item.matches(pathname),
  );
  return specificSecondaryMatch?.key
    ?? desktopSecondaryNavigationItems.find((item) => item.key === "profile" && item.matches(pathname))?.key
    ?? null;
}

export function getActiveMobileSecondaryNavigationKey(pathname: string): SocialNavigationKey | null {
  const specificMatch = mobileSecondaryNavigationItems.find(
    (item) => item.key !== "profile" && item.matches(pathname),
  );
  return specificMatch?.key
    ?? mobileSecondaryNavigationItems.find((item) => item.key === "profile" && item.matches(pathname))?.key
    ?? null;
}

export function isMobileMoreRoute(pathname: string): boolean {
  return getActiveMobileSecondaryNavigationKey(pathname) !== null;
}
