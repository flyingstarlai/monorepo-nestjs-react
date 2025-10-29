#!/usr/bin/env node

// Simple test script to verify admin API endpoints
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test data
const adminCredentials = {
  username: 'admin',
  password: 'admin'
};

async function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAdminEndpoints() {
  console.log('🧪 Testing Admin API Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const health = await makeRequest('/health');
    console.log(`   Status: ${health.statusCode}`);
    if (health.statusCode === 200) {
      console.log('   ✅ Health check passed');
    } else {
      console.log('   ❌ Health check failed');
    }

    // Test 2: Admin login
    console.log('\n2. Testing admin login...');
    try {
      const login = await makeRequest('/auth/login', 'POST', adminCredentials);
      console.log(`   Status: ${login.statusCode}`);
      if (login.statusCode === 200 || login.statusCode === 201) {
        const loginData = JSON.parse(login.body);
        console.log('   ✅ Admin login successful');
        console.log(`   Token: ${loginData.access_token?.substring(0, 20)}...`);
        
        const token = loginData.access_token;
        const authHeaders = { 'Authorization': `Bearer ${token}` };

        // Test 3: Admin workspaces list
        console.log('\n3. Testing admin workspaces list...');
        const workspaces = await makeRequest('/admin/workspaces', 'GET', null, authHeaders);
        console.log(`   Status: ${workspaces.statusCode}`);
        if (workspaces.statusCode === 200) {
          console.log('   ✅ Admin workspaces endpoint accessible');
          const workspacesData = JSON.parse(workspaces.body);
          console.log(`   Found ${workspacesData.workspaces?.length || 0} workspaces`);
        } else {
          console.log('   ❌ Admin workspaces endpoint failed');
        }

        // Test 4: Admin workspace stats
        if (workspaces.statusCode === 200) {
          const workspacesData = JSON.parse(workspaces.body);
          if (workspacesData.workspaces && workspacesData.workspaces.length > 0) {
            const firstWorkspace = workspacesData.workspaces[0];
            console.log('\n4. Testing admin workspace stats...');
            const stats = await makeRequest(`/admin/c/${firstWorkspace.slug}/stats`, 'GET', null, authHeaders);
            console.log(`   Status: ${stats.statusCode}`);
            if (stats.statusCode === 200) {
              console.log('   ✅ Admin workspace stats endpoint accessible');
            } else {
              console.log('   ❌ Admin workspace stats endpoint failed');
            }
          }
        }

      } else {
        console.log('   ❌ Admin login failed');
        console.log(`   Response: ${login.body}`);
      }
    } catch (error) {
      console.log('   ❌ Admin login error:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testAdminEndpoints().then(() => {
  console.log('\n🏁 Testing completed');
}).catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});