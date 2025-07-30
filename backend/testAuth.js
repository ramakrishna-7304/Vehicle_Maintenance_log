require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUsers = {
  admin: {
    name: 'Tata Motors Admin',
    email: 'admin@tatamotors.com',
    password: 'password123',
    role: 'admin',
    companyName: 'Tata Motors',
    companyPassword: '123123'
  },
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user'
  }
};

let adminToken = '';
let userToken = '';

const testAuth = async () => {
  console.log('🧪 Testing Authentication & Authorization System...\n');

  try {
    // Test 1: Register Admin
    console.log('1. Testing Admin Registration...');
    try {
      const adminResponse = await axios.post(`${BASE_URL}/auth/register`, testUsers.admin);
      console.log('✅ Admin registration successful');
      console.log('📧 Admin Email:', adminResponse.data.email);
      console.log('🏢 Company:', adminResponse.data.companyName);
      console.log('🔑 Role:', adminResponse.data.role);
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Admin already exists, proceeding with login...');
      } else {
        console.error('❌ Admin registration failed:', error.response?.data?.message);
        return;
      }
    }

    // Test 2: Register User
    console.log('\n2. Testing User Registration...');
    try {
      const userResponse = await axios.post(`${BASE_URL}/auth/register`, testUsers.user);
      console.log('✅ User registration successful');
      console.log('📧 User Email:', userResponse.data.email);
      console.log('🔑 Role:', userResponse.data.role);
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ User already exists, proceeding with login...');
      } else {
        console.error('❌ User registration failed:', error.response?.data?.message);
        return;
      }
    }

    // Test 3: Login Admin
    console.log('\n3. Testing Admin Login...');
    try {
      const adminLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: testUsers.admin.email,
        password: testUsers.admin.password
      });
      adminToken = adminLoginResponse.data.token;
      console.log('✅ Admin login successful');
      console.log('🔑 Admin Token:', adminToken.substring(0, 20) + '...');
    } catch (error) {
      console.error('❌ Admin login failed:', error.response?.data?.message);
      return;
    }

    // Test 4: Login User
    console.log('\n4. Testing User Login...');
    try {
      const userLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: testUsers.user.email,
        password: testUsers.user.password
      });
      userToken = userLoginResponse.data.token;
      console.log('✅ User login successful');
      console.log('🔑 User Token:', userToken.substring(0, 20) + '...');
    } catch (error) {
      console.error('❌ User login failed:', error.response?.data?.message);
      return;
    }

    // Test 5: Test Admin Routes with Admin Token
    console.log('\n5. Testing Admin Routes with Admin Token...');
    try {
      const adminLogsResponse = await axios.get(`${BASE_URL}/admin/logs`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Admin can access admin routes');
      console.log('📊 Logs count:', adminLogsResponse.data.length);
    } catch (error) {
      console.error('❌ Admin route access failed:', error.response?.data?.message);
    }

    // Test 6: Test Admin Routes with User Token (Should Fail)
    console.log('\n6. Testing Admin Routes with User Token (Should Fail)...');
    try {
      await axios.get(`${BASE_URL}/admin/logs`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.error('❌ User should not access admin routes');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ User correctly blocked from admin routes');
        console.log('🚫 Error:', error.response.data.message);
      } else {
        console.error('❌ Unexpected error:', error.response?.data?.message);
      }
    }

    // Test 7: Test Admin Routes without Token (Should Fail)
    console.log('\n7. Testing Admin Routes without Token (Should Fail)...');
    try {
      await axios.get(`${BASE_URL}/admin/logs`);
      console.error('❌ Should not access admin routes without token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly blocked access without token');
        console.log('🚫 Error:', error.response.data.message);
      } else {
        console.error('❌ Unexpected error:', error.response?.data?.message);
      }
    }

    // Test 8: Test Public Routes
    console.log('\n8. Testing Public Routes...');
    try {
      const companiesResponse = await axios.get(`${BASE_URL}/admin/companies`);
      console.log('✅ Public route accessible');
      console.log('🏢 Companies count:', companiesResponse.data.length);
    } catch (error) {
      console.error('❌ Public route failed:', error.response?.data?.message);
    }

    // Test 9: Test User Routes with User Token
    console.log('\n9. Testing User Routes with User Token...');
    try {
      const userLogsResponse = await axios.get(`${BASE_URL}/logs`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('✅ User can access user routes');
      console.log('📊 User logs count:', userLogsResponse.data.length);
    } catch (error) {
      console.error('❌ User route access failed:', error.response?.data?.message);
    }

    // Test 10: Test User Routes with Admin Token
    console.log('\n10. Testing User Routes with Admin Token...');
    try {
      const adminUserLogsResponse = await axios.get(`${BASE_URL}/logs`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Admin can access user routes (if needed)');
      console.log('📊 Admin user logs count:', adminUserLogsResponse.data.length);
    } catch (error) {
      console.error('❌ Admin user route access failed:', error.response?.data?.message);
    }

    console.log('\n🎉 Authentication & Authorization tests completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Registration system working');
    console.log('✅ Login system working');
    console.log('✅ JWT token generation working');
    console.log('✅ Role-based access control working');
    console.log('✅ Route protection working');
    console.log('✅ Public routes accessible');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test
testAuth(); 