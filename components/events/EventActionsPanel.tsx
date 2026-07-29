"use client";

import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import {
  cancelEvent,
  joinEvent,
  leaveEvent,
  type EventActionResult,
} from "@/services/events";

type EventActionsPanelProps = {
  eventId: string;
  status?: string | null;
  myStatus?: string | null;
  isJoined?: boolean | null;
  isHost: boolean;
  cooldownSeconds?: number | null;
  onChanged?: () => Promise<void> | void;
};

type ActionName =
  | "join"
  | "cancel-request"
  | "leave"
  | "cancel-event";

function normalize(
  value?: string | null,
): string {
  return (value ?? "")
    .trim()
    .toLowerCase();
}

function getInitialCooldown(
  value?: number | null,
): number {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil(parsed),
  );
}

function formatCooldown(
  totalSeconds: number,
): string {
  const seconds = Math.max(
    0,
    Math.ceil(totalSeconds),
  );

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(
    seconds / 60,
  );

  const remainingSeconds =
    seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}

function getJoinSuccessMessage(
  result: EventActionResult,
  isHost: boolean,
): string {
  const resultStatus = normalize(
    result.my_status,
  );

  const joined =
    result.already_joined ||
    result.is_playing ||
    resultStatus === "joined";

  if (joined) {
    return isHost
      ? "You are now hosting and playing in this event."
      : "Your seat is confirmed.";
  }

  const requested =
    result.requested ||
    result.already_requested ||
    resultStatus === "pending" ||
    resultStatus === "requested" ||
    resultStatus.includes("pend") ||
    resultStatus.includes("request");

  if (requested) {
    return result.already_requested
      ? "Your request is already waiting for the host."
      : "Request sent. Waiting for the host.";
  }

  return isHost
    ? "You are now playing in this event."
    : "Your request was sent.";
}

function getErrorMessage(
  error: unknown,
): string {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "The action could not be completed.";

  const normalized =
    rawMessage.toUpperCase();

  const knownErrors: Array<{
    code: string;
    message: string;
  }> = [
    {
      code: "JOIN_COOLDOWN_ACTIVE",
      message:
        "You need to wait before requesting another seat.",
    },
    {
      code: "KICK_COOLDOWN_ACTIVE",
      message:
        "You cannot rejoin this event yet.",
    },
    {
      code: "EVENT_FULL",
      message:
        "This table is already full.",
    },
    {
      code: "EVENT_NOT_OPEN",
      message:
        "This event is no longer accepting players.",
    },
    {
      code: "EVENT_CANCELLED",
      message:
        "This event has been cancelled.",
    },
    {
      code: "EVENT_STARTED",
      message:
        "This event has already started.",
    },
    {
      code: "ALREADY_JOINED",
      message:
        "You are already playing in this event.",
    },
    {
      code: "ALREADY_REQUESTED",
      message:
        "Your request is already waiting for the host.",
    },
    {
      code: "REQUEST_ALREADY_PENDING",
      message:
        "Your request is already waiting for the host.",
    },
    {
      code: "NOT_HOST",
      message:
        "Only the event host can perform this action.",
    },
  ];

  const match = knownErrors.find(
    ({ code }) =>
      normalized.includes(code),
  );

  if (match) {
    return match.message;
  }

  if (
    !rawMessage ||
    rawMessage ===
      "[object Object]"
  ) {
    return "The action could not be completed.";
  }

  return rawMessage;
}

function getPanelCopy({
  isHost,
  joined,
  requested,
  isFull,
  isStarted,
  isEnded,
  isCancelled,
  inCooldown,
}: {
  isHost: boolean;
  joined: boolean;
  requested: boolean;
  isFull: boolean;
  isStarted: boolean;
  isEnded: boolean;
  isCancelled: boolean;
  inCooldown: boolean;
}): {
  title: string;
  description: string;
} {
  if (isCancelled) {
    return {
      title: "Event cancelled",
      description:
        "This event is no longer taking place.",
    };
  }

  if (isEnded) {
    return {
      title: "Event finished",
      description:
        "This table has already finished.",
    };
  }

  if (isStarted) {
    return {
      title: "Game in progress",
      description: joined
        ? "The event has started and your seat is confirmed."
        : "This event has already started.",
    };
  }

  if (isHost && joined) {
    return {
      title:
        "You’re hosting and playing",
      description:
        "Your seat is confirmed and you remain the event host.",
    };
  }

  if (isHost) {
    return {
      title:
        "You’re hosting this event",
      description:
        "You can also join as a player while seats remain available.",
    };
  }

  if (joined) {
    return {
      title:
        "You’re joining this table",
      description:
        "Your place is confirmed.",
    };
  }

  if (requested) {
    return {
      title: "Request pending",
      description:
        "The host will review your request.",
    };
  }

  if (inCooldown) {
    return {
      title:
        "Request temporarily unavailable",
      description:
        "You will be able to request another seat when the cooldown ends.",
    };
  }

  if (isFull) {
    return {
      title:
        "This table is full",
      description:
        "There are no open seats right now.",
    };
  }

  return {
    title: "Join the game",
    description:
      "Request a seat from the host.",
  };
}

export default function EventActionsPanel({
  eventId,
  status,
  myStatus,
  isJoined,
  isHost,
  cooldownSeconds,
  onChanged,
}: EventActionsPanelProps) {
  const router = useRouter();

  const [
    loadingAction,
    setLoadingAction,
  ] =
    useState<ActionName | null>(
      null,
    );

  const [message, setMessage] =
    useState<string | null>(
      null,
    );

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    remainingCooldown,
    setRemainingCooldown,
  ] = useState(
    getInitialCooldown(
      cooldownSeconds,
    ),
  );

  useEffect(() => {
    setRemainingCooldown(
      getInitialCooldown(
        cooldownSeconds,
      ),
    );
  }, [cooldownSeconds]);

  const cooldownActive =
    remainingCooldown > 0;

  useEffect(() => {
    if (!cooldownActive) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setRemainingCooldown(
          (current) =>
            Math.max(
              0,
              current - 1,
            ),
        );
      }, 1000);

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [cooldownActive]);

  const eventStatus =
    normalize(status);

  const membershipStatus =
    normalize(myStatus);

  const joined =
    Boolean(isJoined) ||
    membershipStatus ===
      "joined";

  const requested =
    membershipStatus ===
      "pending" ||
    membershipStatus ===
      "requested" ||
    membershipStatus.includes(
      "pend",
    ) ||
    membershipStatus.includes(
      "request",
    );

  const isOpen =
    eventStatus === "open";

  const isFull =
    eventStatus === "full";

  const isStarted =
    eventStatus ===
      "started" ||
    eventStatus ===
      "in_progress" ||
    eventStatus ===
      "in progress";

  const isEnded =
    eventStatus === "ended" ||
    eventStatus ===
      "finished" ||
    eventStatus ===
      "completed";

  const isCancelled =
    eventStatus ===
      "cancelled" ||
    eventStatus ===
      "canceled";

  const canJoin =
    isOpen &&
    !joined &&
    !requested &&
    !cooldownActive;

  const canLeave =
    joined &&
    !isStarted &&
    !isEnded &&
    !isCancelled;

  const canCancelRequest =
    requested &&
    !isStarted &&
    !isEnded &&
    !isCancelled;

  const canCancelEvent =
    isHost &&
    (isOpen || isFull);

  const hasActions =
    canJoin ||
    canLeave ||
    canCancelRequest ||
    canCancelEvent;

  const panelCopy =
    getPanelCopy({
      isHost,
      joined,
      requested,
      isFull,
      isStarted,
      isEnded,
      isCancelled,
      inCooldown:
        cooldownActive,
    });

  async function refreshEvent() {
    router.refresh();

    if (!onChanged) {
      return;
    }

    try {
      await onChanged();
    } catch {
      setError(
        "The action was completed, but the latest event information could not be reloaded.",
      );
    }
  }

  async function runAction({
    actionName,
    action,
    getSuccessMessage,
  }: {
    actionName: ActionName;
    action: () => Promise<EventActionResult>;
    getSuccessMessage: (
      result: EventActionResult,
    ) => string;
  }) {
    setLoadingAction(
      actionName,
    );

    setMessage(null);
    setError(null);

    try {
      const result =
        await action();

      setMessage(
        getSuccessMessage(
          result ?? {},
        ),
      );

      await refreshEvent();
    } catch (err) {
      setError(
        getErrorMessage(err),
      );
    } finally {
      setLoadingAction(null);
    }
  }

  function confirmLeave() {
    const prompt = isHost
      ? "Stop playing in this event? You will remain the host."
      : "Leave this event? Your seat will become available to another player.";

    if (
      !window.confirm(prompt)
    ) {
      return;
    }

    void runAction({
      actionName: "leave",
      action: () =>
        leaveEvent(eventId),
      getSuccessMessage: () =>
        isHost
          ? "You are no longer playing, but you are still hosting."
          : "You left the event.",
    });
  }

  function confirmCancellation() {
    const confirmed =
      window.confirm(
        "Cancel this event for everyone? Players will be notified and this cannot be undone.",
      );

    if (!confirmed) {
      return;
    }

    void runAction({
      actionName:
        "cancel-event",
      action: () =>
        cancelEvent(eventId),
      getSuccessMessage: () =>
        "Event cancelled.",
    });
  }

  return (
    <section className="rounded-[1.35rem] border border-black/10 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
          Participation
        </p>

        <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-950">
          {panelCopy.title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {
            panelCopy.description
          }
        </p>
      </div>

      <div className="mt-5 grid gap-2.5">
        {canJoin ? (
          <button
            type="button"
            disabled={
              loadingAction !==
              null
            }
            onClick={() => {
              void runAction({
                actionName:
                  "join",
                action: () =>
                  joinEvent(
                    eventId,
                  ),
                getSuccessMessage:
                  (result) =>
                    getJoinSuccessMessage(
                      result,
                      isHost,
                    ),
              });
            }}
            className="w-full rounded-2xl bg-[#6E5AA7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#5F4E94] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction ===
            "join"
              ? "Sending..."
              : isHost
                ? "Join as player"
                : "Request to join"}
          </button>
        ) : null}

        {canCancelRequest ? (
          <button
            type="button"
            disabled={
              loadingAction !==
              null
            }
            onClick={() => {
              void runAction({
                actionName:
                  "cancel-request",
                action: () =>
                  leaveEvent(
                    eventId,
                  ),
                getSuccessMessage:
                  () =>
                    "Request cancelled.",
              });
            }}
            className="w-full rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-black/20 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction ===
            "cancel-request"
              ? "Cancelling..."
              : "Cancel request"}
          </button>
        ) : null}

        {canLeave ? (
          <button
            type="button"
            disabled={
              loadingAction !==
              null
            }
            onClick={
              confirmLeave
            }
            className="w-full rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-black/20 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction ===
            "leave"
              ? "Leaving..."
              : isHost
                ? "Stop playing"
                : "Leave event"}
          </button>
        ) : null}

        {canCancelEvent ? (
          <button
            type="button"
            disabled={
              loadingAction !==
              null
            }
            onClick={
              confirmCancellation
            }
            className="w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingAction ===
            "cancel-event"
              ? "Cancelling..."
              : "Cancel event"}
          </button>
        ) : null}

        {!hasActions ? (
          <div className="rounded-2xl bg-black/[0.04] px-4 py-3 text-sm leading-6 text-zinc-500">
            {isCancelled
              ? "This event has been cancelled."
              : isStarted
                ? "Participation can no longer be changed after the event starts."
                : isEnded
                  ? "This event has finished."
                  : cooldownActive
                    ? "Joining will become available when the cooldown ends."
                    : "No actions are available right now."}
          </div>
        ) : null}
      </div>

      {cooldownActive ? (
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          You can request
          another seat in{" "}
          <span className="font-semibold text-zinc-700">
            {formatCooldown(
              remainingCooldown,
            )}
          </span>
          .
        </p>
      ) : null}

      {message ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

          <p>{message}</p>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

          <p className="whitespace-pre-wrap">
            {error}
          </p>
        </div>
      ) : null}
    </section>
  );
}