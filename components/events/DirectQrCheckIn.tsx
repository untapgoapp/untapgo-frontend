"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  CheckCircle2,
  LogIn,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import {
  checkInWithEventQr,
  type AttendanceQrCheckInResult,
} from "@/services/events";

type DirectQrCheckInProps = {
  token: string;
};

type State =
  | "checking-session"
  | "login-required"
  | "checking-in"
  | "success"
  | "error";

function friendlyError(
  error: unknown,
): string {
  const message =
    error instanceof Error
      ? error.message
      : "Could not complete check-in.";

  const normalized =
    message.toUpperCase();

  if (
    normalized.includes(
      "QR_TOKEN_EXPIRED",
    )
  ) {
    return "This QR has expired. Ask the host to show the current code.";
  }

  if (
    normalized.includes(
      "NOT_CONFIRMED_PLAYER",
    )
  ) {
    return "You do not have a confirmed seat and this event does not allow QR walk-ins.";
  }

  if (
    normalized.includes(
      "EVENT_FULL",
    )
  ) {
    return "The event is already full.";
  }

  if (
    normalized.includes("EVENT_CANCELLED") ||
    normalized.includes("EVENT_ENDED")
  ) {
    return "This event no longer accepts check-ins.";
  }

  if (normalized.includes("BLOCKED_USER")) {
    return "Check-in is not available for this event.";
  }

  if (normalized.includes("QR_COOLDOWN_ACTIVE")) {
    return "You cannot rejoin this event yet.";
  }

  return "Could not complete check-in. Please try again.";
}

export default function DirectQrCheckIn({
  token,
}: DirectQrCheckInProps) {
  const [state, setState] =
    useState<State>(
      "checking-session",
    );

  const [result, setResult] =
    useState<AttendanceQrCheckInResult | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setError(
          "No check-in token was provided.",
        );
        setState("error");
        return;
      }

      const {
        data,
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      if (
        sessionError ||
        !data.session
      ) {
        setState(
          "login-required",
        );
        return;
      }

      setState(
        "checking-in",
      );

      try {
        const response =
          await checkInWithEventQr(
            token,
          );

        if (cancelled) {
          return;
        }

        setResult(response);
        setState("success");
      } catch (checkInError) {
        if (cancelled) {
          return;
        }

        setError(
          friendlyError(
            checkInError,
          ),
        );
        setState("error");
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] sm:p-8">
      {state ===
        "checking-session" ||
      state ===
        "checking-in" ? (
        <div className="py-10 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#6E5AA7]" />

          <h1 className="mt-5 text-2xl font-black text-zinc-950">
            Checking you in
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Confirming the event and your seat…
          </p>
        </div>
      ) : null}

      {state ===
      "login-required" ? (
        <div className="py-8 text-center">
          <LogIn className="mx-auto h-10 w-10 text-[#6E5AA7]" />

          <h1 className="mt-4 text-2xl font-black text-zinc-950">
            Log in to check in
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
            Sign in to UntapGo, then scan the current QR again.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-[#6E5AA7] px-6 py-3 text-sm font-semibold text-white"
          >
            Log in
          </Link>
        </div>
      ) : null}

      {state ===
        "success" &&
      result ? (
        <div className="py-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />

          <h1 className="mt-4 text-2xl font-black text-zinc-950">
            You are checked in
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-600">
            {result.joined_as_walk_in
              ? "A free seat was claimed for you."
              : result.already_checked_in
                ? "Your arrival had already been recorded."
                : "Your arrival has been recorded."}
          </p>

          <Link
            href={`/events/${result.event_id}`}
            className="mt-6 inline-flex rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-white"
          >
            Open event
          </Link>
        </div>
      ) : null}

      {state === "error" ? (
        <div className="py-8 text-center">
          <TriangleAlert className="mx-auto h-11 w-11 text-red-600" />

          <h1 className="mt-4 text-2xl font-black text-zinc-950">
            Check-in failed
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-red-700">
            {error}
          </p>

          <Link
            href="/events"
            className="mt-6 inline-flex rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-zinc-700"
          >
            Back to events
          </Link>
        </div>
      ) : null}
    </section>
  );
}
