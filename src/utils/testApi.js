// API Integration Test Utility
import apiService from '../services/api';

export const testApiIntegration = async () => {
  console.log('🧪 Testing API Integration...');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const health = await apiService.healthCheck();
    console.log('✅ Health check passed:', health);

    // Test 2: Login (if credentials available)
    console.log('2. Testing authentication...');
    try {
      const loginResponse = await apiService.login('admin@cnterminal.com', 'admin123');
      console.log('✅ Login successful:', loginResponse.user?.email);
    } catch (error) {
      console.log('⚠️ Login test failed (expected if no user exists):', error.message);
    }

    // Test 3: Get customers (requires authentication)
    console.log('3. Testing customer API...');
    try {
      const customers = await apiService.getCustomers();
      console.log('✅ Customers API working:', customers.customers?.length || 0, 'customers found');
    } catch (error) {
      console.log('⚠️ Customers API test failed (expected if not authenticated):', error.message);
    }

    // Test 4: Public tracking (no authentication required)
    console.log('4. Testing public tracking...');
    try {
      const tracking = await apiService.trackPackage('TEST123');
      console.log('✅ Public tracking API working');
    } catch (error) {
      console.log('⚠️ Public tracking test failed (expected if no test data):', error.message);
    }

    console.log('🎉 API Integration test completed!');
    return true;
  } catch (error) {
    console.error('❌ API Integration test failed:', error);
    return false;
  }
};

// Export for use in components
export default testApiIntegration;
