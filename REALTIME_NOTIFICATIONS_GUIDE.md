# Real-Time Notifications Implementation Guide

## Overview

The CN Terminal Web App now includes real-time notifications using WebSocket technology (Socket.IO) for instant notification delivery. This replaces the previous polling-based approach with a more efficient real-time system.

## Architecture

### Backend Components

1. **Socket.IO Server** (`backend/server.js`)
   - Initialized with CORS support for frontend connections
   - Handles user authentication and room management
   - Global `io` instance available for broadcasting notifications

2. **RealtimeNotificationService** (`backend/services/realtimeNotificationService.js`)
   - Centralized service for sending real-time notifications
   - Methods for individual, multiple, and system-wide notifications
   - Integrates with existing database notification system

3. **Updated Routes**
   - All notification-related routes now trigger real-time updates
   - Job status changes, invoice creation, and payment updates are real-time
   - Test endpoint available at `/api/notifications/test-realtime`

### Frontend Components

1. **NotificationContext** (`frontend/src/contexts/NotificationContext.js`)
   - Manages Socket.IO client connection
   - Handles real-time event listeners
   - Falls back to polling when WebSocket is unavailable
   - Connection status tracking

2. **NotificationBell** (`frontend/src/components/common/NotificationBell.jsx`)
   - Visual connection status indicator (green/red dot)
   - Real-time notification display
   - Maintains existing functionality with enhanced UX

## Features

### Real-Time Events

- **New Notifications**: Instant delivery when notifications are created
- **Unread Count Updates**: Real-time badge updates
- **Read Status Updates**: Instant UI updates when notifications are marked as read
- **System Notifications**: Broadcast messages to all connected users

### Connection Management

- **Automatic Reconnection**: Socket.IO handles connection drops
- **Authentication**: User-specific notification rooms
- **Fallback Support**: Polling continues when WebSocket is unavailable
- **Visual Indicators**: Connection status shown in notification bell

### Notification Types

- Job assignments and status changes
- Invoice creation and updates
- Payment received notifications
- System-wide alerts
- Custom test notifications

## Usage

### Testing Real-Time Notifications

1. **Via API**:
   ```bash
   POST /api/notifications/test-realtime
   {
     "title": "Test Notification",
     "message": "This is a test real-time notification",
     "type": "SUCCESS"
   }
   ```

2. **Via UI**: 
   - Look for the green dot next to "Notifications" in the notification bell
   - Create/update jobs, invoices, or payments to trigger real-time notifications

### Connection Status

- **Green dot**: Real-time connection active
- **Red dot**: Using polling fallback (WebSocket unavailable)

## Configuration

### Environment Variables

```env
# Backend
FRONTEND_URL=http://localhost:3000  # For CORS configuration

# Frontend
REACT_APP_API_URL=http://localhost:5000  # Socket.IO server URL
```

### Socket.IO Settings

- **Transports**: WebSocket with polling fallback
- **CORS**: Configured for frontend origin
- **Authentication**: Token-based user authentication
- **Rooms**: User-specific notification channels

## Benefits

1. **Instant Updates**: Notifications appear immediately without page refresh
2. **Reduced Server Load**: No more constant polling requests
3. **Better UX**: Real-time feedback for all user actions
4. **Scalable**: Efficient WebSocket connections
5. **Resilient**: Automatic fallback to polling when needed

## Technical Details

### WebSocket Events

- `authenticate`: User joins their notification room
- `new_notification`: New notification received
- `unread_count_update`: Badge count updated
- `notification_read_update`: Read status changed
- `system_notification`: System-wide message

### Error Handling

- Connection failures fall back to polling
- Notification creation failures don't break main functionality
- Automatic reconnection on network issues
- Graceful degradation when WebSocket unavailable

## Monitoring

### Backend Logs
- Connection/disconnection events
- Notification delivery status
- Error handling and fallbacks

### Frontend Logs
- Socket.IO connection status
- Real-time event reception
- Fallback polling activation

## Future Enhancements

- Push notifications for mobile devices
- Notification preferences and filtering
- Rich notification content with actions
- Notification history and archiving
- Multi-device synchronization

## Troubleshooting

### Common Issues

1. **No Real-Time Updates**
   - Check WebSocket connection (red dot in notification bell)
   - Verify backend is running on correct port
   - Check browser console for connection errors

2. **Notifications Not Appearing**
   - Ensure user is authenticated
   - Check notification service integration
   - Verify database notifications are being created

3. **Connection Drops**
   - Check network stability
   - Verify CORS configuration
   - Monitor backend logs for errors

### Debug Mode

Enable detailed logging by checking browser console and backend logs for Socket.IO events and notification delivery status.
