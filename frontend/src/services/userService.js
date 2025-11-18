// User service for managing users
import apiService from './api';

class UserService {
  // Get all users
  async getUsers() {
    console.log('\n🔷 [UserService] getUsers called');
    console.log('  - Timestamp:', new Date().toISOString());
    try {
      console.log('  - Calling apiService.get("/auth/users")');
      const response = await apiService.get('/auth/users');
      console.log('✅ [UserService] getUsers response received');
      console.log('  - Response type:', typeof response);
      console.log('  - Response keys:', response ? Object.keys(response) : 'null/undefined');
      console.log('  - Has users property:', !!response?.users);
      console.log('  - Users is array:', Array.isArray(response?.users));
      console.log('  - Users count:', response?.users?.length || 0);
      
      if (!response) {
        console.error('❌ [UserService] Response is null or undefined');
        throw new Error('Invalid response from server');
      }
      
      if (!response.users) {
        console.error('❌ [UserService] Response missing users property');
        console.error('  - Response structure:', response);
        throw new Error('Response missing users property');
      }
      
      if (!Array.isArray(response.users)) {
        console.error('❌ [UserService] Response.users is not an array');
        console.error('  - Users type:', typeof response.users);
        console.error('  - Users value:', response.users);
        throw new Error('Users property is not an array');
      }
      
      console.log('✅ [UserService] getUsers completed successfully');
      return response;
    } catch (error) {
      console.error('\n❌ [UserService] getUsers ERROR:');
      console.error('  - Error name:', error.name);
      console.error('  - Error message:', error.message);
      console.error('  - Error status:', error.status);
      console.error('  - Error response:', error.response?.data);
      console.error('  - Error stack:', error.stack);
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