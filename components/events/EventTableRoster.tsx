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
  Check,
  Clipboard,
  Eye,
  EyeOff,
  Layers3,
  List,
  LockKeyhole,
  MoreHorizontal,
} from "lucide-react";

import EventActionSheet from "@/components/events/EventActionSheet";
import {
  getEventAttendance,
  getEventAttendees,
  getEventDecks,
  kickEventAttendee,
  type AttendanceStatus,
  type EventAttendee,
  type EventAttendanceParticipant,
  type EventDeckBrief,
  type EventDeckVisibility,
  type EventPlayerDeck,
} from "@/services/events";

type EventTableRosterProps = {
  eventId: string;
  currentUserId: string;
  hostUserId?: string | null;
  eventStatus?: string | null;
  attendeesCount: number;
  maxPlayers: number;
  isHost: boolean;
  canViewDecks: boolean;
  refreshKey?: number;
  onChanged?: () => Promise<void> | void;
};

type TableRow = {
  userId: string;
  nickname: string;
  avatarUrl?: string | null;
  isHost: boolean;
  isMe: boolean;
  association: EventPlayerDeck | null;
  attendanceStatus: AttendanceStatus | null;
  verificationMethod?: "host" | "qr" | null;
};

type OpenDeck = {
  nickname: string;
  deck: EventDeckBrief;
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

  return value
    ? String(value)
    : null;
}

function getNickname(
  attendee: EventAttendee,
): string {
  const nickname =
    attendee.nickname?.trim();

  if (nickname) {
    return nickname;
  }

  const userId =
    getUserId(attendee);

  return userId
    ? `Player ${userId.slice(0, 4)}`
    : "Player";
}

function isActiveAttendee(
  attendee: EventAttendee,
): boolean {
  const status = normalize(
    attendee.visible_status ??
      attendee.status,
  );

  /*
   * An explicit membership status is the source of truth.
   * It must override stale legacy is_playing values.
   */
  if (status) {
    if (
      [
        "accepted",
        "approved",
        "confirmed",
        "joined",
        "playing",
      ].includes(status)
    ) {
      return true;
    }

    if (
      [
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
        "withdrawn",
      ].includes(status)
    ) {
      return false;
    }

    /*
     * Unknown explicit statuses are not considered
     * confirmed by default.
     */
    return false;
  }

  /*
   * Compatibility fallback for older attendee responses
   * that did not include an explicit status.
   */
  return attendee.is_playing === true;
}

function getVisibilityLabel(
  visibility?: EventDeckVisibility | null,
): string {
  if (visibility === "private") {
    return "Private";
  }

  if (visibility === "full") {
    return "Full decklist";
  }

  return "Name only";
}

function getAttendanceLabel(
  status: AttendanceStatus,
  method?: "host" | "qr" | null,
): string {
  if (
    status === "attended" ||
    status === "checked_in"
  ) {
    return method === "qr"
      ? "Checked in · QR"
      : method === "host"
        ? "Checked in · Host"
        : "Checked in";
  }

  if (status === "no_show") {
    return "No-show";
  }

  if (status === "excused") {
    return "Excused";
  }

  if (status === "disputed") {
    return "Disputed";
  }

  return "Expected";
}

function getAttendanceClasses(
  status: AttendanceStatus,
): string {
  if (
    status === "attended" ||
    status === "checked_in"
  ) {
    return "text-emerald-700";
  }

  if (status === "no_show") {
    return "text-red-700";
  }

  if (status === "excused") {
    return "text-sky-700";
  }

  return "text-zinc-600";
}

function getErrorMessage(
  error: unknown,
): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Could not load the table.";

  const normalized =
    message.toUpperCase();

  if (
    normalized.includes(
      "CANNOT_KICK_HOST",
    )
  ) {
    return "The event host cannot be removed.";
  }

  if (
    normalized.includes(
      "EVENT_STARTED",
    )
  ) {
    return "Players cannot be removed after the event starts.";
  }

  if (
    normalized.includes(
      "ATTENDEE_NOT_FOUND",
    ) ||
    normalized.includes(
      "USER_NOT_JOINED",
    )
  ) {
    return "This player is no longer part of the event.";
  }

  return message;
}

export default function EventTableRoster({
  eventId,
  currentUserId,
  hostUserId,
  eventStatus,
  attendeesCount,
  maxPlayers,
  isHost,
  canViewDecks,
  refreshKey = 0,
  onChanged,
}: EventTableRosterProps) {
  const router = useRouter();

  const [
    attendees,
    setAttendees,
  ] = useState<EventAttendee[]>(
    [],
  );

  const [
    associations,
    setAssociations,
  ] = useState<EventPlayerDeck[]>(
    [],
  );

  const [
    attendanceByUser,
    setAttendanceByUser,
  ] = useState<
    Map<
      string,
      Pick<
        EventAttendanceParticipant,
        "attendance_status" | "verification_method"
      >
    >
  >(new Map());

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
    removingRow,
    setRemovingRow,
  ] = useState<TableRow | null>(
    null,
  );

  const [
    removing,
    setRemoving,
  ] = useState(false);

  const [
    openDeck,
    setOpenDeck,
  ] = useState<OpenDeck | null>(
    null,
  );

  const [copied, setCopied] =
    useState(false);

  const loadTable =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const loadedAttendees =
          await getEventAttendees(
            eventId,
          );

        setAttendees(
          Array.isArray(
            loadedAttendees,
          )
            ? loadedAttendees
            : [],
        );

        const [
          deckResult,
          attendanceResult,
        ] = await Promise.allSettled([
          canViewDecks
            ? getEventDecks(
                eventId,
              )
            : Promise.resolve({
                decks: [],
              }),
          isHost
            ? getEventAttendance(
                eventId,
              )
            : Promise.resolve(null),
        ]);

        if (
          deckResult.status ===
          "fulfilled"
        ) {
          setAssociations(
            Array.isArray(
              deckResult.value
                .decks,
            )
              ? deckResult.value
                  .decks
              : [],
          );
        } else {
          setAssociations([]);
          setError(
            getErrorMessage(
              deckResult.reason,
            ),
          );
        }

        if (
          attendanceResult.status ===
            "fulfilled" &&
          attendanceResult.value
        ) {
          setAttendanceByUser(
            new Map(
              attendanceResult.value.participants.map(
                (participant) => [
                  String(
                    participant.user_id,
                  ),
                  {
                    attendance_status:
                      participant.attendance_status,
                    verification_method:
                      participant.verification_method,
                  },
                ],
              ),
            ),
          );
        } else {
          setAttendanceByUser(
            new Map(),
          );
        }
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
          ),
        );
      } finally {
        setLoading(false);
      }
    }, [
      canViewDecks,
      eventId,
      isHost,
    ]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadTable();
      }, 0);

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [loadTable, refreshKey]);

  const rows =
    useMemo<TableRow[]>(() => {
      const associationByUser =
        new Map<
          string,
          EventPlayerDeck
        >();

      for (
        const association of
        associations
      ) {
        associationByUser.set(
          String(
            association.user_id,
          ),
          association,
        );
      }

      const attendeeByUser =
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

        attendeeByUser.set(
          userId,
          attendee,
        );
      }

      return Array.from(
        attendeeByUser.entries(),
      )
        .map(
          ([
            userId,
            attendee,
          ]) => ({
            userId,
            nickname:
              getNickname(
                attendee,
              ),
            avatarUrl:
              attendee.avatar_url,
            isHost:
              String(
                hostUserId ?? "",
              ) === userId,
            isMe:
              String(
                currentUserId,
              ) === userId,
            association:
              associationByUser.get(
                userId,
              ) ?? null,
            attendanceStatus:
              attendanceByUser.get(userId)
                ?.attendance_status ?? null,
            verificationMethod:
              attendanceByUser.get(userId)
                ?.verification_method ?? null,
          }),
        )
        .sort((left, right) => {
          if (
            left.isHost !==
            right.isHost
          ) {
            return left.isHost
              ? -1
              : 1;
          }

          if (
            left.isMe !==
            right.isMe
          ) {
            return left.isMe
              ? -1
              : 1;
          }

          return left.nickname.localeCompare(
            right.nickname,
          );
        });
    }, [
      associations,
      attendees,
      attendanceByUser,
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
      : rows.length;

  const status =
    normalize(eventStatus);

  const canManagePlayers =
    isHost &&
    (status === "open" ||
      status === "full");

  async function removePlayer() {
    if (
      !removingRow ||
      removing
    ) {
      return;
    }

    setRemoving(true);
    setError(null);
    setMessage(null);

    try {
      await kickEventAttendee({
        eventId,
        userId:
          removingRow.userId,
        cooldownMinutes: 10,
      });

      setAttendees(
        (current) =>
          current.filter(
            (attendee) =>
              getUserId(
                attendee,
              ) !==
              removingRow.userId,
          ),
      );

      setMessage(
        `${removingRow.nickname} was removed from the event.`,
      );
      setRemovingRow(null);
      router.refresh();

      try {
        await onChanged?.();
      } catch {
        setError(
          "The player was removed, but the latest event information could not be reloaded.",
        );
      }
    } catch (removeError) {
      setError(
        getErrorMessage(
          removeError,
        ),
      );
    } finally {
      setRemoving(false);
    }
  }

  async function copyDecklist() {
    const exportText =
      openDeck?.deck
        .export_text;

    if (!exportText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        exportText,
      );
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setError(
        "Could not copy the decklist.",
      );
    }
  }

  return (
    <>
      <section
        aria-labelledby="event-table-title"
        className="py-7 lg:col-start-1 lg:row-start-2"
      >
        <div>
          <h2
            id="event-table-title"
            className="text-xl font-semibold tracking-tight text-foreground"
          >
            The table
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {displayedCount}
            {maxPlayers > 0
              ? ` of ${maxPlayers}`
              : ""}{" "}
            confirmed
          </p>
        </div>

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
          <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
            {[0, 1, 2].map(
              (item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse bg-surface-subtle/60"
                />
              ),
            )}
          </div>
        ) : null}

        {!loading &&
        rows.length === 0 ? (
          <p className="mt-4 border-y border-border/70 py-5 text-sm text-muted-foreground">
            No players at the table yet.
          </p>
        ) : null}

        {!loading &&
        rows.length > 0 ? (
          <div className="mt-4 divide-y divide-border/70 border-y border-border/70">
            {rows.map((row) => (
              <PlayerCard
                key={row.userId}
                row={row}
                canViewDecks={
                  canViewDecks
                }
                canRemove={
                  canManagePlayers &&
                  !row.isHost &&
                  !row.isMe
                }
                onRemove={() => {
                  setRemovingRow(
                    row,
                  );
                }}
                onOpenDeck={(
                  deck,
                ) => {
                  setCopied(false);
                  setOpenDeck({
                    nickname:
                      row.nickname,
                    deck,
                  });
                }}
              />
            ))}
          </div>
        ) : null}
      </section>

      <EventActionSheet
        open={Boolean(openDeck)}
        title={
          openDeck?.deck.name ??
          "Decklist"
        }
        description={
          openDeck
            ? `${openDeck.nickname} · Full decklist`
            : undefined
        }
        onClose={() => {
          setOpenDeck(null);
          setCopied(false);
        }}
        footer={
          openDeck?.deck
            .export_text ? (
            <button
              type="button"
              onClick={() => {
                void copyDecklist();
              }}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#6E5AA7] px-4 text-sm font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/25"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
              {copied
                ? "Copied"
                : "Copy decklist"}
            </button>
          ) : undefined
        }
      >
        {openDeck?.deck
          .export_text ? (
          <pre className="whitespace-pre-wrap rounded-2xl bg-white p-4 font-mono text-xs leading-6 text-zinc-700">
            {
              openDeck.deck
                .export_text
            }
          </pre>
        ) : (
          <p className="py-3 text-sm text-zinc-500">
            This deck does not have an exported decklist.
          </p>
        )}
      </EventActionSheet>

      <EventActionSheet
        open={Boolean(
          removingRow,
        )}
        title={
          removingRow
            ? `Remove ${removingRow.nickname}?`
            : "Remove player?"
        }
        description="Their seat will become available and they cannot request another for 10 minutes."
        onClose={() => {
          if (!removing) {
            setRemovingRow(null);
          }
        }}
        footer={
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => {
                void removePlayer();
              }}
              disabled={removing}
              className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 disabled:opacity-50"
            >
              {removing
                ? "Removing…"
                : "Remove player"}
            </button>

            <button
              type="button"
              onClick={() => {
                setRemovingRow(null);
              }}
              disabled={removing}
              className="min-h-11 rounded-xl text-sm font-semibold text-zinc-700 outline-none focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20"
            >
              Keep player
            </button>
          </div>
        }
      >
        <p className="px-1 py-2 text-sm leading-6 text-zinc-600">
          This only removes the player from this event. It does not affect their account.
        </p>
      </EventActionSheet>
    </>
  );
}

function PlayerCard({
  row,
  canViewDecks,
  canRemove,
  onRemove,
  onOpenDeck,
}: {
  row: TableRow;
  canViewDecks: boolean;
  canRemove: boolean;
  onRemove: () => void;
  onOpenDeck: (
    deck: EventDeckBrief,
  ) => void;
}) {
  const association = row.association;
  const visibility = association?.visibility ?? null;
  const deck = association?.deck ?? null;

  const hiddenFromViewer =
    visibility === "private" &&
    !row.isMe;

  const canOpenDecklist =
    Boolean(deck?.export_text) &&
    (row.isMe || visibility === "full");

  let deckContent: ReactNode;

  if (!canViewDecks) {
    deckContent = (
      <p className="text-xs leading-5 text-zinc-400">
        Deck visible after confirming a seat
      </p>
    );
  } else if (!association) {
    deckContent = (
      <div className="flex items-center gap-2 text-zinc-400">
        <Layers3 className="h-4 w-4 shrink-0 text-primary/70" />
        <span className="text-xs">No deck selected</span>
      </div>
    );
  } else if (hiddenFromViewer) {
    deckContent = (
      <div className="flex items-center gap-2 text-zinc-500">
        <LockKeyhole className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium">Private deck</span>
      </div>
    );
  } else if (deck) {
    const content = (
      <>
        <DeckCover deck={deck} />

        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-xs font-semibold text-zinc-800">
            {deck.name}
          </span>

          <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-zinc-500">
            <VisibilityIcon visibility={visibility ?? "name"} />
            {getVisibilityLabel(visibility)}
          </span>
        </span>

        {canOpenDecklist ? (
          <List className="h-3.5 w-3.5 shrink-0 text-primary" />
        ) : null}
      </>
    );

    deckContent = canOpenDecklist ? (
      <button
        type="button"
        onClick={() => {
          onOpenDeck(deck);
        }}
        className="flex min-w-0 items-center gap-2.5 rounded-control px-1 py-1 outline-none transition-colors hover:bg-secondary/45 focus-visible:ring-[3px] focus-visible:ring-ring/20"
      >
        {content}
      </button>
    ) : (
      <div className="flex min-w-0 items-center gap-2.5 px-1 py-1">
        {content}
      </div>
    );
  } else {
    deckContent = (
      <div className="flex items-center gap-2 text-zinc-400">
        <Layers3 className="h-4 w-4 shrink-0" />
        <span className="text-xs">Deck unavailable</span>
      </div>
    );
  }

  return (
    <article
      className={[
        "relative flex min-h-[78px] flex-col gap-3 px-2 py-3 transition-colors sm:flex-row sm:items-center",
        canRemove ? "pr-12" : "",
        row.isHost
          ? "bg-secondary/20 hover:bg-secondary/35"
          : "bg-transparent hover:bg-surface-selected/40 focus-within:bg-surface-selected/40",
      ].join(" ")}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <PlayerAvatar
          nickname={row.nickname}
          avatarUrl={row.avatarUrl}
          isHost={row.isHost}
        />

        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${encodeURIComponent(row.userId)}`}
            className="block truncate text-sm font-semibold text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/20"
          >
            {row.nickname}
            {row.isMe ? (
              <span className="font-normal text-zinc-400"> · You</span>
            ) : null}
          </Link>

          <div className="mt-1 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-muted-foreground">
            <span
              className={
                row.isHost
                  ? "rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground"
                  : "text-muted-foreground"
              }
            >
              {row.isHost ? "Host" : "Player"}
            </span>

            {row.attendanceStatus ? (
              <span
                className={[
                  "inline-flex items-center gap-1 before:h-1.5 before:w-1.5 before:rounded-full before:bg-current",
                  getAttendanceClasses(row.attendanceStatus),
                ].join(" ")}
              >
                {getAttendanceLabel(
                  row.attendanceStatus,
                  row.verificationMethod,
                )}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-w-0 border-t border-border/60 pt-2 sm:w-[220px] sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
        {deckContent}
      </div>

      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Manage ${row.nickname}`}
          className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-control text-quiet-foreground outline-none transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/20"
        >
          <MoreHorizontal className="h-[18px] w-[18px]" />
        </button>
      ) : null}
    </article>
  );
}

function PlayerAvatar({
  nickname,
  avatarUrl,
  isHost,
}: {
  nickname: string;
  avatarUrl?: string | null;
  isHost: boolean;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={[
          "h-11 w-11 rounded-full bg-muted object-cover",
          isHost
            ? "ring-2 ring-primary/25 ring-offset-2 ring-offset-secondary/50"
            : "",
        ].join(" ")}
      />
    );
  }

  return (
    <div
      className={[
        "grid h-11 w-11 place-items-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground",
        isHost
          ? "ring-2 ring-primary/25 ring-offset-2 ring-offset-secondary/50"
          : "ring-1 ring-[#6E5AA7]/10",
      ].join(" ")}
    >
      {nickname
        .slice(0, 1)
        .toUpperCase()}
    </div>
  );
}

function DeckCover({
  deck,
}: {
  deck: EventDeckBrief;
}) {
  if (deck.image_url) {
    return (
      <span className="h-12 w-9 shrink-0 overflow-hidden rounded-[0.55rem] bg-zinc-200 shadow-[0_5px_12px_rgba(30,24,38,0.16)] ring-1 ring-black/[0.07]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={deck.image_url}
          alt=""
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span className="grid h-12 w-9 shrink-0 place-items-center rounded-[0.55rem] bg-[#EEE9FF] text-[#8A7BA6] shadow-[inset_0_0_0_1px_rgba(110,90,167,0.08)]">
      <Layers3 className="h-3.5 w-3.5" />
    </span>
  );
}

function VisibilityIcon({
  visibility,
}: {
  visibility: EventDeckVisibility;
}) {
  if (visibility === "private") {
    return (
      <EyeOff className="h-3 w-3 shrink-0" />
    );
  }

  if (visibility === "full") {
    return (
      <List className="h-3 w-3 shrink-0" />
    );
  }

  return (
    <Eye className="h-3 w-3 shrink-0" />
  );
}
