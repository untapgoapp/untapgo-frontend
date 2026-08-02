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
  UserCheck,
  UserPlus,
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
  mobilePrimary?: number;
  mobileSecondary?: number;
  matches: (pathname: string) => boolean;
};

export type ContextualNavigationKey = "binder" | "decks" | "players";

export type ContextualNavigationItem = {
  key: string;
  label: string;
  href: string;
  views: readonly string[];
  icon?: LucideIcon;
};

export type ContextualNavigationSection = {
  key: ContextualNavigationKey;
  label: string;
  selectorLabel: string;
  items: readonly ContextualNavigationItem[];
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
    matches: (pathname) => atRoot(pathname, "/decks")
      || atRoot(pathname, "/profile/decks")
      || /^\/profile\/[^/]+\/decks(?:\/|$)/.test(pathname),
  },
  {
    key: "profile", label: "Profile", href: "/profile", icon: CircleUserRound,
    mobileSecondary: 3,
    matches: (pathname) => atRoot(pathname, "/profile"),
  },
  {
    key: "favorites", label: "Favorites", href: "/profile/favorites", icon: Heart,
    mobileSecondary: 4,
    matches: (pathname) => atRoot(pathname, "/profile/favorites"),
  },
  {
    key: "settings", label: "Settings", href: "/settings", icon: Settings,
    mobileSecondary: 5,
    matches: (pathname) => atRoot(pathname, "/settings"),
  },
  {
    key: "blocked", label: "Blocked players", href: "/profile/blocked", icon: ShieldBan,
    mobileSecondary: 6,
    matches: (pathname) => atRoot(pathname, "/profile/blocked"),
  },
];

export const mobileMoreNavigationItem = {
  key: "more" as const,
  label: "More",
  icon: Ellipsis,
};

export const contextualNavigationSections: Record<ContextualNavigationKey, ContextualNavigationSection> = {
  players: {
    key: "players",
    label: "PLAYERS",
    selectorLabel: "Player sections",
    items: [
      { key: "discover", label: "Discover", href: "/players?view=discover", views: ["discover"], icon: UserRoundSearch },
      { key: "connections", label: "Connections", href: "/players?view=connections", views: ["connections"], icon: UsersRound },
      { key: "followers", label: "Followers", href: "/players?view=followers", views: ["followers"], icon: UserPlus },
      { key: "following", label: "Following", href: "/players?view=following", views: ["following"], icon: UserCheck },
    ],
  },
  binder: {
    key: "binder",
    label: "BINDER",
    selectorLabel: "Binder sections",
    items: [
      { key: "community", label: "Community", href: "/binder?view=community", views: ["community"] },
      { key: "items", label: "My Binder", href: "/binder?view=items", views: ["items"] },
      { key: "wanted", label: "Wanted List", href: "/binder?view=wanted", views: ["wanted"] },
      { key: "matches", label: "Matches", href: "/binder?view=matches", views: ["matches"] },
      { key: "requests", label: "Trade requests", href: "/binder?view=received", views: ["received", "sent"] },
    ],
  },
  decks: {
    key: "decks",
    label: "DECKS",
    selectorLabel: "Deck sections",
    items: [
      { key: "community", label: "Community", href: "/decks?view=community", views: ["community"] },
      { key: "mine", label: "My Decks", href: "/decks?view=mine", views: ["mine"] },
      { key: "saved", label: "Saved Decks", href: "/decks?view=saved", views: ["saved"] },
    ],
  },
};

export const desktopNavigationItems = socialNavigationItems
  .filter((item) => item.desktopPrimary !== undefined)
  .sort((left, right) => left.desktopPrimary! - right.desktopPrimary!);
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
  const specificSecondaryMatch = mobileSecondaryNavigationItems.find(
    (item) => item.key !== "profile" && item.matches(pathname),
  );
  return specificSecondaryMatch?.key
    ?? mobileSecondaryNavigationItems.find((item) => item.key === "profile" && item.matches(pathname))?.key
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

export function getContextualNavigation(
  pathname: string,
  requestedView: string | null,
): { section: ContextualNavigationSection; activeKey: string | null } | null {
  if (atRoot(pathname, "/players")) {
    const section = contextualNavigationSections.players;
    const activeKey = pathname === "/players"
      ? section.items.find((item) => item.views.includes(requestedView ?? "discover"))?.key ?? "discover"
      : null;
    return { section, activeKey };
  }

  if (atRoot(pathname, "/binder")) {
    const section = contextualNavigationSections.binder;
    const activeKey = pathname === "/binder"
      ? section.items.find((item) => item.views.includes(requestedView ?? "community"))?.key ?? "community"
      : null;
    return { section, activeKey };
  }

  const isDeckRoute = atRoot(pathname, "/decks") || atRoot(pathname, "/profile/decks");
  if (!isDeckRoute) return null;

  const section = contextualNavigationSections.decks;
  const isListRoute = pathname === "/decks" || pathname === "/profile/decks";
  const defaultView = pathname === "/profile/decks" ? "mine" : "community";
  const activeKey = isListRoute
    ? section.items.find((item) => item.views.includes(requestedView ?? defaultView))?.key ?? defaultView
    : null;
  return { section, activeKey };
}
