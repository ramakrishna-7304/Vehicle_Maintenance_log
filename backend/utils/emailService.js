const nodemailer = require('nodemailer');

// Validate email configuration
const validateEmailConfig = () => {
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing email configuration variables:', missingVars.join(', '));
    console.error('Please add these to your .env file');
    return false;
  }
  return true;
};

// Create transporter with flexible SMTP configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Verify transporter connection
const verifyTransporter = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
    console.log(`📧 SMTP Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
    return true;
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    return false;
  }
};

// Main sendEmail function - reusable and robust
const sendEmail = async (to, subject, html, text = null) => {
  try {
    // Validate configuration
    if (!validateEmailConfig()) {
      console.error('Email configuration validation failed');
      return { success: false, error: 'Email configuration missing' };
    }

    // Create transporter
    const transporter = createTransporter();

    // Verify transporter
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('❌ Transporter verification failed:', verifyError.message);
      return { success: false, error: 'Email service not available' };
    }

    console.log('📧 Attempting to send email:');
    console.log('📧 To:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 From:', process.env.EMAIL_FROM);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error('📧 To:', to);
    console.error('📧 Subject:', subject);
    console.error('📧 Error:', error.message);
    console.error('📧 Full Error:', error);
    
    // Log specific error types
    if (error.code === 'EAUTH') {
      console.error('🔐 Authentication failed - check SMTP_USER and SMTP_PASS');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 Connection failed - check SMTP_HOST and SMTP_PORT');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏰ Connection timeout');
    }
    
    return { success: false, error: error.message };
  }
};

// Specialized email function for log status changes
const sendLogStatusEmail = async (email, userName, logTitle, status, companyName, additionalData = {}) => {
  console.log('📧 Sending log status email:');
  console.log('📧 To:', email);
  console.log('📧 User:', userName);
  console.log('📧 Log:', logTitle);
  console.log('📧 Status:', status);
  console.log('📧 Company:', companyName);
  console.log('📧 Additional Data:', additionalData);

  let subject = '';
  let html = '';

  switch (status) {
    case 'accepted':
      subject = `Maintenance Log Accepted - ${logTitle}`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Maintenance Log Accepted</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #155724; margin-top: 0; text-align: center;">✅ Maintenance Log Accepted</h2>
          </div>
          
          <p>Dear <strong>${userName}</strong>,</p>
          
          <p>Great news! Your maintenance log "<strong>${logTitle}</strong>" has been accepted by <strong>${companyName}</strong>.</p>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0;">Approval Details:</h3>
            ${additionalData.price ? `<p><strong>Estimated Cost:</strong> ₹${additionalData.price}</p>` : ''}
            ${additionalData.completionDate ? `<p><strong>Estimated Completion Date:</strong> ${new Date(additionalData.completionDate).toLocaleDateString()}</p>` : ''}
          </div>
          
          <p>Your vehicle maintenance request is now being processed. We'll keep you updated on the progress.</p>
          
          <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Next Steps:</strong></p>
            <ul style="margin: 10px 0;">
              <li>Our team will begin work on your vehicle</li>
              <li>You'll receive updates on the progress</li>
              <li>We'll notify you when the work is completed</li>
            </ul>
          </div>
          
          <p>Thank you for choosing <strong>${companyName}</strong> for your vehicle maintenance needs.</p>
          
          <p>Best regards,<br>
          <strong>${companyName}</strong><br>
          Vehicle Maintenance Team</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </body>
        </html>
      `;
      break;

    case 'rejected':
      subject = `Maintenance Log Rejected - ${logTitle}`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Maintenance Log Rejected</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #721c24; margin-top: 0; text-align: center;">❌ Maintenance Log Rejected</h2>
          </div>
          
          <p>Dear <strong>${userName}</strong>,</p>
          
          <p>We regret to inform you that your maintenance log "<strong>${logTitle}</strong>" has been rejected by <strong>${companyName}</strong>.</p>
          
          ${additionalData.rejectionReason ? `
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Reason for Rejection:</h3>
              <p style="margin: 0;">${additionalData.rejectionReason}</p>
            </div>
          ` : `
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">Please contact the service center for more details about the rejection.</p>
            </div>
          `}
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
            <h3 style="color: #721c24; margin-top: 0;">What You Can Do:</h3>
            <ul style="margin: 10px 0;">
              <li>Contact ${companyName} for clarification</li>
              <li>Submit a new maintenance request with updated information</li>
              <li>Consider alternative service providers if needed</li>
            </ul>
          </div>
          
          <p>We apologize for any inconvenience this may have caused.</p>
          
          <p>Best regards,<br>
          <strong>${companyName}</strong><br>
          Vehicle Maintenance Team</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </body>
        </html>
      `;
      break;

    case 'completed':
      subject = `Maintenance Completed - ${logTitle}`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Maintenance Completed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #0c5460; margin-top: 0; text-align: center;">🔧 Maintenance Completed</h2>
          </div>
          
          <p>Dear <strong>${userName}</strong>,</p>
          
          <p>Excellent news! Your maintenance log "<strong>${logTitle}</strong>" has been completed by <strong>${companyName}</strong>.</p>
          
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="color: #155724; margin-top: 0;">🎉 Your Vehicle is Ready!</h3>
            <p style="margin: 10px 0; font-size: 18px;"><strong>You can now pick up your vehicle.</strong></p>
            ${additionalData.completionDate ? `<p style="margin: 10px 0;"><strong>Completion Date:</strong> ${new Date(additionalData.completionDate).toLocaleDateString()}</p>` : ''}
          </div>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0;">
            <h3 style="color: #0c5460; margin-top: 0;">Pickup Information:</h3>
            <ul style="margin: 10px 0;">
              <li>Please bring your vehicle registration documents</li>
              <li>Have your payment ready (if not already paid)</li>
              <li>Contact ${companyName} if you need assistance</li>
            </ul>
          </div>
          
          <p>Thank you for choosing <strong>${companyName}</strong> for your vehicle maintenance. We appreciate your business!</p>
          
          <p>Best regards,<br>
          <strong>${companyName}</strong><br>
          Vehicle Maintenance Team</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </body>
        </html>
      `;
      break;

    default:
      console.error('❌ Unknown status for email:', status);
      return { success: false, error: 'Unknown status' };
  }

  const result = await sendEmail(email, subject, html);
  
  if (result.success) {
    console.log('✅ Log status email sent successfully!');
  } else {
    console.error('❌ Failed to send log status email:', result.error);
  }
  
  return result;
};

// Completion reminder email function
const sendCompletionReminderEmail = async (email, userName, logTitle, companyName, completionDate, adminPrice) => {
  console.log('📧 Sending completion reminder email:');
  console.log('📧 To:', email);
  console.log('📧 User:', userName);
  console.log('📧 Log:', logTitle);
  console.log('📧 Company:', companyName);
  console.log('📧 Completion Date:', completionDate);

  const subject = `Vehicle Ready for Pickup - ${logTitle}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vehicle Ready for Pickup</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #155724; margin-top: 0; text-align: center;">🚗 Vehicle Ready for Pickup</h2>
      </div>
      
      <p>Dear <strong>${userName}</strong>,</p>
      
      <p>Great news! Your vehicle maintenance has been completed by <strong>${companyName}</strong> and is ready for pickup.</p>
      
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center;">
        <h3 style="color: #155724; margin-top: 0;">🎉 Your Vehicle is Ready!</h3>
        <p style="margin: 10px 0; font-size: 18px;"><strong>Maintenance Log:</strong> ${logTitle}</p>
        <p style="margin: 10px 0;"><strong>Completion Date:</strong> ${new Date(completionDate).toLocaleDateString()}</p>
        ${adminPrice ? `<p style="margin: 10px 0;"><strong>Total Cost:</strong> ₹${adminPrice}</p>` : ''}
      </div>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
        <h3 style="color: #155724; margin-top: 0;">Pickup Instructions:</h3>
        <ul style="margin: 10px 0;">
          <li>Please bring your vehicle registration documents</li>
          <li>Have your payment ready (if not already paid)</li>
          <li>Bring a valid ID for verification</li>
          <li>Contact ${companyName} if you need assistance</li>
        </ul>
      </div>
      
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h3 style="color: #856404; margin-top: 0;">Important Reminder:</h3>
        <p style="margin: 0;">Please pick up your vehicle within the next 3 days to avoid any storage charges.</p>
      </div>
      
      <p>Thank you for choosing <strong>${companyName}</strong> for your vehicle maintenance. We appreciate your business!</p>
      
      <p>Best regards,<br>
      <strong>${companyName}</strong><br>
      Vehicle Maintenance Team</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #666; text-align: center;">
        This is an automated reminder. Please do not reply to this email.
      </p>
    </body>
    </html>
  `;

  const result = await sendEmail(email, subject, html);
  
  if (result.success) {
    console.log('✅ Completion reminder email sent successfully!');
  } else {
    console.error('❌ Failed to send completion reminder email:', result.error);
  }
  
  return result;
};

// Test email function
const sendTestEmail = async (toEmail) => {
  const subject = '🧪 Test Email - Vehicle Maintenance System';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #0056b3; margin-top: 0; text-align: center;">🧪 Test Email</h2>
      </div>
      
      <p>This is a test email from your <strong>Vehicle Maintenance Log</strong> system.</p>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
        <h3 style="color: #0056b3; margin-top: 0;">Email Configuration Status:</h3>
        <ul style="margin: 10px 0;">
          <li>✅ SMTP Host: ${process.env.SMTP_HOST}</li>
          <li>✅ SMTP Port: ${process.env.SMTP_PORT}</li>
          <li>✅ SMTP User: ${process.env.SMTP_USER}</li>
          <li>✅ Email From: ${process.env.EMAIL_FROM}</li>
        </ul>
      </div>
      
      <p>If you received this email, your email configuration is working correctly!</p>
      
      <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="font-size: 12px; color: #666; text-align: center;">
        This is a test message from the Vehicle Maintenance System.
      </p>
    </body>
    </html>
  `;

  return await sendEmail(toEmail, subject, html);
};

module.exports = {
  sendEmail,
  sendLogStatusEmail,
  sendTestEmail,
  sendCompletionReminderEmail,
  validateEmailConfig,
  verifyTransporter,
  createTransporter,
}; 