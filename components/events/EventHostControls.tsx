"use client";

import Link from "next/link";
import {
  ChevronRight,
  Pencil,
  UserMinus,
  XCircle,
} from "lucide-react";

import EventAttendancePanel from "@/components/events/EventAttendancePanel";
import EventRequestsPanel from "@/components/events/EventRequestsPanel";
import type {
  AttendanceMethod,
} from "@/services/events";

export type HostControlTab =
  | "requests"
  | "attendance"
  | "manage";

type EventHostControlsProps = {
  eventId: string;
  eventStatus?: string | null;
  attendanceMethod: AttendanceMethod;
  allowWalkIns?: boolean;
  pendingCount?: number | null;
  attendeesCount: number;
  maxPlayers: number;
  isPlaying: boolean;
  canLeave: boolean;
  canCancelEvent: boolean;
  activeTab: HostControlTab;
  qrOpen?: boolean;
  onTabChange: (
    tab: HostControlTab,
  ) => void;
  onQrOpenChange?: (
    open: boolean,
  ) => void;
  onStopPlaying: () => void;
  onCancelEvent: () => void;
  onChanged?: () => Promise<void> | void;
};

const TABS: Array<{
  value: HostControlTab;
  label: string;
}> = [
  {
    value: "requests",
    label: "Requests",
  },
  {
    value: "attendance",
    label: "Attendance",
  },
  {
    value: "manage",
    label: "Manage",
  },
];

export default function EventHostControls({
  eventId,
  eventStatus,
  attendanceMethod,
  allowWalkIns,
  pendingCount,
  attendeesCount,
  maxPlayers,
  isPlaying,
  canLeave,
  canCancelEvent,
  activeTab,
  qrOpen,
  onTabChange,
  onQrOpenChange,
  onStopPlaying,
  onCancelEvent,
  onChanged,
}: EventHostControlsProps) {
  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    if (
      event.key !==
        "ArrowRight" &&
      event.key !== "ArrowLeft" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    event.preventDefault();

    let nextIndex =
      currentIndex;

    if (
      event.key ===
      "ArrowRight"
    ) {
      nextIndex =
        (currentIndex + 1) %
        TABS.length;
    } else if (
      event.key ===
      "ArrowLeft"
    ) {
      nextIndex =
        (currentIndex -
          1 +
          TABS.length) %
        TABS.length;
    } else if (
      event.key === "Home"
    ) {
      nextIndex = 0;
    } else if (
      event.key === "End"
    ) {
      nextIndex =
        TABS.length - 1;
    }

    const nextTab =
      TABS[nextIndex];

    onTabChange(
      nextTab.value,
    );

    const tabList =
      event.currentTarget
        .parentElement;

    const tabs =
      tabList?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]',
      );

    tabs?.[nextIndex]?.focus();
  }

  return (
    <section
      id="event-host-controls"
      aria-labelledby="event-host-controls-title"
      className="border-t border-[#6E5AA7]/10 py-5"
    >
      <div className="px-1">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="h-1.5 w-5 rounded-full bg-[#6E5AA7]"
          />
          <h2
            id="event-host-controls-title"
            className="text-lg font-bold tracking-[-0.025em] text-zinc-950"
          >
            Host controls
          </h2>
        </div>

        <p className="mt-1 text-sm text-zinc-500">
          Review the table and event.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Host controls"
        className="mt-4 grid grid-cols-3 rounded-[0.95rem] bg-[#EEE9FF]/65 p-1 shadow-[inset_0_0_0_1px_rgba(110,90,167,0.10)]"
      >
        {TABS.map(
          (tab, index) => {
            const active =
              tab.value ===
              activeTab;

            const showCount =
              tab.value ===
                "requests" &&
              Number(
                pendingCount ?? 0,
              ) > 0;

            return (
              <button
                key={tab.value}
                id={`event-host-tab-${tab.value}`}
                type="button"
                role="tab"
                aria-selected={
                  active
                }
                aria-controls={`event-host-panel-${tab.value}`}
                tabIndex={
                  active ? 0 : -1
                }
                onClick={() => {
                  onTabChange(
                    tab.value,
                  );
                }}
                onKeyDown={(
                  event,
                ) => {
                  handleTabKeyDown(
                    event,
                    index,
                  );
                }}
                className={[
                  "flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 text-[12px] font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-[#6E5AA7]/20",
                  active
                    ? "bg-[#6E5AA7] text-white shadow-[0_4px_12px_rgba(110,90,167,0.24)]"
                    : "text-[#625A6D] hover:bg-white/45 hover:text-[#5B478A]",
                ].join(" ")}
              >
                <span className="truncate">
                  {tab.label}
                </span>

                {showCount ? (
                  <span
                    className={[
                      "grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active
                        ? "bg-white/20 text-white"
                        : "bg-white/75 text-[#5B478A]",
                    ].join(" ")}
                  >
                    {Math.min(
                      99,
                      Number(
                        pendingCount,
                      ),
                    )}
                  </span>
                ) : null}
              </button>
            );
          },
        )}
      </div>

      <div className="mt-4">
        {activeTab ===
        "requests" ? (
          <div
            id="event-host-panel-requests"
            role="tabpanel"
            aria-labelledby="event-host-tab-requests"
          >
            <EventRequestsPanel
              eventId={eventId}
              initialCount={
                pendingCount
              }
              eventStatus={
                eventStatus
              }
              attendeesCount={
                attendeesCount
              }
              maxPlayers={
                maxPlayers
              }
              onChanged={
                onChanged
              }
            />
          </div>
        ) : null}

        {activeTab ===
        "attendance" ? (
          <div
            id="event-host-panel-attendance"
            role="tabpanel"
            aria-labelledby="event-host-tab-attendance"
          >
            {attendanceMethod !==
            "none" ? (
              <EventAttendancePanel
                eventId={eventId}
                eventStatus={
                  eventStatus
                }
                attendanceMethod={
                  attendanceMethod
                }
                allowWalkIns={
                  allowWalkIns
                }
                qrOpen={qrOpen}
                onQrOpenChange={
                  onQrOpenChange
                }
                onChanged={
                  onChanged
                }
              />
            ) : (
              <p className="border-t border-[#6E5AA7]/10 py-4 text-sm text-zinc-500">
                Attendance verification is not enabled for this event.
              </p>
            )}
          </div>
        ) : null}

        {activeTab ===
        "manage" ? (
          <div
            id="event-host-panel-manage"
            role="tabpanel"
            aria-labelledby="event-host-tab-manage"
          >
            <div className="overflow-hidden rounded-[1.3rem] bg-white/60 px-4 shadow-[inset_0_0_0_1px_rgba(110,90,167,0.10),0_10px_28px_rgba(57,43,82,0.035)]">
              {canCancelEvent ? (
                <Link
                  href={`/events/${eventId}/edit`}
                  className="flex min-h-14 items-center gap-3 py-3 outline-none transition hover:bg-[#6E5AA7]/[0.035] focus-visible:bg-[#6E5AA7]/[0.07]"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#EEE9FF] text-[#5B478A] shadow-[inset_0_0_0_1px_rgba(110,90,167,0.08)]">
                    <Pencil className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1 text-sm font-medium text-zinc-900">
                    Edit event
                  </span>

                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </Link>
              ) : (
                <div className="flex min-h-14 items-center gap-3 py-3 opacity-45">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/80 text-zinc-500">
                    <Pencil className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1 text-sm font-medium text-zinc-900">
                    Edit event
                  </span>

                  <span className="text-xs text-zinc-500">
                    Closed
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={
                  onStopPlaying
                }
                disabled={
                  !isPlaying ||
                  !canLeave
                }
                className="flex min-h-14 w-full items-center gap-3 border-t border-[#6E5AA7]/10 py-3 text-left outline-none transition hover:bg-[#6E5AA7]/[0.035] focus-visible:bg-[#6E5AA7]/[0.07] disabled:opacity-45"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#F1EEF4] text-zinc-600">
                  <UserMinus className="h-4 w-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-zinc-900">
                    Stop playing
                  </span>

                  {!isPlaying ? (
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      You are hosting only
                    </span>
                  ) : null}
                </span>

                <ChevronRight className="h-4 w-4 text-zinc-400" />
              </button>
            </div>

            <div className="mt-5 border-t border-red-500/15 pt-2">
              <button
                type="button"
                onClick={
                  onCancelEvent
                }
                disabled={
                  !canCancelEvent
                }
                className="flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left text-red-600 outline-none transition hover:bg-red-500/[0.055] active:bg-red-500/[0.08] focus-visible:ring-4 focus-visible:ring-red-500/15 disabled:opacity-45"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/[0.08]">
                  <XCircle className="h-[18px] w-[18px]" />
                </span>

                <span className="min-w-0 flex-1 text-sm font-medium">
                  Cancel event
                </span>

                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
