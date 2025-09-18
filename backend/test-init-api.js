// Test script for the initialization API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testInitAPI() {
  try {
    console.log('🧪 Testing Initialization API...\n');

    // Test 1: Check initialization status
    console.log('1. Checking initialization status...');
    const checkResponse = await axios.get(`${BASE_URL}/init/check`);
    console.log('✅ Status check response:', checkResponse.data);
    console.log('');

    // Test 2: Create super admin (only if not already initialized)
    if (!checkResponse.data.initialized) {
      console.log('2. Creating super admin...');
      const createResponse = await axios.post(`${BASE_URL}/init/super-admin`, {
        name: 'Super Administrator',
        email: 'admin@cnterminal.com',
        password: 'admin123'
      });
      console.log('✅ Super admin created:', createResponse.data);
      console.log('');
    } else {
      console.log('2. ⚠️  System already initialized, skipping super admin creation');
      console.log('');
    }

    // Test 3: Check status again
    console.log('3. Checking status after creation...');
    const finalCheckResponse = await axios.get(`${BASE_URL}/init/check`);
    console.log('✅ Final status:', finalCheckResponse.data);
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testInitAPI();








