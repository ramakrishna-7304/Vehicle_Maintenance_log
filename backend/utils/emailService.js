const nodemailer = require('nodemailer');

// Validate email configuration
const validateEmailConfig = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email configuration missing!');
    console.error('Please add EMAIL_USER and EMAIL_PASS to your .env file');
    return false;
  }
  return true;
};

// Create transporter (you'll need to configure this with your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER, // Add this to your .env file
    pass: process.env.EMAIL_PASS, // Add this to your .env file
  },
});

// Verify transporter connection
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    return false;
  }
};

const sendEmail = async (to, subject, html) => {
  try {
    // Validate configuration
    if (!validateEmailConfig()) {
      console.error('Email configuration validation failed');
      return false;
    }

    // Verify transporter
    const isVerified = await verifyTransporter();
    if (!isVerified) {
      console.error('Email transporter verification failed');
      return false;
    }

    console.log('📧 Attempting to send email to:', to);
    console.log('📧 Subject:', subject);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error('📧 To:', to);
    console.error('📧 Subject:', subject);
    console.error('📧 Error:', error.message);
    
    // Log specific error types
    if (error.code === 'EAUTH') {
      console.error('🔐 Authentication failed - check EMAIL_USER and EMAIL_PASS');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 Connection failed - check internet connection');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏰ Connection timeout');
    }
    
    return false;
  }
};

const sendApprovalEmail = async (userEmail, userName, logTitle, status, price, completionDate) => {
  console.log('📧 Sending approval email:');
  console.log('📧 To:', userEmail);
  console.log('📧 User:', userName);
  console.log('📧 Log:', logTitle);
  console.log('📧 Status:', status);
  console.log('📧 Price:', price);
  console.log('📧 Completion Date:', completionDate);

  const subject = `Maintenance Log ${status === 'accepted' ? 'Approved' : 'Rejected'}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${status === 'accepted' ? '#28a745' : '#dc3545'};">
        Maintenance Log ${status === 'accepted' ? 'Approved' : 'Rejected'}
      </h2>
      <p>Dear ${userName},</p>
      <p>Your maintenance log "<strong>${logTitle}</strong>" has been <strong>${status}</strong>.</p>
      
      ${status === 'accepted' ? `
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">Approval Details:</h3>
          <p><strong>Price:</strong> ₹${price}</p>
          <p><strong>Completion Date:</strong> ${new Date(completionDate).toLocaleDateString()}</p>
        </div>
      ` : `
        <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="color: #721c24; margin: 0;">Your maintenance request has been rejected. Please contact the service center for more details.</p>
        </div>
      `}
      
      <p>Thank you for using our service.</p>
      <p>Best regards,<br>Vehicle Maintenance Team</p>
    </div>
  `;

  const result = await sendEmail(userEmail, subject, html);
  
  if (result) {
    console.log('✅ Approval email sent successfully!');
  } else {
    console.error('❌ Failed to send approval email');
  }
  
  return result;
};

module.exports = {
  sendEmail,
  sendApprovalEmail,
  validateEmailConfig,
  verifyTransporter,
}; 