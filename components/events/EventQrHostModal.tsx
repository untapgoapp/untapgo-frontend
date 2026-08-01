"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Check,
  Copy,
  RefreshCw,
  X,
} from "lucide-react";
import QRCode from "react-qr-code";

import {
  createEventQrSession,
  type AttendanceQrSession,
} from "@/services/events";

type EventQrHostModalProps = {
  eventId: string;
  open: boolean;
  onClose: () => void;
};

function secondsUntil(
  value?: string | null,
): number {
  if (!value) {
    return 0;
  }

  const timestamp =
    new Date(value).getTime();

  if (
    !Number.isFinite(timestamp)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil(
      (
        timestamp -
        Date.now()
      ) / 1000,
    ),
  );
}

function errorMessage(
  error: unknown,
): string {
  const message =
    error instanceof Error
      ? error.message
      : "Could not create the check-in QR.";

  const normalized =
    message.toUpperCase();

  if (
    normalized.includes(
      "QR_CHECK_IN_NOT_OPEN",
    )
  ) {
    return "QR check-in opens one hour before the event.";
  }

  if (
    normalized.includes(
      "QR_CHECK_IN_CLOSED",
    )
  ) {
    return "The QR check-in window has closed.";
  }

  if (
    normalized.includes(
      "QR_NOT_ENABLED",
    )
  ) {
    return "This event is not configured for QR check-in.";
  }

  if (
    normalized.includes(
      "ATTENDANCE_FINALIZED",
    )
  ) {
    return "Attendance has already been finalised.";
  }

  if (
    normalized.includes("EVENT_CANCELLED") ||
    normalized.includes("EVENT_ENDED")
  ) {
    return "This event no longer accepts check-ins.";
  }

  return "Could not create the check-in QR. Please try again.";
}

export default function EventQrHostModal({
  eventId,
  open,
  onClose,
}: EventQrHostModalProps) {
  const [session, setSession] =
    useState<AttendanceQrSession | null>(
      null,
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [copied, setCopied] =
    useState(false);

  const [, forceClock] =
    useState(0);

  const loadSession =
    useCallback(async () => {
      if (!open) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result =
          await createEventQrSession(
            eventId,
          );

        setSession(result);
      } catch (loadError) {
        setSession(null);
        setError(
          errorMessage(
            loadError,
          ),
        );
      } finally {
        setLoading(false);
      }
    }, [eventId, open]);

  useEffect(() => {
    if (!open) {
      setSession(null);
      setError(null);
      setCopied(false);
      return;
    }

    void loadSession();
  }, [loadSession, open]);

  useEffect(() => {
    if (
      !open ||
      !session
    ) {
      return;
    }

    const refreshTimer =
      window.setTimeout(
        () => {
          void loadSession();
        },
        Math.max(
          10,
          session
            .refresh_after_seconds,
        ) * 1000,
      );

    return () => {
      window.clearTimeout(
        refreshTimer,
      );
    };
  }, [
    loadSession,
    open,
    session,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          forceClock(
            (value) =>
              value + 1,
          );
        },
        1000,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [open]);

  const remaining =
    secondsUntil(
      session?.expires_at,
    );

  async function copyLink() {
    if (!session) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        session.check_in_url,
      );

      setCopied(true);

      window.setTimeout(
        () => {
          setCopied(false);
        },
        1600,
      );
    } catch {
      setCopied(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Event check-in QR"
      className="fixed inset-0 z-[10060] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      onMouseDown={(mouseEvent) => {
        if (
          mouseEvent.target ===
          mouseEvent.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-surface bg-background p-5 shadow-overlay sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6E5AA7]">
              Live check-in
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
              Scan to join the table
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Keep this screen visible at the venue. The code refreshes automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-surface text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20"
          >
            <X size={18} />
          </button>
        </div>

        {loading &&
        !session ? (
          <div className="mt-6 grid min-h-72 place-items-center rounded-surface bg-surface">
            <RefreshCw className="h-6 w-6 animate-spin text-[#6E5AA7]" />
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-row bg-destructive-subtle p-4 text-sm leading-6 text-destructive">
            <p className="font-semibold">
              QR unavailable
            </p>

            <p className="mt-1">
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                void loadSession();
              }}
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-control bg-surface px-4 text-sm font-semibold text-destructive outline-none focus-visible:ring-[3px] focus-visible:ring-destructive/15"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : null}

        {session ? (
          <>
            <div className="mt-6 grid place-items-center rounded-surface bg-surface p-6">
              <QRCode
                value={
                  session.check_in_url
                }
                size={256}
                level="M"
                style={{
                  height: "auto",
                  maxWidth: "100%",
                  width: "100%",
                }}
                viewBox="0 0 256 256"
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-row bg-surface-subtle px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400">
                  Refreshes in
                </p>

                <p className="mt-0.5 text-sm font-bold text-zinc-900">
                  {remaining}s
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  void copyLink();
                }}
                className="inline-flex min-h-10 items-center gap-2 rounded-control bg-surface px-4 text-sm font-semibold text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20"
              >
                {copied ? (
                  <Check size={15} />
                ) : (
                  <Copy size={15} />
                )}

                {copied
                  ? "Copied"
                  : "Copy link"}
              </button>
            </div>

            <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
              A copied QR expires quickly. The live screen keeps rotating to discourage remote check-ins.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
