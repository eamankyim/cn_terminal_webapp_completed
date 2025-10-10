// API Integration Test Utility
import apiService from '../services/api';

export const testApiIntegration = async () => {

  try {
    // Test 1: Health Check

    const health = await apiService.healthCheck();

    // Test 2: Login (if credentials available)

    try {
      const loginResponse = await apiService.login('admin@cnterminal.com', 'admin123');

    } catch (error) {

    }

    // Test 3: Get customers (requires authentication)

    try {
      const customers = await apiService.getCustomers();

    } catch (error) {

    }

    // Test 4: Public tracking (no authentication required)

    try {
      await apiService.trackPackage('TEST123');

    } catch (error) {

    }

    return true;
  } catch (error) {

    return false;
  }
};

// Export for use in components
export default testApiIntegration;
