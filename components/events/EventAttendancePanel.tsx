"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Check,
  ChevronRight,
  QrCode,
  RefreshCw,
} from "lucide-react";

import EventActionSheet from "@/components/events/EventActionSheet";
import EventQrHostModal from "@/components/events/EventQrHostModal";
import {
  finalizeEventAttendance,
  getEventAttendance,
  updateEventAttendance,
  type AttendanceMethod,
  type EventAttendanceParticipant,
  type EventAttendanceRoster,
  type AttendanceStatus,
} from "@/services/events";

type EventAttendancePanelProps = {
  eventId: string;
  eventStatus?: string | null;
  attendanceMethod: AttendanceMethod;
  allowWalkIns?: boolean;
  qrOpen?: boolean;
  onQrOpenChange?: (
    open: boolean,
  ) => void;
  onChanged?: () => void | Promise<void>;
};

type EditableAttendanceStatus =
  | "expected"
  | "attended"
  | "no_show"
  | "excused";

const STATUS_OPTIONS: Array<{
  value: EditableAttendanceStatus;
  label: string;
  description: string;
}> = [
  {
    value: "attended",
    label: "Attended",
    description:
      "The player was present at the table.",
  },
  {
    value: "no_show",
    label: "No-show",
    description:
      "The player did not attend.",
  },
  {
    value: "excused",
    label: "Excused",
    description:
      "The absence should not count as a no-show.",
  },
  {
    value: "expected",
    label: "Expected",
    description:
      "Reset to the pre-event attendance state.",
  },
];

function normalize(
  value?: string | null,
): string {
  return (value ?? "")
    .trim()
    .toLowerCase();
}

function getMethodLabel(
  method: AttendanceMethod,
): string {
  if (method === "host") {
    return "Host visual check-in";
  }

  if (method === "qr") {
    return "QR check-in";
  }

  return "No verification";
}

function getStatusLabel(
  status: AttendanceStatus,
): string {
  if (
    status === "attended" ||
    status === "checked_in"
  ) {
    return "Attended";
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

function formatTimestamp(
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

export default function EventAttendancePanel({
  eventId,
  eventStatus,
  attendanceMethod,
  allowWalkIns = false,
  qrOpen: controlledQrOpen,
  onQrOpenChange,
  onChanged,
}: EventAttendancePanelProps) {
  const [roster, setRoster] =
    useState<EventAttendanceRoster | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [
    savingUserId,
    setSavingUserId,
  ] = useState<string | null>(
    null,
  );

  const [finalising, setFinalising] =
    useState(false);

  const [
    internalQrOpen,
    setInternalQrOpen,
  ] = useState(false);

  const qrOpen =
    controlledQrOpen ??
    internalQrOpen;

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    selectedParticipant,
    setSelectedParticipant,
  ] =
    useState<EventAttendanceParticipant | null>(
      null,
    );

  const loadRoster =
    useCallback(
      async ({
        silent = false,
      }: {
        silent?: boolean;
      } = {}) => {
        if (!silent) {
          setLoading(true);
          setError(null);
        }

        try {
          const result =
            await getEventAttendance(
              eventId,
            );

          setRoster(result);
        } catch (loadError) {
          if (!silent) {
            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Could not load attendance.",
            );
          }
        } finally {
          if (!silent) {
            setLoading(false);
          }
        }
      },
      [eventId],
    );

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadRoster();
      }, 0);

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [loadRoster]);

  useEffect(() => {
    if (
      !qrOpen ||
      attendanceMethod !==
        "qr"
    ) {
      return;
    }

    const timer =
      window.setInterval(() => {
        void loadRoster({
          silent: true,
        });
      }, 5000);

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    attendanceMethod,
    loadRoster,
    qrOpen,
  ]);

  const counts = useMemo(() => {
    const summary = {
      expected: 0,
      checked_in: 0,
      attended: 0,
      no_show: 0,
      excused: 0,
      disputed: 0,
    };

    for (
      const participant of
      roster?.participants ?? []
    ) {
      summary[
        participant.attendance_status
      ] += 1;
    }

    return summary;
  }, [roster]);

  const eventCancelled = [
    "cancelled",
    "canceled",
  ].includes(
    normalize(eventStatus),
  );

  function setQrOpen(
    open: boolean,
  ) {
    setInternalQrOpen(open);
    onQrOpenChange?.(open);
  }

  async function setStatus(
    userId: string,
    status: EditableAttendanceStatus,
  ) {
    if (
      savingUserId ||
      finalising ||
      eventCancelled
    ) {
      return;
    }

    setSavingUserId(userId);
    setError(null);

    try {
      await updateEventAttendance({
        eventId,
        userId,
        status,
      });

      setSelectedParticipant(
        null,
      );
      await loadRoster();
      await onChanged?.();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not update attendance.",
      );
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleFinalise() {
    if (
      finalising ||
      savingUserId
    ) {
      return;
    }

    setFinalising(true);
    setError(null);

    try {
      await finalizeEventAttendance(
        eventId,
      );

      await loadRoster();
      await onChanged?.();
    } catch (finaliseError) {
      setError(
        finaliseError instanceof
          Error
          ? finaliseError.message
          : "Could not finalise attendance.",
      );
    } finally {
      setFinalising(false);
    }
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-800">
              {getMethodLabel(
                attendanceMethod,
              )}
            </p>

            <p className="mt-0.5 truncate text-xs text-zinc-500">
              {attendanceMethod ===
                "qr" &&
              allowWalkIns
                ? "Walk-ins enabled"
                : "Manual updates available around event time"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadRoster();
            }}
            disabled={
              loading ||
              Boolean(
                savingUserId,
              ) ||
              finalising
            }
            aria-label="Refresh attendance"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#6E5AA7] outline-none transition hover:bg-[#EEE9FF] active:scale-[0.96] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20 disabled:opacity-50"
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

        {attendanceMethod ===
        "qr" ? (
          <button
            type="button"
            onClick={() => {
              setQrOpen(true);
            }}
            disabled={
              eventCancelled ||
              Boolean(
                roster?.attendance_finalized_at,
              )
            }
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[0.9rem] bg-[#6E5AA7] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(110,90,167,0.24)] outline-none transition hover:bg-[#5F4E94] active:scale-[0.985] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/25 disabled:opacity-45"
          >
            <QrCode className="h-4 w-4" />
            Show live QR
          </button>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-500/[0.08] px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="mt-4 divide-y divide-[#6E5AA7]/10 border-y border-[#6E5AA7]/10">
            {[0, 1].map(
              (item) => (
                <div
                  key={item}
                  className="flex h-14 animate-pulse items-center gap-3"
                >
                  <div className="h-9 w-9 rounded-full bg-black/[0.07]" />
                  <div className="h-3 w-28 rounded-full bg-black/[0.07]" />
                </div>
              ),
            )}
          </div>
        ) : null}

        {!loading &&
        roster &&
        roster.participants
          .length === 0 ? (
          <p className="mt-4 border-y border-[#6E5AA7]/10 py-4 text-sm text-zinc-500">
            No confirmed players yet.
          </p>
        ) : null}

        {!loading &&
        roster &&
        roster.participants
          .length > 0 ? (
          <>
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              <span className="font-bold text-[#5B478A]">
                Attended{" "}
                {counts.attended +
                  counts.checked_in}
              </span>
              {" · "}Expected{" "}
              {counts.expected}
              {" · "}No-shows{" "}
              {counts.no_show}
              {" · "}Excused{" "}
              {counts.excused}
            </p>

            <div className="mt-3 divide-y divide-[#6E5AA7]/10 border-y border-[#6E5AA7]/10">
              {roster.participants.map(
                (
                  participant,
                ) => {
                  const busy =
                    savingUserId ===
                    participant.user_id;

                  const checkedInAt =
                    formatTimestamp(
                      participant.checked_in_at,
                    );

                  return (
                    <div
                      key={
                        participant.user_id
                      }
                      className="flex min-h-16 items-center gap-3 py-2"
                    >
                      <ParticipantAvatar
                        participant={
                          participant
                        }
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {participant.nickname ||
                            "Unnamed player"}
                        </p>

                        {checkedInAt ? (
                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            QR checked in{" "}
                            {checkedInAt}
                          </p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedParticipant(
                            participant,
                          );
                        }}
                        disabled={
                          Boolean(
                            savingUserId,
                          ) ||
                          finalising ||
                          eventCancelled
                        }
                        className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-[#EEE9FF]/70 px-3 text-xs font-semibold text-[#5B478A] shadow-[inset_0_0_0_1px_rgba(110,90,167,0.08)] outline-none transition hover:bg-[#E8E1FF] focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20 disabled:opacity-45"
                      >
                        {busy ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            {getStatusLabel(
                              participant.attendance_status,
                            )}
                            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                },
              )}
            </div>
          </>
        ) : null}

        {roster
          ?.attendance_finalized_at ? (
          <p className="mt-4 rounded-xl bg-emerald-500/[0.08] px-3 py-2.5 text-sm text-emerald-800">
            Attendance finalised
            {formatTimestamp(
              roster
                .attendance_finalized_at,
            )
              ? ` on ${formatTimestamp(
                  roster
                    .attendance_finalized_at,
                )}`
              : ""}
            .
          </p>
        ) : null}

        {!roster
          ?.attendance_finalized_at &&
        roster?.can_finalize ? (
          <button
            type="button"
            onClick={() => {
              void handleFinalise();
            }}
            disabled={
              finalising ||
              Boolean(
                savingUserId,
              ) ||
              eventCancelled
            }
            className="mt-4 min-h-11 w-full rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-zinc-500/20 disabled:opacity-45"
          >
            {finalising
              ? "Finalising…"
              : "Finalise attendance"}
          </button>
        ) : null}

        {!roster
          ?.attendance_finalized_at &&
        roster &&
        !roster.can_finalize ? (
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            Finalisation becomes available after the event ends.
          </p>
        ) : null}
      </div>

      <EventActionSheet
        open={Boolean(
          selectedParticipant,
        )}
        title="Attendance status"
        description={
          selectedParticipant
            ? `Update ${selectedParticipant.nickname || "this player"}.`
            : undefined
        }
        onClose={() => {
          if (!savingUserId) {
            setSelectedParticipant(
              null,
            );
          }
        }}
      >
        <div className="overflow-hidden rounded-2xl bg-white px-4">
          {STATUS_OPTIONS.map(
            (option, index) => {
              const currentStatus =
                selectedParticipant?.attendance_status;

              const selected =
                option.value ===
                  currentStatus ||
                (option.value ===
                  "attended" &&
                  currentStatus ===
                    "checked_in");

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (
                      selectedParticipant
                    ) {
                      void setStatus(
                        selectedParticipant.user_id,
                        option.value,
                      );
                    }
                  }}
                  disabled={
                    Boolean(
                      savingUserId,
                    ) ||
                    finalising ||
                    eventCancelled
                  }
                  className={[
                    "flex min-h-[64px] w-full items-center gap-3 py-3 text-left outline-none focus-visible:bg-[#6E5AA7]/[0.07]",
                    index > 0
                      ? "border-t border-black/[0.07]"
                      : "",
                  ].join(" ")}
                >
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

                  {selected ? (
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#6E5AA7] text-white">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="h-6 w-6 shrink-0 rounded-full border border-black/15" />
                  )}
                </button>
              );
            },
          )}
        </div>
      </EventActionSheet>

      <EventQrHostModal
        eventId={eventId}
        open={qrOpen}
        onClose={() => {
          setQrOpen(false);
        }}
      />
    </>
  );
}

function ParticipantAvatar({
  participant,
}: {
  participant: EventAttendanceParticipant;
}) {
  if (participant.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={participant.avatar_url}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full bg-zinc-200 object-cover"
      />
    );
  }

  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EEE9FF] text-sm font-bold text-[#6E5AA7]">
      {(participant.nickname ||
        "P")
        .slice(0, 1)
        .toUpperCase()}
    </div>
  );
}
