export const REALTIME_RECOVERY_REQUESTED_EVENT = "untapgo:realtime-recovery-requested";
export const REALTIME_HEARTBEAT_FAILED_EVENT = "untapgo:realtime-heartbeat-failed";

export type RealtimeRecoveryReason =
  | "heartbeat"
  | "visible"
  | "online"
  | "pageshow"
  | "manual";

export function dispatchRealtimeRecovery(reason: RealtimeRecoveryReason): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(REALTIME_RECOVERY_REQUESTED_EVENT, {
    detail: { reason },
  }));
}
