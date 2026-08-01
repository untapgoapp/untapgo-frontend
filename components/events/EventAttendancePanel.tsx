"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  QrCode,
  RefreshCw,
  Undo2,
} from "lucide-react";

import EventQrHostModal from "@/components/events/EventQrHostModal";
import { getVerificationLabel } from "@/lib/event-attendance";
import {
  finalizeEventAttendance,
  getEventAttendance,
  updateEventAttendance,
  type AttendanceMethod,
  type EventAttendanceParticipant,
  type EventAttendanceRoster,
} from "@/services/events";

type EventAttendancePanelProps = {
  eventId: string;
  eventStatus?: string | null;
  attendanceMethod: AttendanceMethod;
  allowWalkIns?: boolean;
  qrOpen?: boolean;
  onQrOpenChange?: (open: boolean) => void;
  onChanged?: () => void | Promise<void>;
};

function normalize(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function friendlyError(error: unknown): string {
  const message = error instanceof Error
    ? error.message
    : "Could not update attendance.";
  const normalized = message.toUpperCase();

  const known = [
    ["HOST_CHECK_IN_NOT_ENABLED", "Visual check-in is not enabled for this event."],
    ["EVENT_PARTICIPANT_NOT_FOUND", "This player no longer has a confirmed seat."],
    ["ATTENDANCE_WINDOW_NOT_OPEN", "Visual check-in has not opened yet."],
    ["ATTENDANCE_WINDOW_CLOSED", "The attendance window has closed."],
    ["ATTENDANCE_FINALIZED", "Attendance has already been finalised."],
    ["EVENT_CANCELLED", "Attendance cannot be changed for a cancelled event."],
    ["EVENT_ENDED", "New check-ins are not accepted for an ended event."],
  ] as const;

  return known.find(([code]) => normalized.includes(code))?.[1]
    ?? "Attendance could not be updated. Please try again.";
}

function formatTimestamp(value?: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function participantStatus(participant: EventAttendanceParticipant): string {
  const method = getVerificationLabel(participant.verification_method);

  if (["checked_in", "attended"].includes(participant.attendance_status)) {
    return method ? `Checked in · ${method}` : "Checked in";
  }

  if (participant.attendance_status === "no_show") return "No-show";
  if (participant.attendance_status === "excused") return "Excused";
  if (participant.attendance_status === "disputed") return "Disputed";
  return "Awaiting check-in";
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
  const [roster, setRoster] = useState<EventAttendanceRoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [finalising, setFinalising] = useState(false);
  const [internalQrOpen, setInternalQrOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qrOpen = controlledQrOpen ?? internalQrOpen;

  const loadRoster = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      setRoster(await getEventAttendance(eventId));
    } catch (loadError) {
      if (!silent) setError(friendlyError(loadError));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRoster(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRoster]);

  useEffect(() => {
    if (!qrOpen || attendanceMethod !== "qr") return;
    const timer = window.setInterval(
      () => void loadRoster({ silent: true }),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [attendanceMethod, loadRoster, qrOpen]);

  const checkedInCount = useMemo(
    () => (roster?.participants ?? []).filter((participant) =>
      ["checked_in", "attended"].includes(participant.attendance_status),
    ).length,
    [roster],
  );

  const eventClosed = [
    "cancelled",
    "canceled",
    "ended",
    "finished",
    "completed",
  ].includes(normalize(eventStatus));
  const locked = eventClosed || Boolean(roster?.attendance_finalized_at);

  function setQrOpen(open: boolean) {
    setInternalQrOpen(open);
    onQrOpenChange?.(open);
  }

  async function toggleHostCheckIn(participant: EventAttendanceParticipant) {
    if (savingUserId || finalising || locked || attendanceMethod !== "host") return;

    const checkedIn = participant.attendance_status === "attended"
      && participant.verification_method === "host";
    setSavingUserId(participant.user_id);
    setError(null);

    try {
      await updateEventAttendance({
        eventId,
        userId: participant.user_id,
        status: checkedIn ? "expected" : "attended",
      });
      await loadRoster();
      await onChanged?.();
    } catch (saveError) {
      setError(friendlyError(saveError));
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleFinalise() {
    if (finalising || savingUserId) return;
    setFinalising(true);
    setError(null);

    try {
      await finalizeEventAttendance(eventId);
      await loadRoster();
      await onChanged?.();
    } catch (finaliseError) {
      setError(friendlyError(finaliseError));
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
              {attendanceMethod === "qr" ? "QR check-in" : "Host visual check-in"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {attendanceMethod === "qr"
                ? allowWalkIns ? "QR-only · walk-ins enabled" : "QR-only verification"
                : "Only confirmed players can be checked in"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadRoster()}
            disabled={loading || Boolean(savingUserId) || finalising}
            aria-label="Refresh attendance"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-control text-primary outline-none transition-colors hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {attendanceMethod === "qr" ? (
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            disabled={locked}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-control bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none transition-colors hover:bg-primary-hover focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:opacity-45"
          >
            <QrCode className="h-4 w-4" />
            Show live QR
          </button>
        ) : null}

        {error ? <p role="alert" className="mt-3 rounded-xl bg-red-500/[0.08] px-3 py-2 text-sm text-red-700">{error}</p> : null}

        {loading ? <AttendanceSkeleton /> : null}

        {!loading && roster?.participants.length === 0 ? (
          <p className="mt-4 py-3 text-sm text-zinc-500">No confirmed players yet.</p>
        ) : null}

        {!loading && roster && roster.participants.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs text-zinc-500">
              <span className="font-semibold text-[#5B478A]">Checked in {checkedInCount}</span>
              {" · "}{roster.participants.length} confirmed
            </p>

            <div className="mt-2 grid gap-1">
              {roster.participants.map((participant) => {
                const checkedIn = participant.attendance_status === "attended"
                  && participant.verification_method === "host";
                const timestamp = formatTimestamp(participant.checked_in_at);

                return (
                  <div key={participant.user_id} className="flex min-h-16 items-center gap-3 rounded-row px-2 py-2 transition-colors hover:bg-secondary/40">
                    <ParticipantAvatar participant={participant} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">{participant.nickname || "Unnamed player"}</p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        {participantStatus(participant)}{timestamp ? ` · ${timestamp}` : ""}
                      </p>
                    </div>

                    {attendanceMethod === "host" ? (
                      <button
                        type="button"
                        onClick={() => void toggleHostCheckIn(participant)}
                        disabled={Boolean(savingUserId) || finalising || locked}
                        className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-control bg-secondary px-3 text-xs font-semibold text-secondary-foreground outline-none transition-colors hover:bg-primary/14 focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:opacity-45"
                      >
                        {savingUserId === participant.user_id
                          ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          : checkedIn ? <Undo2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        {checkedIn ? "Undo" : "Check in"}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {roster?.attendance_finalized_at ? (
          <p className="mt-4 rounded-xl bg-emerald-500/[0.08] px-3 py-2.5 text-sm text-emerald-800">Attendance finalised.</p>
        ) : roster?.can_finalize ? (
          <button
            type="button"
            onClick={() => void handleFinalise()}
            disabled={finalising || Boolean(savingUserId)}
            className="mt-4 min-h-11 w-full rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white outline-none focus-visible:ring-4 focus-visible:ring-zinc-500/20 disabled:opacity-45"
          >
            {finalising ? "Finalising…" : "Finalise attendance"}
          </button>
        ) : null}
      </div>

      <EventQrHostModal eventId={eventId} open={qrOpen} onClose={() => setQrOpen(false)} />
    </>
  );
}

function AttendanceSkeleton() {
  return (
    <div className="mt-4 grid gap-1">
      {[0, 1].map((item) => (
        <div key={item} className="flex h-14 animate-pulse items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-black/[0.07]" />
          <div className="h-3 w-28 rounded-full bg-black/[0.07]" />
        </div>
      ))}
    </div>
  );
}

function ParticipantAvatar({ participant }: { participant: EventAttendanceParticipant }) {
  if (participant.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={participant.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full bg-zinc-200 object-cover" />;
  }

  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EEE9FF] text-sm font-bold text-[#6E5AA7]">
      {(participant.nickname || "P").slice(0, 1).toUpperCase()}
    </div>
  );
}
