"use client";

import {
  ClipboardCheck,
  Inbox,
  Layers3,
  LogOut,
  QrCode,
  ScanLine,
  SlidersHorizontal,
  UserPlus,
  X,
} from "lucide-react";

import type {
  AttendanceMethod,
} from "@/services/events";

type EventMobileActionBarProps = {
  isHost: boolean;
  isPlaying: boolean;
  requested: boolean;
  canJoin: boolean;
  canLeave: boolean;
  canCancelRequest: boolean;
  canScan: boolean;
  hostAttendanceDisabled?: boolean;
  attendanceMethod: AttendanceMethod;
  busy: boolean;
  onHostAttendance: () => void;
  onRequests: () => void;
  onManage: () => void;
  onScan: () => void;
  onChangeDeck: () => void;
  onLeave: () => void;
  onJoin: () => void;
  onCancelRequest: () => void;
};

export default function EventMobileActionBar({
  isHost,
  isPlaying,
  requested,
  canJoin,
  canLeave,
  canCancelRequest,
  canScan,
  hostAttendanceDisabled = false,
  attendanceMethod,
  busy,
  onHostAttendance,
  onRequests,
  onManage,
  onScan,
  onChangeDeck,
  onLeave,
  onJoin,
  onCancelRequest,
}: EventMobileActionBarProps) {

  return (
    <nav
      aria-label="Event actions"
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-border/70 bg-surface/92 px-3 pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 shadow-surface backdrop-blur-2xl lg:hidden"
    >
      {isHost ? (
        <div className={`mx-auto grid max-w-md ${attendanceMethod === "none" ? "grid-cols-2" : "grid-cols-3"}`}>
          {attendanceMethod !== "none" ? (
            <BarButton
              icon={
                attendanceMethod === "qr"
                  ? <QrCode />
                  : <ClipboardCheck />
              }
              label={attendanceMethod === "qr" ? "Show QR" : "Attendance"}
              onClick={onHostAttendance}
              disabled={busy || hostAttendanceDisabled}
              accent
            />
          ) : null}

          <BarButton
            icon={<Inbox />}
            label="Requests"
            onClick={onRequests}
            disabled={busy}
          />

          <BarButton
            icon={
              <SlidersHorizontal />
            }
            label="Manage"
            onClick={onManage}
            disabled={busy}
          />
        </div>
      ) : isPlaying ? (
        <div className="mx-auto grid max-w-md grid-cols-3">
          <BarButton
            icon={<ScanLine />}
            label="Scan QR"
            onClick={onScan}
            disabled={
              busy || !canScan
            }
            accent
          />

          <BarButton
            icon={<Layers3 />}
            label="Change deck"
            onClick={
              onChangeDeck
            }
            disabled={busy}
          />

          <BarButton
            icon={<LogOut />}
            label="Leave"
            onClick={onLeave}
            disabled={
              busy || !canLeave
            }
          />
        </div>
      ) : (
        <div className="mx-auto flex max-w-md justify-center">
          {canScan ? (
            <BarButton
              icon={<ScanLine />}
              label="Scan QR"
              onClick={onScan}
              disabled={busy}
              accent
            />
          ) : null}

          {canJoin ? (
            <BarButton
              icon={<UserPlus />}
              label="Request seat"
              onClick={onJoin}
              disabled={busy}
              accent
            />
          ) : null}

          {requested &&
          canCancelRequest ? (
            <BarButton
              icon={<X />}
              label="Cancel request"
              onClick={
                onCancelRequest
              }
              disabled={busy}
            />
          ) : null}

          {!canScan &&
          !canJoin &&
          !canCancelRequest ? (
            <span className="flex min-h-12 items-center px-4 text-xs font-medium text-zinc-500">
              No participation actions available
            </span>
          ) : null}
        </div>
      )}
    </nav>
  );
}

function BarButton({
  icon,
  label,
  onClick,
  disabled,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled: boolean;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "mx-auto flex min-h-12 min-w-[82px] flex-col items-center justify-center gap-0.5 rounded-control px-2 text-[11px] font-semibold outline-none transition-colors hover:bg-secondary/55 focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:opacity-40",
        accent
          ? "text-primary"
          : "text-muted-foreground",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-7 w-8 place-items-center rounded-lg [&>svg]:h-[19px] [&>svg]:w-[19px]",
          accent
            ? "bg-secondary"
            : "",
        ].join(" ")}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
