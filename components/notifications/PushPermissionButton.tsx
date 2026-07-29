"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  BellOff,
  BellRing,
  Check,
  LoaderCircle,
} from "lucide-react";

import {
  disablePushNotifications,
  enablePushNotifications,
  getPushBrowserState,
  PUSH_STATE_CHANGED_EVENT,
  type PushBrowserState,
} from "@/services/push";

type ButtonState =
  | PushBrowserState
  | "loading"
  | "error";

type PushPermissionButtonProps = {
  variant?:
    | "icon"
    | "settings";
};

export default function PushPermissionButton({
  variant = "icon",
}: PushPermissionButtonProps) {
  const [
    state,
    setState,
  ] =
    useState<ButtonState>(
      "loading",
    );

  const [
    busy,
    setBusy,
  ] = useState(false);

  useEffect(() => {
    function refresh() {
      setState(
        getPushBrowserState(),
      );
    }

    refresh();

    window.addEventListener(
      PUSH_STATE_CHANGED_EVENT,
      refresh,
    );

    return () => {
      window.removeEventListener(
        PUSH_STATE_CHANGED_EVENT,
        refresh,
      );
    };
  }, []);

  async function handleClick() {
    if (
      busy ||
      state === "unsupported" ||
      state === "blocked"
    ) {
      return;
    }

    setBusy(true);

    try {
      if (
        state === "enabled"
      ) {
        const confirmed =
          window.confirm(
            "Disable push notifications on this device?",
          );

        if (!confirmed) {
          return;
        }

        await disablePushNotifications();
      } else {
        await enablePushNotifications();
      }

      setState(
        getPushBrowserState(),
      );
    } catch (actionError) {
      console.error(
        "Push notification action failed",
        actionError,
      );

      setState("error");
    } finally {
      setBusy(false);
    }
  }

  if (
    variant === "settings"
  ) {
    return (
      <SettingsControl
        state={state}
        busy={busy}
        onClick={() => {
          void handleClick();
        }}
      />
    );
  }

  const title =
    getButtonTitle(state);

  return (
    <button
      type="button"
      onClick={() => {
        void handleClick();
      }}
      disabled={
        busy ||
        state === "loading" ||
        state === "unsupported" ||
        state === "blocked"
      }
      aria-label={title}
      title={title}
      className={[
        "relative grid h-10 w-10 place-items-center rounded-full border transition",
        state === "enabled"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : state === "blocked" ||
              state === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-black/10 bg-white text-zinc-600 hover:border-[#6E5AA7]/30 hover:bg-[#F3EFFF] hover:text-[#6E5AA7]",
        "disabled:cursor-not-allowed disabled:opacity-60",
      ].join(" ")}
    >
      {busy ||
      state === "loading" ? (
        <LoaderCircle className="h-[18px] w-[18px] animate-spin" />
      ) : state ===
        "enabled" ? (
        <>
          <BellRing className="h-[18px] w-[18px]" />

          <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white">
            <Check
              size={10}
              strokeWidth={3}
            />
          </span>
        </>
      ) : state ===
          "blocked" ||
        state ===
          "unsupported" ? (
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
  onClick,
}: {
  state: ButtonState;
  busy: boolean;
  onClick: () => void;
}) {
  const copy =
    getSettingsCopy(state);

  const disabled =
    busy ||
    state === "loading" ||
    state === "unsupported" ||
    state === "blocked";

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-black/10 bg-white p-5 sm:flex-row sm:items-center">
      <span
        className={[
          "grid h-12 w-12 shrink-0 place-items-center rounded-full",
          state === "enabled"
            ? "bg-emerald-50 text-emerald-700"
            : state === "blocked" ||
                state === "error"
              ? "bg-red-50 text-red-700"
              : "bg-[#EEE9FF] text-[#6E5AA7]",
        ].join(" ")}
      >
        {busy ||
        state === "loading" ? (
          <LoaderCircle
            size={20}
            className="animate-spin"
          />
        ) : state ===
            "blocked" ||
          state ===
            "unsupported" ? (
          <BellOff size={20} />
        ) : (
          <BellRing size={20} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <h2 className="font-bold text-zinc-950">
          {copy.title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {copy.description}
        </p>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={[
          "inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-semibold transition",
          state === "enabled"
            ? "border border-black/10 bg-white text-zinc-700 hover:bg-black/[0.035]"
            : "bg-black text-white hover:bg-zinc-800",
          "disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" ")}
      >
        {busy
          ? "Working..."
          : copy.action}
      </button>
    </div>
  );
}

function getSettingsCopy(
  state: ButtonState,
): {
  title: string;
  description: string;
  action: string;
} {
  switch (state) {
    case "enabled":
      return {
        title: "Push notifications are on",
        description:
          "UntapGo can notify this browser when important event activity happens.",
        action: "Disable",
      };

    case "blocked":
      return {
        title: "Notifications are blocked",
        description:
          "Allow notifications for this site from your browser settings, then return here.",
        action: "Blocked",
      };

    case "unsupported":
      return {
        title: "Push is not supported",
        description:
          "This browser or device does not support web push notifications.",
        action: "Unavailable",
      };

    case "error":
      return {
        title: "Push could not be configured",
        description:
          "Something interrupted registration. Try enabling notifications again.",
        action: "Try again",
      };

    case "loading":
      return {
        title: "Checking this device",
        description:
          "UntapGo is checking notification support and permission.",
        action: "Checking...",
      };

    case "ready":
    case "default":
    default:
      return {
        title: "Push notifications are off",
        description:
          "Enable alerts for requests, event changes, cancellations, and other important activity.",
        action: "Enable",
      };
  }
}

function getButtonTitle(
  state: ButtonState,
): string {
  switch (state) {
    case "enabled":
      return "Push notifications are enabled. Click to disable them on this device.";

    case "blocked":
      return "Notifications are blocked in your browser settings.";

    case "unsupported":
      return "Push notifications are not supported in this browser.";

    case "error":
      return "Push notifications could not be configured. Click to try again.";

    case "loading":
      return "Checking push notification support.";

    case "ready":
    case "default":
    default:
      return "Enable push notifications on this device.";
  }
}