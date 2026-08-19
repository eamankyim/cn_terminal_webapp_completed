import apiService from './api';

const roleService = {
  // Get all roles and their permissions
  async getRoles() {
    try {

      const response = await apiService.get('/roles');

      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  // Get permissions for a specific role
  async getRolePermissions(role) {
    try {
      const response = await apiService.get(`/roles/${role}/permissions`);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  // Update permissions for a specific role
  async updateRolePermissions(role, permissions) {
    try {

      const response = await apiService.put(`/roles/${role}/permissions`, {
        permissions
      });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  // Get all available permissions
  async getPermissions() {
    try {
      const response = await apiService.get('/roles/permissions');
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  // Update user's role
  async updateUserRole(userId, role) {
    try {
      const response = await apiService.put(`/roles/users/${userId}/role`, {
        role
      });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  },

  async getExpenseEndorsement(userId) {
    return apiService.get(`/roles/users/${userId}/expense-endorsement`);
  },

  async setExpenseEndorsement(userId, enabled) {
    return apiService.patch(`/roles/users/${userId}/expense-endorsement`, { enabled });
  }
};

export default roleService;

