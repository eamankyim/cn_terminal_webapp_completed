import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/env';
import { useAuth } from '../context/AuthContext';

type JobSocketCallbacks = {
  onJobCreated?: (payload: any) => void;
  onJobUpdated?: (payload: any) => void;
  onJobDeleted?: (payload: any) => void;
  onJobStatusUpdated?: (payload: any) => void;
  onJobCommentAdded?: (payload: any) => void;
};

let socket: Socket | null = null;

export function useJobSocket(callbacks: JobSocketCallbacks) {
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user || !token) return;

    const base = API_BASE_URL.replace('/api', '');
    socket =
      socket ??
      io(base, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

    socket.on('connect', () => {
      socket?.emit('authenticate', user.id);
    });

    if (callbacks.onJobCreated) {
      socket.on('job:created', callbacks.onJobCreated);
    }
    if (callbacks.onJobUpdated) {
      socket.on('job:updated', callbacks.onJobUpdated);
    }
    if (callbacks.onJobDeleted) {
      socket.on('job:deleted', callbacks.onJobDeleted);
    }
    if (callbacks.onJobStatusUpdated) {
      socket.on('job:status-updated', callbacks.onJobStatusUpdated);
    }
    if (callbacks.onJobCommentAdded) {
      socket.on('job:comment-added', callbacks.onJobCommentAdded);
    }

    return () => {
      if (!socket) return;
      socket.off('job:created');
      socket.off('job:updated');
      socket.off('job:deleted');
      socket.off('job:status-updated');
      socket.off('job:comment-added');
    };
  }, [callbacks, token, user]);
}

