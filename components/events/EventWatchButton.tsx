"use client";

import {
  useEffect,
  useState,
  type MouseEvent,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  Bookmark,
  LoaderCircle,
} from "lucide-react";

import {
  getWatchlist,
  unwatchEvent,
  watchEvent,
  WATCHLIST_CHANGED_EVENT,
  type WatchlistChangedDetail,
} from "@/services/events";

type EventWatchButtonProps = {
  eventId: string;
  initialWatched?: boolean;
  variant?: "icon" | "button";
  className?: string;
  onChanged?: (
    watched: boolean,
  ) => void;
};

type AuthenticationState =
  | "checking"
  | "authenticated"
  | "guest";

function isUnauthorized(
  error: unknown,
): boolean {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  return (
    Number(
      (
        error as {
          status?: unknown;
        }
      ).status,
    ) === 401
  );
}

export default function EventWatchButton({
  eventId,
  initialWatched,
  variant = "icon",
  className = "",
  onChanged,
}: EventWatchButtonProps) {
  const router = useRouter();
  const pathname =
    usePathname();

  const [
    mounted,
    setMounted,
  ] = useState(false);

  const [
    watched,
    setWatched,
  ] = useState(
    initialWatched ??
      false,
  );

  const [
    authenticationState,
    setAuthenticationState,
  ] =
    useState<AuthenticationState>(
      "checking",
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setMounted(true);
      }, 0);

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, []);

  useEffect(() => {
    if (
      initialWatched !==
      undefined
    ) {
      const timer =
        window.setTimeout(() => {
          setWatched(
            initialWatched,
          );
        }, 0);

      return () => {
        window.clearTimeout(
          timer,
        );
      };
    }
  }, [initialWatched]);

  useEffect(() => {
    let active = true;

    async function loadState() {
      try {
        const events =
          await getWatchlist();

        if (!active) {
          return;
        }

        setAuthenticationState(
          "authenticated",
        );

        setWatched(
          events.some(
            (event) =>
              String(
                event.id,
              ) ===
              String(eventId),
          ),
        );
      } catch (loadError) {
        if (!active) {
          return;
        }

        if (
          isUnauthorized(
            loadError,
          )
        ) {
          setAuthenticationState(
            "guest",
          );

          setWatched(false);

          return;
        }

        setAuthenticationState(
          "authenticated",
        );

        setError(
          loadError instanceof
            Error
            ? loadError.message
            : "Could not load saved state.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadState();

    return () => {
      active = false;
    };
  }, [eventId]);

  useEffect(() => {
    function handleWatchlistChanged(
      browserEvent: Event,
    ) {
      const event =
        browserEvent as CustomEvent<WatchlistChangedDetail>;

      if (
        String(
          event.detail?.eventId,
        ) !== String(eventId)
      ) {
        return;
      }

      setWatched(
        Boolean(
          event.detail.watched,
        ),
      );
    }

    window.addEventListener(
      WATCHLIST_CHANGED_EVENT,
      handleWatchlistChanged,
    );

    return () => {
      window.removeEventListener(
        WATCHLIST_CHANGED_EVENT,
        handleWatchlistChanged,
      );
    };
  }, [eventId]);

  async function handleClick(
    clickEvent: MouseEvent<HTMLButtonElement>,
  ) {
    clickEvent.preventDefault();
    clickEvent.stopPropagation();

    if (
      loading ||
      saving
    ) {
      return;
    }

    if (
      authenticationState ===
      "guest"
    ) {
      const nextPath =
        pathname ||
        `/events/${eventId}`;

      router.push(
        `/login?next=${encodeURIComponent(
          nextPath,
        )}`,
      );

      return;
    }

    const nextWatched =
      !watched;

    setSaving(true);
    setError(null);
    setWatched(
      nextWatched,
    );

    try {
      if (nextWatched) {
        await watchEvent(
          eventId,
        );
      } else {
        await unwatchEvent(
          eventId,
        );
      }

      setAuthenticationState(
        "authenticated",
      );

      onChanged?.(
        nextWatched,
      );
    } catch (saveError) {
      setWatched(
        !nextWatched,
      );

      if (
        isUnauthorized(
          saveError,
        )
      ) {
        setAuthenticationState(
          "guest",
        );

        const nextPath =
          pathname ||
          `/events/${eventId}`;

        router.push(
          `/login?next=${encodeURIComponent(
            nextPath,
          )}`,
        );

        return;
      }

      setError(
        saveError instanceof
          Error
          ? saveError.message
          : "Could not update saved event.",
      );
    } finally {
      setSaving(false);
    }
  }

  const busy =
    !mounted ||
    loading ||
    saving;

  const visibleWatched =
    mounted
      ? watched
      : Boolean(
          initialWatched,
        );

  const label =
    visibleWatched
      ? "Saved"
      : "Save";

  const title = error
    ? error
    : visibleWatched
      ? "Remove from saved events"
      : "Save event";

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={
          handleClick
        }
        disabled={busy}
        aria-pressed={
          visibleWatched
        }
        aria-label={title}
        title={title}
        className={[
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-[0_6px_18px_rgba(58,44,82,0.06)] outline-none transition active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20 disabled:cursor-wait disabled:opacity-60",
          visibleWatched
            ? "border-[#6E5AA7]/20 bg-[#EEE9FF] text-[#5B478A] hover:bg-[#E8E1FF]"
            : "border-[#6E5AA7]/15 bg-white/75 text-[#5B478A] hover:border-[#6E5AA7]/25 hover:bg-[#F7F3FF]",
          error
            ? "border-red-300"
            : "",
          className,
        ].join(" ")}
      >
        {busy ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Bookmark
            className="h-4 w-4"
            fill={
              visibleWatched
                ? "currentColor"
                : "none"
            }
          />
        )}

        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={
        handleClick
      }
      onPointerDown={(
        pointerEvent,
      ) => {
        pointerEvent.stopPropagation();
      }}
      disabled={busy}
      aria-pressed={
        visibleWatched
      }
      aria-label={title}
      title={title}
      className={[
        "grid h-11 w-11 shrink-0 place-items-center rounded-full border shadow-[0_6px_18px_rgba(58,44,82,0.06)] outline-none transition active:scale-[0.96] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20 disabled:cursor-wait disabled:opacity-60",
        visibleWatched
          ? "border-[#6E5AA7]/20 bg-[#EEE9FF] text-[#5B478A]"
          : "border-[#6E5AA7]/15 bg-white/75 text-[#5B478A] hover:bg-[#F7F3FF]",
        error
          ? "border-red-300"
          : "",
        className,
      ].join(" ")}
    >
      {busy ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark
          className="h-4 w-4"
          fill={
            visibleWatched
              ? "currentColor"
              : "none"
          }
        />
      )}
    </button>
  );
}
