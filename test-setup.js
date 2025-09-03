// test-complete-kit.js
require('dotenv').config({ path: '.env' });

console.log('Testing Complete Frontend Interview Preparation Kit Setup...\n');
console.log('=' .repeat(50));

// Check environment variables
const checks = {
  'Service Account Email': process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  'Private Key': process.env.GOOGLE_PRIVATE_KEY ? '✓ Present' : '✗ Missing',
  'Complete Kit Folder ID': process.env.COMPLETE_KIT_FOLDER_ID,
  'Email User': process.env.EMAIL_USER,
  'Email Pass': process.env.EMAIL_PASS ? '✓ Present' : '✗ Missing',
};

console.log('Environment Variables Check:');
console.log('-' .repeat(30));
for (const [key, value] of Object.entries(checks)) {
  console.log(`${key}: ${value || '✗ Missing'}`);
}

// Test Google Drive connection
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

// Test Complete Kit folder access
async function testCompleteKitAccess() {
  console.log('\n' + '=' .repeat(50));
  console.log('Testing Complete Kit Folder Access...');
  console.log('-' .repeat(30));
  
  try {
    const folder = await drive.files.get({
      fileId: process.env.COMPLETE_KIT_FOLDER_ID,
      fields: 'name,webViewLink,mimeType,owners',
    });
    
    console.log('✅ Google Drive connection successful!');
    console.log(`Folder Name: ${folder.data.name}`);
    console.log(`Folder Link: ${folder.data.webViewLink}`);
    console.log(`Owner: ${folder.data.owners?.[0]?.emailAddress}`);
    
    return true;
  } catch (error) {
    console.log('❌ Google Drive connection failed!');
    console.log(`Error: ${error.message}`);
    console.log('\nPossible solutions:');
    console.log('1. Make sure you shared the folder with the service account');
    console.log('2. Check if the folder ID is correct');
    console.log('3. Verify service account credentials are correct');
    
    return false;
  }
}

// Test sharing capability
async function testSharingCapability() {
  console.log('\n' + '=' .repeat(50));
  console.log('Testing Sharing Capability...');
  console.log('-' .repeat(30));
  
  const testEmail = 'test@example.com'; // Use a test email
  
  try {
    // List current permissions
    const permissions = await drive.permissions.list({
      fileId: process.env.COMPLETE_KIT_FOLDER_ID,
      fields: 'permissions(id,type,role,emailAddress)',
    });
    
    console.log(`Current shares: ${permissions.data.permissions?.length || 0} users`);
    
    // Find service account permission
    const serviceAccountPerm = permissions.data.permissions?.find(
      p => p.emailAddress === process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    );
    
    if (serviceAccountPerm) {
      console.log(`✅ Service account has "${serviceAccountPerm.role}" access`);
      
      if (serviceAccountPerm.role === 'writer' || serviceAccountPerm.role === 'owner') {
        console.log('✅ Service account can manage sharing');
      } else {
        console.log('⚠️  Service account needs "Editor" permission to share with customers');
      }
    } else {
      console.log('❌ Service account does not have access to this folder');
      console.log('   Please share the folder with:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Cannot check sharing permissions');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

// Test email configuration
async function testEmailConfig() {
  console.log('\n' + '=' .repeat(50));
  console.log('Testing Email Configuration...');
  console.log('-' .repeat(30));
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    // Verify email configuration
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    console.log(`Email will be sent from: ${process.env.EMAIL_USER}`);
    
    return true;
  } catch (error) {
    console.log('❌ Email configuration failed');
    console.log(`Error: ${error.message}`);
    console.log('\nPossible solutions:');
    console.log('1. Make sure 2-factor authentication is enabled');
    console.log('2. Use app-specific password, not your regular password');
    console.log('3. Check if "Less secure app access" needs to be enabled');
    
    return false;
  }
}

// Test complete flow
async function testCompleteFlow() {
  console.log('\n' + '=' .repeat(50));
  console.log('TESTING COMPLETE KIT - FULL FLOW');
  console.log('=' .repeat(50));
  
  const testEmail = 'your-test-email@gmail.com'; // Change this to your test email
  
  console.log(`\nSimulating payment flow for: ${testEmail}`);
  console.log('Plan: Complete Frontend Interview Preparation Kit');
  console.log('Amount: ₹149\n');
  
  try {
    // Step 1: Check folder access
    const folderAccess = await testCompleteKitAccess();
    
    // Step 2: Check sharing capability
    const sharingCapability = await testSharingCapability();
    
    // Step 3: Check email config
    const emailConfig = await testEmailConfig();
    
    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('TEST SUMMARY');
    console.log('=' .repeat(50));
    
    if (folderAccess && sharingCapability && emailConfig) {
      console.log('✅ All systems ready!');
      console.log('Your Complete Kit payment integration is ready to use.');
      
      console.log('\n📝 Next Steps:');
      console.log('1. Run your Next.js app: npm run dev');
      console.log('2. Click "Buy Now" on Complete Kit');
      console.log('3. Use Razorpay test card: 4111 1111 1111 1111');
      console.log('4. Check if folder gets shared and email is sent');
    } else {
      console.log('⚠️  Some issues need to be fixed');
      console.log('Please resolve the errors above before testing payments.');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the complete test
// testCompleteFlow();

// Optional: Test actual sharing (uncomment to test with a real email)

async function testActualSharing() {
  const testEmail = 'sawanofficial899@gmail.com'; // Change this
  
  console.log(`\nTesting actual sharing with: ${testEmail}`);
  
  try {
    await drive.permissions.create({
      fileId: process.env.COMPLETE_KIT_FOLDER_ID,
      requestBody: {
        role: 'reader',
        type: 'user',
        emailAddress: testEmail,
      },
      sendNotificationEmail: false,
    });
    
    console.log('✅ Successfully shared folder with test email!');
    console.log('Check the email account for access.');
    
    // Optional: Remove the test permission after verifying
    // You can manually remove it from Google Drive UI
    
  } catch (error) {
    console.log('❌ Sharing failed:', error.message);
  }
}

// Uncomment to test actual sharing
testActualSharing();