import api from './api';

const notificationService = {
  // Get user notifications with pagination
  async getNotifications(page = 1, limit = 20, unreadOnly = false) {
    try {
      const response = await api.get('/notifications', {
        params: { page, limit, unreadOnly }
      });
      return response; // API service already returns the full response object
    } catch (error) {

      throw error;
    }
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response;
    } catch (error) {

      throw error;
    }
  },

  // Delete all notifications (clear all)
  async markAllAsRead() {
    try {

      const response = await api.patch('/notifications/read-all');

      return response;
    } catch (error) {

      throw error;
    }
  },

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread-count');
      return response;
    } catch (error) {

      throw error;
    }
  },

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response;
    } catch (error) {

      throw error;
    }
  }
};

export default notificationService;
