import { useEffect } from 'react';
import { AppState } from 'react-native';
import { focusManager, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useJobSocket } from './useJobSocket';
import { useNotificationSocket } from './useNotificationSocket';

/** Refresh on web events, reconnection via foreground, and a bounded polling fallback. */
export function DataSync() {
  const client = useQueryClient();
  const { user, status } = useAuth();
  const refresh = () => { void client.invalidateQueries(); };
  useJobSocket({ onJobCreated: refresh, onJobUpdated: refresh, onJobDeleted: refresh, onJobStatusUpdated: refresh, onJobCommentAdded: refresh });
  useNotificationSocket({ onNewNotification: refresh, onSystemNotification: refresh });
  useEffect(() => {
    if (status !== 'authenticated') return;
    const listener = AppState.addEventListener('change', state => {
      focusManager.setFocused(state === 'active');
      if (state === 'active') void client.invalidateQueries();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void client.invalidateQueries();
    }, 30_000);
    return () => { listener.remove(); clearInterval(timer); };
  }, [client, status, user?.id]);
  return null;
}
