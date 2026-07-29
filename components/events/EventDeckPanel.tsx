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
  CheckCircle2,
  Eye,
  EyeOff,
  Layers3,
  List,
  RefreshCw,
  Trash2,
} from "lucide-react";

import {
  decksApi,
} from "@/lib/decks-api";
import type {
  Deck,
} from "@/types/decks";
import {
  clearMyEventDeck,
  getEventDecks,
  setMyEventDeck,
  type EventDeckBrief,
  type EventDeckVisibility,
  type EventPlayerDeck,
} from "@/services/events";

type EventDeckPanelProps = {
  eventId: string;
  currentUserId: string;
  eventStatus?: string | null;
  eventFormatSlug?: string | null;
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
      "Other players cannot see which deck you selected.",
    icon: EyeOff,
  },
  {
    value: "name",
    label: "Name only",
    description:
      "Players can see the deck name, format and cover.",
    icon: Eye,
  },
  {
    value: "full",
    label: "Full decklist",
    description:
      "Players can open and view the complete decklist.",
    icon: List,
  },
];

function normalize(
  value?: string | null
): string {
  return (value ?? "")
    .trim()
    .toLowerCase();
}

function formatSlug(
  value?: string | null
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
        letter.toUpperCase()
    );
}

function getErrorMessage(
  error: unknown
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
    typeof record?.message ===
    "string"
      ? record.message
      : typeof error === "string"
        ? error
        : "Could not update the event deck.";

  const normalized =
    `${code} ${message}`.toUpperCase();

  if (
    normalized.includes(
      "DECK_NOT_FOUND"
    )
  ) {
    return "This deck could not be found.";
  }

  if (
    normalized.includes(
      "NOT_EVENT_PLAYER"
    ) ||
    normalized.includes(
      "NOT_JOINED"
    )
  ) {
    return "You must be a confirmed player before selecting a deck.";
  }

  if (
    normalized.includes(
      "EVENT_NOT_FOUND"
    )
  ) {
    return "This event could not be found.";
  }

  if (
    normalized.includes(
      "INVALID_VISIBILITY"
    )
  ) {
    return "The selected deck visibility is not valid.";
  }

  if (
    normalized.includes(
      "AUTH_REQUIRED"
    )
  ) {
    return "You need to sign in again.";
  }

  if (
    !message ||
    message === "[object Object]"
  ) {
    return "Could not update the event deck.";
  }

  return message;
}

function deckToEventBrief(
  deck: Deck
): EventDeckBrief {
  return {
    id: deck.id,
    name: deck.name,
    format_slug:
      deck.format_slug,
    image_url:
      deck.image_url,
    is_public:
      deck.is_public,
    export_text:
      deck.export_text,
  };
}

export default function EventDeckPanel({
  eventId,
  currentUserId,
  eventStatus,
  eventFormatSlug,
  onChanged,
}: EventDeckPanelProps) {
  const [decks, setDecks] =
    useState<Deck[]>([]);

  const [
    savedSelection,
    setSavedSelection,
  ] =
    useState<EventPlayerDeck | null>(
      null
    );

  const [
    selectedDeckId,
    setSelectedDeckId,
  ] = useState("");

  const [
    visibility,
    setVisibility,
  ] =
    useState<EventDeckVisibility>(
      "name"
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [removing, setRemoving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [message, setMessage] =
    useState<string | null>(
      null
    );

  const loadData =
    useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          deckList,
          eventDecks,
        ] = await Promise.all([
          decksApi.list(),
          getEventDecks(
            eventId
          ),
        ]);

        const loadedDecks =
          Array.isArray(
            deckList.decks
          )
            ? deckList.decks
            : [];

        const mySelection =
          (
            eventDecks.decks ??
            []
          ).find(
            (entry) =>
              String(
                entry.user_id
              ) ===
              String(
                currentUserId
              )
          ) ?? null;

        setDecks(loadedDecks);
        setSavedSelection(
          mySelection
        );

        const savedDeckId =
          mySelection?.deck?.id;

        setSelectedDeckId(
          savedDeckId ??
            loadedDecks[0]?.id ??
            ""
        );

        setVisibility(
          mySelection?.visibility ??
            "name"
        );
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError
          )
        );
      } finally {
        setLoading(false);
      }
    }, [
      currentUserId,
      eventId,
    ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const sortedDecks =
    useMemo(() => {
      const eventFormat =
        normalize(
          eventFormatSlug
        );

      return [...decks].sort(
        (left, right) => {
          const leftMatches =
            eventFormat &&
            normalize(
              left.format_slug
            ) === eventFormat;

          const rightMatches =
            eventFormat &&
            normalize(
              right.format_slug
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
            right.name
          );
        }
      );
    }, [
      decks,
      eventFormatSlug,
    ]);

  const selectedDeck =
    useMemo(
      () =>
        decks.find(
          (deck) =>
            deck.id ===
            selectedDeckId
        ) ?? null,
      [
        decks,
        selectedDeckId,
      ]
    );

  const status =
    normalize(eventStatus);

  const locked =
    status === "cancelled" ||
    status === "canceled" ||
    status === "ended" ||
    status === "finished" ||
    status === "completed";

  const hasChanges =
    savedSelection?.deck?.id !==
      selectedDeckId ||
    savedSelection?.visibility !==
      visibility;

  async function notifyChanged() {
    if (!onChanged) {
      return;
    }

    try {
      await onChanged();
    } catch {
      setError(
        "The deck was saved, but the latest event information could not be reloaded."
      );
    }
  }

  async function handleSave() {
    if (
      !selectedDeckId ||
      !selectedDeck
    ) {
      setError(
        "Choose a deck first."
      );

      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await setMyEventDeck({
        eventId,
        deckId:
          selectedDeckId,
        visibility,
      });

      setSavedSelection({
        user_id:
          currentUserId,
        visibility,
        deck:
          deckToEventBrief(
            selectedDeck
          ),
      });

      setMessage(
        "Deck selection saved."
      );

      await notifyChanged();
    } catch (saveError) {
      setError(
        getErrorMessage(
          saveError
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!savedSelection) {
      return;
    }

    const confirmed =
      window.confirm(
        "Remove your deck from this event? You will remain a confirmed player."
      );

    if (!confirmed) {
      return;
    }

    setRemoving(true);
    setError(null);
    setMessage(null);

    try {
      await clearMyEventDeck(
        eventId
      );

      setSavedSelection(null);
      setVisibility("name");

      setSelectedDeckId(
        sortedDecks[0]?.id ??
          ""
      );

      setMessage(
        "Deck removed from the event."
      );

      await notifyChanged();
    } catch (removeError) {
      setError(
        getErrorMessage(
          removeError
        )
      );
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-[1.35rem] border border-black/10 bg-white p-5">
        <div className="h-4 w-28 animate-pulse rounded-full bg-black/10" />

        <div className="mt-4 h-16 animate-pulse rounded-2xl bg-black/[0.06]" />

        <div className="mt-3 h-12 animate-pulse rounded-2xl bg-black/[0.06]" />
      </section>
    );
  }

  return (
    <section className="rounded-[1.35rem] border border-black/10 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Your loadout
          </p>

          <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-950">
            Event deck
          </h2>

          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Choose the deck you
            plan to bring and what
            other players can see.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMessage(null);
            void loadData();
          }}
          disabled={
            saving ||
            removing
          }
          aria-label="Refresh decks"
          title="Refresh decks"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/10 bg-black/[0.035] text-zinc-500 transition hover:border-black/20 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {error ? (
        <StatusMessage variant="error">
          {error}
        </StatusMessage>
      ) : null}

      {message ? (
        <StatusMessage variant="success">
          {message}
        </StatusMessage>
      ) : null}

      {decks.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-black/[0.035] p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#6E5AA7]">
              <Layers3 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-900">
                No decks yet
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Create or import a
                deck before linking
                one to this event.
              </p>
            </div>
          </div>

          <Link
            href="/profile/decks"
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-[#6E5AA7] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5F4E94]"
          >
            Open my decks
          </Link>
        </div>
      ) : (
        <>
          {selectedDeck ? (
            <DeckPreview
              deck={selectedDeck}
              eventFormatSlug={
                eventFormatSlug
              }
            />
          ) : null}

          <label className="mt-5 grid gap-2">
            <span className="text-sm font-semibold text-zinc-800">
              Deck
            </span>

            <select
              value={
                selectedDeckId
              }
              onChange={(
                changeEvent
              ) => {
                setSelectedDeckId(
                  changeEvent
                    .target.value
                );

                setMessage(null);
                setError(null);
              }}
              disabled={
                locked ||
                saving ||
                removing
              }
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition hover:border-black/20 focus:border-[#6E5AA7] focus:ring-4 focus:ring-[#6E5AA7]/10 disabled:cursor-not-allowed disabled:bg-zinc-100"
            >
              {sortedDecks.map(
                (deck) => {
                  const matches =
                    eventFormatSlug &&
                    normalize(
                      deck.format_slug
                    ) ===
                      normalize(
                        eventFormatSlug
                      );

                  return (
                    <option
                      key={
                        deck.id
                      }
                      value={
                        deck.id
                      }
                    >
                      {deck.name}
                      {deck.format_slug
                        ? ` · ${formatSlug(
                            deck.format_slug
                          )}`
                        : ""}
                      {matches
                        ? " · Matches event"
                        : ""}
                    </option>
                  );
                }
              )}
            </select>
          </label>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-zinc-800">
              Visibility
            </legend>

            <div className="mt-2 grid gap-2">
              {VISIBILITY_OPTIONS.map(
                (option) => {
                  const Icon =
                    option.icon;

                  const active =
                    visibility ===
                    option.value;

                  return (
                    <button
                      key={
                        option.value
                      }
                      type="button"
                      onClick={() => {
                        setVisibility(
                          option.value
                        );

                        setMessage(
                          null
                        );

                        setError(
                          null
                        );
                      }}
                      disabled={
                        locked ||
                        saving ||
                        removing
                      }
                      className={[
                        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50",
                        active
                          ? "border-[#6E5AA7] bg-[#F4F0FF]"
                          : "border-black/10 bg-white hover:border-black/20",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full",
                          active
                            ? "bg-[#6E5AA7] text-white"
                            : "bg-black/[0.045] text-zinc-500",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {
                            option.label
                          }
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                          {
                            option.description
                          }
                        </p>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </fieldset>

          {locked ? (
            <div className="mt-4 rounded-2xl bg-black/[0.04] px-4 py-3 text-sm leading-6 text-zinc-500">
              Deck selections can
              no longer be changed
              for this event.
            </div>
          ) : null}

          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={
                locked ||
                saving ||
                removing ||
                !selectedDeckId ||
                !hasChanges
              }
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-[#6E5AA7] px-5 text-sm font-semibold text-white transition hover:bg-[#5F4E94] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : savedSelection
                  ? "Save deck changes"
                  : "Add deck to event"}
            </button>

            {savedSelection ? (
              <button
                type="button"
                onClick={() => {
                  void handleRemove();
                }}
                disabled={
                  locked ||
                  saving ||
                  removing
                }
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />

                {removing
                  ? "Removing..."
                  : "Remove deck from event"}
              </button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}

function DeckPreview({
  deck,
  eventFormatSlug,
}: {
  deck: Deck;
  eventFormatSlug?: string | null;
}) {
  const matchesFormat =
    Boolean(eventFormatSlug) &&
    normalize(
      deck.format_slug
    ) ===
      normalize(
        eventFormatSlug
      );

  const cardCount =
    Number(
      deck.mainboard_count ??
        0
    ) +
    Number(
      deck.sideboard_count ??
        0
    ) +
    Number(
      deck.commander_count ??
        0
    );

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-black/10 bg-black/[0.025]">
      {deck.image_url ? (
        <div className="relative h-28 overflow-hidden bg-zinc-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={deck.image_url}
            alt=""
            className="h-full w-full object-cover"
            style={{
              objectPosition: `${deck.cover_focus_x ?? 50}% ${deck.cover_focus_y ?? 50}%`,
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

          <p className="absolute bottom-3 left-4 right-4 truncate text-base font-bold text-white">
            {deck.name}
          </p>
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          {!deck.image_url ? (
            <p className="truncate text-sm font-semibold text-zinc-900">
              {deck.name}
            </p>
          ) : null}

          <p className="mt-1 text-xs text-zinc-500">
            {formatSlug(
              deck.format_slug
            )}

            {cardCount > 0
              ? ` · ${cardCount} cards`
              : ""}
          </p>
        </div>

        {matchesFormat ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            Matches event
          </span>
        ) : eventFormatSlug ? (
          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            Different format
          </span>
        ) : null}
      </div>
    </div>
  );
}

function StatusMessage({
  variant,
  children,
}: {
  variant:
    | "success"
    | "error";
  children: ReactNode;
}) {
  const success =
    variant === "success";

  return (
    <div
      className={[
        "mt-4 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm leading-6",
        success
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700",
      ].join(" ")}
    >
      {success ? (
        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
      )}

      <p>{children}</p>
    </div>
  );
}