"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

import EventActionSheet from "@/components/events/EventActionSheet";
import EventFeedbackPanel from "@/components/events/EventFeedbackPanel";
import EventHostControls, {
  type HostControlTab,
} from "@/components/events/EventHostControls";
import EventMobileActionBar from "@/components/events/EventMobileActionBar";
import EventQrScannerModal from "@/components/events/EventQrScannerModal";
import EventTableRoster from "@/components/events/EventTableRoster";
import EventYourSeat from "@/components/events/EventYourSeat";
import { supabase } from "@/lib/supabase/client";
import {
  getEventMembershipState,
  isConfirmedMembership,
  isPendingMembership,
} from "@/lib/event-membership";
import { normalizeAttendanceMethod } from "@/lib/event-attendance";
import {
  cancelEvent,
  getMyEventAttendance,
  getPrivateEvent,
  joinEvent,
  leaveEvent,
  type EventActionResult,
  type EventItem,
  type EventMyAttendance,
} from "@/services/events";

type EventUserPanelsProps = {
  eventId: string;
  initialEvent: EventItem;
};

type LoadOptions = {
  showLoading?: boolean;
  refreshPanels?: boolean;
};

type ActionName =
  | "join"
  | "cancel-request"
  | "leave"
  | "cancel-event";

type Confirmation =
  | "leave"
  | "cancel-event"
  | null;

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
  const parsed = Number(
    value ?? 0,
  );

  if (
    !Number.isFinite(parsed)
  ) {
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

  const remaining =
    seconds % 60;

  return remaining
    ? `${minutes}m ${remaining}s`
    : `${minutes}m`;
}

function getActionError(
  error: unknown,
): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "The action could not be completed.";

  const normalized =
    message.toUpperCase();

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
      code: "ALREADY_REQUESTED",
      message:
        "Your request is already waiting for the host.",
    },
    {
      code: "REQUEST_ALREADY_PENDING",
      message:
        "Your request is already waiting for the host.",
    },
  ];

  return (
    knownErrors.find(
      ({ code }) =>
        normalized.includes(
          code,
        ),
    )?.message ?? message
  );
}

function getJoinMessage(
  result: EventActionResult,
  isHost: boolean,
): string {
  const resultStatus =
    normalize(
      result.my_status,
    );

  const isPending =
    result.requested === true ||
    result.already_requested ===
      true ||
    resultStatus.includes(
      "pend",
    ) ||
    resultStatus.includes(
      "request",
    );

  /*
   * An explicit pending/requested result must always win
   * over legacy booleans such as is_playing.
   */
  if (isPending) {
    return result.already_requested
      ? "Your request is already waiting for the host."
      : "Request sent. Waiting for the host.";
  }

  const confirmedByStatus = [
    "joined",
    "accepted",
    "approved",
    "confirmed",
    "playing",
  ].includes(resultStatus);

  /*
   * Legacy booleans are only trusted when the API
   * did not return an explicit membership status.
   */
  const confirmedByLegacy =
    !resultStatus &&
    Boolean(
      result.already_joined ||
        result.is_playing,
    );

  if (
    confirmedByStatus ||
    confirmedByLegacy
  ) {
    return isHost
      ? "You are now hosting and playing."
      : "Your seat is confirmed.";
  }

  return isHost
    ? "You are now playing in this event."
    : "Your request was sent.";
}

export default function EventUserPanels({
  eventId,
  initialEvent,
}: EventUserPanelsProps) {
  const router = useRouter();

  const [event, setEvent] =
    useState<EventItem>(
      initialEvent,
    );

  const [myAttendance, setMyAttendance] =
    useState<EventMyAttendance | null>(null);

  const [
    currentUserId,
    setCurrentUserId,
  ] = useState<string | null>(
    null,
  );

  const [loading, setLoading] =
    useState(true);

  const [
    isLoggedIn,
    setIsLoggedIn,
  ] = useState(false);

  const [loadError, setLoadError] =
    useState<string | null>(
      null,
    );

  const [
    panelsVersion,
    setPanelsVersion,
  ] = useState(0);

  const [
    remainingCooldown,
    setRemainingCooldown,
  ] = useState(
    getInitialCooldown(
      initialEvent.cooldown_seconds,
    ),
  );

  const [
    actionBusy,
    setActionBusy,
  ] = useState<ActionName | null>(
    null,
  );

  const [
    actionMessage,
    setActionMessage,
  ] = useState<string | null>(
    null,
  );

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(
    null,
  );

  const [
    confirmation,
    setConfirmation,
  ] = useState<Confirmation>(
    null,
  );

  const [
    hostTab,
    setHostTab,
  ] =
    useState<HostControlTab>(
      "requests",
    );

  const [
    deckSheetOpen,
    setDeckSheetOpen,
  ] = useState(false);

  const [
    visibilitySheetOpen,
    setVisibilitySheetOpen,
  ] = useState(false);

  const [
    scannerOpen,
    setScannerOpen,
  ] = useState(false);

  const [
    hostQrOpen,
    setHostQrOpen,
  ] = useState(false);

  const loadUserEventState =
    useCallback(
      async (
        options: LoadOptions = {},
      ) => {
        const {
          showLoading = true,
          refreshPanels = false,
        } = options;

        if (showLoading) {
          setLoading(true);
        }

        setLoadError(null);

        try {
          const {
            data,
            error: sessionError,
          } =
            await supabase.auth.getSession();

          if (sessionError) {
            throw sessionError;
          }

          const session =
            data.session;

          if (!session?.user) {
            setIsLoggedIn(false);
            setCurrentUserId(null);
            setEvent(initialEvent);
            setMyAttendance(null);
            return;
          }

          setIsLoggedIn(true);
          setCurrentUserId(
            session.user.id,
          );

          const [eventResult, attendanceResult] =
            await Promise.allSettled([
              getPrivateEvent(eventId),
              getMyEventAttendance(eventId),
            ]);

          if (eventResult.status === "rejected") {
            throw eventResult.reason;
          }

          const privateEvent = eventResult.value;

          setEvent(privateEvent);
          setRemainingCooldown(
            getInitialCooldown(
              privateEvent.cooldown_seconds,
            ),
          );
          setMyAttendance(
            attendanceResult.status === "fulfilled"
              ? attendanceResult.value
              : null,
          );

          if (refreshPanels) {
            setPanelsVersion(
              (current) =>
                current + 1,
            );
          }
        } catch (error) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Could not load event options.",
          );
        } finally {
          if (showLoading) {
            setLoading(false);
          }
        }
      },
      [
        eventId,
        initialEvent,
      ],
    );

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadUserEventState();
      }, 0);

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [loadUserEventState]);

  const cooldownRunning =
    remainingCooldown > 0;

  useEffect(() => {
    if (!cooldownRunning) {
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
  }, [cooldownRunning]);

  const refreshAfterAction =
    useCallback(async () => {
      await loadUserEventState({
        showLoading: false,
        refreshPanels: true,
      });
    }, [loadUserEventState]);

  const isHost = Boolean(
    currentUserId &&
      event.host_user_id &&
      String(
        event.host_user_id,
      ) === currentUserId,
  );

  const membershipState =
    getEventMembershipState({
      status: event.my_status,
      isHost: false,
      legacyIsJoined:
        event.is_joined,
      legacyIsPlaying:
        event.my_is_playing,
    });

  const isPlaying =
    isConfirmedMembership(
      membershipState,
    );

  const requested =
    isPendingMembership(
      membershipState,
    );

  const joinedForActions =
    isPlaying;

  const eventStatus =
    normalize(event.status);

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

  const isEnded = [
    "ended",
    "finished",
    "completed",
  ].includes(eventStatus);

  const isCancelled = [
    "cancelled",
    "canceled",
  ].includes(eventStatus);

  const cooldownActive =
    cooldownRunning;

  const canJoin =
    isOpen &&
    !joinedForActions &&
    !requested &&
    !cooldownActive;

  const canLeave =
    joinedForActions &&
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

  const canViewDecks =
    Boolean(
      currentUserId &&
        (isHost || isPlaying),
    );

  const attendanceMethod =
    normalizeAttendanceMethod(
      event.attendance_method,
    );

  const canScan =
    attendanceMethod === "qr" &&
    !isEnded &&
    !isCancelled &&
    (myAttendance
      ? myAttendance.can_check_in
      : isPlaying || Boolean(event.allow_walk_ins));

  async function runAction({
    name,
    action,
    success,
  }: {
    name: ActionName;
    action: () => Promise<EventActionResult>;
    success: (
      result: EventActionResult,
    ) => string;
  }) {
    if (actionBusy) {
      return;
    }

    setActionBusy(name);
    setActionMessage(null);
    setActionError(null);

    try {
      const result =
        await action();

      setActionMessage(
        success(result ?? {}),
      );
      setConfirmation(null);
      router.refresh();
      await refreshAfterAction();
    } catch (error) {
      setActionError(
        getActionError(error),
      );
    } finally {
      setActionBusy(null);
    }
  }

  function join() {
    void runAction({
      name: "join",
      action: () =>
        joinEvent(eventId),
      success: (result) =>
        getJoinMessage(
          result,
          isHost,
        ),
    });
  }

  function cancelRequest() {
    void runAction({
      name: "cancel-request",
      action: () =>
        leaveEvent(eventId),
      success: () =>
        "Request cancelled.",
    });
  }

  function leave() {
    void runAction({
      name: "leave",
      action: () =>
        leaveEvent(eventId),
      success: () =>
        isHost
          ? "You are no longer playing, but you are still hosting."
          : "You left the event.",
    });
  }

  function cancelWholeEvent() {
    void runAction({
      name: "cancel-event",
      action: () =>
        cancelEvent(eventId),
      success: () =>
        "Event cancelled.",
    });
  }

  function showHostTab(
    tab: HostControlTab,
  ) {
    setHostTab(tab);

    window.setTimeout(() => {
      document
        .getElementById(
          "event-host-controls",
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 0);
  }

  if (loading) {
    return (
      <PanelsStateLayout>
        <div className="h-[210px] animate-pulse rounded-[1.25rem] bg-black/[0.045]" />
      </PanelsStateLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="lg:contents">
        <section className="py-6 lg:col-start-1 lg:row-start-2">
          <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-zinc-950">
            The table
          </h2>

          <p className="mt-3 rounded-row bg-surface-subtle/60 px-4 py-3 text-sm text-muted-foreground">
            Log in to see the table roster.
          </p>
        </section>

        <aside className="mt-4 py-4 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-0 lg:py-0">
          <LoginPanel />
        </aside>
      </div>
    );
  }

  if (
    loadError ||
    !currentUserId
  ) {
    return (
      <PanelsStateLayout>
        <div>
          <p className="font-semibold text-red-700">
            Could not load event options
          </p>

          {loadError ? (
            <p className="mt-1 text-sm leading-6 text-red-600">
              {loadError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              void loadUserEventState();
            }}
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-red-700 outline-none focus-visible:ring-4 focus-visible:ring-red-500/15"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </PanelsStateLayout>
    );
  }

  return (
    <div className="lg:contents">
      <EventTableRoster
        eventId={event.id}
        currentUserId={
          currentUserId
        }
        hostUserId={
          event.host_user_id ??
          null
        }
        eventStatus={
          event.status
        }
        attendeesCount={
          event.attendees_count
        }
        maxPlayers={
          event.max_players
        }
        isHost={isHost}
        canViewDecks={
          canViewDecks
        }
        refreshKey={
          panelsVersion
        }
        onChanged={
          refreshAfterAction
        }
      />

      <aside className="mt-4 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:mt-0">
        <div className="lg:sticky lg:top-24 lg:rounded-surface lg:bg-surface-subtle/45 lg:px-4">
          <EventYourSeat
            eventId={event.id}
            currentUserId={
              currentUserId
            }
            eventStatus={
              event.status
            }
            eventFormatSlug={
              event.format_slug
            }
            isHost={isHost}
            isPlaying={
              isPlaying
            }
            requested={
              requested
            }
            canJoin={canJoin}
            canLeave={canLeave}
            canCancelRequest={
              canCancelRequest
            }
            canScan={canScan}
            attendanceMethod={
              attendanceMethod
            }
            attendance={
              myAttendance
            }
            actionBusy={Boolean(
              actionBusy,
            )}
            actionMessage={
              actionMessage
            }
            actionError={
              actionError
            }
            cooldownLabel={
              cooldownActive
                ? formatCooldown(
                    remainingCooldown,
                  )
                : null
            }
            deckSheetOpen={
              deckSheetOpen
            }
            visibilitySheetOpen={
              visibilitySheetOpen
            }
            onDeckSheetOpenChange={
              setDeckSheetOpen
            }
            onVisibilitySheetOpenChange={
              setVisibilitySheetOpen
            }
            onJoin={join}
            onCancelRequest={
              cancelRequest
            }
            onScan={() => {
              setScannerOpen(true);
            }}
            onLeave={() => {
              setConfirmation(
                "leave",
              );
            }}
            onChanged={
              refreshAfterAction
            }
          />

          {isHost ? (
            <EventHostControls
              eventId={event.id}
              eventStatus={
                event.status
              }
              attendanceMethod={
                attendanceMethod
              }
              allowWalkIns={
                event.allow_walk_ins
              }
              pendingCount={
                event.pending_requests_count
              }
              attendeesCount={
                event.attendees_count
              }
              maxPlayers={
                event.max_players
              }
              isPlaying={
                isPlaying
              }
              canLeave={canLeave}
              canCancelEvent={
                canCancelEvent
              }
              activeTab={
                hostTab
              }
              qrOpen={
                hostQrOpen
              }
              onTabChange={
                setHostTab
              }
              onQrOpenChange={
                setHostQrOpen
              }
              onStopPlaying={() => {
                setConfirmation(
                  "leave",
                );
              }}
              onCancelEvent={() => {
                setConfirmation(
                  "cancel-event",
                );
              }}
              onChanged={
                refreshAfterAction
              }
            />
          ) : null}
        </div>
      </aside>

      {isEnded ? (
        <div className="py-6 lg:col-start-1 lg:row-start-3">
          <EventFeedbackPanel
            key={`feedback-${event.id}-${panelsVersion}`}
            eventId={event.id}
          />
        </div>
      ) : null}

      <EventMobileActionBar
        isHost={isHost}
        isPlaying={isPlaying}
        requested={requested}
        canJoin={canJoin}
        canLeave={canLeave}
        canCancelRequest={
          canCancelRequest
        }
        canScan={canScan}
        hostAttendanceDisabled={
          attendanceMethod === "none" ||
          isCancelled ||
          isEnded ||
          Boolean(event.attendance_finalized_at)
        }
        attendanceMethod={
          attendanceMethod
        }
        busy={Boolean(
          actionBusy,
        )}
        onHostAttendance={() => {
          if (
            attendanceMethod ===
            "qr"
          ) {
            setHostTab(
              "attendance",
            );
            setHostQrOpen(true);
          } else {
            showHostTab(
              "attendance",
            );
          }
        }}
        onRequests={() => {
          showHostTab("requests");
        }}
        onManage={() => {
          showHostTab("manage");
        }}
        onScan={() => {
          setScannerOpen(true);
        }}
        onChangeDeck={() => {
          setDeckSheetOpen(true);
        }}
        onLeave={() => {
          setConfirmation(
            "leave",
          );
        }}
        onJoin={join}
        onCancelRequest={
          cancelRequest
        }
      />

      <EventActionSheet
        open={
          confirmation === "leave"
        }
        title={
          isHost
            ? "Stop playing?"
            : "Leave this event?"
        }
        description={
          isHost
            ? "You will keep hosting, but your player seat will become available."
            : "Your seat will become available to another player."
        }
        onClose={() => {
          if (!actionBusy) {
            setConfirmation(null);
          }
        }}
        footer={
          <div className="grid gap-2">
            <button
              type="button"
              onClick={leave}
              disabled={Boolean(
                actionBusy,
              )}
              className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 disabled:opacity-50"
            >
              {actionBusy ===
              "leave"
                ? "Updating…"
                : isHost
                  ? "Stop playing"
                  : "Leave event"}
            </button>

            <button
              type="button"
              onClick={() => {
                setConfirmation(
                  null,
                );
              }}
              disabled={Boolean(
                actionBusy,
              )}
              className="min-h-11 rounded-xl text-sm font-semibold text-zinc-700 outline-none focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20"
            >
              Keep my seat
            </button>
          </div>
        }
      >
        <p className="px-1 py-2 text-sm leading-6 text-zinc-600">
          This changes participation only. Your account and saved decks are unaffected.
        </p>
      </EventActionSheet>

      <EventActionSheet
        open={
          confirmation ===
          "cancel-event"
        }
        title="Cancel this event?"
        description="Players will be notified. This cannot be undone."
        onClose={() => {
          if (!actionBusy) {
            setConfirmation(null);
          }
        }}
        footer={
          <div className="grid gap-2">
            <button
              type="button"
              onClick={
                cancelWholeEvent
              }
              disabled={Boolean(
                actionBusy,
              )}
              className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 disabled:opacity-50"
            >
              {actionBusy ===
              "cancel-event"
                ? "Cancelling…"
                : "Cancel event"}
            </button>

            <button
              type="button"
              onClick={() => {
                setConfirmation(
                  null,
                );
              }}
              disabled={Boolean(
                actionBusy,
              )}
              className="min-h-11 rounded-xl text-sm font-semibold text-zinc-700 outline-none focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20"
            >
              Keep event
            </button>
          </div>
        }
      >
        <p className="px-1 py-2 text-sm leading-6 text-zinc-600">
          Attendance, join requests, and player participation will close with the event.
        </p>
      </EventActionSheet>

      <EventQrScannerModal
        open={scannerOpen}
        onClose={() => {
          setScannerOpen(false);
        }}
        onCheckedIn={async () => {
          await refreshAfterAction();
        }}
      />

    </div>
  );
}

function PanelsStateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lg:contents">
      <section className="py-6 lg:col-start-1 lg:row-start-2">
        <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-zinc-950">
          The table
        </h2>

        <div className="mt-4">
          {children}
        </div>
      </section>
    </div>
  );
}

function LoginPanel() {
  return (
    <section className="rounded-row bg-surface-subtle/55 px-4 py-4">
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-zinc-950">
        Your seat
      </h2>

      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Log in to request a seat and manage your event deck.
      </p>

      <Link
        href="/login"
        className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#6E5AA7] outline-none focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20"
      >
        Log in
      </Link>
    </section>
  );
}
