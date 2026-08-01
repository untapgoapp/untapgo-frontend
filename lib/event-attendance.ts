import type {
  AttendanceMethod,
  EventMyAttendance,
} from "@/services/events";

export function normalizeAttendanceMethod(
  value?: string | null,
): AttendanceMethod {
  return value === "host" || value === "qr"
    ? value
    : "none";
}

export function getVerificationLabel(
  method?: "host" | "qr" | null,
): string | null {
  if (method === "host") {
    return "Verified by host";
  }

  if (method === "qr") {
    return "Verified with QR";
  }

  return null;
}

export function isVerifiedAttendance(
  attendance?: EventMyAttendance | null,
): boolean {
  return Boolean(
    attendance &&
      ["checked_in", "attended"].includes(
        attendance.attendance_status ?? "",
      ) &&
      ["host", "qr"].includes(
        attendance.verification_method ?? "",
      ),
  );
}

export function getAttendancePresentation({
  method,
  attendance,
  confirmed,
  pending,
}: {
  method: AttendanceMethod;
  attendance?: EventMyAttendance | null;
  confirmed: boolean;
  pending: boolean;
}): { label: string; detail: string } {
  if (isVerifiedAttendance(attendance)) {
    return {
      label: "Checked in",
      detail:
        getVerificationLabel(
          attendance?.verification_method,
        ) ?? "Attendance verified",
    };
  }

  if (pending || attendance?.check_in_state === "pending") {
    return {
      label: "Request pending",
      detail: "Check-in is available after the host confirms your seat.",
    };
  }

  if (method === "none") {
    return {
      label: "No verification required",
      detail: confirmed
        ? "Your confirmed seat does not require check-in."
        : "This event does not use attendance check-in.",
    };
  }

  if (!confirmed && attendance?.check_in_state !== "ready") {
    return {
      label: "Not participating",
      detail: "A confirmed seat is required for attendance check-in.",
    };
  }

  if (attendance?.check_in_state === "not_open") {
    return {
      label: "Confirmed · check-in not open",
      detail: "Check-in will become available near the event start time.",
    };
  }

  if (attendance?.check_in_state === "closed") {
    return {
      label: "Check-in closed",
      detail: "This event is no longer accepting check-ins.",
    };
  }

  if (attendance?.check_in_state === "ready") {
    return method === "qr"
      ? {
          label: confirmed
            ? "Confirmed · ready to check in"
            : "Ready to check in",
          detail: confirmed
            ? "Scan the event QR with your authenticated account."
            : "Scanning the event QR will claim an available walk-in seat.",
        }
      : {
          label: "Confirmed · ready for host check-in",
          detail: "The host can visually confirm you at the event.",
        };
  }

  return {
    label: confirmed ? "Confirmed" : "Not participating",
    detail:
      method === "qr"
        ? "QR check-in is used for this event."
        : "The host verifies attendance at this event.",
  };
}
