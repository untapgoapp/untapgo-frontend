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
  getNotificationHref,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_CHANGED_EVENT,
  type NotificationItem,
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

  const [items, setItems] =
    useState<NotificationItem[]>(
      [],
    );

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

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

          setItems(result.items);
          setUnreadCount(
            result.unread_count,
          );
        } catch (loadError) {
          if (
            loadError instanceof
              ApiError &&
            loadError.status === 401
          ) {
            setAuthenticationState(
              "guest",
            );

            setItems([]);
            setUnreadCount(0);

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

    function handleNotificationsChanged() {
      void loadNotifications(
        true,
      );
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

        setItems(
          (currentItems) =>
            currentItems.map(
              (current) =>
                current.id ===
                notification.id
                  ? {
                      ...current,
                      is_read: true,
                    }
                  : current,
            ),
        );

        setUnreadCount(
          (current) =>
            Math.max(
              0,
              current - 1,
            ),
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

      setItems(
        (currentItems) =>
          currentItems.map(
            (notification) => ({
              ...notification,
              is_read: true,
            }),
          ),
      );

      setUnreadCount(0);
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
        className="relative grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white text-zinc-600 transition hover:border-black/20 hover:bg-black/[0.035] hover:text-black"
      >
        <Bell className="h-[18px] w-[18px]" />

        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-white bg-[#6E5AA7] px-1 text-[9px] font-black leading-none text-white">
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