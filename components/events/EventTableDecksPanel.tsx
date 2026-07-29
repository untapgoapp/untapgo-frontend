"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Check,
  Clipboard,
  Eye,
  EyeOff,
  Layers3,
  List,
  LockKeyhole,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";

import {
  getEventAttendees,
  getEventDecks,
  type EventAttendee,
  type EventDeckBrief,
  type EventDeckVisibility,
  type EventPlayerDeck,
} from "@/services/events";

type EventTableDecksPanelProps = {
  eventId: string;
  currentUserId: string;
  hostUserId?: string | null;
};

type TableDeckRow = {
  userId: string;
  nickname: string;
  avatarUrl?: string | null;
  isHost: boolean;
  isMe: boolean;
  association: EventPlayerDeck | null;
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

function getAttendeeUserId(
  attendee: EventAttendee,
): string | null {
  const value =
    attendee.user_id ??
    attendee.id;

  return value
    ? String(value)
    : null;
}

function getAttendeeNickname(
  attendee: EventAttendee,
): string {
  const nickname =
    attendee.nickname?.trim();

  if (nickname) {
    return nickname;
  }

  const userId =
    getAttendeeUserId(attendee);

  return userId
    ? `Player ${userId.slice(0, 4)}`
    : "Player";
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

function formatSlug(
  value?: string | null,
): string {
  if (!value) {
    return "No format";
  }

  return value
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function getVisibilityLabel(
  visibility?: EventDeckVisibility | null,
): string {
  switch (visibility) {
    case "private":
      return "Private";

    case "full":
      return "Full decklist";

    case "name":
    default:
      return "Name only";
  }
}

function getErrorMessage(
  error: unknown,
): string {
  const record =
    error &&
    typeof error === "object"
      ? (error as {
          code?: unknown;
          message?: unknown;
        })
      : null;

  const code =
    typeof record?.code === "string"
      ? record.code.toUpperCase()
      : "";

  const message =
    typeof record?.message === "string"
      ? record.message
      : typeof error === "string"
        ? error
        : "Could not load table decks.";

  const normalized =
    `${code} ${message}`.toUpperCase();

  if (
    normalized.includes(
      "EVENT_DECK_LIST_NOT_ALLOWED",
    )
  ) {
    return "Only confirmed players and the event host can view table decks.";
  }

  if (
    normalized.includes(
      "EVENT_DECK_MEMBERSHIP_CHECK_UNAVAILABLE",
    )
  ) {
    return "Player information is temporarily unavailable.";
  }

  if (
    normalized.includes(
      "EVENT_DECK_BLOCK_CHECK_UNAVAILABLE",
    )
  ) {
    return "Deck privacy information is temporarily unavailable.";
  }

  if (
    normalized.includes(
      "AUTH_REQUIRED",
    )
  ) {
    return "You need to sign in again.";
  }

  if (
    !message ||
    message === "[object Object]"
  ) {
    return "Could not load table decks.";
  }

  return message;
}

export default function EventTableDecksPanel({
  eventId,
  currentUserId,
  hostUserId,
}: EventTableDecksPanelProps) {
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

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    openDeck,
    setOpenDeck,
  ] = useState<OpenDeck | null>(
    null,
  );

  const [copied, setCopied] =
    useState(false);

  const loadTableDecks =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          loadedAttendees,
          loadedDecks,
        ] = await Promise.all([
          getEventAttendees(
            eventId,
          ),
          getEventDecks(
            eventId,
          ),
        ]);

        setAttendees(
          Array.isArray(
            loadedAttendees,
          )
            ? loadedAttendees
            : [],
        );

        setAssociations(
          Array.isArray(
            loadedDecks.decks,
          )
            ? loadedDecks.decks
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
    void loadTableDecks();
  }, [loadTableDecks]);

  useEffect(() => {
    if (!openDeck) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    function handleKeyDown(
      keyboardEvent: KeyboardEvent,
    ) {
      if (
        keyboardEvent.key ===
        "Escape"
      ) {
        setOpenDeck(null);
      }
    }

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
  }, [openDeck]);

  useEffect(() => {
    setCopied(false);
  }, [openDeck]);

  const rows =
    useMemo<TableDeckRow[]>(
      () => {
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
            getAttendeeUserId(
              attendee,
            );

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
                getAttendeeNickname(
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
            }),
          )
          .sort(
            (left, right) => {
              if (
                left.isHost &&
                !right.isHost
              ) {
                return -1;
              }

              if (
                right.isHost &&
                !left.isHost
              ) {
                return 1;
              }

              if (
                left.isMe &&
                !right.isMe
              ) {
                return -1;
              }

              if (
                right.isMe &&
                !left.isMe
              ) {
                return 1;
              }

              return left.nickname.localeCompare(
                right.nickname,
              );
            },
          );
      },
      [
        associations,
        attendees,
        currentUserId,
        hostUserId,
      ],
    );

  const selectedCount =
    rows.filter(
      (row) =>
        row.association !== null,
    ).length;

  const subtitle =
    rows.length === 0
      ? "No confirmed players"
      : `${selectedCount}/${rows.length} player${
          rows.length === 1
            ? ""
            : "s"
        } selected a deck`;

  async function copyDecklist() {
    const exportText =
      openDeck?.deck.export_text;

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
      <section className="rounded-[1.35rem] border border-black/10 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
              Table loadouts
            </p>

            <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-950">
              Decks at this table
            </h2>

            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadTableDecks();
            }}
            disabled={loading}
            aria-label="Refresh table decks"
            title="Refresh table decks"
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

        {error ? (
          <StatusMessage>
            {error}
          </StatusMessage>
        ) : null}

        {loading ? (
          <LoadingRows />
        ) : null}

        {!loading &&
        !error &&
        rows.length === 0 ? (
          <EmptyState />
        ) : null}

        {!loading &&
        !error &&
        rows.length > 0 ? (
          <div className="mt-5 divide-y divide-black/10">
            {rows.map((row) => (
              <PlayerDeckRow
                key={row.userId}
                row={row}
                onOpenDeck={(
                  deck,
                ) => {
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

      {openDeck ? (
        <DecklistDialog
          openDeck={openDeck}
          copied={copied}
          onCopy={() => {
            void copyDecklist();
          }}
          onClose={() => {
            setOpenDeck(null);
          }}
        />
      ) : null}
    </>
  );
}

function PlayerDeckRow({
  row,
  onOpenDeck,
}: {
  row: TableDeckRow;
  onOpenDeck: (
    deck: EventDeckBrief,
  ) => void;
}) {
  const association =
    row.association;

  const visibility =
    association?.visibility ??
    null;

  const deck =
    association?.deck ??
    null;

  const isPrivate =
    visibility === "private";

  const hiddenFromViewer =
    isPrivate &&
    !row.isMe;

  const canOpenDecklist =
    Boolean(
      deck?.export_text,
    ) &&
    (row.isMe ||
      visibility === "full");

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-3">
        <PlayerAvatar
          nickname={row.nickname}
          avatarUrl={row.avatarUrl}
        />

        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${encodeURIComponent(
              row.userId,
            )}`}
            className="block truncate text-sm font-semibold text-zinc-900 transition hover:text-[#6E5AA7]"
          >
            {row.nickname}

            {row.isMe ? (
              <span className="font-normal text-zinc-400">
                {" "}
                · You
              </span>
            ) : null}
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {row.isHost ? (
              <SmallTag>
                Host
              </SmallTag>
            ) : null}

            {association ? (
              <VisibilityTag
                visibility={
                  visibility ??
                  "name"
                }
              />
            ) : null}
          </div>
        </div>
      </div>

      {!association ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-black/[0.035] px-4 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-zinc-400">
            <Layers3 className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-600">
              No deck selected
            </p>

            <p className="mt-0.5 text-xs text-zinc-400">
              This player has not
              added a deck yet.
            </p>
          </div>
        </div>
      ) : null}

      {hiddenFromViewer ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-black/10 bg-black/[0.025] px-4 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-zinc-500">
            <LockKeyhole className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-700">
              Private deck
            </p>

            <p className="mt-0.5 text-xs leading-5 text-zinc-500">
              This player chose not
              to reveal their deck.
            </p>
          </div>
        </div>
      ) : null}

      {association &&
      !hiddenFromViewer &&
      deck ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-black/[0.02]">
          <div className="flex items-center gap-3 p-3">
            <DeckCover
              deck={deck}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {deck.name}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                {formatSlug(
                  deck.format_slug,
                )}
              </p>
            </div>

            {canOpenDecklist ? (
              <button
                type="button"
                onClick={() => {
                  onOpenDeck(deck);
                }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#6E5AA7] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#5F4E94]"
              >
                <List className="h-3.5 w-3.5" />
                View list
              </button>
            ) : null}
          </div>

          {visibility === "name" &&
          !row.isMe ? (
            <div className="border-t border-black/10 px-3 py-2 text-xs leading-5 text-zinc-500">
              The full decklist is
              hidden.
            </div>
          ) : null}

          {visibility === "private" &&
          row.isMe ? (
            <div className="border-t border-black/10 px-3 py-2 text-xs leading-5 text-zinc-500">
              Only you can see this
              deck selection.
            </div>
          ) : null}
        </div>
      ) : null}

      {association &&
      !hiddenFromViewer &&
      !deck ? (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />

          <p className="text-sm text-amber-800">
            This deck is no longer
            available.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function VisibilityTag({
  visibility,
}: {
  visibility: EventDeckVisibility;
}) {
  const Icon =
    visibility === "private"
      ? EyeOff
      : visibility === "full"
        ? List
        : Eye;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.045] px-2 py-1 text-[10px] font-semibold text-zinc-500">
      <Icon className="h-3 w-3" />
      {getVisibilityLabel(
        visibility,
      )}
    </span>
  );
}

function SmallTag({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="rounded-full bg-[#EEE9FF] px-2 py-1 text-[10px] font-semibold text-[#6E5AA7]">
      {children}
    </span>
  );
}

function PlayerAvatar({
  nickname,
  avatarUrl,
}: {
  nickname: string;
  avatarUrl?: string | null;
}) {
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

function DeckCover({
  deck,
}: {
  deck: EventDeckBrief;
}) {
  if (deck.image_url) {
    return (
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={deck.image_url}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#EEE9FF] text-[#6E5AA7]">
      <Layers3 className="h-5 w-5" />
    </div>
  );
}

function DecklistDialog({
  openDeck,
  copied,
  onCopy,
  onClose,
}: {
  openDeck: OpenDeck;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}) {
  const exportText =
    openDeck.deck.export_text ??
    "";

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-decklist-title"
        onMouseDown={(
          mouseEvent,
        ) => {
          mouseEvent.stopPropagation();
        }}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.35)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-black/10 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6E5AA7]">
              {openDeck.nickname}
            </p>

            <h2
              id="event-decklist-title"
              className="mt-1 truncate text-xl font-black tracking-tight text-zinc-950"
            >
              {openDeck.deck.name}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {formatSlug(
                openDeck.deck
                  .format_slug,
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close decklist"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 text-zinc-500 transition hover:bg-black/[0.05] hover:text-black"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#F8F5EF] p-4 sm:p-5">
          {exportText ? (
            <pre className="whitespace-pre-wrap rounded-2xl border border-black/10 bg-white p-4 font-mono text-xs leading-6 text-zinc-700">
              {exportText}
            </pre>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              This deck does not
              have an exported
              decklist yet.
            </div>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-black/10 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-black/20 hover:text-black"
          >
            Close
          </button>

          <button
            type="button"
            onClick={onCopy}
            disabled={!exportText}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#6E5AA7] px-4 text-sm font-semibold text-white transition hover:bg-[#5F4E94] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Clipboard className="h-4 w-4" />
                Copy decklist
              </>
            )}
          </button>
        </footer>
      </section>
    </div>
  );
}

function StatusMessage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
      <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />

      <p className="whitespace-pre-wrap">
        {children}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-5 flex items-center gap-3 rounded-2xl bg-black/[0.035] px-4 py-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-zinc-400">
        <UserRound className="h-4 w-4" />
      </div>

      <p className="text-sm text-zinc-500">
        No confirmed players are
        at this table yet.
      </p>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="mt-5 grid gap-4">
      <LoadingRow />
      <LoadingRow />
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 animate-pulse rounded-full bg-black/10" />

      <div className="flex-1">
        <div className="h-3.5 w-28 animate-pulse rounded-full bg-black/10" />

        <div className="mt-2 h-12 animate-pulse rounded-2xl bg-black/[0.06]" />
      </div>
    </div>
  );
}