/**
 * Upload CSRF Test
 * Tests the complete upload flow with CSRF protection
 */

async function testUploadCSRF() {
  console.log('\n🧪 Testing Upload CSRF Flow\n');

  // Step 1: Fetch CSRF token
  console.log('📋 Step 1: Fetching CSRF token...');
  const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf', {
    method: 'GET',
    credentials: 'include',
  });

  if (!csrfResponse.ok) {
    console.error('❌ Failed to fetch CSRF token:', csrfResponse.status);
    return;
  }

  const csrfData = await csrfResponse.json();
  const csrfToken = csrfData.token;
  console.log(`✅ CSRF Token received: ${csrfToken.substring(0, 16)}...`);
  
  // Check if cookie was set
  const setCookieHeader = csrfResponse.headers.get('set-cookie');
  console.log(`   Cookie header: ${setCookieHeader ? 'Present ✅' : 'Missing ❌'}`);

  // Step 2: Create a test file upload
  console.log('\n📋 Step 2: Creating test FormData...');
  const testCSV = `caseId,activity,timestamp
1,Start,2024-01-01T10:00:00Z
1,Process,2024-01-01T10:05:00Z
1,End,2024-01-01T10:10:00Z`;

  const blob = new Blob([testCSV], { type: 'text/csv' });
  const formData = new FormData();
  formData.append('file', blob, 'test.csv');
  formData.append('processName', 'Test Upload Process');
  console.log('✅ FormData created');

  // Step 3: Upload with CSRF token
  console.log('\n📋 Step 3: Uploading file with CSRF token...');
  const uploadResponse = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-CSRF-Token': csrfToken,
    },
    body: formData,
  });

  console.log(`   Upload response status: ${uploadResponse.status}`);

  if (uploadResponse.ok) {
    const data = await uploadResponse.json();
    console.log('✅ Upload successful!');
    console.log(`   Events imported: ${data.eventsImported || 0}`);
    console.log(`   Process created: ${data.process?.name || 'N/A'}`);
  } else {
    const errorData = await uploadResponse.json();
    console.error('❌ Upload failed:');
    console.error(`   Status: ${uploadResponse.status}`);
    console.error(`   Error: ${errorData.error || 'Unknown error'}`);
    console.error(`   Code: ${errorData.code || 'N/A'}`);
  }

  console.log('\n🧪 Test complete\n');
}

// Run test if server is running
testUploadCSRF().catch(error => {
  console.error('❌ Test error:', error.message);
  console.log('\n⚠️  Make sure the dev server is running: npm run dev\n');
});
