# Vehicle Maintenance Log - Setup Guide

## New Features Added

### Registration System
- Users can register as either "User" or "Admin"
- Admin registration requires company name and company password (123123)
- Admins represent service companies/garages

### User Flow
- Users submit maintenance logs to specific companies (admins)
- Logs are pending until admin approval
- Users receive email notifications on admin decisions
- Log status is displayed: Pending (yellow), Accepted (green), Rejected (red)
- **Price Display**: When admin accepts a log, the adminPrice is used instead of the original cost field
- **Cancel Functionality**: Users can cancel (delete) maintenance logs only when status is pending

### Admin Flow
- Admins see all logs assigned to their company
- Can accept/reject logs with price and completion date
- Dashboard shows total earnings, pending vehicles, accepted vehicles
- Email notifications sent to users on decisions

## Environment Setup

### Backend (.env file)
Create a `.env` file in the backend directory with:

```
# Database
MONGO_URI=mongodb://localhost:27017/vehicle_maintenance

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Email Configuration (for Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Server
PORT=5000
```

### Email Setup (Required for Notifications)
**Important**: Email notifications are sent when admins accept/reject logs. Follow these steps:

#### Gmail Setup (Recommended)
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Vehicle Maintenance Log" as the name
   - Click "Generate"
   - Copy the 16-character password
3. **Update .env file**:
   ```
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_16_character_app_password
   ```

#### Alternative Email Services
- **Outlook/Hotmail**: Change service to 'outlook' in emailService.js
- **Custom SMTP**: Configure host, port, and credentials

#### Testing Email Configuration
1. Start the backend server
2. Look for these console messages:
   ```
   🔧 Verifying email service configuration...
   ✅ Email service ready for notifications
   ```
3. If you see warnings, check your .env file and email credentials

## Running the Application

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Testing the Features

### 1. Register as Admin
- Go to registration page
- Select "Admin" role
- Enter company name
- Enter company password: 123123

### 2. Register as User
- Go to registration page
- Select "User" role
- Complete registration

### 3. User Flow
- Login as user
- Add vehicle
- Add maintenance log (select company from dropdown)
- Log will be pending until admin approval
- **Cancel pending logs**: Users can cancel logs that are still pending

### 4. Admin Flow
- Login as admin
- View pending maintenance requests
- Accept/reject with price and completion date
- **Email notifications**: Users receive emails when logs are accepted/rejected

### 5. Email Testing
- When admin accepts a log, user receives email with:
  - Price and completion date
  - Styled HTML template
- When admin rejects a log, user receives email with:
  - Rejection notification
  - Contact information

## Database Changes

### User Model
- Added `role` field (user/admin)
- Added `companyName` field (required for admins)

### MaintenanceLog Model
- Added `user` field (user who created log)
- Added `assignedAdmin` field (admin assigned to log)
- Added `status` field (pending/accepted/rejected)
- Added `adminPrice` field (set by admin)
- Added `completionDate` field (set by admin)
- Added `adminNotes` field (optional notes)

## Price Display Logic

The system now correctly displays prices based on log status:
- **Pending/Rejected logs**: Show original `cost` field (if any)
- **Accepted logs**: Show `adminPrice` field (set by admin)
- **Total cost calculations**: Use `adminPrice` for accepted logs, `cost` for others

## Cancel Functionality

Users can cancel (delete) maintenance logs with the following restrictions:
- **Only pending logs can be cancelled**
- **Accepted or rejected logs cannot be cancelled**
- **Cancel button appears in:**
  - Dashboard (Recent Logs section)
  - Maintenance History page
  - Global Search page
- **Backend validation**: Server prevents deletion of non-pending logs

## Email Notifications

### When Emails Are Sent
- **Log Acceptance**: When admin accepts a log with price and completion date
- **Log Rejection**: When admin rejects a log

### Email Content
- **Acceptance Email**: Includes price, completion date, and approval details
- **Rejection Email**: Includes rejection notification and contact information

### Troubleshooting Email Issues
1. **Check backend console** for email-related messages
2. **Verify .env file** has correct EMAIL_USER and EMAIL_PASS
3. **Test email configuration** on server startup
4. **Check Gmail app password** if using Gmail
5. **Enable 2FA** on your email account

## API Endpoints

### New Admin Endpoints
- `GET /api/admin/companies` - Get all companies (public)
- `GET /api/admin/logs` - Get admin's assigned logs
- `GET /api/admin/stats` - Get admin dashboard stats
- `PUT /api/admin/logs/:id/accept` - Accept log with price/date
- `PUT /api/admin/logs/:id/reject` - Reject log

### Updated Endpoints
- `POST /api/auth/register` - Now supports role and company fields
- `POST /api/logs` - Now assigns to admin and sets status
- `GET /api/logs` - Now includes admin information
- `DELETE /api/logs/:id` - Only allows deletion of pending logs

## Debug Information

### Backend Logs
The system provides detailed logging for:
- Email sending attempts and results
- Log acceptance/rejection operations
- User authentication and authorization
- Database operations

### Frontend Logs
Browser console shows:
- API request attempts and responses
- Error messages and status codes
- User interactions and state changes

## Common Issues and Solutions

### Email Not Working
- Check EMAIL_USER and EMAIL_PASS in .env
- Verify Gmail app password is correct
- Enable 2FA on Gmail account
- Check backend console for error messages

### Cancel Function Not Working
- Ensure log status is "pending"
- Check browser console for error messages
- Verify user owns the vehicle
- Check backend logs for authorization issues

### Admin Dashboard Issues
- Verify user role is "admin"
- Check if logs are assigned to the admin
- Ensure proper authentication

For detailed troubleshooting, see `DEBUG_CANCEL.md` and `EMAIL_SETUP.md` files. 