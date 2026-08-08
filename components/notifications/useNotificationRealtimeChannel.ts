"use client";

import { useMemo } from "react";
import type { Session } from "@supabase/supabase-js";

import useResilientPrivateBroadcastChannel, {
  type ResilientRealtimeStatus,
} from "@/hooks/useResilientPrivateBroadcastChannel";
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

export type NotificationConnectionState = ResilientRealtimeStatus;

type Handlers = {
  onChange: (change: NotificationChange) => void;
  onReconnect: () => void;
};

export function useNotificationRealtimeChannel(
  session: Session | null,
  handlers: Handlers,
): NotificationConnectionState {
  const userId = session?.user.id ?? null;
  const topic = userId ? notificationRealtimeTopic(userId) : null;

  const events = useMemo(() => ({
    [NOTIFICATION_CREATED_EVENT]: (payload: unknown) => {
      const notification = parseNotificationBroadcast(payload);
      if (notification) handlers.onChange({ kind: "created", notification });
    },
    [NOTIFICATION_UPDATED_EVENT]: (payload: unknown) => {
      const notification = parseNotificationBroadcast(payload);
      if (notification) handlers.onChange({ kind: "updated", notification });
    },
    [NOTIFICATION_DELETED_EVENT]: (payload: unknown) => {
      const change = parseDeletedBroadcast(payload);
      if (change) handlers.onChange(change);
    },
    [NOTIFICATIONS_CLEARED_EVENT]: (payload: unknown) => {
      const change = parseClearedBroadcast(payload);
      if (change) handlers.onChange(change);
    },
  }), [handlers]);

  return useResilientPrivateBroadcastChannel({
    topic,
    userId,
    enabled: Boolean(session),
    events,
    onSubscribed: (reason) => {
      if (reason !== "recovery") handlers.onReconnect();
    },
    onRecovery: handlers.onReconnect,
  });
}
