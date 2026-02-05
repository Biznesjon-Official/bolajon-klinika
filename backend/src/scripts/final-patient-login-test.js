import axios from 'axios';

const API_URL = 'http://localhost:5001/api/v1';

async function testPatientLogin() {
  console.log('=== FINAL PATIENT LOGIN TEST ===\n');
  
  const testCases = [
    { username: 'mironshox', password: '123456', description: 'Custom username' },
    { username: 'P000001', password: '123456', description: 'Patient number uppercase' },
    { username: 'p000001', password: '123456', description: 'Patient number lowercase' },
    { username: 'P000005', password: '123456', description: 'Another patient number' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.description} ---`);
    console.log(`Username: ${testCase.username}`);
    
    try {
      const response = await axios.post(`${API_URL}/auth/patient-login`, {
        username: testCase.username,
        password: testCase.password
      });
      
      if (response.data.success) {
        console.log('✓ Login successful!');
        console.log(`  Patient: ${response.data.user.full_name}`);
        console.log(`  Patient Number: ${response.data.user.patient_number}`);
        console.log(`  Role: ${response.data.user.role_name}`);
        console.log(`  Token: ${response.data.accessToken.substring(0, 50)}...`);
      } else {
        console.log('✗ Login failed:', response.data.message);
      }
    } catch (error) {
      console.log('✗ Login error!');
      console.log(`  Status: ${error.response?.status}`);
      console.log(`  Message: ${error.response?.data?.error || error.message}`);
    }
  }
  
  console.log('\n=== TEST COMPLETE ===');
  console.log('\nTo test in browser:');
  console.log('1. Go to http://localhost:5173/login');
  console.log('2. Enter username: mironshox (or P000001, P000002, etc.)');
  console.log('3. Enter password: 123456');
  console.log('4. Click "Kirish"');
  console.log('5. Should redirect to /patient/portal');
}

testPatientLogin();
