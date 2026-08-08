"use client";

import { useMemo } from "react";

import useResilientPrivateBroadcastChannel, {
  type ResilientRealtimeStatus,
} from "@/hooks/useResilientPrivateBroadcastChannel";
import {
  isPlaygroupChatMessage,
  playgroupChatTopic,
  type PlaygroupChatMessage,
} from "@/lib/playgroup-communications";

export type PlaygroupRealtimeStatus = ResilientRealtimeStatus;

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
  const topic = playgroupChatTopic(playgroupId);
  const events = useMemo(() => ({
    message: (payload: unknown) => {
      if (isPlaygroupChatMessage(payload, playgroupId)) onMessage(payload);
    },
    message_deleted: (payload: unknown) => {
      if (isPlaygroupChatMessage(payload, playgroupId)) onDeleted(payload);
    },
  }), [onDeleted, onMessage, playgroupId]);

  return useResilientPrivateBroadcastChannel({
    topic,
    userId: viewerId,
    enabled,
    retryKey,
    events,
    onSubscribed: (reason) => {
      if (reason !== "recovery") onReconnect();
    },
    onRecovery: onReconnect,
    onFailure: () => onChannelFailure(),
  });
}
