"use client";

import { useEffect, useRef, useState } from "react";
import type { AuthChangeEvent, RealtimeChannel, Session } from "@supabase/supabase-js";

import {
  isPlaygroupChatMessage,
  playgroupChatTopic,
  type PlaygroupChatMessage,
} from "@/lib/playgroup-communications";
import { supabase } from "@/lib/supabase/client";

export type PlaygroupRealtimeStatus = "idle" | "connecting" | "connected" | "unavailable";

const terminalFailureStates = new Set(["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"]);
const channelRemovalByTopic = new Map<string, Promise<void>>();

function connectionState() {
  return supabase.realtime.connectionState();
}

function logRealtimeState({
  topic,
  status,
  error,
  sessionAvailable,
  tokenApplied,
}: {
  topic: string;
  status: string;
  error?: unknown;
  sessionAvailable: boolean;
  tokenApplied: boolean;
}) {
  if (process.env.NODE_ENV === "production") return;
  const details = {
    topic,
    status,
    sessionAvailable,
    tokenApplied,
    connectionState: connectionState(),
  };
  if (error) console.error("[playgroup chat realtime]", details, error);
  else console.debug("[playgroup chat realtime]", details);
}

async function removeTopicChannel(topic: string, channel: RealtimeChannel) {
  const previous = channelRemovalByTopic.get(topic) ?? Promise.resolve();
  const removal: Promise<void> = previous
    .catch(() => undefined)
    .then(async () => {
      await supabase.removeChannel(channel);
    })
    .finally(() => {
      if (channelRemovalByTopic.get(topic) === removal) channelRemovalByTopic.delete(topic);
    });
  channelRemovalByTopic.set(topic, removal);
  await removal;
}

async function removeExistingTopicChannel(topic: string) {
  await channelRemovalByTopic.get(topic)?.catch(() => undefined);
  const realtimeTopic = `realtime:${topic}`;
  const existing = supabase.getChannels().find((candidate) => candidate.topic === realtimeTopic);
  if (existing) await removeTopicChannel(topic, existing);
}

export default function usePlaygroupChatRealtime({
  playgroupId,
  viewerId,
  enabled,
  retryKey,
  onMessage,
  onDeleted,
  onReconnect,
  onChannelFailure,
}: {
  playgroupId: string;
  viewerId: string | null;
  enabled: boolean;
  retryKey: number;
  onMessage: (message: PlaygroupChatMessage) => void;
  onDeleted: (message: PlaygroupChatMessage) => void;
  onReconnect: () => void;
  onChannelFailure: () => void;
}) {
  const [status, setStatus] = useState<PlaygroupRealtimeStatus>(enabled ? "connecting" : "idle");
  const handlers = useRef({ onMessage, onDeleted, onReconnect, onChannelFailure });

  useEffect(() => {
    handlers.current = { onMessage, onDeleted, onReconnect, onChannelFailure };
  }, [onChannelFailure, onDeleted, onMessage, onReconnect]);

  useEffect(() => {
    const topic = playgroupChatTopic(playgroupId);
    if (!enabled || !viewerId || !topic) {
      setStatus("idle");
      return;
    }

    let stopped = false;
    let channel: RealtimeChannel | null = null;
    let initialized = false;
    let sessionAvailable = false;
    let tokenApplied = false;
    let latestAuthSession: Session | null | undefined;
    setStatus("connecting");

    const removeCurrentChannel = () => {
      const current = channel;
      channel = null;
      if (current) {
        void removeTopicChannel(topic, current).catch((error: unknown) => {
          logRealtimeState({
            topic,
            status: "CLEANUP_ERROR",
            error,
            sessionAvailable,
            tokenApplied,
          });
        });
      }
    };

    const applyRefreshedAuth = (event: AuthChangeEvent, session: Session | null) => {
      latestAuthSession = session;
      if (!initialized || stopped) return;
      if (!session || session.user.id !== viewerId) {
        sessionAvailable = Boolean(session);
        tokenApplied = false;
        logRealtimeState({ topic, status: event, sessionAvailable, tokenApplied });
        setStatus("idle");
        removeCurrentChannel();
        handlers.current.onChannelFailure();
        return;
      }
      if (event !== "TOKEN_REFRESHED" && event !== "SIGNED_IN" && event !== "INITIAL_SESSION") return;
      sessionAvailable = true;
      void supabase.realtime.setAuth(session.access_token)
        .then(() => {
          if (stopped) return;
          tokenApplied = true;
          logRealtimeState({ topic, status: event, sessionAvailable, tokenApplied });
        })
        .catch((error: unknown) => {
          if (stopped) return;
          tokenApplied = false;
          logRealtimeState({ topic, status: `${event}_AUTH_ERROR`, error, sessionAvailable, tokenApplied });
          setStatus("unavailable");
          handlers.current.onChannelFailure();
        });
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      applyRefreshedAuth(event, session);
    });

    void (async () => {
      const { data, error } = await supabase.auth.getSession();
      const session = latestAuthSession === undefined ? data.session : latestAuthSession;
      if (stopped) return;
      if (error || !session || session.user.id !== viewerId) {
        initialized = true;
        sessionAvailable = Boolean(session);
        logRealtimeState({
          topic,
          status: "SESSION_UNAVAILABLE",
          error,
          sessionAvailable,
          tokenApplied,
        });
        setStatus("unavailable");
        handlers.current.onChannelFailure();
        return;
      }

      sessionAvailable = true;
      await supabase.realtime.setAuth(session.access_token);
      tokenApplied = true;
      initialized = true;
      logRealtimeState({ topic, status: "AUTH_APPLIED", sessionAvailable, tokenApplied });
      if (stopped) return;

      await removeExistingTopicChannel(topic);
      if (stopped) return;
      channel = supabase.channel(topic, {
        config: { private: true, broadcast: { ack: false, self: false } },
      });
      channel
        .on("broadcast", { event: "message" }, ({ payload }) => {
          if (!stopped && isPlaygroupChatMessage(payload, playgroupId)) handlers.current.onMessage(payload);
        })
        .on("broadcast", { event: "message_deleted" }, ({ payload }) => {
          if (!stopped && isPlaygroupChatMessage(payload, playgroupId)) handlers.current.onDeleted(payload);
        })
        .subscribe((nextStatus, subscriptionError) => {
          if (stopped) return;
          logRealtimeState({
            topic,
            status: nextStatus,
            error: subscriptionError,
            sessionAvailable,
            tokenApplied,
          });
          if (nextStatus === "SUBSCRIBED") {
            setStatus("connected");
            // Close the REST/subscription race on first connect and recover any
            // events missed while the socket was unavailable on reconnect.
            handlers.current.onReconnect();
            return;
          }
          if (terminalFailureStates.has(nextStatus)) {
            setStatus("unavailable");
            handlers.current.onChannelFailure();
          }
        });
    })().catch((error: unknown) => {
      if (!stopped) {
        initialized = true;
        logRealtimeState({ topic, status: "SETUP_ERROR", error, sessionAvailable, tokenApplied });
        setStatus("unavailable");
        handlers.current.onChannelFailure();
      }
    });

    return () => {
      stopped = true;
      authListener.subscription.unsubscribe();
      removeCurrentChannel();
    };
  }, [enabled, playgroupId, retryKey, viewerId]);

  return status;
}
