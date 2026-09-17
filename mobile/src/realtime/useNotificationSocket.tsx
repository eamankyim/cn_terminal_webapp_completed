import { useEffect, useRef } from 'react';
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
let subscribers = 0;
let socketIdentity = "";

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

  const latest = useRef(callbacks);
  latest.current = callbacks;
  const userId = user?.id;
  useEffect(() => {
    if (!userId || !token) return;
    const identity = `${userId}:${token}`;
    if (socketIdentity !== identity) {
      notificationSocket?.disconnect();
      notificationSocket = null;
      socketIdentity = identity;
      subscribers = 0;
    }
    if (!notificationSocket) {
      notificationSocket = io(API_BASE_URL.replace(/\/api\/?$/, ''), {
        auth: { token }, transports: ['websocket', 'polling'],
      });
      const connected = notificationSocket;
      connected.on('connect', () => connected.emit('authenticate', userId));
      connected.on('new_notification', playJobAssignmentAlarm);
    }
    const connected = notificationSocket;
    subscribers += 1;
    const events: Record<string, keyof NotificationSocketCallbacks> = {
      new_notification: 'onNewNotification',
      unread_count_update: 'onUnreadCountUpdate',
      notification_read_update: 'onNotificationReadUpdate',
      notification_deleted: 'onNotificationDeleted',
      notifications_cleared: 'onNotificationsCleared',
      system_notification: 'onSystemNotification',
    };
    const listeners = Object.entries(events).map(([event, key]) => {
      const listener = (payload: unknown) => latest.current[key]?.(payload);
      connected.on(event, listener);
      return { event, listener };
    });
    return () => {
      listeners.forEach(({ event, listener }) => connected.off(event, listener));
      if (connected !== notificationSocket) return;
      subscribers -= 1;
      if (subscribers === 0) {
        connected.disconnect();
        notificationSocket = null;
        socketIdentity = '';
      }
    };
  }, [token, userId]);
}
