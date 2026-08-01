"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";

import {
  NOTIFICATION_CREATED_EVENT,
  NOTIFICATION_DELETED_EVENT,
  NOTIFICATION_UPDATED_EVENT,
  NOTIFICATIONS_CLEARED_EVENT,
  notificationRealtimeTopic,
  parseClearedBroadcast,
  parseDeletedBroadcast,
  parseNotificationBroadcast,
  type NotificationChange,
} from "@/lib/notification-live";
import { supabase } from "@/lib/supabase/client";

export type NotificationConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "unavailable";

type Handlers = {
  onChange: (change: NotificationChange) => void;
  onReconnect: () => void;
};

async function removeExistingTopicChannel(topic: string): Promise<void> {
  const realtimeTopic = `realtime:${topic}`;
  const existing = supabase.getChannels().find((item) => item.topic === realtimeTopic);
  if (existing) await supabase.removeChannel(existing);
}

function diagnostic(topic: string, status: string, error?: unknown): void {
  if (process.env.NODE_ENV === "production") return;
  console.debug("[notifications realtime]", {
    topic,
    status,
    errorType: error instanceof Error ? error.name : undefined,
  });
}

export function useNotificationRealtimeChannel(
  session: Session | null,
  handlers: Handlers,
): NotificationConnectionState {
  const [status, setStatus] = useState<NotificationConnectionState>("idle");
  const [retryKey, setRetryKey] = useState(0);
  const handlersRef = useRef(handlers);
  const subscribedUserRef = useRef<string | null>(null);
  const hadConnectionFailureRef = useRef(false);
  const retryAttemptRef = useRef(0);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const userId = session?.user.id ?? "";
    const accessToken = session?.access_token ?? "";
    const resolvedTopic = notificationRealtimeTopic(userId);
    if (!resolvedTopic || !accessToken) {
      setStatus("idle");
      subscribedUserRef.current = null;
      hadConnectionFailureRef.current = false;
      return;
    }
    const topic = resolvedTopic;

    let disposed = false;
    let channel: RealtimeChannel | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    function scheduleRetry(nextStatus: string, error?: unknown) {
      if (disposed || retryTimer) return;
      setStatus("unavailable");
      hadConnectionFailureRef.current = true;
      diagnostic(topic, nextStatus, error);
      retryAttemptRef.current += 1;
      const delay = Math.min(30_000, 1_000 * 2 ** Math.min(5, retryAttemptRef.current - 1));
      retryTimer = setTimeout(() => setRetryKey((value) => value + 1), delay);
    }

    async function connect() {
      setStatus("connecting");
      await supabase.realtime.setAuth(accessToken);
      await removeExistingTopicChannel(topic);
      if (disposed) return;

      channel = supabase.channel(topic, {
        config: { private: true, broadcast: { ack: false, self: false } },
      });
      channel
        .on("broadcast", { event: NOTIFICATION_CREATED_EVENT }, ({ payload }) => {
          const notification = parseNotificationBroadcast(payload);
          if (notification) handlersRef.current.onChange({ kind: "created", notification });
        })
        .on("broadcast", { event: NOTIFICATION_UPDATED_EVENT }, ({ payload }) => {
          const notification = parseNotificationBroadcast(payload);
          if (notification) handlersRef.current.onChange({ kind: "updated", notification });
        })
        .on("broadcast", { event: NOTIFICATION_DELETED_EVENT }, ({ payload }) => {
          const change = parseDeletedBroadcast(payload);
          if (change) handlersRef.current.onChange(change);
        })
        .on("broadcast", { event: NOTIFICATIONS_CLEARED_EVENT }, ({ payload }) => {
          const change = parseClearedBroadcast(payload);
          if (change) handlersRef.current.onChange(change);
        })
        .subscribe((nextStatus, subscriptionError) => {
          if (disposed) return;
          diagnostic(topic, nextStatus, subscriptionError);
          if (nextStatus === "SUBSCRIBED") {
            const reconnect = subscribedUserRef.current === userId
              || hadConnectionFailureRef.current;
            subscribedUserRef.current = userId;
            hadConnectionFailureRef.current = false;
            retryAttemptRef.current = 0;
            setStatus("connected");
            if (reconnect) handlersRef.current.onReconnect();
          } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(nextStatus)) {
            scheduleRetry(nextStatus, subscriptionError);
          }
        });
    }

    void connect().catch((error) => scheduleRetry("CHANNEL_ERROR", error));
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [session?.access_token, session?.user.id, retryKey]);

  return status;
}
