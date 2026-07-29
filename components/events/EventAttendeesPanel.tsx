"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";

import {
  getEventAttendees,
  kickEventAttendee,
  type EventAttendee,
} from "@/services/events";

type EventAttendeesPanelProps = {
  eventId: string;
  attendeesCount: number;
  maxPlayers: number;
  isHost: boolean;
  currentUserId: string | null;
  hostUserId?: string | null;
  eventStatus?: string | null;
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
  attendee: EventAttendee,
): string | null {
  const value =
    attendee.user_id ??
    attendee.id;

  if (!value) {
    return null;
  }

  return String(value);
}

function getNickname(
  attendee: EventAttendee,
): string {
  const nickname =
    attendee.nickname?.trim();

  const userId =
    getUserId(attendee);

  if (nickname) {
    return nickname;
  }

  if (userId) {
    return `Player ${userId.slice(
      0,
      4,
    )}`;
  }

  return "Player";
}

function isActiveAttendee(
  attendee: EventAttendee,
): boolean {
  if (
    attendee.is_playing === true
  ) {
    return true;
  }

  if (
    attendee.is_playing === false
  ) {
    return false;
  }

  const status = normalize(
    attendee.visible_status ??
      attendee.status,
  );

  if (!status) {
    return true;
  }

  const inactiveStatuses = [
    "pending",
    "requested",
    "request",
    "rejected",
    "declined",
    "kicked",
    "removed",
    "left",
    "cancelled",
    "canceled",
  ];

  return !inactiveStatuses.some(
    (inactiveStatus) =>
      status.includes(
        inactiveStatus,
      ),
  );
}

function formatRole(
  value?: string | null,
): string | null {
  const role = value?.trim();

  if (!role) {
    return null;
  }

  return (
    role.slice(0, 1).toUpperCase() +
    role.slice(1).toLowerCase()
  );
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
      code: "NOT_HOST",
      message:
        "Only the event host can remove players.",
    },
    {
      code: "EVENT_NOT_FOUND",
      message:
        "This event could not be found.",
    },
    {
      code: "ATTENDEE_NOT_FOUND",
      message:
        "This player is no longer part of the event.",
    },
    {
      code: "USER_NOT_JOINED",
      message:
        "This player is no longer part of the event.",
    },
    {
      code: "CANNOT_KICK_HOST",
      message:
        "The event host cannot be removed.",
    },
    {
      code: "EVENT_STARTED",
      message:
        "Players cannot be removed after the event starts.",
    },
    {
      code: "EVENT_CANCELLED",
      message:
        "This event has been cancelled.",
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

export default function EventAttendeesPanel({
  eventId,
  attendeesCount,
  maxPlayers,
  isHost,
  currentUserId,
  hostUserId,
  eventStatus,
  onChanged,
}: EventAttendeesPanelProps) {
  const router = useRouter();

  const [
    attendees,
    setAttendees,
  ] = useState<EventAttendee[]>(
    [],
  );

  const [loading, setLoading] =
    useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState<string | null>(
    null,
  );

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(
    null,
  );

  const [message, setMessage] =
    useState<string | null>(
      null,
    );

  const [
    removingUserId,
    setRemovingUserId,
  ] = useState<string | null>(
    null,
  );

  const loadAttendees =
    useCallback(async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const rows =
          await getEventAttendees(
            eventId,
          );

        setAttendees(
          Array.isArray(rows)
            ? rows
            : [],
        );
      } catch (error) {
        setLoadError(
          getErrorMessage(error),
        );
      } finally {
        setLoading(false);
      }
    }, [eventId]);

  useEffect(() => {
    void loadAttendees();
  }, [loadAttendees]);

  const sortedAttendees =
    useMemo(() => {
      const attendeesByUser =
        new Map<
          string,
          EventAttendee
        >();

      for (
        const attendee of
        attendees
      ) {
        if (
          !isActiveAttendee(
            attendee,
          )
        ) {
          continue;
        }

        const userId =
          getUserId(attendee);

        if (!userId) {
          continue;
        }

        attendeesByUser.set(
          userId,
          attendee,
        );
      }

      return Array.from(
        attendeesByUser.values(),
      ).sort((left, right) => {
        const leftId =
          getUserId(left);

        const rightId =
          getUserId(right);

        if (
          leftId === hostUserId &&
          rightId !== hostUserId
        ) {
          return -1;
        }

        if (
          rightId === hostUserId &&
          leftId !== hostUserId
        ) {
          return 1;
        }

        if (
          leftId ===
            currentUserId &&
          rightId !==
            currentUserId
        ) {
          return -1;
        }

        if (
          rightId ===
            currentUserId &&
          leftId !==
            currentUserId
        ) {
          return 1;
        }

        return getNickname(
          left,
        ).localeCompare(
          getNickname(right),
        );
      });
    }, [
      attendees,
      currentUserId,
      hostUserId,
    ]);

  const displayedCount =
    loading
      ? Math.max(
          0,
          Number(
            attendeesCount ?? 0,
          ),
        )
      : sortedAttendees.length;

  const seatsLeft =
    maxPlayers > 0
      ? Math.max(
          0,
          maxPlayers -
            displayedCount,
        )
      : null;

  const subtitle =
    maxPlayers > 0
      ? `${displayedCount}/${maxPlayers} players${
          seatsLeft !== null
            ? ` · ${seatsLeft} seat${
                seatsLeft === 1
                  ? ""
                  : "s"
              } left`
            : ""
        }`
      : `${displayedCount} player${
          displayedCount === 1
            ? ""
            : "s"
        }`;

  const normalizedEventStatus =
    normalize(eventStatus);

  const canManagePlayers =
    isHost &&
    (normalizedEventStatus ===
      "open" ||
      normalizedEventStatus ===
        "full");

  async function handleRemove(
    userId: string,
    nickname: string,
  ) {
    const confirmed =
      window.confirm(
        `Remove ${nickname} from this event?\n\nThey will not be able to request another seat for 10 minutes.`,
      );

    if (!confirmed) {
      return;
    }

    setRemovingUserId(userId);
    setActionError(null);
    setMessage(null);

    try {
      await kickEventAttendee({
        eventId,
        userId,
        cooldownMinutes: 10,
      });

      setAttendees(
        (currentAttendees) =>
          currentAttendees.filter(
            (attendee) =>
              getUserId(
                attendee,
              ) !== userId,
          ),
      );

      setMessage(
        `${nickname} was removed from the event.`,
      );

      router.refresh();

      if (onChanged) {
        try {
          await onChanged();
        } catch {
          setActionError(
            "The player was removed, but the latest event information could not be reloaded.",
          );
        }
      }
    } catch (error) {
      setActionError(
        getErrorMessage(error),
      );
    } finally {
      setRemovingUserId(
        null,
      );
    }
  }

  return (
    <section className="rounded-[1.35rem] border border-black/10 bg-white p-5">
      <PanelHeader
        title="Players"
        subtitle={subtitle}
        loading={loading}
        onRefresh={() => {
          setMessage(null);
          setActionError(null);

          void loadAttendees();
        }}
      />

      {loadError ? (
        <StatusMessage
          variant="error"
        >
          {loadError}
        </StatusMessage>
      ) : null}

      {actionError ? (
        <StatusMessage
          variant="error"
        >
          {actionError}
        </StatusMessage>
      ) : null}

      {message ? (
        <StatusMessage
          variant="success"
        >
          {message}
        </StatusMessage>
      ) : null}

      <PanelBody
        loading={loading}
        empty={
          sortedAttendees.length ===
          0
        }
        emptyText="No players have joined yet."
      >
        <div className="divide-y divide-black/10">
          {sortedAttendees.map(
            (attendee) => {
              const userId =
                getUserId(
                  attendee,
                );

              if (!userId) {
                return null;
              }

              const nickname =
                getNickname(
                  attendee,
                );

              const isMe =
                currentUserId ===
                userId;

              const isHostRow =
                hostUserId ===
                userId;

              const canRemove =
                canManagePlayers &&
                !isHostRow &&
                !isMe;

              const removing =
                removingUserId ===
                userId;

              return (
                <AttendeeRow
                  key={userId}
                  attendee={
                    attendee
                  }
                  userId={userId}
                  nickname={
                    nickname
                  }
                  isMe={isMe}
                  isHost={
                    isHostRow
                  }
                  role={
                    attendee.role
                  }
                  canRemove={
                    canRemove
                  }
                  removing={
                    removing
                  }
                  onRemove={() => {
                    void handleRemove(
                      userId,
                      nickname,
                    );
                  }}
                />
              );
            },
          )}
        </div>
      </PanelBody>

      {isHost &&
      !canManagePlayers &&
      sortedAttendees.length >
        0 ? (
        <p className="mt-4 text-xs leading-5 text-zinc-500">
          Players can only be
          removed while the event
          is open or full.
        </p>
      ) : null}
    </section>
  );
}

function AttendeeRow({
  attendee,
  userId,
  nickname,
  isMe,
  isHost,
  role,
  canRemove,
  removing,
  onRemove,
}: {
  attendee: EventAttendee;
  userId: string;
  nickname: string;
  isMe: boolean;
  isHost: boolean;
  role?: string | null;
  canRemove: boolean;
  removing: boolean;
  onRemove: () => void;
}) {
  const roleLabel = isHost
    ? "Host"
    : formatRole(role);

  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <AttendeeAvatar
          attendee={attendee}
          nickname={nickname}
        />

        <div className="min-w-0">
          <Link
            href={`/profile/${encodeURIComponent(
              userId,
            )}`}
            className="block truncate text-sm font-semibold text-zinc-900 transition hover:text-[#6E5AA7]"
          >
            {nickname}

            {isMe ? (
              <span className="font-normal text-zinc-400">
                {" "}
                · You
              </span>
            ) : null}
          </Link>

          {roleLabel ? (
            <p className="mt-0.5 text-xs text-zinc-500">
              {roleLabel}
            </p>
          ) : null}
        </div>
      </div>

      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          aria-label={`Remove ${nickname}`}
          title={`Remove ${nickname}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-red-200 bg-red-50 text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {removing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </button>
      ) : null}
    </div>
  );
}

function AttendeeAvatar({
  attendee,
  nickname,
}: {
  attendee: EventAttendee;
  nickname: string;
}) {
  const avatarUrl =
    attendee.avatar_url?.trim();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full border border-black/10 object-cover"
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

function PanelHeader({
  title,
  subtitle,
  loading,
  onRefresh,
}: {
  title: string;
  subtitle: string;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
          Table
        </p>

        <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-950">
          {title}
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        aria-label="Refresh players"
        title="Refresh players"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 bg-black/[0.035] text-zinc-500 transition hover:border-black/20 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw
          className={
            loading
              ? "h-4 w-4 animate-spin"
              : "h-4 w-4"
          }
        />
      </button>
    </div>
  );
}

function PanelBody({
  loading,
  empty,
  emptyText,
  children,
}: {
  loading: boolean;
  empty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="mt-5 grid gap-3">
        <LoadingRow />
        <LoadingRow />
      </div>
    );
  }

  if (empty) {
    return (
      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-black/[0.035] px-4 py-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-zinc-400">
          <UserRound className="h-4 w-4" />
        </div>

        <p className="text-sm text-zinc-500">
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      {children}
    </div>
  );
}

function StatusMessage({
  variant,
  children,
}: {
  variant: "success" | "error";
  children: ReactNode;
}) {
  const success =
    variant === "success";

  return (
    <div
      className={[
        "mt-4 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm",
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700",
      ].join(" ")}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      )}

      <p className="whitespace-pre-wrap">
        {children}
      </p>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 animate-pulse rounded-full bg-black/10" />

      <div className="flex-1">
        <div className="h-3.5 w-28 animate-pulse rounded-full bg-black/10" />

        <div className="mt-2 h-3 w-16 animate-pulse rounded-full bg-black/[0.06]" />
      </div>
    </div>
  );
}