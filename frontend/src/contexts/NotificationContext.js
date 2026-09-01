import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { notification as antdNotification } from 'antd';
import notificationService from '../services/notificationService';
import {
  playAssignmentAlarm,
  requestAlarmNotificationPermission,
  showAssignmentBrowserNotification,
  isJobAssignmentNotification,
  unlockAssignmentAlarm,
} from '../utils/assignmentAlarm';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Avoid badge flicker: only commit when the number actually changes
  const setUnreadCountSafe = useCallback((next) => {
    const value = typeof next === 'function' ? null : Math.max(0, Number(next) || 0);
    if (typeof next === 'function') {
      setUnreadCount((prev) => {
        const computed = Math.max(0, Number(next(prev)) || 0);
        return computed === prev ? prev : computed;
      });
      return;
    }
    setUnreadCount((prev) => (value === prev ? prev : value));
  }, []);

  const loadNotifications = useCallback(async (page = 1, unreadOnly = false) => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(page, 20, unreadOnly);

      if (response.success) {
        setNotifications(response.data.notifications || []);
        setPagination(response.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        });
      } else {
        setNotifications([]);
        setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
      }
    } catch (error) {
      if (error.response?.status === 401 || error.status === 401) {
        setNotifications([]);
        setUnreadCountSafe(0);
        setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [setUnreadCountSafe]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCountSafe(response.data.count);
      }
    } catch (error) {
      if (error.response?.status === 401 || error.status === 401) {
        setUnreadCountSafe(0);
      }
    }
  }, [setUnreadCountSafe]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );
        // Prefer server unread_count_update when available; optimistic fallback:
        setUnreadCountSafe((prev) => Math.max(0, prev - 1));
      }
    } catch (_) {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications([]);
        setUnreadCountSafe(0);
      }
    } catch (_) {
      // ignore
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      if (response.success) {
        setNotifications((prev) => {
          const target = prev.find((n) => n.id === notificationId);
          if (target && !target.isRead) {
            setUnreadCountSafe((count) => Math.max(0, count - 1));
          }
          return prev.filter((n) => n.id !== notificationId);
        });
      }
    } catch (_) {
      // ignore
    }
  };

  const refreshNotifications = useCallback(async () => {
    await Promise.all([loadNotifications(1), loadUnreadCount()]);
  }, [loadNotifications, loadUnreadCount]);

  // Initialize Socket.IO once
  useEffect(() => {
    const token = localStorage.getItem('cn_terminal_token');
    if (!token) return undefined;

    const socketUrl = process.env.REACT_APP_API_URL
      ? process.env.REACT_APP_API_URL.replace('/api', '')
      : 'http://localhost:5000';

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    const unlockAudio = () => unlockAssignmentAlarm();
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    newSocket.on('connect', () => {
      setIsConnected(true);
      const user = JSON.parse(localStorage.getItem('cn_terminal_user') || '{}');
      if (user.id) {
        newSocket.emit('authenticate', user.id);
      }
      requestAlarmNotificationPermission();
      // Re-sync authoritative count on reconnect
      loadUnreadCount();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', () => {
      setIsConnected(false);
    });

    // List updates only — unread badge comes from unread_count_update
    newSocket.on('new_notification', (incoming) => {
      if (!incoming?.id) return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === incoming.id)) return prev;
        return [incoming, ...prev];
      });

      if (isJobAssignmentNotification(incoming)) {
        playAssignmentAlarm();
        antdNotification.warning({
          message: incoming.title || 'Job assigned to you',
          description: incoming.message,
          duration: 8,
          placement: 'topRight',
        });
        showAssignmentBrowserNotification(
          incoming.title || 'Job assigned to you',
          incoming.message
        );
      }
    });

    newSocket.on('unread_count_update', (data) => {
      if (data && typeof data.count === 'number') {
        setUnreadCountSafe(data.count);
      }
    });

    newSocket.on('notification_read_update', (data) => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === data.notificationId
            ? { ...notification, isRead: data.isRead, readAt: data.readAt }
            : notification
        )
      );
    });

    newSocket.on('notification_deleted', (data) => {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== data.notificationId)
      );
      // Do not bump the badge here — bulk clear emits many deletes.
      // unread_count_update is the source of truth.
    });

    newSocket.on('notifications_cleared', () => {
      setNotifications([]);
      setUnreadCountSafe(0);
    });

    newSocket.on('system_notification', (notification) => {
      if (!notification?.id) return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) return prev;
        return [notification, ...prev];
      });
    });

    setSocket(newSocket);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      newSocket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- connect once per mount
  }, []);

  // Load once on mount (do not re-run when callback identities change)
  const didInitialLoad = useRef(false);
  useEffect(() => {
    if (didInitialLoad.current) return;
    didInitialLoad.current = true;
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // Poll unread count only when socket is down
  useEffect(() => {
    if (isConnected) return undefined;
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 60000);
    return () => clearInterval(interval);
  }, [isConnected, loadUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    pagination,
    socket,
    isConnected,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    // kept for API compatibility; no longer used to fight the badge
    syncUnreadCount: loadUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
