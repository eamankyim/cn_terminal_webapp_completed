import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/env';
import { useAuth } from '../context/AuthContext';

type NotificationSocketCallbacks = {
  onNewNotification?: (payload: any) => void;
  onUnreadCountUpdate?: (payload: any) => void;
  onNotificationReadUpdate?: (payload: any) => void;
  onNotificationDeleted?: (payload: any) => void;
  onNotificationsCleared?: (payload: any) => void;
  onSystemNotification?: (payload: any) => void;
};

let notificationSocket: Socket | null = null;

export function useNotificationSocket(callbacks: NotificationSocketCallbacks) {
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) return;

    const base = API_BASE_URL.replace('/api', '');
    notificationSocket =
      notificationSocket ??
      io(base, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

    notificationSocket.on('connect', () => {
      notificationSocket?.emit('authenticate', user.id);
    });

    if (callbacks.onNewNotification) {
      notificationSocket.on('new_notification', callbacks.onNewNotification);
    }
    if (callbacks.onUnreadCountUpdate) {
      notificationSocket.on(
        'unread_count_update',
        callbacks.onUnreadCountUpdate,
      );
    }
    if (callbacks.onNotificationReadUpdate) {
      notificationSocket.on(
        'notification_read_update',
        callbacks.onNotificationReadUpdate,
      );
    }
    if (callbacks.onNotificationDeleted) {
      notificationSocket.on(
        'notification_deleted',
        callbacks.onNotificationDeleted,
      );
    }
    if (callbacks.onNotificationsCleared) {
      notificationSocket.on(
        'notifications_cleared',
        callbacks.onNotificationsCleared,
      );
    }
    if (callbacks.onSystemNotification) {
      notificationSocket.on(
        'system_notification',
        callbacks.onSystemNotification,
      );
    }

    return () => {
      if (!notificationSocket) return;
      notificationSocket.off('new_notification');
      notificationSocket.off('unread_count_update');
      notificationSocket.off('notification_read_update');
      notificationSocket.off('notification_deleted');
      notificationSocket.off('notifications_cleared');
      notificationSocket.off('system_notification');
    };
  }, [callbacks, token, user]);
}

