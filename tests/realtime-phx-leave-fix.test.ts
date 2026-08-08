import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("transient Realtime statuses do not force removeChannel/phx_leave", () => {
  const hook = read("hooks/useResilientPrivateBroadcastChannel.ts");
  const block = hook.slice(hook.indexOf("if (terminalStatuses.has(nextStatus))"), hook.indexOf("});\n      } catch", hook.indexOf("if (terminalStatuses.has(nextStatus))")));
  assert.doesNotMatch(block, /removeCurrentChannel/);
  assert.match(block, /setStatus\("unavailable"\)/);
  assert.match(block, /onFailure/);
});

test("recovery only forces socket connect for explicit disconnected heartbeat", () => {
  const provider = read("components/realtime/RealtimeRecoveryProvider.tsx");
  assert.match(provider, /status === "disconnected"/);
  assert.match(provider, /if \(reconnectSocket\) supabase\.realtime\.connect\(\)/);
});

test("messaging inbox has temporary REST safety sync only while Realtime is down", () => {
  const provider = read("components/messages/MessagingProvider.tsx");
  assert.match(provider, /messagingRealtimeStatus === "connected"/);
  assert.match(provider, /setInterval\(safetyRefresh, 5_000\)/);
});
