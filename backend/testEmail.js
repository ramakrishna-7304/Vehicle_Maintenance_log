require('dotenv').config();
const { sendApprovalEmail, validateEmailConfig, verifyTransporter } = require('./utils/emailService');

const testEmail = async () => {
  console.log('🧪 Testing Email Functionality...\n');

  // Test 1: Validate configuration
  console.log('1. Checking email configuration...');
  const configValid = validateEmailConfig();
  if (configValid) {
    console.log('✅ Email configuration is valid');
  } else {
    console.log('❌ Email configuration is invalid');
    console.log('Please check your .env file for EMAIL_USER and EMAIL_PASS');
    return;
  }

  // Test 2: Verify transporter
  console.log('\n2. Verifying email transporter...');
  const transporterValid = await verifyTransporter();
  if (transporterValid) {
    console.log('✅ Email transporter is working');
  } else {
    console.log('❌ Email transporter verification failed');
    return;
  }

  // Test 3: Send test acceptance email
  console.log('\n3. Sending test acceptance email...');
  const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
  const acceptanceResult = await sendApprovalEmail(
    testEmail,
    'Test User',
    'Oil Change Service',
    'accepted',
    1500,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  );

  if (acceptanceResult) {
    console.log('✅ Test acceptance email sent successfully');
  } else {
    console.log('❌ Test acceptance email failed');
  }

  // Test 4: Send test rejection email
  console.log('\n4. Sending test rejection email...');
  const rejectionResult = await sendApprovalEmail(
    testEmail,
    'Test User',
    'Brake Service',
    'rejected',
    null,
    null
  );

  if (rejectionResult) {
    console.log('✅ Test rejection email sent successfully');
  } else {
    console.log('❌ Test rejection email failed');
  }

  console.log('\n🎉 Email testing completed!');
  console.log('Check your email inbox for test messages.');
};

// Run the test
testEmail().catch(console.error); 