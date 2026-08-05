"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, Check, LoaderCircle, Send } from "lucide-react";

import { ApiError } from "@/lib/api";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushBrowserState,
  getVerifiedPushBrowserState,
  PUSH_STATE_CHANGED_EVENT,
  sendTestPushNotification,
  type PushBrowserState,
} from "@/services/push";

type ButtonState = PushBrowserState | "loading" | "error";
type PushPermissionButtonProps = { variant?: "icon" | "settings" };

export default function PushPermissionButton({ variant = "icon" }: PushPermissionButtonProps) {
  const [state, setState] = useState<ButtonState>("loading");
  const [busy, setBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    function refresh() {
      const immediate = getPushBrowserState();
      if (immediate !== "enabled") {
        setState(immediate);
        return;
      }
      setState("loading");
      void getVerifiedPushBrowserState().then(setState).catch(() => setState("error"));
    }

    refresh();
    window.addEventListener(PUSH_STATE_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(PUSH_STATE_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  async function handleClick() {
    if (busy || state === "unsupported" || state === "blocked") return;
    setBusy(true);
    setTestStatus(null);
    try {
      if (state === "enabled") {
        if (!window.confirm("Disable push notifications on this device?")) return;
        await disablePushNotifications();
      } else {
        await enablePushNotifications();
      }
      setState(getPushBrowserState());
    } catch (actionError) {
      console.error("Push notification action failed", actionError);
      setState("error");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    if (testBusy || state !== "enabled") return;
    setTestBusy(true);
    setTestStatus(null);
    try {
      await sendTestPushNotification();
      setTestStatus("Test notification sent. It may take a few seconds to appear.");
    } catch (error) {
      if (error instanceof ApiError) {
        const messages: Record<string, string> = {
          PUSH_BACKEND_NOT_CONFIGURED: "Push delivery is not configured on the backend yet.",
          USER_HAS_NO_PUSH_TOKEN: "This device is not registered for push. Disable and enable push again.",
          PUSH_DELIVERY_FAILED: "Firebase did not accept the test notification. Check the Firebase project and VAPID configuration.",
        };
        setTestStatus((error.code && messages[error.code]) || "The test notification could not be delivered.");
      } else {
        setTestStatus("The test notification could not be delivered.");
      }
    } finally {
      setTestBusy(false);
    }
  }

  if (variant === "settings") {
    return (
      <SettingsControl
        state={state}
        busy={busy}
        testBusy={testBusy}
        testStatus={testStatus}
        onClick={() => { void handleClick(); }}
        onTest={() => { void sendTest(); }}
      />
    );
  }

  const title = getButtonTitle(state);
  return (
    <button
      type="button"
      onClick={() => { void handleClick(); }}
      disabled={busy || state === "loading" || state === "unsupported" || state === "blocked"}
      aria-label={title}
      title={title}
      className={[
        "relative grid h-10 w-10 place-items-center rounded-full border transition",
        state === "enabled"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : state === "blocked" || state === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-black/10 bg-white text-zinc-600 hover:border-[#6E5AA7]/30 hover:bg-[#F3EFFF] hover:text-[#6E5AA7]",
        "disabled:cursor-not-allowed disabled:opacity-60",
      ].join(" ")}
    >
      {busy || state === "loading" ? (
        <LoaderCircle className="h-[18px] w-[18px] animate-spin" />
      ) : state === "enabled" ? (
        <>
          <BellRing className="h-[18px] w-[18px]" />
          <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white">
            <Check size={10} strokeWidth={3} />
          </span>
        </>
      ) : state === "blocked" || state === "unsupported" ? (
        <BellOff className="h-[18px] w-[18px]" />
      ) : (
        <BellRing className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}

function SettingsControl({
  state,
  busy,
  testBusy,
  testStatus,
  onClick,
  onTest,
}: {
  state: ButtonState;
  busy: boolean;
  testBusy: boolean;
  testStatus: string | null;
  onClick: () => void;
  onTest: () => void;
}) {
  const copy = getSettingsCopy(state);
  const disabled = busy || state === "loading" || state === "unsupported" || state === "blocked";

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className={[
          "grid h-12 w-12 shrink-0 place-items-center rounded-full",
          state === "enabled"
            ? "bg-emerald-50 text-emerald-700"
            : state === "blocked" || state === "error"
              ? "bg-red-50 text-red-700"
              : "bg-[#EEE9FF] text-[#6E5AA7]",
        ].join(" ")}>
          {busy || state === "loading" ? (
            <LoaderCircle size={20} className="animate-spin" />
          ) : state === "blocked" || state === "unsupported" ? (
            <BellOff size={20} />
          ) : (
            <BellRing size={20} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-zinc-950">{copy.title}</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">{copy.description}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {state === "enabled" ? (
            <button
              type="button"
              onClick={onTest}
              disabled={testBusy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-black/[0.035] disabled:opacity-50"
            >
              {testBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
              Send test
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={[
              "inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition",
              state === "enabled"
                ? "border border-black/10 bg-white text-zinc-700 hover:bg-black/[0.035]"
                : "bg-black text-white hover:bg-zinc-800",
              "disabled:cursor-not-allowed disabled:opacity-50",
            ].join(" ")}
          >
            {busy ? "Working..." : copy.action}
          </button>
        </div>
      </div>
      {testStatus ? <p role="status" className="mt-4 text-sm text-zinc-600">{testStatus}</p> : null}
    </div>
  );
}

function getSettingsCopy(state: ButtonState): { title: string; description: string; action: string } {
  switch (state) {
    case "enabled":
      return {
        title: "Push notifications are on",
        description: "UntapGo can notify this browser about messages, requests, event changes and other important activity.",
        action: "Disable",
      };
    case "blocked":
      return {
        title: "Notifications are blocked",
        description: "Allow notifications for this site from your browser settings, then return here.",
        action: "Blocked",
      };
    case "unsupported":
      return {
        title: "Push is not supported",
        description: "This browser or device does not support web push notifications.",
        action: "Unavailable",
      };
    case "error":
      return {
        title: "Push could not be configured",
        description: "Something interrupted registration. Try enabling notifications again.",
        action: "Try again",
      };
    case "loading":
      return {
        title: "Checking this device",
        description: "UntapGo is checking notification support and permission.",
        action: "Checking...",
      };
    default:
      return {
        title: "Push notifications are off",
        description: "Enable alerts for messages, requests, event changes, cancellations and other important activity.",
        action: "Enable",
      };
  }
}

function getButtonTitle(state: ButtonState): string {
  switch (state) {
    case "enabled": return "Push notifications are enabled. Click to disable them on this device.";
    case "blocked": return "Notifications are blocked in your browser settings.";
    case "unsupported": return "Push notifications are not supported in this browser.";
    case "error": return "Push notifications could not be configured. Click to try again.";
    case "loading": return "Checking push notification support.";
    default: return "Enable push notifications on this device.";
  }
}
