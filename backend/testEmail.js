require('dotenv').config();
const { sendTestEmail, sendLogStatusEmail, validateEmailConfig, verifyTransporter } = require('./utils/emailService');

const testEmail = async () => {
  console.log('🧪 Testing Email Functionality...\n');

  // Test 1: Validate configuration
  console.log('1. Checking email configuration...');
  const configValid = validateEmailConfig();
  if (configValid) {
    console.log('✅ Email configuration is valid');
    console.log(`📧 SMTP Host: ${process.env.SMTP_HOST}`);
    console.log(`📧 SMTP Port: ${process.env.SMTP_PORT}`);
    console.log(`📧 SMTP User: ${process.env.SMTP_USER}`);
    console.log(`📧 Email From: ${process.env.EMAIL_FROM}`);
  } else {
    console.log('❌ Email configuration is invalid');
    console.log('Please check your .env file for SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and EMAIL_FROM');
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

  // Test 3: Send test email
  console.log('\n3. Sending test email...');
  const testEmail = process.env.SMTP_USER; // Send to yourself for testing
  const testResult = await sendTestEmail(testEmail);

  if (testResult.success) {
    console.log('✅ Test email sent successfully');
  } else {
    console.log('❌ Test email failed:', testResult.error);
  }

  // Test 4: Send acceptance email
  console.log('\n4. Sending test acceptance email...');
  const acceptanceResult = await sendLogStatusEmail(
    testEmail,
    'Test User',
    'Oil Change Service',
    'accepted',
    'Tata Motors',
    {
      price: 1500,
      completionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }
  );

  if (acceptanceResult.success) {
    console.log('✅ Test acceptance email sent successfully');
  } else {
    console.log('❌ Test acceptance email failed:', acceptanceResult.error);
  }

  // Test 5: Send rejection email
  console.log('\n5. Sending test rejection email...');
  const rejectionResult = await sendLogStatusEmail(
    testEmail,
    'Test User',
    'Brake Service',
    'rejected',
    'Tata Motors',
    {
      rejectionReason: 'Parts not available at the moment'
    }
  );

  if (rejectionResult.success) {
    console.log('✅ Test rejection email sent successfully');
  } else {
    console.log('❌ Test rejection email failed:', rejectionResult.error);
  }

  // Test 6: Send completion email
  console.log('\n6. Sending test completion email...');
  const completionResult = await sendLogStatusEmail(
    testEmail,
    'Test User',
    'Engine Tune-up',
    'completed',
    'Tata Motors',
    {
      completionDate: new Date()
    }
  );

  if (completionResult.success) {
    console.log('✅ Test completion email sent successfully');
  } else {
    console.log('❌ Test completion email failed:', completionResult.error);
  }

  console.log('\n🎉 Email testing completed!');
  console.log('Check your email inbox for test messages.');
};

// Run the test
testEmail().catch(console.error); 