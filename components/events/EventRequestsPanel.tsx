"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  RefreshCw,
  X,
} from "lucide-react";

import EventActionSheet from "@/components/events/EventActionSheet";
import {
  acceptEventRequest,
  getEventRequests,
  rejectEventRequest,
  type EventJoinRequest,
} from "@/services/events";

type EventRequestsPanelProps = {
  eventId: string;
  initialCount?: number | null;
  eventStatus?: string | null;
  attendeesCount: number;
  maxPlayers: number;
  onChanged?: () => Promise<void> | void;
};

function normalize(
  value?: string | null,
): string {
  return (value ?? "")
    .trim()
    .toLowerCase();
}

function getUserId(
  request: EventJoinRequest,
): string | null {
  const value =
    request.user_id ??
    request.id;

  return value
    ? String(value)
    : null;
}

function getNickname(
  request: EventJoinRequest,
): string {
  const nickname =
    request.nickname?.trim();

  if (nickname) {
    return nickname;
  }

  const userId =
    getUserId(request);

  return userId
    ? `Player ${userId.slice(0, 4)}`
    : "Player";
}

function isPendingRequest(
  request: EventJoinRequest,
): boolean {
  const status = normalize(
    request.status,
  );

  if (!status) {
    return true;
  }

  return ![
    "accepted",
    "approved",
    "joined",
    "rejected",
    "declined",
    "cancelled",
    "canceled",
    "withdrawn",
    "removed",
    "kicked",
  ].some((completedStatus) =>
    status.includes(
      completedStatus,
    ),
  );
}

function getRequestedTime(
  value?: string | null,
): number {
  if (!value) {
    return 0;
  }

  const time =
    new Date(value).getTime();

  return Number.isFinite(time)
    ? time
    : 0;
}

function formatRequestedAt(
  value?: string | null,
): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function getErrorMessage(
  error: unknown,
): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "The request could not be processed.";

  const normalized =
    message.toUpperCase();

  if (
    normalized.includes(
      "EVENT_FULL",
    )
  ) {
    return "This table is already full.";
  }

  if (
    normalized.includes(
      "EVENT_NOT_OPEN",
    ) ||
    normalized.includes(
      "EVENT_STARTED",
    )
  ) {
    return "Requests can no longer be processed for this event.";
  }

  if (
    normalized.includes(
      "REQUEST_NOT_FOUND",
    ) ||
    normalized.includes(
      "JOIN_REQUEST_NOT_FOUND",
    )
  ) {
    return "This request is no longer pending.";
  }

  if (
    normalized.includes(
      "ALREADY_JOINED",
    )
  ) {
    return "This player has already joined the event.";
  }

  return message;
}

export default function EventRequestsPanel({
  eventId,
  initialCount,
  eventStatus,
  attendeesCount,
  maxPlayers,
  onChanged,
}: EventRequestsPanelProps) {
  const router = useRouter();

  const [
    requests,
    setRequests,
  ] = useState<
    EventJoinRequest[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [message, setMessage] =
    useState<string | null>(
      null,
    );

  const [
    processingIds,
    setProcessingIds,
  ] = useState<Set<string>>(
    new Set(),
  );

  const [
    declineRequest,
    setDeclineRequest,
  ] =
    useState<EventJoinRequest | null>(
      null,
    );

  const loadRequests =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const rows =
          await getEventRequests(
            eventId,
          );

        setRequests(
          Array.isArray(rows)
            ? rows
            : [],
        );
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
          ),
        );
      } finally {
        setLoading(false);
      }
    }, [eventId]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadRequests();
      }, 0);

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [loadRequests]);

  const pendingRequests =
    useMemo(() => {
      const byUser =
        new Map<
          string,
          EventJoinRequest
        >();

      for (
        const request of
        requests
      ) {
        if (
          !isPendingRequest(
            request,
          )
        ) {
          continue;
        }

        const userId =
          getUserId(request);

        if (!userId) {
          continue;
        }

        byUser.set(
          userId,
          request,
        );
      }

      return Array.from(
        byUser.values(),
      ).sort(
        (left, right) =>
          getRequestedTime(
            left.requested_at,
          ) -
          getRequestedTime(
            right.requested_at,
          ),
      );
    }, [requests]);

  const visibleCount =
    loading &&
    pendingRequests.length === 0
      ? Math.max(
          0,
          Number(
            initialCount ?? 0,
          ),
        )
      : pendingRequests.length;

  const status =
    normalize(eventStatus);

  const canManageRequests =
    status === "open" ||
    status === "full";

  const seatsLeft =
    maxPlayers > 0
      ? Math.max(
          0,
          Number(maxPlayers) -
            Number(
              attendeesCount ?? 0,
            ),
        )
      : 0;

  const canApprove =
    status === "open" &&
    seatsLeft > 0;

  const processingAny =
    processingIds.size > 0;

  function setProcessing(
    userId: string,
    processing: boolean,
  ) {
    setProcessingIds(
      (current) => {
        const next =
          new Set(current);

        if (processing) {
          next.add(userId);
        } else {
          next.delete(userId);
        }

        return next;
      },
    );
  }

  function removeRequest(
    userId: string,
  ) {
    setRequests(
      (current) =>
        current.filter(
          (request) =>
            getUserId(
              request,
            ) !== userId,
        ),
    );
  }

  async function refreshEvent() {
    router.refresh();

    try {
      await onChanged?.();
    } catch {
      setError(
        "The request was processed, but the latest event information could not be reloaded.",
      );
    }
  }

  async function approve(
    request: EventJoinRequest,
  ) {
    const userId =
      getUserId(request);

    if (
      !userId ||
      processingAny ||
      !canApprove
    ) {
      return;
    }

    const nickname =
      getNickname(request);

    setProcessing(
      userId,
      true,
    );
    setError(null);
    setMessage(null);

    try {
      await acceptEventRequest({
        eventId,
        userId,
      });

      removeRequest(userId);
      setMessage(
        `${nickname} joined the event.`,
      );
      await refreshEvent();
    } catch (approveError) {
      setError(
        getErrorMessage(
          approveError,
        ),
      );
    } finally {
      setProcessing(
        userId,
        false,
      );
    }
  }

  async function decline() {
    const request =
      declineRequest;

    const userId =
      request
        ? getUserId(request)
        : null;

    if (
      !request ||
      !userId ||
      processingAny ||
      !canManageRequests
    ) {
      return;
    }

    const nickname =
      getNickname(request);

    setProcessing(
      userId,
      true,
    );
    setError(null);
    setMessage(null);

    try {
      await rejectEventRequest({
        eventId,
        userId,
        cooldownMinutes: 10,
      });

      removeRequest(userId);
      setDeclineRequest(
        null,
      );
      setMessage(
        `${nickname}'s request was declined.`,
      );
      await refreshEvent();
    } catch (declineError) {
      setError(
        getErrorMessage(
          declineError,
        ),
      );
    } finally {
      setProcessing(
        userId,
        false,
      );
    }
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            <span className="font-semibold text-zinc-900">
              {visibleCount}
            </span>{" "}
            pending request
            {visibleCount === 1
              ? ""
              : "s"}
          </p>

          <button
            type="button"
            onClick={() => {
              setMessage(null);
              void loadRequests();
            }}
            disabled={
              loading ||
              processingAny
            }
            aria-label="Refresh join requests"
            className="grid h-10 w-10 place-items-center rounded-control text-primary outline-none transition-colors hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:opacity-50"
          >
            <RefreshCw
              className={[
                "h-4 w-4",
                loading
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />
          </button>
        </div>

        {!loading &&
        pendingRequests.length > 0 &&
        canManageRequests &&
        !canApprove ? (
          <p className="mt-2 text-xs leading-5 text-amber-700">
            The table is full. Requests can still be declined.
          </p>
        ) : null}

        {!loading &&
        pendingRequests.length > 0 &&
        !canManageRequests ? (
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Requests can no longer be processed.
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-500/[0.08] px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        {message ? (
          <p
            role="status"
            className="mt-3 rounded-xl bg-emerald-500/[0.08] px-3 py-2 text-sm text-emerald-800"
          >
            {message}
          </p>
        ) : null}

        {loading ? (
          <div className="mt-3 grid gap-1">
            {[0, 1].map(
              (item) => (
                <div
                  key={item}
                  className="flex h-16 animate-pulse items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-full bg-black/[0.07]" />
                  <div className="h-3 w-24 rounded-full bg-black/[0.07]" />
                </div>
              ),
            )}
          </div>
        ) : null}

        {!loading &&
        pendingRequests.length ===
          0 ? (
          <p className="mt-3 rounded-row bg-surface/55 px-3 py-3 text-sm text-muted-foreground">
            No pending requests — you&apos;re all caught up.
          </p>
        ) : null}

        {!loading &&
        pendingRequests.length > 0 ? (
          <div className="mt-3 grid gap-1">
            {pendingRequests.map(
              (request) => {
                const userId =
                  getUserId(
                    request,
                  );

                if (!userId) {
                  return null;
                }

                const nickname =
                  getNickname(
                    request,
                  );

                const requestedAt =
                  formatRequestedAt(
                    request.requested_at,
                  );

                const processing =
                  processingIds.has(
                    userId,
                  );

                return (
                  <div
                    key={userId}
                    className="flex min-h-[68px] items-center gap-3 rounded-row px-2 py-2 transition-colors hover:bg-secondary/45 focus-within:bg-secondary/45"
                  >
                    <RequestAvatar
                      request={
                        request
                      }
                      nickname={
                        nickname
                      }
                    />

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/profile/${encodeURIComponent(
                          userId,
                        )}`}
                        className="flex min-h-11 flex-col justify-center truncate text-sm font-medium text-zinc-900 outline-none transition hover:text-[#6E5AA7] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20"
                      >
                        <span className="truncate">
                          {nickname}
                        </span>

                        <span className="mt-0.5 truncate text-xs font-normal text-zinc-500">
                          {requestedAt
                            ? `Requested ${requestedAt}`
                            : "Waiting for review"}
                        </span>
                      </Link>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDeclineRequest(
                            request,
                          );
                        }}
                        disabled={
                          processingAny ||
                          !canManageRequests
                        }
                        aria-label={`Decline ${nickname}`}
                        className="grid h-10 w-10 place-items-center rounded-control text-muted-foreground outline-none transition-colors hover:bg-destructive-subtle hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-destructive/15 disabled:opacity-40"
                      >
                        {processing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void approve(
                            request,
                          );
                        }}
                        disabled={
                          processingAny ||
                          !canApprove
                        }
                        aria-label={`Approve ${nickname}`}
                        className="grid h-10 w-10 place-items-center rounded-control bg-primary text-primary-foreground outline-none transition-colors hover:bg-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:opacity-40"
                      >
                        {processing ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        ) : null}
      </div>

      <EventActionSheet
        open={Boolean(
          declineRequest,
        )}
        title={
          declineRequest
            ? `Decline ${getNickname(declineRequest)}?`
            : "Decline request?"
        }
        description="They will not be able to request another seat for 10 minutes."
        onClose={() => {
          if (!processingAny) {
            setDeclineRequest(
              null,
            );
          }
        }}
        footer={
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => {
                void decline();
              }}
              disabled={
                processingAny
              }
              className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 disabled:opacity-50"
            >
              {processingAny
                ? "Declining…"
                : "Decline request"}
            </button>

            <button
              type="button"
              onClick={() => {
                setDeclineRequest(
                  null,
                );
              }}
              disabled={
                processingAny
              }
              className="min-h-11 rounded-xl text-sm font-semibold text-zinc-700 outline-none focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20"
            >
              Keep request
            </button>
          </div>
        }
      >
        <p className="px-1 py-2 text-sm leading-6 text-zinc-600">
          The request will be removed from this queue.
        </p>
      </EventActionSheet>
    </>
  );
}

function RequestAvatar({
  request,
  nickname,
}: {
  request: EventJoinRequest;
  nickname: string;
}) {
  if (request.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={request.avatar_url}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full bg-zinc-200 object-cover"
      />
    );
  }

  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EEE9FF] text-sm font-bold text-[#6E5AA7]">
      {nickname
        .slice(0, 1)
        .toUpperCase()}
    </div>
  );
}
