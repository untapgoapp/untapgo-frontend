"use client";

import {
  useEffect,
} from "react";

import {
  getFirebaseMessagingClient,
} from "@/lib/firebase/client";
import { supabase } from "@/lib/supabase/client";
import { requestNotificationsRefresh } from "@/services/notifications";
import {
  ACTIVE_CONVERSATION_STORAGE_KEY,
  MESSAGING_REFRESH_REQUESTED_EVENT,
  conversationKey,
  type ConversationKind,
} from "@/lib/messaging";
import {
  clearLocalPushAfterSignOut,
  getPushBrowserState,
  registerFirebaseMessagingWorker,
  syncPushSubscription,
} from "@/services/push";

function shouldSyncPush(): boolean {
  return getPushBrowserState() === "enabled";
}

function isAuthenticationError(
  error: unknown,
): boolean {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const candidate =
      error as {
        status?: unknown;
        code?: unknown;
        message?: unknown;
      };

    if (
      Number(candidate.status) ===
      401
    ) {
      return true;
    }

    const code = String(
      candidate.code ?? "",
    ).toUpperCase();

    if (
      [
        "AUTH_INVALID",
        "INVALID_TOKEN",
        "MISSING_BEARER_TOKEN",
        "TOKEN_EXPIRED",
      ].some((value) =>
        code.includes(value),
      )
    ) {
      return true;
    }

    const message = String(
      candidate.message ?? "",
    );

    if (
      /auth invalid|invalid token|missing bearer token|jwt expired/i.test(
        message,
      )
    ) {
      return true;
    }
  }

  return false;
}

function isTransientNetworkError(
  error: unknown,
): boolean {
  if (!(error instanceof TypeError)) {
    return false;
  }

  return /failed to fetch|networkerror|load failed/i.test(
    error.message,
  );
}

export default function PwaBootstrap() {
  useEffect(() => {
    let disposed = false;
    let retryTimer: number | null = null;
    let syncPromise: Promise<void> | null = null;
    let unsubscribeMessage: (() => void) | undefined;
    let workerRegistration: ServiceWorkerRegistration | null = null;

    function clearRetryTimer() {
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
        retryTimer = null;
      }
    }

    async function hasValidatedSession(): Promise<boolean> {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !session
      ) {
        return false;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (
        !userError &&
        user &&
        user.id === session.user.id
      ) {
        return true;
      }

      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      return Boolean(
        !refreshError &&
        refreshedSession,
      );
    }

    function scheduleRetry(attempt: number) {
      if (
        disposed ||
        attempt > 3 ||
        retryTimer !== null
      ) {
        return;
      }

      const delay =
        Math.min(
          15000,
          2000 * 2 ** (attempt - 1),
        );

      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        void syncPushBestEffort(attempt);
      }, delay);
    }

    async function syncPushBestEffort(
      attempt = 1,
    ): Promise<void> {
      if (
        disposed ||
        !shouldSyncPush() ||
        !navigator.onLine
      ) {
        return;
      }

      if (syncPromise) {
        return syncPromise;
      }

      syncPromise = (async () => {
        try {
          const hasSession =
            await hasValidatedSession();

          if (
            disposed ||
            !hasSession
          ) {
            clearRetryTimer();
            return;
          }

          await syncPushSubscription();
          clearRetryTimer();
        } catch (error) {
          if (isAuthenticationError(error)) {
            clearRetryTimer();
            return;
          }

          if (isTransientNetworkError(error)) {
            scheduleRetry(attempt + 1);
            return;
          }

          console.warn(
            "UntapGo push token sync failed",
            error,
          );
        } finally {
          syncPromise = null;
        }
      })();

      return syncPromise;
    }

    async function start() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator)
      ) {
        return;
      }

      try {
        const registration =
          await registerFirebaseMessagingWorker();
        workerRegistration = registration;

        if (
          process.env.NODE_ENV ===
          "development"
        ) {
          console.debug(
            "UntapGo push diagnostic",
            {
              permission:
                Notification.permission,
              serviceWorkerActive:
                Boolean(
                  registration.active,
                ),
              scope:
                registration.scope,
            },
          );
        }
      } catch (error) {
        console.warn(
          "UntapGo service worker registration failed",
          error,
        );
        return;
      }

      await syncPushBestEffort();

      const messaging = await getFirebaseMessagingClient();

      if (!messaging || disposed) {
        return;
      }

      const { onMessage } = await import("firebase/messaging");

      unsubscribeMessage = onMessage(messaging, (payload) => {
        const conversationType = payload.data?.conversation_type as ConversationKind | undefined;
        const conversationId = payload.data?.conversation_id || "";
        const isMessagePush = Boolean(
          conversationId &&
          (conversationType === "direct" || conversationType === "trade" || conversationType === "playgroup")
        );

        if (isMessagePush) {
          window.dispatchEvent(new Event(MESSAGING_REFRESH_REQUESTED_EVENT));
        } else {
          requestNotificationsRefresh();
        }

        const activeKey = window.localStorage.getItem(ACTIVE_CONVERSATION_STORAGE_KEY);
        const sameOpenConversation = isMessagePush && activeKey === conversationKey(conversationType!, conversationId);

        // Foreground messages update the floating chat and Messages badge.
        // Background tabs still receive a system push.
        if (
          document.visibilityState !== "visible" &&
          !sameOpenConversation &&
          Notification.permission === "granted" &&
          workerRegistration
        ) {
          const title = payload.notification?.title || "UntapGo";
          const href = payload.data?.href || (isMessagePush ? "/messages" : "/notifications");
          void workerRegistration.showNotification(title, {
            body: payload.notification?.body || "You have new activity on UntapGo.",
            icon: "/icons/icon-192.png",
            badge: "/icons/badge-96.png",
            tag: payload.data?.notification_id || (isMessagePush ? `${conversationType}:${conversationId}` : undefined),
            data: { href },
          });
        }
      });
    }

    void start();

    function handleOnline() {
      void syncPushBestEffort();
    }

    window.addEventListener(
      "online",
      handleOnline,
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        clearRetryTimer();

        void clearLocalPushAfterSignOut().catch((error) => {
          console.warn(
            "UntapGo local push cleanup failed",
            error,
          );
        });

        return;
      }

      if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session
      ) {
        void syncPushBestEffort();
      }
    });

    return () => {
      disposed = true;
      clearRetryTimer();
      window.removeEventListener(
        "online",
        handleOnline,
      );
      unsubscribeMessage?.();
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
