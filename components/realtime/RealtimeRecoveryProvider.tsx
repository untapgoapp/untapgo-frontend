"use client";

import { useEffect, useRef, type ReactNode } from "react";

import {
  REALTIME_HEARTBEAT_FAILED_EVENT,
  dispatchRealtimeRecovery,
  type RealtimeRecoveryReason,
} from "@/lib/realtime-events";
import { supabase } from "@/lib/supabase/client";

const RESUME_DEBOUNCE_MS = 750;
const MIN_HIDDEN_MS = 1_500;

export default function RealtimeRecoveryProvider({ children }: { children: ReactNode }) {
  const hiddenAtRef = useRef<number | null>(null);
  const lastRecoveryRef = useRef(0);

  useEffect(() => {
    let disposed = false;

    const recover = async (reason: RealtimeRecoveryReason, reconnectSocket = false) => {
      const now = Date.now();
      if (now - lastRecoveryRef.current < RESUME_DEBOUNCE_MS) return;
      lastRecoveryRef.current = now;

      try {
        const { data } = await supabase.auth.getSession();
        if (disposed) return;
        if (data.session?.access_token) {
          await supabase.realtime.setAuth(data.session.access_token);
        }
        if (disposed) return;

        // realtime-js already reconnects automatically. Only force a socket
        // connect when the heartbeat explicitly reports `disconnected`. Calling
        // connect() for timeout/error/visibility events can create unnecessary
        // reconnect churn while healthy channels are trying to rejoin.
        if (reconnectSocket) supabase.realtime.connect();
      } catch {
        // Individual channel hooks still perform their own auth/retry cycle.
        // The recovery event below also triggers REST reconciliation so a
        // temporary socket failure never becomes stale UI state.
      } finally {
        if (!disposed) dispatchRealtimeRecovery(reason);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt !== null && Date.now() - hiddenAt >= MIN_HIDDEN_MS) {
        void recover("visible");
      }
    };

    const onPageHide = () => {
      hiddenAtRef.current = Date.now();
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void recover("pageshow");
    };

    const onOnline = () => {
      void recover("online");
    };

    const onHeartbeatFailure = (event: Event) => {
      const status = (event as CustomEvent<{ status?: string }>).detail?.status;
      void recover("heartbeat", status === "disconnected");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("online", onOnline);
    window.addEventListener(REALTIME_HEARTBEAT_FAILED_EVENT, onHeartbeatFailure);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", onOnline);
      window.removeEventListener(REALTIME_HEARTBEAT_FAILED_EVENT, onHeartbeatFailure);
    };
  }, []);

  return children;
}
