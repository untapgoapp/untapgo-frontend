"use client";

import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import type { Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function assertFirebaseClientConfig(): void {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase browser configuration: ${missing.join(", ")}`,
    );
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY");
  }
}

export function getFirebaseClientApp(): FirebaseApp {
  assertFirebaseClientConfig();

  return getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);
}

export async function getFirebaseMessagingClient(): Promise<
  Messaging | null
> {
  if (typeof window === "undefined") {
    return null;
  }

  assertFirebaseClientConfig();

  const { getMessaging, isSupported } = await import(
    "firebase/messaging"
  );

  if (!(await isSupported())) {
    return null;
  }

  return getMessaging(getFirebaseClientApp());
}