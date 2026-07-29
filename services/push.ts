"use client";

import { api } from "@/lib/api";
import {
  getFirebaseMessagingClient,
} from "@/lib/firebase/client";

export const PUSH_STATE_CHANGED_EVENT =
  "untapgo:push-state-changed";

const DEVICE_ID_KEY = "untapgo:push-device-id";
const PUSH_ENABLED_KEY = "untapgo:push-enabled";

export type PushBrowserState =
  | "unsupported"
  | "blocked"
  | "default"
  | "ready"
  | "enabled";

type SavePushTokenResponse = {
  ok: boolean;
  device_id: string;
};

function emitPushStateChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(PUSH_STATE_CHANGED_EVENT),
  );
}

function isPushBrowserSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function createDeviceId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `web-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function getPushDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);

  if (existing) {
    return existing;
  }

  const created = createDeviceId();
  window.localStorage.setItem(DEVICE_ID_KEY, created);

  return created;
}

export function isPushEnabledOnThisDevice(): boolean {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem(PUSH_ENABLED_KEY) === "true"
  );
}

export function getPushBrowserState(): PushBrowserState {
  if (!isPushBrowserSupported()) {
    return "unsupported";
  }

  if (Notification.permission === "denied") {
    return "blocked";
  }

  if (Notification.permission === "default") {
    return "default";
  }

  return isPushEnabledOnThisDevice()
    ? "enabled"
    : "ready";
}

export async function registerFirebaseMessagingWorker(): Promise<
  ServiceWorkerRegistration
> {
  if (!isPushBrowserSupported()) {
    throw new Error(
      "Push notifications are not supported in this browser.",
    );
  }

  return navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
    {
      scope: "/",
      updateViaCache: "none",
    },
  );
}

async function saveCurrentToken(
  token: string,
): Promise<SavePushTokenResponse> {
  return api.post<SavePushTokenResponse>("/me/push-token", {
    token,
    platform: "web",
    device_id: getPushDeviceId(),
    app_version:
      process.env.NEXT_PUBLIC_APP_VERSION || "web",
  });
}

async function deleteFirebaseTokenBestEffort(): Promise<void> {
  const messaging = await getFirebaseMessagingClient();

  if (!messaging) {
    return;
  }

  const { deleteToken } = await import("firebase/messaging");

  try {
    await deleteToken(messaging);
  } catch (error) {
    console.warn(
      "Could not delete the local Firebase messaging token",
      error,
    );
  }
}

export async function syncPushSubscription(): Promise<boolean> {
  if (
    !isPushBrowserSupported() ||
    Notification.permission !== "granted"
  ) {
    return false;
  }

  const registration = await registerFirebaseMessagingWorker();
  const messaging = await getFirebaseMessagingClient();

  if (!messaging) {
    return false;
  }

  const { getToken } = await import("firebase/messaging");
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  if (!vapidKey) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY");
  }

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Firebase did not return a push token.");
  }

  await saveCurrentToken(token);
  window.localStorage.setItem(PUSH_ENABLED_KEY, "true");
  emitPushStateChanged();

  return true;
}

export async function enablePushNotifications(): Promise<boolean> {
  if (!isPushBrowserSupported()) {
    throw new Error(
      "Push notifications are not supported in this browser.",
    );
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    emitPushStateChanged();
    return false;
  }

  return syncPushSubscription();
}

export async function disablePushNotifications(): Promise<void> {
  if (!isPushBrowserSupported()) {
    return;
  }

  const deviceId = getPushDeviceId();
  let serverError: unknown = null;

  await deleteFirebaseTokenBestEffort();

  try {
    await api.delete<{ ok: boolean; deleted: number }>(
      `/me/push-token?device_id=${encodeURIComponent(deviceId)}`,
    );
  } catch (error) {
    serverError = error;
  } finally {
    window.localStorage.removeItem(PUSH_ENABLED_KEY);
    emitPushStateChanged();
  }

  if (serverError) {
    throw serverError;
  }
}

export async function clearLocalPushAfterSignOut(): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  if (isPushBrowserSupported()) {
    await deleteFirebaseTokenBestEffort();
  }

  window.localStorage.removeItem(PUSH_ENABLED_KEY);
  emitPushStateChanged();
}