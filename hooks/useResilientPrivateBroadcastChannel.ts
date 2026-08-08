"use client";

import { useEffect, useRef, useState } from "react";
import type { AuthChangeEvent, RealtimeChannel, Session } from "@supabase/supabase-js";

import { REALTIME_RECOVERY_REQUESTED_EVENT } from "@/lib/realtime-events";
import { supabase } from "@/lib/supabase/client";

export type ResilientRealtimeStatus = "idle" | "connecting" | "connected" | "unavailable";
export type RealtimeConnectReason = "initial" | "retry" | "recovery" | "auth";

type BroadcastHandlers = Record<string, (payload: unknown) => void>;

type ResilientChannelOptions = {
  topic: string | null;
  userId: string | null;
  enabled?: boolean;
  events: BroadcastHandlers;
  retryKey?: number;
  onSubscribed?: (reason: RealtimeConnectReason) => void;
  onRecovery?: () => void;
  onFailure?: (status: string, error?: unknown) => void;
};

const terminalStatuses = new Set(["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"]);

function debug(topic: string, status: string, error?: unknown) {
  if (process.env.NODE_ENV === "production") return;
  const details = {
    topic,
    status,
    connectionState: supabase.realtime.connectionState(),
  };
  if (error) console.warn("[realtime]", details, error);
  else console.debug("[realtime]", details);
}

export default function useResilientPrivateBroadcastChannel({
  topic,
  userId,
  enabled = true,
  events,
  retryKey = 0,
  onSubscribed,
  onRecovery,
  onFailure,
}: ResilientChannelOptions): ResilientRealtimeStatus {
  const [status, setStatus] = useState<ResilientRealtimeStatus>(
    enabled && topic && userId ? "connecting" : "idle",
  );
  const callbacksRef = useRef({ events, onSubscribed, onRecovery, onFailure });

  useEffect(() => {
    callbacksRef.current = { events, onSubscribed, onRecovery, onFailure };
  }, [events, onFailure, onRecovery, onSubscribed]);

  useEffect(() => {
    if (!enabled || !topic || !userId) {
      setStatus("idle");
      return;
    }

    let disposed = false;
    let channel: RealtimeChannel | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let generation = 0;
    let retryAttempt = 0;
    let removalPromise: Promise<void> = Promise.resolve();

    const clearRetry = () => {
      if (!retryTimer) return;
      clearTimeout(retryTimer);
      retryTimer = null;
    };

    const removeCurrentChannel = async () => {
      const current = channel;
      channel = null;
      if (current) {
        removalPromise = removalPromise
          .catch(() => undefined)
          .then(async () => {
            try {
              await supabase.removeChannel(current);
            } catch (error) {
              debug(topic, "CLEANUP_ERROR", error);
            }
          });
      }
      await removalPromise.catch(() => undefined);
    };

    const scheduleRetry = (failureStatus: string, error?: unknown) => {
      if (disposed) return;
      setStatus("unavailable");
      debug(topic, failureStatus, error);
      callbacksRef.current.onFailure?.(failureStatus, error);
      if (retryTimer) return;
      retryAttempt += 1;
      const delay = Math.min(30_000, 1_000 * 2 ** Math.min(5, retryAttempt - 1));
      retryTimer = setTimeout(() => {
        retryTimer = null;
        void connect("retry");
      }, delay);
    };

    const resolveSession = async (): Promise<Session> => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session || data.session.user.id !== userId) {
        throw new Error("Realtime session is unavailable for the current user.");
      }
      await supabase.realtime.setAuth(data.session.access_token);
      return data.session;
    };

    const connect = async (reason: RealtimeConnectReason) => {
      const currentGeneration = ++generation;
      clearRetry();
      setStatus("connecting");
      await removeCurrentChannel();
      if (disposed || currentGeneration !== generation) return;

      try {
        await resolveSession();
        if (disposed || currentGeneration !== generation) return;

        const nextChannel = supabase.channel(topic, {
          config: { private: true, broadcast: { ack: false, self: false } },
        });
        channel = nextChannel;

        for (const eventName of Object.keys(callbacksRef.current.events)) {
          nextChannel.on("broadcast", { event: eventName }, ({ payload }) => {
            if (disposed || channel !== nextChannel) return;
            callbacksRef.current.events[eventName]?.(payload);
          });
        }

        nextChannel.subscribe((nextStatus, subscriptionError) => {
          if (disposed || channel !== nextChannel) return;
          debug(topic, nextStatus, subscriptionError);
          if (nextStatus === "SUBSCRIBED") {
            retryAttempt = 0;
            setStatus("connected");
            callbacksRef.current.onSubscribed?.(reason);
            return;
          }
          if (terminalStatuses.has(nextStatus)) {
            void removeCurrentChannel();
            scheduleRetry(nextStatus, subscriptionError);
          }
        });
      } catch (error) {
        if (!disposed && currentGeneration === generation) {
          scheduleRetry("SETUP_ERROR", error);
        }
      }
    };

    const onAuthChange = (event: AuthChangeEvent, nextSession: Session | null) => {
      if (disposed) return;
      if (!nextSession || nextSession.user.id !== userId) {
        generation += 1;
        clearRetry();
        setStatus("idle");
        void removeCurrentChannel();
        return;
      }
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        void supabase.realtime.setAuth(nextSession.access_token).catch((error) => {
          scheduleRetry("AUTH_REFRESH_ERROR", error);
        });
        if (event === "SIGNED_IN" && !channel) void connect("auth");
      }
    };

    const onGlobalRecovery = () => {
      if (disposed) return;
      // Reconcile application state, but do not tear down a healthy channel.
      // Supabase Realtime already reconnects/rejoins its socket. Rebuilding every
      // channel on visibility/heartbeat recovery caused unnecessary churn across
      // Firefox and mobile browsers.
      callbacksRef.current.onRecovery?.();
      if (!channel) void connect("recovery");
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(onAuthChange);
    window.addEventListener(REALTIME_RECOVERY_REQUESTED_EVENT, onGlobalRecovery);
    void connect("initial");

    return () => {
      disposed = true;
      generation += 1;
      clearRetry();
      authListener.subscription.unsubscribe();
      window.removeEventListener(REALTIME_RECOVERY_REQUESTED_EVENT, onGlobalRecovery);
      void removeCurrentChannel();
    };
  }, [enabled, retryKey, topic, userId]);

  return status;
}
