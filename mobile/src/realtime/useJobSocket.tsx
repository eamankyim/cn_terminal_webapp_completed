import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/env';
import { useAuth } from '../context/AuthContext';

type JobSocketCallbacks = {
  onJobCreated?: (payload: any) => void;
  onJobUpdated?: (payload: any) => void;
  onJobDeleted?: (payload: any) => void;
  onJobStatusUpdated?: (payload: any) => void;
  onJobCommentAdded?: (payload: any) => void;
};

export function useJobSocket(callbacks: JobSocketCallbacks) {
  const { user, token } = useAuth();
  const latest = useRef(callbacks);
  latest.current = callbacks;
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !token) return;
    const socket = io(API_BASE_URL.replace(/\/api\/?$/, ''), {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socket.on('connect', () => socket.emit('authenticate', userId));
    socket.on('job:created', payload => latest.current.onJobCreated?.(payload));
    socket.on('job:updated', payload => latest.current.onJobUpdated?.(payload));
    socket.on('job:deleted', payload => latest.current.onJobDeleted?.(payload));
    socket.on('job:status-updated', payload => latest.current.onJobStatusUpdated?.(payload));
    socket.on('job:comment-added', payload => latest.current.onJobCommentAdded?.(payload));
    return () => { socket.disconnect(); };
  }, [token, userId]);
}
