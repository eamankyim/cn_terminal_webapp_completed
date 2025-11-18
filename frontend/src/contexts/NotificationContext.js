import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import notificationService from '../services/notificationService';

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

  const syncUnreadCount = useCallback(() => {
    if (notifications && notifications.length > 0) {
      const actualUnreadCount = notifications.filter(n => !n.isRead).length;
      if (actualUnreadCount !== unreadCount) {
        setUnreadCount(actualUnreadCount);
      }
    } else if (unreadCount > 0) {
      setUnreadCount(0);
    }
  }, [notifications, unreadCount]);

  // Load notifications
  const loadNotifications = useCallback(async (page = 1, unreadOnly = false) => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(page, 20, unreadOnly);
      
      if (response.success) {
        setNotifications(response.data.notifications);
        setPagination(response.data.pagination);
        
        // Sync unread count after loading notifications
        setTimeout(() => {
          syncUnreadCount();
        }, 100);
      } else {
        // If API fails, set empty state
        setNotifications([]);
        setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
      }
    } catch (error) {
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        // Clear notifications and unread count on auth error
        setNotifications([]);
        setUnreadCount(0);
        setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [syncUnreadCount]);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.count);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        setUnreadCount(0);
      }
    }
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
    }
  };

  // Delete all notifications
  const markAllAsRead = async () => {
    try {

      const response = await notificationService.markAllAsRead();

      if (response.success) {

        // If WebSocket is not connected, update local state immediately as fallback
        if (!isConnected) {

          setNotifications([]);
          setUnreadCount(0);

        } else {
          // If WebSocket is connected, set a timeout fallback in case real-time updates are delayed
          setTimeout(() => {

            setNotifications([]);
            setUnreadCount(0);

          }, 2000); // 2 second timeout
        }

      } else {

      }
    } catch (error) {

    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await notificationService.deleteNotification(notificationId);
      if (response.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        // Check if the deleted notification was unread
        const deletedNotification = notifications.find(n => n.id === notificationId);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {

    }
  };

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await Promise.all([
      loadNotifications(pagination.page),
      loadUnreadCount()
    ]);
  }, [loadNotifications, loadUnreadCount, pagination.page]);

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('cn_terminal_token');
    if (token) {
      console.log('🔷 [NotificationContext] Initializing Socket.IO connection');
      // Socket.IO connects to base URL (remove /api if present)
      const socketUrl = process.env.REACT_APP_API_URL 
        ? process.env.REACT_APP_API_URL.replace('/api', '')
        : 'http://localhost:5000';

      console.log('  - Socket URL:', socketUrl);
      const newSocket = io(socketUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ [NotificationContext] Socket.IO connected');
        setIsConnected(true);
        
        // Authenticate with user ID
        const user = JSON.parse(localStorage.getItem('cn_terminal_user') || '{}');
        console.log('  - Authenticating user:', user.id);
        if (user.id) {
          newSocket.emit('authenticate', user.id);
          console.log('  - Authentication sent');
        } else {
          console.warn('  ⚠️ No user ID found in localStorage');
        }
      });

      newSocket.on('disconnect', () => {
        console.log('❌ [NotificationContext] Socket.IO disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ [NotificationContext] Socket.IO connection error:', error);
        setIsConnected(false);
      });

      // Real-time notification events
      newSocket.on('new_notification', (notification) => {
        console.log('🔔 [NotificationContext] New notification received:', notification);
        setNotifications(prev => {
          // Check if notification already exists to prevent duplicates
          const exists = prev.some(n => n.id === notification.id);
          if (exists) {
            console.log('  - Notification already exists, skipping');
            return prev;
          }
          console.log('  - Adding notification to list');
          return [notification, ...prev];
        });
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log('  - Unread count updated:', newCount);
          return newCount;
        });
      });

      newSocket.on('unread_count_update', (data) => {
        console.log('🔔 [NotificationContext] Unread count update received:', data.count);
        setUnreadCount(data.count);
      });

      newSocket.on('notification_read_update', (data) => {
        console.log('🔔 [NotificationContext] Notification read update received:', data);
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === data.notificationId 
              ? { ...notification, isRead: data.isRead, readAt: data.readAt }
              : notification
          )
        );
        
        // If this is part of a "mark all as read" operation, we'll get multiple updates
        // The unread count will be updated separately
      });

      newSocket.on('notification_deleted', (data) => {
        console.log('🔔 [NotificationContext] Notification deleted:', data.notificationId);
        setNotifications(prev => {
          const filtered = prev.filter(notification => notification.id !== data.notificationId);
          console.log('  - Notifications after deletion:', filtered.length);
          return filtered;
        });
        // Update unread count after deletion
        setUnreadCount(prev => Math.max(0, prev - 1));
      });

      newSocket.on('system_notification', (notification) => {
        console.log('🔔 [NotificationContext] System notification received:', notification);
        setNotifications(prev => {
          // Check if notification already exists to prevent duplicates
          const exists = prev.some(n => n.id === notification.id);
          if (exists) {
            console.log('  - System notification already exists, skipping');
            return prev;
          }
          console.log('  - Adding system notification to list');
          return [notification, ...prev];
        });
        setUnreadCount(prev => {
          const newCount = prev + 1;
          console.log('  - Unread count updated:', newCount);
          return newCount;
        });
      });

      setSocket(newSocket);

      return () => {

        newSocket.close();
      };
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  // Set up fallback polling for when WebSocket is not available (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isConnected) {

        loadUnreadCount();
      }
    }, 60000); // Reduced frequency since we have real-time updates

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
    syncUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
