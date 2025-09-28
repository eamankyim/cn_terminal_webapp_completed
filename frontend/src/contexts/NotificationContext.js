import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Load notifications
  const loadNotifications = async (page = 1, unreadOnly = false) => {
    try {
      console.log('🔄 NotificationContext: Loading notifications...', { page, unreadOnly });
      setLoading(true);
      const response = await notificationService.getNotifications(page, 20, unreadOnly);
      console.log('📡 NotificationContext: API response:', response);
      
      if (response.success) {
        console.log('✅ NotificationContext: Setting notifications:', response.data.notifications.length);
        setNotifications(response.data.notifications);
        setPagination(response.data.pagination);
        
        // Sync unread count after loading notifications
        setTimeout(() => {
          syncUnreadCount();
        }, 100);
      } else {
        console.error('❌ NotificationContext: API returned success: false', response);
        // If API fails, set empty state
        setNotifications([]);
        setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('❌ NotificationContext: Error loading notifications:', error);
      console.error('❌ NotificationContext: Error details:', error.response?.data || error.message);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.log('🔐 NotificationContext: Authentication error - token may be expired');
        // Clear notifications and unread count on auth error
        setNotifications([]);
        setUnreadCount(0);
        setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      console.log('🔄 NotificationContext: Loading unread count...');
      const response = await notificationService.getUnreadCount();
      console.log('📡 NotificationContext: Unread count response:', response);
      if (response.success) {
        console.log('✅ NotificationContext: Setting unread count:', response.data.count);
        setUnreadCount(response.data.count);
      } else {
        console.error('❌ NotificationContext: Unread count API returned success: false', response);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ NotificationContext: Error loading unread count:', error);
      console.error('❌ NotificationContext: Error details:', error.response?.data || error.message);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        console.log('🔐 NotificationContext: Authentication error on unread count - token may be expired');
        setUnreadCount(0);
      }
    }
  };

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
      console.error('Error marking notification as read:', error);
    }
  };

  // Delete all notifications
  const markAllAsRead = async () => {
    try {
      console.log('🔄 NotificationContext: Deleting all notifications...');
      console.log('🔄 NotificationContext: Current notifications count:', notifications.length);
      console.log('🔄 NotificationContext: Current unread count:', unreadCount);
      console.log('🔄 NotificationContext: WebSocket connected:', isConnected);
      
      const response = await notificationService.markAllAsRead();
      console.log('📡 NotificationContext: API response:', response);
      
      if (response.success) {
        console.log('✅ NotificationContext: API call successful, waiting for real-time updates...');
        
        // If WebSocket is not connected, update local state immediately as fallback
        if (!isConnected) {
          console.log('⚠️ NotificationContext: WebSocket not connected, updating local state as fallback');
          setNotifications([]);
          setUnreadCount(0);
          console.log('✅ NotificationContext: Local state updated immediately (WebSocket fallback)');
        } else {
          // If WebSocket is connected, set a timeout fallback in case real-time updates are delayed
          setTimeout(() => {
            console.log('⏰ NotificationContext: Timeout fallback - ensuring UI is updated');
            setNotifications([]);
            setUnreadCount(0);
            console.log('✅ NotificationContext: Local state updated via timeout fallback');
          }, 2000); // 2 second timeout
        }
        console.log('✅ NotificationContext: Delete all notifications completed');
      } else {
        console.error('❌ NotificationContext: API returned success: false', response);
      }
    } catch (error) {
      console.error('❌ NotificationContext: Error deleting all notifications:', error);
      console.error('❌ NotificationContext: Error details:', error.response?.data || error.message);
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
      console.error('Error deleting notification:', error);
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    console.log('🔄 NotificationContext: Manual refresh triggered');
    await Promise.all([
      loadNotifications(pagination.page),
      loadUnreadCount()
    ]);
  };

  // Sync unread count with actual notifications (fallback fix)
  const syncUnreadCount = () => {
    if (notifications && notifications.length > 0) {
      const actualUnreadCount = notifications.filter(n => !n.isRead).length;
      console.log('🔄 NotificationContext: Syncing unread count. API count:', unreadCount, 'Actual count:', actualUnreadCount);
      
      if (actualUnreadCount !== unreadCount) {
        console.log('⚠️ NotificationContext: Unread count mismatch detected, updating...');
        setUnreadCount(actualUnreadCount);
      }
    } else if (unreadCount > 0) {
      console.log('⚠️ NotificationContext: No notifications but unread count > 0, resetting...');
      setUnreadCount(0);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('🔌 NotificationContext: Initializing Socket.IO connection...');
      
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('🔌 NotificationContext: Socket.IO connected');
        setIsConnected(true);
        
        // Authenticate with user ID
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.id) {
          newSocket.emit('authenticate', user.id);
          console.log('👤 NotificationContext: Authenticated with user ID:', user.id);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 NotificationContext: Socket.IO disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ NotificationContext: Socket.IO connection error:', error);
        setIsConnected(false);
      });

      // Real-time notification events
      newSocket.on('new_notification', (notification) => {
        console.log('📡 NotificationContext: Received new notification:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      newSocket.on('unread_count_update', (data) => {
        console.log('📡 NotificationContext: Received unread count update:', data.count);
        setUnreadCount(data.count);
      });

      newSocket.on('notification_read_update', (data) => {
        console.log('📡 NotificationContext: Received read status update:', data);
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
        console.log('📡 NotificationContext: Received notification deletion:', data);
        setNotifications(prev => prev.filter(notification => notification.id !== data.notificationId));
      });

      newSocket.on('system_notification', (notification) => {
        console.log('📡 NotificationContext: Received system notification:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      setSocket(newSocket);

      return () => {
        console.log('🔌 NotificationContext: Cleaning up Socket.IO connection');
        newSocket.close();
      };
    }
  }, []);

  // Load initial data
  useEffect(() => {
    console.log('🔄 NotificationContext: Loading initial data...');
    loadNotifications();
    loadUnreadCount();
  }, []);

  // Set up fallback polling for when WebSocket is not available (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isConnected) {
        console.log('🔄 NotificationContext: WebSocket not connected, using polling fallback');
        loadUnreadCount();
      }
    }, 60000); // Reduced frequency since we have real-time updates

    return () => clearInterval(interval);
  }, [isConnected]);


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
