import React, { useState } from 'react';
import { Badge, Dropdown, List, Button, Empty, Spin, Typography, Space, Tag } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, MoreOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNotifications } from '../../contexts/NotificationContext';

const { Text } = Typography;

// Simple time formatting function
const formatTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
};

const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    loading,
    socket,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications,
    refreshNotifications,
    syncUnreadCount
  } = useNotifications();

  // Debug logging
  console.log('🔔 NotificationBell: Render data:', {
    notificationsCount: notifications?.length || 0,
    unreadCount,
    loading,
    notifications: notifications?.slice(0, 2), // Log first 2 notifications
    actualUnreadCount: notifications?.filter(n => !n.isRead).length || 0
  });

  // Sync unread count when dropdown opens
  const handleDropdownVisibleChange = (visible) => {
    setDropdownVisible(visible);
    if (visible) {
      console.log('🔔 NotificationBell: Dropdown opened, syncing unread count...');
      syncUnreadCount();
    }
  };


  const [dropdownVisible, setDropdownVisible] = useState(false);

  const getNotificationIcon = (type) => {
    const iconMap = {
      'INFO': '•',
      'SUCCESS': '•',
      'WARNING': '•',
      'ERROR': '•',
      'URGENT': '•'
    };
    return iconMap[type] || '•';
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      'INFO': '#1890ff',
      'SUCCESS': '#52c41a',
      'WARNING': '#faad14',
      'ERROR': '#ff4d4f',
      'URGENT': '#722ed1'
    };
    return colorMap[type] || '#1890ff';
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setDropdownVisible(false);
  };

  const handleMarkAllRead = async () => {
    console.log('🔔 NotificationBell: Clear all button clicked');
    console.log('🔔 NotificationBell: Current notifications:', notifications.length);
    console.log('🔔 NotificationBell: Current unread count:', unreadCount);
    
    if (notifications.length === 0) {
      console.log('⚠️  No notifications to delete');
      return;
    }
    
    try {
      console.log('🔄 NotificationBell: Calling markAllAsRead function...');
      await markAllAsRead();
      console.log('✅ NotificationBell: markAllAsRead completed');
      
      // Close the dropdown to show the updated state
      setDropdownVisible(false);
    } catch (error) {
      console.error('❌ NotificationBell: Error deleting all notifications:', error);
      // Keep dropdown open so user can see the error
    }
  };

  const handleRefresh = async () => {
    try {
      console.log('🔄 Refreshing notifications...');
      console.log('🔔 NotificationBell: Before refresh - notifications:', notifications?.length, 'unread:', unreadCount);
      await refreshNotifications();
      console.log('✅ Notifications refreshed');
      console.log('🔔 NotificationBell: After refresh - notifications:', notifications?.length, 'unread:', unreadCount);
    } catch (error) {
      console.error('❌ Error refreshing notifications:', error);
    }
  };

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const notificationItems = [
    {
      key: 'header',
      label: (
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fafafa'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text strong style={{ fontSize: '16px', color: '#262626' }}>Notifications</Text>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: isConnected ? '#52c41a' : '#ff4d4f',
              opacity: isConnected ? 1 : 0.6
            }} 
            title={isConnected ? 'Real-time connected' : 'Real-time disconnected (using polling)'}
            />
          </div>
          <Space size="small">
        <Button 
          type="link" 
          size="small" 
          onClick={handleRefresh}
          icon={<ReloadOutlined />}
          title="Refresh notifications"
        />
            <Button 
              type="link" 
              size="small" 
              onClick={handleMarkAllRead}
              disabled={notifications.length === 0}
              title={notifications.length === 0 ? "No notifications to delete" : `Delete all ${notifications.length} notifications`}
              style={{
                opacity: notifications.length === 0 ? 0.5 : 1,
                cursor: notifications.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Clear all {notifications.length > 0 && `(${notifications.length})`}
            </Button>
          </Space>
        </div>
      ),
      type: 'group'
    },
    ...(notifications || []).slice(0, 10).map(notification => ({
        key: notification.id,
        label: (
        <div 
          style={{ 
            padding: '12px',
            cursor: 'pointer',
            backgroundColor: notification.isRead ? '#fafafa' : '#f0f8ff',
            borderLeft: notification.isRead ? 'none' : `3px solid ${getNotificationColor(notification.type)}`,
            position: 'relative',
            transition: 'all 0.2s ease',
            borderBottom: '1px solid #f0f0f0'
          }}
          onClick={() => handleNotificationClick(notification)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = notification.isRead ? '#f5f5f5' : '#e6f7ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = notification.isRead ? '#fafafa' : '#f0f8ff';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: getNotificationColor(notification.type),
              marginTop: '6px',
              flexShrink: 0
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '4px'
              }}>
                <Text 
                  strong={!notification.isRead}
                  style={{ 
                    fontSize: '14px',
                    color: notification.isRead ? '#666' : '#262626',
                    lineHeight: '1.4'
                  }}
                >
                  {notification.title}
                </Text>
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => handleDelete(notification.id, e)}
                  style={{ 
                    opacity: 0.6,
                    padding: '0 4px',
                    height: '20px'
                  }}
                />
              </div>
              <Text 
                style={{ 
                  fontSize: '13px',
                  color: notification.isRead ? '#8c8c8c' : '#595959',
                  display: 'block',
                  marginBottom: '6px',
                  lineHeight: '1.4'
                }}
              >
                {notification.message}
              </Text>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  {formatTimeAgo(notification.createdAt)}
                </Text>
                {notification.job && (
                  <Tag size="small" color="#1890ff" style={{ fontSize: '11px' }}>
                    {notification.job.trackingId}
                  </Tag>
                )}
                {notification.invoice && (
                  <Tag size="small" color="#52c41a" style={{ fontSize: '11px' }}>
                    {notification.invoice.invoiceNumber}
                  </Tag>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    })),
    ...((notifications || []).length === 0 ? [{
      key: 'empty',
      label: (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications"
            style={{ margin: 0 }}
          />
        </div>
      )
    }] : [])
  ];

  return (
    <Dropdown
      menu={{ items: notificationItems }}
      trigger={['click']}
      open={dropdownVisible}
      onOpenChange={handleDropdownVisibleChange}
      placement="bottomRight"
      overlayStyle={{ 
        width: '380px',
        maxHeight: '450px',
        overflow: 'auto',
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
        borderRadius: '8px',
        border: '1px solid #d9d9d9',
        backgroundColor: '#ffffff'
      }}
    >
      <Badge count={unreadCount} size="small">
        <Button 
          type="text" 
          icon={<BellOutlined />} 
          style={{ 
            fontSize: '18px',
            color: unreadCount > 0 ? '#1890ff' : '#666'
          }}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
