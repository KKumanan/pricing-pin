const B2 = require('backblaze-b2');
require('dotenv').config();

// Test B2 connection and basic operations
async function testB2Connection() {
  console.log('Testing B2 Backblaze Connection...\n');
  
  // Check environment variables
  const B2_KEY_ID = process.env.B2_KEY_ID;
  const B2_APP_KEY = process.env.B2_APP_KEY;
  const B2_BUCKET_ID = process.env.B2_BUCKET_ID;
  const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME;
  
  console.log('Environment Variables:');
  console.log('B2_KEY_ID:', B2_KEY_ID ? '✓ Set' : '✗ Not set');
  console.log('B2_APP_KEY:', B2_APP_KEY ? '✓ Set' : '✗ Not set');
  console.log('B2_BUCKET_ID:', B2_BUCKET_ID ? '✓ Set' : '✗ Not set');
  console.log('B2_BUCKET_NAME:', B2_BUCKET_NAME ? '✓ Set' : '✗ Not set');
  
  if (!B2_KEY_ID || !B2_APP_KEY || !B2_BUCKET_ID || !B2_BUCKET_NAME) {
    console.log('\n❌ Missing required environment variables. Please check your .env file.');
    console.log('See B2_SETUP.md for setup instructions.');
    return;
  }
  
  const b2 = new B2({
    applicationKeyId: B2_KEY_ID,
    applicationKey: B2_APP_KEY,
  });
  
  try {
    // Test authorization
    console.log('\n🔐 Testing B2 Authorization...');
    await b2.authorize();
    console.log('✓ B2 Authorization successful');
    
    // Test bucket access
    console.log('\n📦 Testing Bucket Access...');
    const bucketInfo = await b2.getBucket({ bucketId: B2_BUCKET_ID });
    console.log('✓ Bucket access successful');
    console.log(`  Bucket Name: ${bucketInfo.data.bucketName}`);
    console.log(`  Bucket Type: ${bucketInfo.data.bucketType}`);
    
    // Test file operations
    console.log('\n📁 Testing File Operations...');
    const testData = { test: 'data', timestamp: new Date().toISOString() };
    const testFileName = `test-${Date.now()}.json`;
    
    // Upload test file
    const uploadUrlResponse = await b2.getUploadUrl({ bucketId: B2_BUCKET_ID });
    await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: testFileName,
      data: Buffer.from(JSON.stringify(testData), 'utf8'),
      mime: 'application/json'
    });
    console.log('✓ File upload successful');
    
    // Download test file
    const downloadResponse = await b2.downloadFileByName({
      bucketName: B2_BUCKET_NAME,
      fileName: testFileName,
      responseType: 'text'
    });
    const downloadedData = JSON.parse(downloadResponse.data);
    console.log('✓ File download successful');
    console.log(`  Downloaded data: ${JSON.stringify(downloadedData)}`);
    
    // Delete test file
    const fileVersions = await b2.listFileVersions({
      bucketId: B2_BUCKET_ID,
      startFileName: testFileName,
      maxFileCount: 1
    });
    const file = fileVersions.data.files.find(f => f.fileName === testFileName);
    if (file) {
      await b2.deleteFileVersion({
        fileId: file.fileId,
        fileName: testFileName
      });
      console.log('✓ File deletion successful');
    }
    
    console.log('\n🎉 All B2 tests passed! Your configuration is working correctly.');
    console.log('\nYou can now start the server with: npm run server');
    
  } catch (error) {
    console.error('\n❌ B2 test failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check your B2 credentials in the .env file');
    console.log('2. Verify your bucket exists and is accessible');
    console.log('3. Ensure your application key has proper permissions');
    console.log('4. Check your internet connection');
  }
}

// Run the test
testB2Connection().catch(console.error); 