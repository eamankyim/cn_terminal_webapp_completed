// API Connection Test Utility
import api from '../services/api';

export const testApiConnection = async () => {
  try {
    // Test 1: Check if API base URL is reachable
    // Test 2: Check if we have a token
    const token = localStorage.getItem('cn_terminal_token');
    if (!token) {
      return { success: false, error: 'No authentication token' };
    }
    
    // Test 3: Try to make a simple authenticated request
    try {
      const response = await api.get('/expenses/requests', { 
        params: { limit: 1 } 
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Test specific accounting endpoints
export const testAccountingEndpoints = async () => {
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
      const response = await test.test();
      results.push({ name: test.name, success: true, data: response.data });
    } catch (error) {
      results.push({ 
        name: test.name, 
        success: false, 
        error: error.response?.data || error.message,
        status: error.response?.status
      });
    }
  }
  return results;
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testApiConnection = testApiConnection;
  window.testAccountingEndpoints = testAccountingEndpoints;
}



