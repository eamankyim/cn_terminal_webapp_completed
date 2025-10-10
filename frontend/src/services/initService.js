// Initialization service for system setup
import apiService from './api';

class InitService {
  // Check if system is initialized
  async checkInitialization() {
    try {
      const response = await apiService.get('/init/check');
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  }

  // Create first super admin
  async createSuperAdmin(adminData) {
    try {
      const response = await apiService.post('/init/super-admin', adminData);
      return response; // API service returns data directly, not wrapped in .data
    } catch (error) {

      throw error;
    }
  }
}

// Create and export a singleton instance
const initService = new InitService();
export default initService;

