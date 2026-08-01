"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  Camera,
  CheckCircle2,
  ClipboardPaste,
  RefreshCw,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import type {
  Html5Qrcode,
} from "html5-qrcode";

import {
  checkInWithEventQr,
  type AttendanceQrCheckInResult,
} from "@/services/events";

type EventQrScannerModalProps = {
  open: boolean;
  onClose: () => void;
  onCheckedIn?: (
    result: AttendanceQrCheckInResult,
  ) => void | Promise<void>;
};

function extractToken(
  scannedValue: string,
): string {
  const value =
    scannedValue.trim();

  if (!value) {
    return "";
  }

  try {
    const url =
      new URL(value);

    return (
      url.searchParams.get(
        "token",
      ) ?? ""
    ).trim();
  } catch {
    return value;
  }
}

function friendlyError(
  error: unknown,
): string {
  const message =
    error instanceof Error
      ? error.message
      : "Could not complete check-in.";

  const normalized =
    message.toUpperCase();

  const known: Array<[
    string,
    string,
  ]> = [
    [
      "QR_TOKEN_EXPIRED",
      "This QR has expired. Ask the host to show the current code.",
    ],
    [
      "QR_TOKEN_INVALID",
      "This is not a valid UntapGo check-in code.",
    ],
    [
      "QR_CHECK_IN_NOT_OPEN",
      "Check-in has not opened yet.",
    ],
    [
      "QR_CHECK_IN_CLOSED",
      "The check-in window has closed.",
    ],
    [
      "NOT_CONFIRMED_PLAYER",
      "You do not have a confirmed seat at this event.",
    ],
    [
      "EVENT_FULL",
      "The event is already full.",
    ],
    [
      "QR_COOLDOWN_ACTIVE",
      "You cannot rejoin this event yet.",
    ],
    [
      "BLOCKED_USER",
      "Check-in is not available for this event.",
    ],
    [
      "EVENT_CANCELLED",
      "This event was cancelled and no longer accepts check-ins.",
    ],
    [
      "EVENT_ENDED",
      "This event has ended and no longer accepts check-ins.",
    ],
    [
      "ATTENDANCE_FINALIZED",
      "Attendance has already been finalised.",
    ],
    [
      "HOST_NOT_PLAYING",
      "The host is organising this event but is not registered as a player.",
    ],
  ];

  const match =
    known.find(
      ([code]) =>
        normalized.includes(
          code,
        ),
    );

  return (
    match?.[1] ??
    message
  );
}

export default function EventQrScannerModal({
  open,
  onClose,
  onCheckedIn,
}: EventQrScannerModalProps) {
  const reactId =
    useId();

  const readerId =
    `untapgo-qr-reader-${reactId.replace(
      /[^a-zA-Z0-9_-]/g,
      "",
    )}`;

  const scannerRef =
    useRef<Html5Qrcode | null>(
      null,
    );

  const processingRef =
    useRef(false);

  const onCheckedInRef =
    useRef(onCheckedIn);

  const [starting, setStarting] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [result, setResult] =
    useState<AttendanceQrCheckInResult | null>(
      null,
    );

  const [manualValue, setManualValue] =
    useState("");

  useEffect(() => {
    onCheckedInRef.current =
      onCheckedIn;
  }, [onCheckedIn]);

  const stopScanner =
    useCallback(async () => {
      const scanner =
        scannerRef.current;

      scannerRef.current = null;

      if (!scanner) {
        return;
      }

      try {
        await scanner.stop();
      } catch {
        // The scanner may not have reached the running state.
      }

      try {
        scanner.clear();
      } catch {
        // The element may already be unmounted.
      }
    }, []);

  const submitScannedValue =
    useCallback(
      async (
        scannedValue: string,
      ) => {
        if (processingRef.current) {
          return;
        }

        const token =
          extractToken(
            scannedValue,
          );

        if (!token) {
          setError(
            "No UntapGo check-in token was found.",
          );
          return;
        }

        processingRef.current =
          true;
        setProcessing(true);
        setError(null);

        await stopScanner();

        try {
          const response =
            await checkInWithEventQr(
              token,
            );

          setResult(response);
          await onCheckedInRef.current?.(
            response,
          );
        } catch (checkInError) {
          setError(
            friendlyError(
              checkInError,
            ),
          );
          processingRef.current =
            false;
        } finally {
          setProcessing(false);
        }
      },
      [stopScanner],
    );

  useEffect(() => {
    if (!open) {
      void stopScanner();
      processingRef.current =
        false;
      setStarting(false);
      setProcessing(false);
      setError(null);
      setResult(null);
      setManualValue("");
      return;
    }

    let cancelled = false;

    async function startScanner() {
      setStarting(true);
      setError(null);

      try {
        const {
          Html5Qrcode,
        } =
          await import(
            "html5-qrcode"
          );

        if (cancelled) {
          return;
        }

        const scanner =
          new Html5Qrcode(
            readerId,
          );

        scannerRef.current =
          scanner;

        await scanner.start(
          {
            facingMode:
              "environment",
          },
          {
            fps: 10,
            qrbox: {
              width: 240,
              height: 240,
            },
            aspectRatio: 1,
          },
          (decodedText) => {
            void submitScannedValue(
              decodedText,
            );
          },
          () => {
            // Per-frame decode failures are expected while aiming.
          },
        );
      } catch (cameraError) {
        if (!cancelled) {
          setError(
            cameraError instanceof Error
              ? cameraError.message
              : "Camera access failed. You can paste the check-in link below.",
          );
        }
      } finally {
        if (!cancelled) {
          setStarting(false);
        }
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [
    open,
    readerId,
    stopScanner,
    submitScannedValue,
  ]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scan event QR"
      className="fixed inset-0 z-[10060] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
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
              Attendance
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
              Scan event QR
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Point the camera at the code shown by the host.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-surface text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20"
          >
            <X size={18} />
          </button>
        </div>

        {!result ? (
          <>
            <div className="relative mt-6 overflow-hidden rounded-surface bg-zinc-950">
              <div
                id={readerId}
                className="min-h-72 w-full"
              />

              {starting ? (
                <div className="absolute inset-0 grid place-items-center bg-zinc-950 text-white">
                  <div className="text-center">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin" />
                    <p className="mt-3 text-sm">
                      Starting camera…
                    </p>
                  </div>
                </div>
              ) : null}

              {processing ? (
                <div className="absolute inset-0 grid place-items-center bg-zinc-950/90 text-white">
                  <div className="text-center">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin" />
                    <p className="mt-3 text-sm">
                      Checking you in…
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-4 rounded-row bg-destructive-subtle px-4 py-3 text-sm leading-6 text-destructive"
              >
                {error}
              </div>
            ) : null}

            <div className="mt-5 rounded-row bg-surface-subtle/60 p-3.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                <ClipboardPaste size={16} />
                Paste check-in link
              </div>

              <div className="mt-3 flex gap-2">
                <Input
                  value={manualValue}
                  onChange={(changeEvent) => {
                    setManualValue(
                      changeEvent.target.value,
                    );
                  }}
                  placeholder="Paste QR link or token"
                  className="min-w-0 flex-1"
                />

                <button
                  type="button"
                  disabled={
                    processing ||
                    !manualValue.trim()
                  }
                  onClick={() => {
                    void submitScannedValue(
                      manualValue,
                    );
                  }}
                  className="min-h-11 rounded-control bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none hover:bg-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:opacity-50"
                >
                  Check in
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-surface bg-success-subtle p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />

            <h3 className="mt-4 text-xl font-black text-emerald-950">
              You are checked in
            </h3>

            <p className="mt-2 text-sm leading-6 text-emerald-800">
              {result.joined_as_walk_in
                ? "A free seat was claimed and your attendance was recorded."
                : result.already_checked_in
                  ? "Your check-in was already recorded."
                  : "Your arrival has been recorded."}
            </p>

            <a
              href={`/events/${result.event_id}`}
              className="mt-5 inline-flex min-h-10 items-center rounded-control bg-success px-5 text-sm font-semibold text-white outline-none focus-visible:ring-[3px] focus-visible:ring-success/20"
            >
              View event
            </a>
          </div>
        )}

        {!result ? (
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs leading-5 text-zinc-500">
            <Camera size={14} />
            Camera access works on HTTPS and localhost.
          </p>
        ) : null}
      </div>
    </div>
  );
}
