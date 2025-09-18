// User service for managing users
import apiService from './api';

class UserService {
  // Get all users
  async getUsers() {
    try {
      const response = await apiService.get('/auth/users');
      return response;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  // Get staff members only
  async getStaffMembers() {
    try {
      const response = await apiService.get('/auth/users');
      const staffMembers = response.users.filter(user => 
        user.role === 'STAFF' && user.isActive
      );
      return { users: staffMembers };
    } catch (error) {
      console.error('Failed to fetch staff members:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await apiService.get(`/auth/users/${userId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      const response = await apiService.put(`/auth/users/${userId}`, userData);
      return response;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  // Update user status
  async updateUserStatus(userId, isActive) {
    try {
      const response = await apiService.put(`/auth/users/${userId}/status`, { isActive });
      return response;
    } catch (error) {
      console.error('Failed to update user status:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      const response = await apiService.delete(`/auth/users/${userId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const userService = new UserService();
export default userService;