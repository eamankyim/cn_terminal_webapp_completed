// Test script for the initialization API
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testInitAPI() {
  try {
    // Test 1: Check initialization status
    const checkResponse = await axios.get(`${BASE_URL}/init/check`);
    // Test 2: Create super admin (only if not already initialized)
    if (!checkResponse.data.initialized) {
      const createResponse = await axios.post(`${BASE_URL}/init/super-admin`, {
        name: 'Super Administrator',
        email: 'admin@cnterminal.com',
        password: 'admin123'
      });
    } else {
    }

    // Test 3: Check status again
    const finalCheckResponse = await axios.get(`${BASE_URL}/init/check`);
  } catch (error) {
  }
}

// Run the test
testInitAPI();

