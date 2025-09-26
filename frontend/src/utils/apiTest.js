// API Connection Test Utility
import api from '../services/api';

export const testApiConnection = async () => {
  console.log('🧪 Testing API connection...');
  
  try {
    // Test 1: Check if API base URL is reachable
    console.log('📍 Testing API base URL:', api.baseURL);
    
    // Test 2: Check if we have a token
    const token = localStorage.getItem('cn_terminal_token');
    console.log('🔑 Token status:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.warn('⚠️ No authentication token found. Please login first.');
      return { success: false, error: 'No authentication token' };
    }
    
    // Test 3: Try to make a simple authenticated request
    try {
      const response = await api.get('/expenses/requests', { 
        params: { limit: 1 } 
      });
      console.log('✅ API connection successful!');
      console.log('📊 Response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ API request failed:', error);
      return { 
        success: false, 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
    
  } catch (error) {
    console.error('❌ API connection test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test specific accounting endpoints
export const testAccountingEndpoints = async () => {
  console.log('🧪 Testing Accounting API endpoints...');
  
  const tests = [
    {
      name: 'Get Expense Requests',
      test: () => api.get('/expenses/requests', { params: { limit: 1 } })
    },
    {
      name: 'Get Expense Stats',
      test: () => api.get('/expenses/stats/summary')
    },
    {
      name: 'Get Payouts',
      test: () => api.get('/payouts', { params: { limit: 1 } })
    },
    {
      name: 'Get Cashflow Summary',
      test: () => api.get('/cashflow/summary')
    }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      const response = await test.test();
      console.log(`✅ ${test.name}: Success`);
      results.push({ name: test.name, success: true, data: response.data });
    } catch (error) {
      console.error(`❌ ${test.name}: Failed`, error.response?.data || error.message);
      results.push({ 
        name: test.name, 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status
      });
    }
  }
  
  console.log('📊 Test Results Summary:', results);
  return results;
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testApiConnection = testApiConnection;
  window.testAccountingEndpoints = testAccountingEndpoints;
  console.log('🔧 API test functions available in browser console:');
  console.log('  - testApiConnection()');
  console.log('  - testAccountingEndpoints()');
}

