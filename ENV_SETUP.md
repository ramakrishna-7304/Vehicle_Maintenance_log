# Environment Setup Guide - Enhanced Email System

## Required Environment Variables

Create a `.env` file in your `backend` directory with the following variables:

```bash
# Database Configuration
MONGO_URI=mongodb://localhost:27017/vehicle_maintenance

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
EMAIL_FROM=your_email@gmail.com

# Server Configuration
PORT=5000
```

## Email Service Configuration

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Vehicle Maintenance Log" as the name
   - Click "Generate"
   - Copy the 16-character password

3. **Update .env file**:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_character_app_password
   EMAIL_FROM=your_email@gmail.com
   ```

### Alternative Email Services

#### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
EMAIL_FROM=your_email@outlook.com
```

#### Yahoo Mail
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@yahoo.com
SMTP_PASS=your_app_password
EMAIL_FROM=your_email@yahoo.com
```

#### Custom SMTP Server
```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_username
SMTP_PASS=your_password
EMAIL_FROM=noreply@yourdomain.com
```

## Testing Your Configuration

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
📧 SMTP Host: smtp.gmail.com:587
```

## Email Flow Testing

### Complete Email Flow Test

1. **Register as User and Admin**
   ```bash
   # Register as admin
   POST /api/auth/register
   {
     "name": "Tata Motors",
     "email": "admin@tatamotors.com",
     "password": "password123",
     "role": "admin",
     "companyName": "Tata Motors",
     "companyPassword": "123123"
   }

   # Register as user
   POST /api/auth/register
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "password123",
     "role": "user"
   }
   ```

2. **Add Vehicle and Submit Log**
   - Login as user
   - Add a vehicle
   - Submit a maintenance log (select the admin company)
   - **Expected**: User receives submission confirmation email

3. **Admin Actions**
   - Login as admin
   - Accept the log with price and completion date
   - **Expected**: User receives acceptance email with details
   
   - Reject the log with reason
   - **Expected**: User receives rejection email with reason
   
   - Mark log as completed
   - **Expected**: User receives completion email

## Troubleshooting

### Common Issues

#### 1. "Authentication failed" Error
**Symptoms**: `EAUTH` error in logs
**Solutions**:
- Verify `SMTP_USER` and `SMTP_PASS` are correct
- For Gmail: Use App Password, not regular password
- Enable 2FA on your email account

#### 2. "Connection failed" Error
**Symptoms**: `ECONNECTION` error in logs
**Solutions**:
- Check `SMTP_HOST` and `SMTP_PORT` are correct
- Verify internet connection
- Check firewall settings

#### 3. "Email configuration missing" Error
**Symptoms**: Missing environment variables
**Solutions**:
- Ensure all required variables are in `.env` file
- Restart server after adding variables
- Check for typos in variable names

#### 4. Emails not being sent
**Symptoms**: No error but no emails received
**Solutions**:
- Check spam/junk folder
- Verify `EMAIL_FROM` is correct
- Test with different email service

### Debug Steps

1. **Check Environment Variables**:
   ```bash
   cd backend
   node -e "
   require('dotenv').config();
   console.log('SMTP_HOST:', process.env.SMTP_HOST);
   console.log('SMTP_PORT:', process.env.SMTP_PORT);
   console.log('SMTP_USER:', process.env.SMTP_USER);
   console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
   console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
   "
   ```

2. **Test SMTP Connection**:
   ```bash
   cd backend
   node -e "
   require('dotenv').config();
   const { verifyTransporter } = require('./utils/emailService');
   verifyTransporter().then(success => {
     console.log('SMTP Test:', success ? 'PASSED' : 'FAILED');
   });
   "
   ```

3. **Check Server Logs**:
   Look for these messages in your server console:
   ```
   📧 Sending log status email:
   📧 To: user@example.com
   📧 User: John Doe
   📧 Log: Oil Change
   📧 Status: accepted
   📧 Company: Tata Motors
   ✅ accepted email sent successfully to user@example.com
   ```

## Security Best Practices

1. **Never commit .env files** to version control
2. **Use App Passwords** instead of regular passwords
3. **Enable 2FA** on your email account
4. **Use environment variables** for all sensitive data
5. **Validate email addresses** before sending
6. **Rate limit email sending** in production

## Production Deployment

### Environment Variables for Production
```bash
# Production SMTP (example with SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### Email Service Recommendations
- **Development**: Gmail with App Password
- **Production**: SendGrid, AWS SES, or Mailgun
- **High Volume**: AWS SES or dedicated SMTP server

### Monitoring
- Monitor email delivery rates
- Set up email bounce handling
- Log email sending attempts
- Set up alerts for email failures

## Email Templates

The system now includes professional HTML email templates for:

1. **Submission Confirmation**: When user submits a log
2. **Acceptance**: When admin accepts with price and completion date
3. **Rejection**: When admin rejects with reason
4. **Completion**: When admin marks work as completed
5. **Completion Reminder**: When log reaches completion date (automated)
6. **Overdue Pickup Reminder**: When vehicle hasn't been picked up for 3+ days (automated)

All templates are responsive, professionally styled, and include:
- Company branding
- Clear status indicators
- Relevant information
- Next steps guidance
- Professional footer

## Automated Email Notifications (Cron Jobs)

The system includes automated email notifications using `node-cron`:

### 1. Completion Reminder (Every Hour)
- **Schedule**: `0 * * * *` (Every hour at minute 0)
- **Trigger**: When a log's `completionDate` is today
- **Email**: Notifies user that their vehicle is ready for pickup
- **Prevents Duplicates**: Uses `completionReminderSent` flag

### 2. Overdue Pickup Reminder (Every 6 Hours)
- **Schedule**: `0 */6 * * *` (Every 6 hours)
- **Trigger**: When a log's `completionDate` is 3+ days ago
- **Email**: Urgent reminder about overdue vehicle pickup
- **Prevents Duplicates**: Uses `overdueReminderSent` flag

### 3. Service Reminder (Daily at 8 AM)
- **Schedule**: `0 8 * * *` (Daily at 8:00 AM)
- **Trigger**: When a log's `nextDueDate` is tomorrow
- **Email**: Reminds user about upcoming service

## Testing Cron Jobs

### Manual Testing
```bash
# Test completion reminders
cd backend
node testCronJobs.js completion

# Test overdue pickup reminders
node testCronJobs.js overdue
```

### Creating Test Data
To test the cron jobs, you can create logs with specific dates:

```javascript
// For completion reminder test
const today = new Date();
const log = new MaintenanceLog({
  // ... other fields
  status: 'accepted',
  completionDate: today,
  completionReminderSent: false
});

// For overdue reminder test
const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
const overdueLog = new MaintenanceLog({
  // ... other fields
  status: 'accepted',
  completionDate: threeDaysAgo,
  overdueReminderSent: false
});
```

### Cron Job Logs
When running, the server will show:
```
🕐 Running completion reminder check...
📧 Found 2 logs with completion date today
📧 Sending completion reminder for log: Oil Change to user@example.com
✅ Completion reminder sent successfully for log: 507f1f77bcf86cd799439011
📧 Completion reminder check completed. Processed 2 logs.
```

## Cron Job Configuration

### Environment Variables for Cron Jobs
```bash
# Optional: Customize cron schedules
COMPLETION_REMINDER_SCHEDULE="0 * * * *"  # Every hour
OVERDUE_REMINDER_SCHEDULE="0 */6 * * *"   # Every 6 hours
SERVICE_REMINDER_SCHEDULE="0 8 * * *"     # Daily at 8 AM
```

### Disabling Cron Jobs
To disable specific cron jobs, comment them out in `server.js`:
```javascript
// Comment out to disable
// cron.schedule('0 * * * *', async () => { ... });
```

### Production Considerations
- **Timezone**: Cron jobs run in server timezone
- **Database Load**: Jobs run during off-peak hours
- **Error Handling**: Failed emails don't break the job
- **Logging**: All activities are logged for monitoring
- **Scaling**: Consider using external cron services for high-volume deployments

Your email system is now production-ready with comprehensive error handling, testing capabilities, professional email templates, and automated notifications! 