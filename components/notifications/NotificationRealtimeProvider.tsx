"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import NotificationToastViewport from "./NotificationToastViewport";
import {
  useNotificationRealtimeChannel,
  type NotificationConnectionState,
} from "./useNotificationRealtimeChannel";
import {
  applyNotificationChange,
  mergeNotificationPage,
  type NotificationChange,
} from "@/lib/notification-live";
import { supabase } from "@/lib/supabase/client";
import {
  deleteNotification as deleteNotificationRequest,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_REFRESH_REQUESTED_EVENT,
  type NotificationItem,
  type NotificationListResponse,
} from "@/services/notifications";

type NotificationContextValue = NotificationListResponse & {
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  connection: NotificationConnectionState;
  refresh: () => Promise<void>;
  markRead: (notification: NotificationItem) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (notification: NotificationItem) => Promise<void>;
};

const emptyState: NotificationListResponse = { unread_count: 0, items: [] };
const noop = async () => {};
const NotificationContext = createContext<NotificationContextValue>({
  ...emptyState,
  authenticated: false,
  loading: true,
  error: null,
  connection: "idle",
  refresh: noop,
  markRead: noop,
  markAllRead: noop,
  deleteNotification: noop,
});

export function useNotifications(): NotificationContextValue {
  return useContext(NotificationContext);
}

export default function NotificationRealtimeProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [state, setState] = useState(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const knownIds = useRef(new Set<string>());
  const toastedIds = useRef(new Set<string>());
  const userId = session?.user.id ?? null;

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const latest = await listNotifications({ limit: 200 });
      for (const item of latest.items) knownIds.current.add(item.id);
      setState((current) => mergeNotificationPage(current, latest));
      setError(null);
    } catch {
      setError("Notifications could not be refreshed.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleChange = useCallback((change: NotificationChange) => {
    if (change.kind === "created") {
      const isNew = !knownIds.current.has(change.notification.id);
      knownIds.current.add(change.notification.id);
      if (isNew && !toastedIds.current.has(change.notification.id)) {
        toastedIds.current.add(change.notification.id);
        setToasts((current) => [...current, change.notification].slice(-3));
      }
    } else if (change.kind === "updated") {
      knownIds.current.add(change.notification.id);
    } else if (change.kind === "deleted") {
      knownIds.current.delete(change.notificationId);
    }
    setState((current) => applyNotificationChange(current, change));
  }, []);

  const channelHandlers = useMemo(() => ({
    onChange: handleChange,
    onReconnect: () => { void refresh(); },
  }), [handleChange, refresh]);
  const connection = useNotificationRealtimeChannel(session, channelHandlers);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setAuthReady(true);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) {
        setSession(next);
        setAuthReady(true);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    knownIds.current.clear();
    toastedIds.current.clear();
    setToasts([]);
    setState(emptyState);
    setError(null);
    setLoading(Boolean(userId));
    if (userId) void refresh();
  }, [authReady, refresh, userId]);

  useEffect(() => {
    const requestRefresh = () => { void refresh(); };
    window.addEventListener(NOTIFICATIONS_REFRESH_REQUESTED_EVENT, requestRefresh);
    return () => window.removeEventListener(NOTIFICATIONS_REFRESH_REQUESTED_EVENT, requestRefresh);
  }, [refresh]);

  const markRead = useCallback(async (notification: NotificationItem) => {
    const result = await markNotificationRead(notification.id);
    const updated = result.notification ?? { ...notification, is_read: true };
    handleChange({ kind: "updated", notification: updated });
  }, [handleChange]);

  const markAllRead = useCallback(async () => {
    const result = await markAllNotificationsRead();
    handleChange({ kind: "mark_all_read", updated: result.updated });
  }, [handleChange]);

  const deleteNotification = useCallback(async (notification: NotificationItem) => {
    const result = await deleteNotificationRequest(notification.id);
    if (result.deleted) handleChange({ kind: "deleted", notificationId: notification.id });
  }, [handleChange]);

  const value = useMemo<NotificationContextValue>(() => ({
    ...state,
    authenticated: Boolean(session),
    loading: !authReady || loading,
    error,
    connection,
    refresh,
    markRead,
    markAllRead,
    deleteNotification,
  }), [authReady, connection, deleteNotification, error, loading, markAllRead, markRead, refresh, session, state]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToastViewport notifications={toasts} onDismiss={dismiss} onMarkRead={markRead} />
    </NotificationContext.Provider>
  );
}
