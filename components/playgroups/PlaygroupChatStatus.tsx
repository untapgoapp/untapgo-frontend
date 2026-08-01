import { Archive, RefreshCw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PlaygroupRealtimeStatus } from "@/components/playgroups/usePlaygroupChatRealtime";

export default function PlaygroupChatStatus({
  archived,
  realtimeStatus,
  refreshing,
  onRefresh,
}: {
  archived: boolean;
  realtimeStatus: PlaygroupRealtimeStatus;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="playgroup-chat-title" className="text-xl font-bold tracking-tight">Chat</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {realtimeStatus === "connected"
              ? "Live conversation with current Playgroup members."
              : "Conversation with current Playgroup members."}
          </p>
        </div>
        {realtimeStatus === "connecting" ? <span className="text-xs font-medium text-muted-foreground">Connecting live updates…</span> : null}
      </div>

      {archived ? <p className="mb-3 flex items-center gap-2 rounded-control bg-surface-subtle/75 px-3 py-2.5 text-sm text-muted-foreground"><Archive size={15} aria-hidden="true" /> This Playgroup is archived. Chat history is read-only.</p> : null}
      {realtimeStatus === "unavailable" ? (
        <div role="status" className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-control bg-warning-subtle px-3 py-2.5 text-sm text-warning">
          <span className="flex items-center gap-2"><WifiOff size={15} aria-hidden="true" /> Live updates are temporarily unavailable. REST history is still available.</span>
          <Button type="button" variant="ghost" size="xs" disabled={refreshing} onClick={onRefresh}><RefreshCw aria-hidden="true" />{refreshing ? "Refreshing…" : "Refresh"}</Button>
        </div>
      ) : null}
    </>
  );
}
