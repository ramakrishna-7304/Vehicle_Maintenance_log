# Email Setup Guide - Enhanced Version

## Overview
The Vehicle Maintenance Log system now has a robust email notification system that sends emails when:
1. **Log Status Changes**: When admins accept, reject, or complete maintenance logs
2. **User Notifications**: Professional HTML emails with company branding
3. **Error Handling**: Graceful handling of email failures without breaking the app

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

### 2. SMTP Configuration
The system uses Gmail SMTP with these settings:
- **Host**: smtp.gmail.com
- **Port**: 587
- **Secure**: false
- **Authentication**: Gmail App Password

## Email Functions

### 1. `sendEmail(to, subject, html, text)`
**Purpose**: General-purpose email sending function
**Parameters**:
- `to`: Recipient email address
- `subject`: Email subject
- `html`: HTML content
- `text`: Plain text content (optional)

**Returns**: `{ success: boolean, messageId?: string, error?: string }`

### 2. `sendLogStatusEmail(userEmail, userName, logTitle, status, companyName, additionalData)`
**Purpose**: Send status-specific emails for maintenance logs
**Parameters**:
- `userEmail`: User's email address
- `userName`: User's name
- `logTitle`: Maintenance log title
- `status`: 'accepted', 'rejected', or 'completed'
- `companyName`: Admin's company name
- `additionalData`: Object with price, completionDate, or rejectionReason

### 3. `sendTestEmail(toEmail)`
**Purpose**: Send a test email to verify configuration
**Parameters**:
- `toEmail`: Email address to send test to

## Email Templates

### Acceptance Email
- **Subject**: "Log Approved by [Company Name]"
- **Content**: Professional HTML with price and completion date
- **Styling**: Green theme with success indicators

### Rejection Email
- **Subject**: "Log Rejected by [Company Name]"
- **Content**: Professional HTML with rejection reason
- **Styling**: Red theme with error indicators

### Completion Email
- **Subject**: "Repair Completed by [Company Name]"
- **Content**: Professional HTML with completion notification
- **Styling**: Blue theme with completion indicators

## Testing Email Configuration

### 1. Command Line Testing
```bash
cd backend
node testEmail.js
```

### 2. API Testing
```bash
# Test email endpoint (requires authentication)
curl -X POST http://localhost:5000/api/test/email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"email": "test@example.com"}'
```

### 3. Server Startup Verification
When you start the server, look for:
```
🔧 Verifying email service configuration...
✅ Email service ready for notifications
```

## Integration Points

### 1. Log Controller (`logController.js`)
- Sends emails when log status changes via `updateLog`
- Uses `sendLogStatusEmail` for consistent formatting
- Handles email failures gracefully

### 2. Admin Controller (`adminController.js`)
- Sends emails when admins accept/reject logs
- Includes company name in emails
- Provides detailed feedback on email success/failure

### 3. Server Startup (`server.js`)
- Verifies email configuration on startup
- Logs email service status
- Continues running even if email fails

## Error Handling

### Common Issues and Solutions

#### 1. "Authentication failed" Error
**Cause**: Incorrect email credentials
**Solution**:
- Verify EMAIL_USER and EMAIL_PASS in .env
- Regenerate Gmail app password
- Check if 2FA is enabled

#### 2. "Connection failed" Error
**Cause**: Network or SMTP server issues
**Solution**:
- Check internet connection
- Verify Gmail SMTP settings
- Try different email service

#### 3. "Email configuration missing" Error
**Cause**: Missing environment variables
**Solution**:
- Add EMAIL_USER and EMAIL_PASS to .env file
- Restart server after adding variables

#### 4. Emails not being sent
**Cause**: Various configuration issues
**Solution**:
- Check backend console for error messages
- Run test email script
- Verify email service configuration

## Debug Information

### Backend Logs
The system provides detailed logging:
```
📧 Sending log status email:
📧 To: user@example.com
📧 User: John Doe
📧 Log: Oil Change
📧 Status: accepted
📧 Company: Tata Motors
✅ Log status email sent successfully!
```

### Email Response Objects
All email functions return structured responses:
```javascript
{
  success: true,
  messageId: "abc123@example.com"
}

// or on failure:
{
  success: false,
  error: "Authentication failed"
}
```

## Security Considerations

1. **Never commit .env files** to version control
2. **Use app passwords** instead of regular passwords
3. **Enable 2FA** on your email account
4. **Use environment variables** for all sensitive data
5. **Validate email addresses** before sending

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

## API Endpoints

### Test Email Endpoint
- **POST** `/api/test/email`
- **Auth**: Required (JWT token)
- **Body**: `{ "email": "test@example.com" }`
- **Response**: Success/failure status with details

## Usage Examples

### Sending a Test Email
```javascript
const { sendTestEmail } = require('./utils/emailService');

const result = await sendTestEmail('test@example.com');
if (result.success) {
  console.log('Test email sent!');
} else {
  console.error('Failed:', result.error);
}
```

### Sending a Status Email
```javascript
const { sendLogStatusEmail } = require('./utils/emailService');

const result = await sendLogStatusEmail(
  'user@example.com',
  'John Doe',
  'Oil Change',
  'accepted',
  'Tata Motors',
  { price: 1500, completionDate: new Date() }
);
```

The enhanced email system is now production-ready with comprehensive error handling, testing capabilities, and professional email templates! 