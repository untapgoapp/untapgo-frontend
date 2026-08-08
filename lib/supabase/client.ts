import { createBrowserClient } from "@supabase/ssr";

import { REALTIME_HEARTBEAT_FAILED_EVENT } from "@/lib/realtime-events";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    // Keep Realtime heartbeats off the main browser thread. This matters on
    // Firefox and mobile browsers, which throttle background-tab timers more
    // aggressively than desktop Chromium.
    worker: true,
    heartbeatCallback: (status) => {
      if (typeof window === "undefined") return;
      if (status !== "timeout" && status !== "disconnected" && status !== "error") return;
      window.dispatchEvent(new CustomEvent(REALTIME_HEARTBEAT_FAILED_EVENT, {
        detail: { status },
      }));
    },
  },
});
