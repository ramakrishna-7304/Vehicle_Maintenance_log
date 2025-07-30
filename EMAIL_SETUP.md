# Email Setup Guide

## Overview
The Vehicle Maintenance Log system sends email notifications to users when their maintenance logs are accepted or rejected by admins.

## Email Configuration

### 1. Gmail Setup (Recommended)

#### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

#### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Vehicle Maintenance Log" as the name
4. Click "Generate"
5. Copy the 16-character password

#### Step 3: Update .env File
Add these variables to your `backend/.env` file:
```
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

### 2. Alternative Email Services

#### Outlook/Hotmail
```javascript
const transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

#### Custom SMTP
```javascript
const transporter = nodemailer.createTransport({
  host: 'your-smtp-host.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

## Testing Email Configuration

### 1. Check Environment Variables
Make sure your `.env` file has the correct email settings:
```bash
# Check if variables are loaded
echo $EMAIL_USER
echo $EMAIL_PASS
```

### 2. Test Email Service
The system will automatically test the email configuration when:
- The server starts
- An admin accepts/rejects a log

### 3. Manual Testing
You can test the email service by:
1. Starting the backend server
2. Looking for these console messages:
   ```
   ✅ Email transporter verified successfully
   ```

## Email Templates

### Acceptance Email
When a log is accepted, users receive:
- **Subject**: "Maintenance Log Approved"
- **Content**: 
  - Greeting with user name
  - Log title and status
  - Price and completion date
  - Styled HTML template

### Rejection Email
When a log is rejected, users receive:
- **Subject**: "Maintenance Log Rejected"
- **Content**:
  - Greeting with user name
  - Log title and status
  - Contact information for service center
  - Styled HTML template

## Troubleshooting

### Common Issues

#### 1. "Authentication failed" Error
**Cause**: Incorrect email credentials
**Solution**:
- Verify EMAIL_USER and EMAIL_PASS in .env
- Regenerate app password if using Gmail
- Check if 2FA is enabled

#### 2. "Connection failed" Error
**Cause**: Network or SMTP server issues
**Solution**:
- Check internet connection
- Verify SMTP server settings
- Try different email service

#### 3. "Email configuration missing" Error
**Cause**: Missing environment variables
**Solution**:
- Add EMAIL_USER and EMAIL_PASS to .env file
- Restart the server after adding variables

#### 4. Emails not being sent
**Cause**: Various configuration issues
**Solution**:
- Check backend console for error messages
- Verify email service configuration
- Test with a simple email first

### Debug Steps

1. **Check Backend Logs**
   Look for these messages in your backend console:
   ```
   📧 Sending approval email:
   📧 To: user@example.com
   📧 User: John Doe
   📧 Log: Oil Change
   📧 Status: accepted
   ✅ Email sent successfully!
   ```

2. **Verify Email Configuration**
   ```bash
   # In backend directory
   node -e "
   require('dotenv').config();
   console.log('EMAIL_USER:', process.env.EMAIL_USER);
   console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
   "
   ```

3. **Test Email Service**
   ```javascript
   // Add this to your server.js for testing
   const { verifyTransporter } = require('./utils/emailService');
   
   // Test on server start
   verifyTransporter().then(success => {
     if (success) {
       console.log('Email service ready');
     } else {
       console.log('Email service not configured');
     }
   });
   ```

## Security Considerations

1. **Never commit .env files** to version control
2. **Use app passwords** instead of regular passwords
3. **Enable 2FA** on your email account
4. **Use environment variables** for all sensitive data

## Production Deployment

### Environment Variables
Set these in your production environment:
```bash
EMAIL_USER=your_production_email@domain.com
EMAIL_PASS=your_production_app_password
```

### Email Service Recommendations
- **Gmail**: Good for development and small scale
- **SendGrid**: Recommended for production
- **AWS SES**: Good for high volume
- **Mailgun**: Popular for transactional emails

### Monitoring
- Monitor email delivery rates
- Set up email bounce handling
- Log email sending attempts
- Set up alerts for email failures 