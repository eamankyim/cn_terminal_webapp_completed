import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook for listening to job-related Socket.io events
 * @param {Function} onJobCreated - Callback when a job is created
 * @param {Function} onJobUpdated - Callback when a job is updated
 * @param {Function} onJobDeleted - Callback when a job is deleted
 * @param {Function} onJobStatusUpdated - Callback when a job status is updated
 * @param {Function} onJobCommentAdded - Callback when a comment is added to a job
 */
export const useJobSocket = ({
  onJobCreated,
  onJobUpdated,
  onJobDeleted,
  onJobStatusUpdated,
  onJobCommentAdded
}) => {
  const socketRef = useRef(null);
  const callbacksRef = useRef({
    onJobCreated,
    onJobUpdated,
    onJobDeleted,
    onJobStatusUpdated,
    onJobCommentAdded
  });

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = {
      onJobCreated,
      onJobUpdated,
      onJobDeleted,
      onJobStatusUpdated,
      onJobCommentAdded
    };
  }, [onJobCreated, onJobUpdated, onJobDeleted, onJobStatusUpdated, onJobCommentAdded]);

  useEffect(() => {
    const token = localStorage.getItem('cn_terminal_token');
    if (!token) {
      return;
    }

    // Socket.IO connects to base URL (remove /api if present)
    const socketUrl = process.env.REACT_APP_API_URL 
      ? process.env.REACT_APP_API_URL.replace('/api', '')
      : 'http://localhost:5000';

    const socket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('📡 [JobSocket] Connected to server');
      
      // Authenticate with user ID
      const user = JSON.parse(localStorage.getItem('cn_terminal_user') || '{}');
      if (user.id) {
        socket.emit('authenticate', user.id);
      }
    });

    socket.on('disconnect', () => {
      console.log('📡 [JobSocket] Disconnected from server');
    });

    socket.on('connect_error', (error) => {
      console.error('📡 [JobSocket] Connection error:', error);
    });

    // Job event listeners
    socket.on('job:created', (data) => {
      console.log('📡 [JobSocket] Job created:', data);
      if (callbacksRef.current.onJobCreated) {
        callbacksRef.current.onJobCreated(data.job);
      }
    });

    socket.on('job:updated', (data) => {
      console.log('📡 [JobSocket] Job updated:', data);
      if (callbacksRef.current.onJobUpdated) {
        callbacksRef.current.onJobUpdated(data.job);
      }
    });

    socket.on('job:deleted', (data) => {
      console.log('📡 [JobSocket] Job deleted:', data);
      if (callbacksRef.current.onJobDeleted) {
        callbacksRef.current.onJobDeleted(data.jobId);
      }
    });

    socket.on('job:status-updated', (data) => {
      console.log('📡 [JobSocket] Job status updated:', data);
      if (callbacksRef.current.onJobStatusUpdated) {
        callbacksRef.current.onJobStatusUpdated(data.job);
      }
    });

    socket.on('job:comment-added', (data) => {
      console.log('📡 [JobSocket] Job comment added:', data);
      if (callbacksRef.current.onJobCommentAdded) {
        callbacksRef.current.onJobCommentAdded(data.jobId, data.comment);
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('📡 [JobSocket] Cleaning up socket connection');
      socket.disconnect();
    };
  }, []); // Empty dependency array - only run once on mount

  return socketRef.current;
};

