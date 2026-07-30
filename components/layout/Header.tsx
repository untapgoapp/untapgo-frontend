"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  Menu,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  usePathname,
} from "next/navigation";

import NotificationBell from "@/components/notifications/NotificationBell";
import { supabase } from "@/lib/supabase/client";
import {
  getProfileAvatarUrl,
  getProfileNickname,
  getPublicProfile,
  type PublicProfile,
} from "@/services/profiles";

import styles from "./Header.module.css";

type HeaderProps = {
  variant?:
    | "default"
    | "overlay";
  hideOnMapMobile?: boolean;
  modalOpen?: boolean;
};

const navLinks = [
  {
    href: "/events",
    label: "Explore",
  },
  {
    href: "/events?view=map",
    label: "Map",
  },
  {
    href: "/events/saved",
    label: "Saved",
  },
  {
    href: "/create",
    label: "Host Game",
  },
];

const landingNavLinks = [
  {
    href: "/events",
    label: "Explore events",
  },
  {
    href: "/#how-it-works",
    label: "How it works",
  },
];

function getSearchFromHref(
  href: string,
): string {
  const index =
    href.indexOf("?");

  if (index === -1) {
    return "";
  }

  return href.slice(index);
}

function isActive(
  pathname: string,
  search: string,
  href: string,
): boolean {
  const view =
    new URLSearchParams(
      search,
    ).get("view");

  if (
    href === "/events"
  ) {
    return (
      pathname ===
        "/events" &&
      view !== "map"
    );
  }

  if (
    href ===
    "/events?view=map"
  ) {
    return (
      pathname ===
        "/events" &&
      view === "map"
    );
  }

  if (
    href ===
    "/events/saved"
  ) {
    return (
      pathname ===
        "/events/saved" ||
      pathname.startsWith(
        "/events/saved/",
      )
    );
  }

  return pathname === href;
}

export default function Header({
  variant = "default",
  hideOnMapMobile = false,
  modalOpen = false,
}: HeaderProps) {
  const pathname =
    usePathname();

  const [
    currentSearch,
    setCurrentSearch,
  ] = useState("");

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);
  const [
    hasScrolled,
    setHasScrolled,
  ] = useState(false);

  const [
    userId,
    setUserId,
  ] = useState<string | null>(
    null,
  );

  const [
    profile,
    setProfile,
  ] =
    useState<PublicProfile | null>(
      null,
    );

  const isOverlay =
    variant === "overlay";
  const isLanding =
    pathname === "/";
  const visibleNavLinks =
    isLanding
      ? landingNavLinks
      : navLinks;

  const nickname = profile
    ? getProfileNickname(
        profile,
      )
    : "Player";

  const avatarUrl = profile
    ? getProfileAvatarUrl(
        profile,
      )
    : null;

  const closeMenus =
    useCallback(() => {
      setMenuOpen(false);
    }, []);

  const loadProfile =
    useCallback(
      async (
        nextUserId: string,
      ) => {
        try {
          const loadedProfile =
            await getPublicProfile(
              nextUserId,
            );

          setProfile(
            loadedProfile,
          );
        } catch {
          setProfile(null);
        }
      },
      [],
    );

  const loadUser =
    useCallback(async () => {
      const {
        data,
        error,
      } =
        await supabase.auth.getUser();

      if (
        error ||
        !data.user
      ) {
        setUserId(null);
        setProfile(null);

        return;
      }

      setUserId(
        data.user.id,
      );

      await loadProfile(
        data.user.id,
      );
    }, [loadProfile]);

  useEffect(() => {
    function syncSearch() {
      setCurrentSearch(
        window.location.search,
      );
    }

    syncSearch();

    window.addEventListener(
      "popstate",
      syncSearch,
    );

    return () => {
      window.removeEventListener(
        "popstate",
        syncSearch,
      );
    };
  }, []);

  useEffect(() => {
    function syncScroll() {
      setHasScrolled(
        window.scrollY > 12,
      );
    }

    syncScroll();
    window.addEventListener(
      "scroll",
      syncScroll,
      { passive: true },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        syncScroll,
      );
    };
  }, []);

  useEffect(() => {
    closeMenus();

    setCurrentSearch(
      window.location.search,
    );
  }, [
    pathname,
    closeMenus,
  ]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        closeMenus();
      }
    }

    document.body.style.overflow =
      "hidden";
    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [menuOpen, closeMenus]);

  useEffect(() => {
    void loadUser();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        () => {
          void loadUser();
        },
      );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUser]);

  function handleNavClick(
    href: string,
  ) {
    setCurrentSearch(
      getSearchFromHref(
        href,
      ),
    );

    closeMenus();
  }

  return (
    <header
      className={`${styles.header} ${
        isOverlay
          ? styles.headerOverlay
          : styles.headerDefault
      } ${
        hideOnMapMobile
          ? styles.hideOnMapMobile
          : ""
      } ${
        modalOpen
          ? styles.headerBehindModal
          : ""
      }`}
    >
      <div
        className={`${styles.pill} ${
          isOverlay
            ? styles.pillOverlay
            : styles.pillDefault
        } ${isLanding ? styles.landingPill : ""} ${
          isLanding && hasScrolled
            ? styles.landingPillScrolled
            : ""
        }`}
      >
        <Link
          href="/"
          className={
            styles.logoLink
          }
          onClick={
            closeMenus
          }
        >
          <img
            src="/logo.png"
            className={
              styles.logoImg
            }
            alt="UntapGo"
          />
        </Link>

        <div
          className={
            styles.desktopDivider
          }
        />

        <nav
          className={
            styles.nav
          }
          aria-label="Main navigation"
        >
          {visibleNavLinks.map(
            (link) => (
              <Link
                key={
                  link.href
                }
                href={
                  link.href
                }
                onClick={() => {
                  handleNavClick(
                    link.href,
                  );
                }}
                className={`${
                  styles.navItem
                } ${
                  isActive(
                    pathname,
                    currentSearch,
                    link.href,
                  )
                    ? styles.navItemActive
                    : ""
                }`}
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div
          className={
            styles.desktopDivider
          }
        />

        <div
          className={
            styles.actions
          }
        >
          {userId ? (
            <>
              {isLanding ? (
                <Link
                  href="/create"
                  className={styles.btnSolid}
                >
                  Create an event
                </Link>
              ) : null}
              <NotificationBell />

              <Link
                href="/profile"
                className={
                  styles.profileButton
                }
                onClick={
                  closeMenus
                }
              >
                <span
                  className={
                    styles.avatar
                  }
                >
                  {avatarUrl ? (
                    <img
                      src={
                        avatarUrl
                      }
                      alt=""
                    />
                  ) : (
                    nickname
                      .slice(0, 1)
                      .toUpperCase()
                  )}
                </span>

                <span
                  className={
                    styles.profileName
                  }
                >
                  {nickname}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={
                  styles.btnGhost
                }
              >
                Sign in
              </Link>

              <Link
                href={isLanding ? "/login?next=%2Fcreate" : "/login"}
                className={
                  styles.btnSolid
                }
              >
                {isLanding ? "Create an event" : "Sign up"}
              </Link>
            </>
          )}
        </div>

        {isLanding ? (
          <Link
            href="/events"
            className={styles.mobilePrimary}
            onClick={closeMenus}
          >
            Explore
          </Link>
        ) : null}

        <button
          type="button"
          className={
            styles.menuButton
          }
          onClick={() => {
            setMenuOpen(
              (current) =>
                !current,
            );
          }}
          aria-label={
            menuOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={
            menuOpen
          }
        >
          {menuOpen ? (
            <X size={18} />
          ) : (
            <Menu
              size={18}
            />
          )}
        </button>
      </div>

      {menuOpen ? (
        <div
          className={`${
            styles.mobileMenu
          } ${
            isOverlay
              ? styles.mobileMenuOverlay
              : styles.mobileMenuDefault
          }`}
        >
          {visibleNavLinks.map(
            (link) => (
              <Link
                key={
                  link.href
                }
                href={
                  link.href
                }
                className={
                  `${styles.mobileItem} ${
                    isActive(
                      pathname,
                      currentSearch,
                      link.href,
                    )
                      ? styles.mobileItemActive
                      : ""
                  }`
                }
                onClick={() => {
                  handleNavClick(
                    link.href,
                  );
                }}
              >
                {link.label}
              </Link>
            ),
          )}

          {userId ? (
            <>
              <Link
                href="/notifications"
                className={
                  styles.mobileItem
                }
                onClick={
                  closeMenus
                }
              >
                Notifications
              </Link>

            </>
          ) : null}

          {!userId ? (
            <div
              className={
                styles.mobileActions
              }
            >
              <>
                <Link
                  href="/login"
                  className={
                    styles.mobileGhost
                  }
                  onClick={
                    closeMenus
                  }
                >
                  Sign in
                </Link>

                <Link
                  href={isLanding ? "/login?next=%2Fcreate" : "/login"}
                  className={
                    styles.mobileSolid
                  }
                  onClick={
                    closeMenus
                  }
                >
                  {isLanding ? "Create event" : "Sign up"}
                </Link>
              </>
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
