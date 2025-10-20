// User service for managing users
import apiService from './api';

class UserService {
  // Get all users
  async getUsers() {
    console.log('🔷 [UserService] getUsers called');
    try {
      console.log('  - Fetching from: /auth/users');
      const response = await apiService.get('/auth/users');
      console.log('✅ [UserService] getUsers response:', response);
      console.log('  - Users count:', response?.users?.length || 0);
      return response;
    } catch (error) {
      console.error('❌ [UserService] getUsers error:', error);
      console.error('  - Error response:', error.response?.data);
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

      throw error;
    }
  }

  // Get assignable users for job assignment (excludes IT_CONSULTANT)
  async getAssignableUsers() {
    try {
      const response = await apiService.get('/auth/assignable-users');
      return response;
    } catch (error) {

      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await apiService.get(`/auth/users/${userId}`);
      return response;
    } catch (error) {

      throw error;
    }
  }

  // Update user
  async updateUser(userId, userData) {
    console.log('🔷 [UserService] updateUser called');
    console.log('  - User ID:', userId);
    console.log('  - User Data:', userData);
    console.log('  - Password included:', userData.password ? 'YES (***' + userData.password.slice(-4) + ')' : 'NO');
    try {
      const response = await apiService.put(`/auth/users/${userId}`, userData);
      console.log('✅ [UserService] updateUser response:', response);
      return response;
    } catch (error) {
      console.error('❌ [UserService] updateUser error:', error);
      console.error('  - Error response:', error.response?.data);
      throw error;
    }
  }

  // Update user status
  async updateUserStatus(userId, isActive) {
    try {
      const response = await apiService.put(`/auth/users/${userId}/status`, { isActive });
      return response;
    } catch (error) {

      throw error;
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      const response = await apiService.delete(`/auth/users/${userId}`);
      return response;
    } catch (error) {

      throw error;
    }
  }

  // Change password
  async changePassword(values) {
    console.log('🔷 [UserService] changePassword called');
    console.log('  - Values:', values);
    const { currentPassword, newPassword } = values;
    console.log('  - Current password:', currentPassword ? '***' + currentPassword.slice(-4) : 'NONE');
    console.log('  - New password:', newPassword ? '***' + newPassword.slice(-4) : 'NONE');
    try {
      const response = await apiService.changePassword(currentPassword, newPassword);
      console.log('✅ [UserService] changePassword response:', response);
      return response;
    } catch (error) {
      console.error('❌ [UserService] changePassword error:', error);
      console.error('  - Error response:', error.response?.data);
      throw error;
    }
  }
}

// Create and export a singleton instance
const userService = new UserService();
export default userService;