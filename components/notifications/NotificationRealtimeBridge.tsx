"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel, Session } from "@supabase/supabase-js";

import {
  NOTIFICATION_REALTIME_EVENT,
  notificationRealtimeTopic,
  parseNotificationBroadcast,
} from "@/lib/notification-live";
import { supabase } from "@/lib/supabase/client";
import { emitNotificationsChanged } from "@/services/notifications";

export default function NotificationRealtimeBridge() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user.id ?? "";
    const topic = notificationRealtimeTopic(userId);
    if (!session || !topic) return;

    let stopped = false;
    let channel: RealtimeChannel | null = null;

    void (async () => {
      await supabase.realtime.setAuth(session.access_token);
      if (stopped) return;

      channel = supabase.channel(topic, {
        config: { private: true, broadcast: { ack: false, self: false } },
      });
      channel
        .on("broadcast", { event: NOTIFICATION_REALTIME_EVENT }, ({ payload }) => {
          const notification = parseNotificationBroadcast(payload, userId);
          if (!stopped && notification) {
            emitNotificationsChanged({ kind: "received", notification });
          }
        })
        .subscribe((status) => {
          if (process.env.NODE_ENV !== "production") {
            console.debug(`[notifications realtime] ${status}`);
          }
        });
    })().catch(() => {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[notifications realtime] CHANNEL_ERROR");
      }
    });

    return () => {
      stopped = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [session]);

  return null;
}
