import type {
  LucideIcon,
} from "lucide-react";
import {
  Bell,
  Library,
  CalendarDays,
  CircleUserRound,
  House,
  Layers3,
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
  | "notifications"
  | "profile";

export type SocialNavigationItem = {
  key: SocialNavigationKey;
  label: string;
  href: string | null;
  icon: LucideIcon;
  mobile: boolean;
  unavailableLabel?: string;
};

export const socialNavigationItems: readonly SocialNavigationItem[] = [
  { key: "home", label: "Home", href: "/home", icon: House, mobile: true },
  { key: "events", label: "Events", href: "/events", icon: CalendarDays, mobile: true },
  {
    key: "playgroups",
    label: "Playgroups",
    href: "/playgroups",
    icon: UsersRound,
    mobile: false,
  },
  {
    key: "players",
    label: "Players",
    href: "/players",
    icon: UserRoundSearch,
    mobile: false,
  },
  { key: "decks", label: "Decks", href: "/decks", icon: Layers3, mobile: true },
  { key: "binder", label: "Binder", href: "/binder", icon: Library, mobile: false },
  {
    key: "notifications",
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    mobile: true,
  },
  {
    key: "profile",
    label: "Profile",
    href: "/profile",
    icon: CircleUserRound,
    mobile: true,
  },
];

const socialRouteRoots = [
  "/home",
  "/events",
  "/create",
  "/check-in",
  "/decks",
  "/binder",
  "/notifications",
  "/playgroups",
  "/players",
  "/profile",
  "/settings",
];

export function isSocialAppRoute(pathname: string): boolean {
  return socialRouteRoots.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

export function getActiveSocialNavigationKey(
  pathname: string,
): SocialNavigationKey | null {
  if (pathname === "/home") return "home";
  if (pathname === "/create" || pathname === "/check-in" || pathname.startsWith("/events")) {
    return "events";
  }
  if (pathname.startsWith("/decks") || pathname.startsWith("/profile/decks")) {
    return "decks";
  }
  if (pathname.startsWith("/binder")) return "binder";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/playgroups")) return "playgroups";
  if (pathname.startsWith("/players")) return "players";
  if (pathname.startsWith("/profile") || pathname.startsWith("/settings")) return "profile";

  return null;
}
