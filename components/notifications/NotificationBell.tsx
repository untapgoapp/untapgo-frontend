"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  Bell,
} from "lucide-react";

import NotificationsPanel from "@/components/notifications/NotificationsPanel";
import {
  ApiError,
} from "@/lib/api";
import {
  applyNotificationChange,
  type NotificationChange,
} from "@/lib/notification-live";
import {
  getNotificationHref,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_CHANGED_EVENT,
  type NotificationItem,
  type NotificationListResponse,
} from "@/services/notifications";

type AuthenticationState =
  | "checking"
  | "authenticated"
  | "guest";

export default function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();

  const wrapperRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const [open, setOpen] =
    useState(false);

  const [
    authenticationState,
    setAuthenticationState,
  ] =
    useState<AuthenticationState>(
      "checking",
    );

  const [notificationState, setNotificationState] =
    useState<NotificationListResponse>({ unread_count: 0, items: [] });
  const items = notificationState.items;
  const unreadCount = notificationState.unread_count;

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const [
    busyNotificationId,
    setBusyNotificationId,
  ] = useState<string | null>(
    null,
  );

  const [
    markingAllRead,
    setMarkingAllRead,
  ] = useState(false);

  const loadNotifications =
    useCallback(
      async (
        silent = false,
      ) => {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        try {
          const result =
            await listNotifications({
              limit: 8,
            });

          setAuthenticationState(
            "authenticated",
          );

          setNotificationState(result);
        } catch (loadError) {
          if (
            loadError instanceof
              ApiError &&
            loadError.status === 401
          ) {
            setAuthenticationState(
              "guest",
            );

            setNotificationState({ unread_count: 0, items: [] });

            return;
          }

          setAuthenticationState(
            "authenticated",
          );

          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load notifications.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    void loadNotifications();

    const interval =
      window.setInterval(() => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          void loadNotifications(
            true,
          );
        }
      }, 30_000);

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void loadNotifications(
          true,
        );
      }
    }

    function handleNotificationsChanged(event: Event) {
      const detail = (event as CustomEvent<NotificationChange>).detail;
      if (!detail || detail.kind === "refresh") {
        void loadNotifications(true);
        return;
      }
      setNotificationState((current) => applyNotificationChange(
        current,
        detail,
        { limit: 8 },
      ));
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    window.addEventListener(
      NOTIFICATIONS_CHANGED_EVENT,
      handleNotificationsChanged,
    );

    return () => {
      window.clearInterval(
        interval,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      window.removeEventListener(
        NOTIFICATIONS_CHANGED_EVENT,
        handleNotificationsChanged,
      );
    };
  }, [loadNotifications]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleMouseDown(
      mouseEvent: MouseEvent,
    ) {
      const target =
        mouseEvent.target;

      if (
        !(target instanceof Node)
      ) {
        return;
      }

      if (
        !wrapperRef.current?.contains(
          target,
        )
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(
      keyboardEvent: KeyboardEvent,
    ) {
      if (
        keyboardEvent.key ===
        "Escape"
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleMouseDown,
    );

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleMouseDown,
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [open]);

  async function handleOpenNotification(
    notification: NotificationItem,
  ) {
    if (
      busyNotificationId
    ) {
      return;
    }

    setBusyNotificationId(
      notification.id,
    );

    try {
      if (
        !notification.is_read
      ) {
        await markNotificationRead(
          notification.id,
        );
      }

      setOpen(false);

      router.push(
        getNotificationHref(
          notification,
        ),
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Could not open notification.",
      );
    } finally {
      setBusyNotificationId(
        null,
      );
    }
  }

  async function handleMarkAllRead() {
    if (
      markingAllRead ||
      unreadCount === 0
    ) {
      return;
    }

    setMarkingAllRead(true);
    setError(null);

    try {
      await markAllNotificationsRead();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Could not mark notifications as read.",
      );
    } finally {
      setMarkingAllRead(false);
    }
  }

  if (
    authenticationState ===
    "guest"
  ) {
    return null;
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      <button
        type="button"
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        aria-expanded={open}
        onClick={() => {
          const nextOpen =
            !open;

          setOpen(nextOpen);

          if (nextOpen) {
            void loadNotifications(
              true,
            );
          }
        }}
        className="relative grid h-10 w-10 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-secondary/65 hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/15"
      >
        <Bell className="h-[18px] w-[18px]" />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-surface bg-primary px-1 text-[9px] font-black leading-none text-primary-foreground">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <NotificationsPanel
          items={items}
          unreadCount={
            unreadCount
          }
          loading={
            loading &&
            items.length === 0
          }
          refreshing={
            refreshing
          }
          error={error}
          busyNotificationId={
            busyNotificationId
          }
          markingAllRead={
            markingAllRead
          }
          onClose={() => {
            setOpen(false);
          }}
          onRefresh={() => {
            void loadNotifications(
              true,
            );
          }}
          onMarkAllRead={() => {
            void handleMarkAllRead();
          }}
          onOpenNotification={(
            notification,
          ) => {
            void handleOpenNotification(
              notification,
            );
          }}
        />
      ) : null}
    </div>
  );
}
