/**
 * LOGIN TEST
 */

const API_BASE = 'http://localhost:5001/api/v1';

async function testLogin(username, password) {
  try {
    console.log(`\n🔐 Testing login: ${username}`);
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ SUCCESS - ${username}`);
      console.log(`   User: ${data.user?.full_name || data.user?.username}`);
      console.log(`   Role: ${data.user?.role_name || data.user?.role?.name}`);
      return true;
    } else {
      console.log(`❌ FAILED - ${username}`);
      console.log(`   Error: ${data.error || data.message}`);
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR - ${username}`);
    console.log(`   ${error.message}`);
    return false;
  }
}

async function testAllUsers() {
  console.log('🏥 TESTING ALL USER LOGINS\n');
  console.log('='.repeat(60));
  
  const users = [
    { username: 'admin', password: 'admin123' },
    { username: 'reception', password: 'reception123' },
    { username: 'doctor', password: 'doctor123' },
    { username: 'nurse', password: 'nurse123' },
    { username: 'laborant', password: 'laborant123' },
    { username: 'cashier', password: 'cashier123' },
    { username: 'pharmacist', password: 'pharmacist123' },
    { username: 'chief_doctor', password: 'chief123' },
    { username: 'sanitar', password: 'sanitar123' },
    { username: 'masseur', password: 'masseur123' },
    { username: 'speech_therapist', password: 'speech123' }
  ];

  let success = 0;
  let failed = 0;

  for (const user of users) {
    const result = await testLogin(user.username, user.password);
    if (result) {
      success++;
    } else {
      failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 RESULTS:`);
  console.log(`   ✅ Success: ${success}/${users.length}`);
  console.log(`   ❌ Failed: ${failed}/${users.length}`);
  console.log(`   📈 Success Rate: ${Math.round(success/users.length*100)}%\n`);
}

testAllUsers();
