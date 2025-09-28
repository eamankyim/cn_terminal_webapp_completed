import apiService from './api';

const roleService = {
  // Get all roles and their permissions
  async getRoles() {
    try {
      console.log('🔍 ROLE SERVICE - Making API call to /roles...');
      const response = await apiService.get('/roles');
      console.log('🔍 ROLE SERVICE - Raw API response:', JSON.stringify(response, null, 2));
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {
      console.error('❌ ROLE SERVICE - Error fetching roles:', error);
      throw error;
    }
  },

  // Get permissions for a specific role
  async getRolePermissions(role) {
    try {
      const response = await apiService.get(`/roles/${role}/permissions`);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      throw error;
    }
  },

  // Update permissions for a specific role
  async updateRolePermissions(role, permissions) {
    try {
      console.log(`🔍 ROLE SERVICE - Updating permissions for ${role}:`, permissions);
      console.log(`🔍 ROLE SERVICE - Permissions type:`, typeof permissions, 'Is array:', Array.isArray(permissions));
      
      const response = await apiService.put(`/roles/${role}/permissions`, {
        permissions
      });
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw error;
    }
  },

  // Get all available permissions
  async getPermissions() {
    try {
      const response = await apiService.get('/roles/permissions');
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {
      console.error('Error fetching permissions:', error);
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
      console.error('Error updating user role:', error);
      throw error;
    }
  }
};

export default roleService;


