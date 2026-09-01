import { useEffect } from 'react';
import { Alert, Vibration } from 'react-native';
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
let assignmentAlarmBound = false;

function isJobAssignmentNotification(payload: any) {
  return (
    payload?.category === 'JOB_ASSIGNMENT' ||
    payload?.metadata?.playAlarm === true
  );
}

function playJobAssignmentAlarm(payload: any) {
  if (!isJobAssignmentNotification(payload)) return;
  Vibration.vibrate([0, 500, 180, 500, 180, 500, 180, 800]);
  Alert.alert(
    payload.title || 'Job assigned to you',
    payload.message || 'A job has been assigned to you',
  );
}

export function useNotificationSocket(callbacks: NotificationSocketCallbacks) {
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) return;

    const base = API_BASE_URL.replace('/api', '');
    if (!notificationSocket) {
      notificationSocket = io(base, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
    }

    if (!assignmentAlarmBound) {
      assignmentAlarmBound = true;
      notificationSocket.on('new_notification', playJobAssignmentAlarm);
    }

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
      if (callbacks.onNewNotification) {
        notificationSocket.off('new_notification', callbacks.onNewNotification);
      }
      if (callbacks.onUnreadCountUpdate) {
        notificationSocket.off(
          'unread_count_update',
          callbacks.onUnreadCountUpdate,
        );
      }
      if (callbacks.onNotificationReadUpdate) {
        notificationSocket.off(
          'notification_read_update',
          callbacks.onNotificationReadUpdate,
        );
      }
      if (callbacks.onNotificationDeleted) {
        notificationSocket.off(
          'notification_deleted',
          callbacks.onNotificationDeleted,
        );
      }
      if (callbacks.onNotificationsCleared) {
        notificationSocket.off(
          'notifications_cleared',
          callbacks.onNotificationsCleared,
        );
      }
      if (callbacks.onSystemNotification) {
        notificationSocket.off(
          'system_notification',
          callbacks.onSystemNotification,
        );
      }
    };
  }, [callbacks, token, user]);
}


