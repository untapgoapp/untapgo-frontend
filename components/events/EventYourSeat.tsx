"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Layers3,
  List,
  RefreshCw,
  ScanLine,
} from "lucide-react";

import EventActionSheet from "@/components/events/EventActionSheet";
import { decksApi } from "@/lib/decks-api";
import {
  clearMyEventDeck,
  getEventDecks,
  setMyEventDeck,
  type AttendanceMethod,
  type EventDeckBrief,
  type EventDeckVisibility,
  type EventPlayerDeck,
} from "@/services/events";
import type { Deck } from "@/types/decks";

type EventYourSeatProps = {
  eventId: string;
  currentUserId: string;
  eventStatus?: string | null;
  eventFormatSlug?: string | null;
  isHost: boolean;
  isPlaying: boolean;
  requested: boolean;
  canJoin: boolean;
  canLeave: boolean;
  canCancelRequest: boolean;
  canScan: boolean;
  attendanceMethod: AttendanceMethod;
  actionBusy: boolean;
  actionMessage?: string | null;
  actionError?: string | null;
  cooldownLabel?: string | null;
  deckSheetOpen: boolean;
  visibilitySheetOpen: boolean;
  onDeckSheetOpenChange: (
    open: boolean,
  ) => void;
  onVisibilitySheetOpenChange: (
    open: boolean,
  ) => void;
  onJoin: () => void;
  onCancelRequest: () => void;
  onScan: () => void;
  onLeave: () => void;
  onChanged?: () => Promise<void> | void;
};

const VISIBILITY_OPTIONS: Array<{
  value: EventDeckVisibility;
  label: string;
  description: string;
  icon: typeof Eye;
}> = [
  {
    value: "private",
    label: "Private",
    description:
      "Only you can see the selected deck.",
    icon: EyeOff,
  },
  {
    value: "name",
    label: "Name only",
    description:
      "Players can see the deck name and cover.",
    icon: Eye,
  },
  {
    value: "full",
    label: "Full decklist",
    description:
      "Players can open the complete decklist.",
    icon: List,
  },
];

function normalize(
  value?: string | null,
): string {
  return (value ?? "")
    .trim()
    .toLowerCase();
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
  if (visibility === "private") {
    return "Private";
  }

  if (visibility === "full") {
    return "Full decklist";
  }

  return "Name only";
}

function deckToBrief(
  deck: Deck,
): EventDeckBrief {
  return {
    id: deck.id,
    name: deck.name,
    format_slug:
      deck.format_slug,
    image_url: deck.image_url,
    is_public: deck.is_public,
    export_text:
      deck.export_text,
  };
}

function getDeckError(
  error: unknown,
): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Could not update your event deck.";

  const normalized =
    message.toUpperCase();

  if (
    normalized.includes(
      "NOT_EVENT_PLAYER",
    ) ||
    normalized.includes(
      "NOT_JOINED",
    )
  ) {
    return "A confirmed seat is required before selecting a deck.";
  }

  if (
    normalized.includes(
      "DECK_NOT_FOUND",
    )
  ) {
    return "This deck could not be found.";
  }

  return message;
}

export default function EventYourSeat({
  eventId,
  currentUserId,
  eventStatus,
  eventFormatSlug,
  isHost,
  isPlaying,
  requested,
  canJoin,
  canLeave,
  canCancelRequest,
  canScan,
  attendanceMethod,
  actionBusy,
  actionMessage,
  actionError,
  cooldownLabel,
  deckSheetOpen,
  visibilitySheetOpen,
  onDeckSheetOpenChange,
  onVisibilitySheetOpenChange,
  onJoin,
  onCancelRequest,
  onScan,
  onLeave,
  onChanged,
}: EventYourSeatProps) {
  const [decks, setDecks] =
    useState<Deck[]>([]);

  const [
    savedSelection,
    setSavedSelection,
  ] =
    useState<EventPlayerDeck | null>(
      null,
    );

  const [
    draftDeckId,
    setDraftDeckId,
  ] = useState("");

  const [
    draftVisibility,
    setDraftVisibility,
  ] =
    useState<EventDeckVisibility>(
      "name",
    );

  const [
    decksLoading,
    setDecksLoading,
  ] = useState(isPlaying);

  const [deckBusy, setDeckBusy] =
    useState(false);

  const [deckError, setDeckError] =
    useState<string | null>(null);

  const [
    deckMessage,
    setDeckMessage,
  ] = useState<string | null>(
    null,
  );

  const [
    removeSheetOpen,
    setRemoveSheetOpen,
  ] = useState(false);

  const loadDecks =
    useCallback(async () => {
      if (!isPlaying) {
        setDecksLoading(false);
        return;
      }

      setDecksLoading(true);
      setDeckError(null);

      try {
        const [
          deckList,
          eventDecks,
        ] = await Promise.all([
          decksApi.list(),
          getEventDecks(eventId),
        ]);

        const loadedDecks =
          Array.isArray(
            deckList.decks,
          )
            ? deckList.decks
            : [];

        const mySelection =
          (
            eventDecks.decks ?? []
          ).find(
            (entry) =>
              String(
                entry.user_id,
              ) ===
              String(
                currentUserId,
              ),
          ) ?? null;

        setDecks(loadedDecks);
        setSavedSelection(
          mySelection,
        );
        setDraftDeckId(
          mySelection?.deck?.id ??
            loadedDecks[0]?.id ??
            "",
        );
        setDraftVisibility(
          mySelection?.visibility ??
            "name",
        );
      } catch (error) {
        setDeckError(
          getDeckError(error),
        );
      } finally {
        setDecksLoading(false);
      }
    }, [
      currentUserId,
      eventId,
      isPlaying,
    ]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadDecks();
      }, 0);

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [loadDecks]);

  const sortedDecks =
    useMemo(() => {
      const eventFormat =
        normalize(
          eventFormatSlug,
        );

      return [...decks].sort(
        (left, right) => {
          const leftMatches =
            Boolean(eventFormat) &&
            normalize(
              left.format_slug,
            ) === eventFormat;

          const rightMatches =
            Boolean(eventFormat) &&
            normalize(
              right.format_slug,
            ) === eventFormat;

          if (
            leftMatches &&
            !rightMatches
          ) {
            return -1;
          }

          if (
            rightMatches &&
            !leftMatches
          ) {
            return 1;
          }

          return left.name.localeCompare(
            right.name,
          );
        },
      );
    }, [
      decks,
      eventFormatSlug,
    ]);

  const status =
    normalize(eventStatus);

  const deckLocked = [
    "cancelled",
    "canceled",
    "ended",
    "finished",
    "completed",
  ].includes(status);

  const selectedDeck =
    decks.find(
      (deck) =>
        deck.id ===
        draftDeckId,
    ) ?? null;

  const roleLabel = isHost
    ? isPlaying
      ? "Host · Playing"
      : "Host"
    : isPlaying
      ? "Player"
      : "Guest";

  const participationLabel =
    isPlaying
      ? "Confirmed"
      : requested
        ? "Request pending"
        : canJoin
          ? "Not joined"
          : "Unavailable";

  async function notifyChanged() {
    try {
      await onChanged?.();
    } catch {
      setDeckError(
        "Your deck was updated, but the latest event information could not be reloaded.",
      );
    }
  }

  function closeDeckSheet() {
    setDraftDeckId(
      savedSelection?.deck?.id ??
        sortedDecks[0]?.id ??
        "",
    );
    setDraftVisibility(
      savedSelection?.visibility ??
        "name",
    );
    onDeckSheetOpenChange(false);
  }

  function closeVisibilitySheet() {
    setDraftVisibility(
      savedSelection?.visibility ??
        "name",
    );
    onVisibilitySheetOpenChange(
      false,
    );
  }

  async function saveDeck() {
    if (
      !selectedDeck ||
      deckBusy ||
      deckLocked
    ) {
      return;
    }

    setDeckBusy(true);
    setDeckError(null);
    setDeckMessage(null);

    try {
      await setMyEventDeck({
        eventId,
        deckId: selectedDeck.id,
        visibility:
          draftVisibility,
      });

      setSavedSelection({
        user_id: currentUserId,
        visibility:
          draftVisibility,
        deck:
          deckToBrief(
            selectedDeck,
          ),
      });

      setDeckMessage(
        "Deck selection saved.",
      );
      onDeckSheetOpenChange(
        false,
      );
      await notifyChanged();
    } catch (error) {
      setDeckError(
        getDeckError(error),
      );
    } finally {
      setDeckBusy(false);
    }
  }

  async function saveVisibility() {
    if (
      deckBusy ||
      deckLocked
    ) {
      return;
    }

    const deckId =
      savedSelection?.deck?.id;

    if (!deckId) {
      onVisibilitySheetOpenChange(
        false,
      );
      return;
    }

    setDeckBusy(true);
    setDeckError(null);
    setDeckMessage(null);

    try {
      await setMyEventDeck({
        eventId,
        deckId,
        visibility:
          draftVisibility,
      });

      setSavedSelection(
        (current) =>
          current
            ? {
                ...current,
                visibility:
                  draftVisibility,
              }
            : current,
      );

      setDeckMessage(
        "Deck visibility updated.",
      );
      onVisibilitySheetOpenChange(
        false,
      );
      await notifyChanged();
    } catch (error) {
      setDeckError(
        getDeckError(error),
      );
    } finally {
      setDeckBusy(false);
    }
  }

  async function removeDeck() {
    if (
      !savedSelection ||
      deckBusy ||
      deckLocked
    ) {
      return;
    }

    setDeckBusy(true);
    setDeckError(null);
    setDeckMessage(null);

    try {
      await clearMyEventDeck(
        eventId,
      );

      setSavedSelection(null);
      setDraftDeckId(
        sortedDecks[0]?.id ??
          "",
      );
      setDraftVisibility(
        "name",
      );
      setRemoveSheetOpen(false);
      setDeckMessage(
        "Deck removed from this event.",
      );
      await notifyChanged();
    } catch (error) {
      setDeckError(
        getDeckError(error),
      );
    } finally {
      setDeckBusy(false);
    }
  }

  return (
    <>
      <section
        aria-labelledby="event-your-seat-title"
        className="py-5"
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="h-1.5 w-5 rounded-full bg-[#6E5AA7]"
              />
              <h2
                id="event-your-seat-title"
                className="text-lg font-bold tracking-[-0.025em] text-zinc-950"
              >
                Your seat
              </h2>
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              {participationLabel}
            </p>
          </div>

          {isPlaying ? (
            <button
              type="button"
              onClick={() => {
                setDeckMessage(null);
                void loadDecks();
              }}
              disabled={
                decksLoading ||
                deckBusy
              }
              aria-label="Refresh your seat"
              className="grid h-11 w-11 place-items-center rounded-full text-[#6E5AA7] outline-none transition hover:bg-[#EEE9FF] active:scale-[0.96] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20 disabled:opacity-50"
            >
              <RefreshCw
                className={[
                  "h-4 w-4",
                  decksLoading
                    ? "animate-spin"
                    : "",
                ].join(" ")}
              />
            </button>
          ) : null}
        </div>

        <div className="mt-4 overflow-hidden rounded-[1.3rem] bg-white/60 px-4 shadow-[inset_0_0_0_1px_rgba(110,90,167,0.10),0_10px_28px_rgba(57,43,82,0.035)]">
          <SeatValueRow
            label="Role"
            value={roleLabel}
          />

          {isPlaying ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setDeckMessage(null);
                  onDeckSheetOpenChange(
                    true,
                  );
                }}
                disabled={
                  deckLocked ||
                  decksLoading
                }
                className="flex min-h-14 w-full items-center gap-3 border-t border-[#6E5AA7]/10 py-3 text-left outline-none transition hover:bg-[#6E5AA7]/[0.035] focus-visible:bg-[#6E5AA7]/[0.07] disabled:opacity-55"
              >
                <span className="w-[88px] shrink-0 text-sm text-zinc-500">
                  Deck
                </span>

                {savedSelection?.deck
                  ?.image_url ? (
                  <span className="h-10 w-9 shrink-0 overflow-hidden rounded-lg bg-zinc-200 shadow-[0_4px_10px_rgba(30,24,38,0.14)] ring-1 ring-black/[0.07]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        savedSelection
                          .deck
                          .image_url
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                ) : (
                  <span className="grid h-10 w-9 shrink-0 place-items-center rounded-lg bg-[#EEE9FF] text-[#6E5AA7] shadow-[inset_0_0_0_1px_rgba(110,90,167,0.08)]">
                    <Layers3 className="h-4 w-4" />
                  </span>
                )}

                <span className="min-w-0 flex-1 truncate text-right text-sm font-medium text-zinc-900">
                  {decksLoading
                    ? "Loading…"
                    : savedSelection
                          ?.deck?.name ??
                      "No deck selected"}
                </span>

                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setDraftVisibility(
                    savedSelection?.visibility ??
                      draftVisibility,
                  );
                  onVisibilitySheetOpenChange(
                    true,
                  );
                }}
                disabled={
                  deckLocked ||
                  decksLoading
                }
                className="flex min-h-14 w-full items-center gap-3 border-t border-[#6E5AA7]/10 py-3 text-left outline-none transition hover:bg-[#6E5AA7]/[0.035] focus-visible:bg-[#6E5AA7]/[0.07] disabled:opacity-55"
              >
                <span className="w-[88px] shrink-0 text-sm text-zinc-500">
                  Visibility
                </span>

                <span className="min-w-0 flex-1 truncate text-right text-sm font-medium text-zinc-900">
                  {getVisibilityLabel(
                    savedSelection?.visibility ??
                      draftVisibility,
                  )}
                </span>

                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
              </button>
            </>
          ) : null}

          <SeatValueRow
            label="Participation"
            value={
              participationLabel
            }
            separated
            accent
          />
        </div>

        {canJoin ? (
          <button
            type="button"
            onClick={onJoin}
            disabled={
              actionBusy
            }
            className="mt-2 flex min-h-11 w-full items-center justify-between rounded-xl border-b border-[#6E5AA7]/10 px-3 text-left text-sm font-semibold text-[#5B478A] outline-none transition hover:bg-[#EEE9FF]/65 active:bg-[#EEE9FF] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20 disabled:opacity-50"
          >
            <span>
              {isHost
                ? "Join as player"
                : "Request a seat"}
            </span>

            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}

        {canCancelRequest ? (
          <button
            type="button"
            onClick={
              onCancelRequest
            }
            disabled={
              actionBusy
            }
            className="mt-2 flex min-h-11 w-full items-center justify-between rounded-xl border-b border-[#6E5AA7]/10 px-3 text-left text-sm font-medium text-zinc-700 outline-none transition hover:bg-[#6E5AA7]/[0.035] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20 disabled:opacity-50"
          >
            <span>
              Cancel request
            </span>

            <ChevronRight className="h-4 w-4 text-zinc-400" />
          </button>
        ) : null}

        {attendanceMethod ===
          "qr" &&
        canScan ? (
          <button
            type="button"
            onClick={onScan}
            className="mt-2 flex min-h-11 w-full items-center justify-between rounded-xl border-b border-[#6E5AA7]/10 px-3 text-left text-sm font-semibold text-[#5B478A] outline-none transition hover:bg-[#EEE9FF]/65 active:bg-[#EEE9FF] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20"
          >
            <span className="inline-flex items-center gap-2">
              <ScanLine className="h-4 w-4" />
              Scan event QR
            </span>

            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}

        {canLeave ? (
          <button
            type="button"
            onClick={onLeave}
            disabled={
              actionBusy
            }
            className="mt-2 flex min-h-11 w-full items-center justify-between rounded-xl border-b border-[#6E5AA7]/10 px-3 text-left text-sm font-medium text-zinc-700 outline-none transition hover:bg-[#6E5AA7]/[0.035] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20 disabled:opacity-50"
          >
            <span>
              {isHost
                ? "Stop playing"
                : "Leave event"}
            </span>

            <ChevronRight className="h-4 w-4 text-zinc-400" />
          </button>
        ) : null}

        {cooldownLabel ? (
          <p className="mt-3 px-1 text-xs leading-5 text-zinc-500">
            You can request another seat in{" "}
            <span className="font-semibold text-zinc-700">
              {cooldownLabel}
            </span>
            .
          </p>
        ) : null}

        {deckMessage ||
        actionMessage ? (
          <p
            role="status"
            className="mt-3 rounded-xl bg-emerald-500/[0.09] px-3 py-2.5 text-sm text-emerald-800"
          >
            {deckMessage ||
              actionMessage}
          </p>
        ) : null}

        {deckError ||
        actionError ? (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-500/[0.09] px-3 py-2.5 text-sm text-red-700"
          >
            {deckError ||
              actionError}
          </p>
        ) : null}
      </section>

      <EventActionSheet
        open={deckSheetOpen}
        title="Change deck"
        description="Choose what you plan to bring to this table."
        onClose={closeDeckSheet}
        footer={
          decks.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                void saveDeck();
              }}
              disabled={
                deckBusy ||
                deckLocked ||
                !selectedDeck
              }
              className="min-h-11 w-full rounded-xl bg-[#6E5AA7] px-4 text-sm font-semibold text-white outline-none transition hover:bg-[#5F4E94] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/25 disabled:opacity-50"
            >
              {deckBusy
                ? "Saving…"
                : savedSelection
                  ? "Save deck"
                  : "Add deck"}
            </button>
          ) : undefined
        }
      >
        {decksLoading ? (
          <div className="space-y-px overflow-hidden rounded-2xl bg-white">
            {[0, 1, 2].map(
              (item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse border-b border-black/[0.06] bg-black/[0.035] last:border-0"
                />
              ),
            )}
          </div>
        ) : null}

        {!decksLoading &&
        decks.length === 0 ? (
          <div className="py-3 text-center">
            <p className="text-sm text-zinc-500">
              No decks yet.
            </p>

            <Link
              href="/profile/decks"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[#6E5AA7] outline-none focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20"
            >
              Open my decks
            </Link>
          </div>
        ) : null}

        {!decksLoading &&
        decks.length > 0 ? (
          <>
            <div className="overflow-hidden rounded-2xl bg-white px-4">
              {sortedDecks.map(
                (deck, index) => {
                  const selected =
                    draftDeckId ===
                    deck.id;

                  const matches =
                    Boolean(
                      eventFormatSlug,
                    ) &&
                    normalize(
                      deck.format_slug,
                    ) ===
                      normalize(
                        eventFormatSlug,
                      );

                  return (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => {
                        setDraftDeckId(
                          deck.id,
                        );
                      }}
                      disabled={
                        deckBusy ||
                        deckLocked
                      }
                      className={[
                        "flex min-h-16 w-full items-center gap-3 py-2 text-left outline-none focus-visible:bg-[#6E5AA7]/[0.07]",
                        index > 0
                          ? "border-t border-black/[0.07]"
                          : "",
                      ].join(" ")}
                    >
                      <DeckThumbnail
                        deck={deck}
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-zinc-900">
                          {deck.name}
                        </span>

                        <span className="mt-0.5 block truncate text-xs text-zinc-500">
                          {formatSlug(
                            deck.format_slug,
                          )}
                          {matches
                            ? " · Matches event"
                            : ""}
                        </span>
                      </span>

                      <span
                        className={[
                          "grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                          selected
                            ? "border-[#6E5AA7] bg-[#6E5AA7] text-white"
                            : "border-black/15 text-transparent",
                        ].join(" ")}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                },
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onDeckSheetOpenChange(
                  false,
                );
                setRemoveSheetOpen(
                  true,
                );
              }}
              disabled={
                !savedSelection ||
                deckBusy ||
                deckLocked
              }
              className="mt-3 min-h-11 w-full rounded-2xl bg-white text-sm font-medium text-red-600 outline-none focus-visible:ring-4 focus-visible:ring-red-500/15 disabled:hidden"
            >
              Remove deck from event
            </button>
          </>
        ) : null}
      </EventActionSheet>

      <EventActionSheet
        open={visibilitySheetOpen}
        title="Deck visibility"
        description="Control what other players at this table can see."
        onClose={
          closeVisibilitySheet
        }
        footer={
          <button
            type="button"
            onClick={() => {
              void saveVisibility();
            }}
            disabled={
              deckBusy ||
              deckLocked
            }
            className="min-h-11 w-full rounded-xl bg-[#6E5AA7] px-4 text-sm font-semibold text-white outline-none transition hover:bg-[#5F4E94] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/25 disabled:opacity-50"
          >
            {deckBusy
              ? "Saving…"
              : "Done"}
          </button>
        }
      >
        <div className="overflow-hidden rounded-2xl bg-white px-4">
          {VISIBILITY_OPTIONS.map(
            (option, index) => {
              const Icon =
                option.icon;

              const selected =
                draftVisibility ===
                option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setDraftVisibility(
                      option.value,
                    );
                  }}
                  disabled={
                    deckBusy ||
                    deckLocked
                  }
                  className={[
                    "flex min-h-[68px] w-full items-center gap-3 py-3 text-left outline-none focus-visible:bg-[#6E5AA7]/[0.07]",
                    index > 0
                      ? "border-t border-black/[0.07]"
                      : "",
                  ].join(" ")}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/[0.045] text-zinc-600">
                    <Icon className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-zinc-900">
                      {option.label}
                    </span>

                    <span className="mt-0.5 block text-xs leading-5 text-zinc-500">
                      {
                        option.description
                      }
                    </span>
                  </span>

                  <span
                    className={[
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                      selected
                        ? "border-[#6E5AA7] bg-[#6E5AA7] text-white"
                        : "border-black/15 text-transparent",
                    ].join(" ")}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            },
          )}
        </div>
      </EventActionSheet>

      <EventActionSheet
        open={removeSheetOpen}
        title="Remove deck?"
        description="You will remain a confirmed player at this event."
        onClose={() => {
          if (!deckBusy) {
            setRemoveSheetOpen(
              false,
            );
          }
        }}
        footer={
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => {
                void removeDeck();
              }}
              disabled={deckBusy}
              className="min-h-11 w-full rounded-xl bg-red-600 px-4 text-sm font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-red-500/20 disabled:opacity-50"
            >
              {deckBusy
                ? "Removing…"
                : "Remove deck"}
            </button>

            <button
              type="button"
              onClick={() => {
                setRemoveSheetOpen(
                  false,
                );
              }}
              disabled={deckBusy}
              className="min-h-11 w-full rounded-xl text-sm font-semibold text-zinc-700 outline-none focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20"
            >
              Keep deck
            </button>
          </div>
        }
      >
        <p className="px-1 py-2 text-sm leading-6 text-zinc-600">
          Your deck and its visibility will no longer be shown at this table.
        </p>
      </EventActionSheet>
    </>
  );
}

function SeatValueRow({
  label,
  value,
  separated = false,
  accent = false,
}: {
  label: string;
  value: string;
  separated?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "flex min-h-14 items-center justify-between gap-4 py-3",
        separated
          ? "border-t border-[#6E5AA7]/10"
          : "",
      ].join(" ")}
    >
      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <span
        className={[
          "text-right font-medium",
          accent
            ? "rounded-full bg-[#EEE9FF] px-2.5 py-1 text-xs font-bold text-[#5B478A] shadow-[inset_0_0_0_1px_rgba(110,90,167,0.08)]"
            : "text-sm text-zinc-900",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function DeckThumbnail({
  deck,
}: {
  deck: Deck;
}) {
  if (deck.image_url) {
    return (
      <span className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={deck.image_url}
          alt=""
          className="h-full w-full object-cover"
          style={{
            objectPosition: `${deck.cover_focus_x ?? 50}% ${deck.cover_focus_y ?? 50}%`,
          }}
        />
      </span>
    );
  }

  return (
    <span className="grid h-12 w-10 shrink-0 place-items-center rounded-lg bg-black/[0.045] text-zinc-400">
      <Layers3 className="h-4 w-4" />
    </span>
  );
}
