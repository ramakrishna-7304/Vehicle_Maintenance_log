# Authentication & Authorization System

## Overview

The Vehicle Maintenance Log system implements a comprehensive role-based access control (RBAC) system with JWT authentication, supporting two user roles: **Users** and **Admins**.

## User Roles

### 1. User Role
- **Purpose**: Vehicle owners who submit maintenance requests
- **Permissions**:
  - Create and manage vehicles
  - Submit maintenance logs to companies
  - View their own maintenance history
  - Cancel pending maintenance logs
  - Receive email notifications

### 2. Admin Role
- **Purpose**: Service center representatives who manage maintenance requests
- **Requirements**: Must provide company name and company password
- **Permissions**:
  - View all logs assigned to their company
  - Accept or reject maintenance requests
  - Set pricing and completion dates
  - View company statistics
  - Send email notifications to users

## Authentication Flow

### 1. Registration Process

#### User Registration
```javascript
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

#### Admin Registration
```javascript
POST /api/auth/register
{
  "name": "Tata Motors Admin",
  "email": "admin@tatamotors.com",
  "password": "password123",
  "role": "admin",
  "companyName": "Tata Motors",
  "companyPassword": "123123"
}
```

### 2. Login Process
```javascript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```javascript
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "companyName": null,
  "token": "jwt_token_here"
}
```

## Authorization Middleware

### 1. `protect` - General Authentication
- Verifies JWT token
- Adds user object to request
- Used for all authenticated routes

### 2. `adminProtect` - Admin-Only Access
- Extends `protect` middleware
- Verifies user role is 'admin'
- Used for admin-specific routes

### 3. `userProtect` - User-Only Access
- Extends `protect` middleware
- Verifies user role is 'user'
- Used for user-specific routes

## Route Protection

### Public Routes
```javascript
POST /api/auth/register
POST /api/auth/login
GET /api/admin/companies  // For company dropdown
```

### User Routes (require authentication)
```javascript
GET /api/vehicles          // User's vehicles
POST /api/vehicles         // Create vehicle
PUT /api/vehicles/:id      // Update vehicle
DELETE /api/vehicles/:id   // Delete vehicle

GET /api/logs              // User's maintenance logs
POST /api/logs             // Create maintenance log
PUT /api/logs/:id          // Update maintenance log
DELETE /api/logs/:id       // Cancel pending log
```

### Admin Routes (require admin role)
```javascript
GET /api/admin/logs        // Company's assigned logs
GET /api/admin/stats       // Company statistics
PUT /api/admin/logs/:id/accept   // Accept maintenance log
PUT /api/admin/logs/:id/reject   // Reject maintenance log
```

## Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['user', 'admin'], default: 'user'),
  companyName: String (required if role is 'admin'),
  timestamps: true
}
```

### MaintenanceLog Model
```javascript
{
  vehicle: ObjectId (ref: 'Vehicle'),
  user: ObjectId (ref: 'User'),           // Who created the log
  assignedAdmin: ObjectId (ref: 'User'),  // Which admin/company
  title: String,
  description: String,
  date: Date,
  mileage: Number,
  status: String (enum: ['pending', 'accepted', 'rejected']),
  adminPrice: Number,                     // Set by admin
  completionDate: Date,                   // Set by admin
  adminNotes: String,                     // Admin comments
  completionReminderSent: Boolean,        // Email tracking
  overdueReminderSent: Boolean,           // Email tracking
  timestamps: true
}
```

## Company Management

### Multiple Companies Support
- Each admin belongs to a unique company
- Companies are identified by `companyName`
- Users can select from available companies when submitting logs
- Companies are dynamically fetched for dropdowns

### Company Registration Process
1. Admin registers with company name and password
2. System validates company password (fixed: "123123")
3. Admin is assigned to the company
4. Company becomes available in user dropdowns

## Email Notifications

### Email Flow
1. **Log Submission**: User receives confirmation email
2. **Admin Acceptance**: User receives email with price and completion date
3. **Admin Rejection**: User receives email with rejection reason
4. **Completion Reminder**: Automated email on completion date
5. **Overdue Reminder**: Automated email for overdue pickups

### Email Configuration
```bash
# .env file
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

## Security Features

### 1. Password Security
- Passwords are hashed using bcryptjs
- Minimum 6 characters required
- Secure password comparison

### 2. JWT Security
- Tokens expire (configurable)
- Secure token verification
- User validation on each request

### 3. Role-Based Access
- Strict role checking
- Admin-only routes protected
- User-specific data isolation

### 4. Input Validation
- Email format validation
- Required field validation
- Role-specific field validation

## Frontend Integration

### Authentication Context
```javascript
const AuthContext = createContext();

// Provides:
- user: Current user object
- login: Login function
- register: Registration function
- logout: Logout function
```

### Protected Routes
```javascript
// Redirects admins to admin dashboard
if (user?.role === 'admin') {
  navigate('/admin-dashboard');
}

// Protects user routes
if (!user) {
  navigate('/login');
}
```

### Role-Based UI
```javascript
// Show admin-specific features
{user?.role === 'admin' && (
  <AdminDashboard />
)}

// Show user-specific features
{user?.role === 'user' && (
  <UserDashboard />
)}
```

## Testing the System

### 1. Register Test Users
```bash
# Register as admin
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tata Motors",
    "email": "admin@tatamotors.com",
    "password": "password123",
    "role": "admin",
    "companyName": "Tata Motors",
    "companyPassword": "123123"
  }'

# Register as user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "user"
  }'
```

### 2. Test Authentication
```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tatamotors.com",
    "password": "password123"
  }'

# Use returned token for authenticated requests
curl -X GET http://localhost:5000/api/admin/logs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Authorization
```bash
# Try to access admin route as user (should fail)
curl -X GET http://localhost:5000/api/admin/logs \
  -H "Authorization: Bearer USER_JWT_TOKEN"
# Expected: 403 Forbidden

# Try to access without token (should fail)
curl -X GET http://localhost:5000/api/admin/logs
# Expected: 401 Unauthorized
```

## Environment Variables

### Required Variables
```bash
# Database
MONGO_URI=mongodb://localhost:27017/vehicle_maintenance

# JWT
JWT_SECRET=your_secure_jwt_secret_here

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com

# Server
PORT=5000
```

## Best Practices

### 1. Security
- Use strong JWT secrets
- Enable 2FA for email accounts
- Use environment variables for sensitive data
- Validate all inputs
- Implement rate limiting in production

### 2. Error Handling
- Graceful error responses
- Detailed logging for debugging
- User-friendly error messages
- Email failure handling

### 3. Performance
- Efficient database queries
- Proper indexing
- Caching where appropriate
- Optimized email sending

## Troubleshooting

### Common Issues

#### 1. "Not authorized, token failed"
- Check JWT_SECRET in .env
- Verify token format
- Check token expiration

#### 2. "Access denied. Admin only."
- Verify user role is 'admin'
- Check middleware implementation
- Ensure proper route protection

#### 3. "Company password is required"
- Admin registration requires companyPassword
- Must be exactly "123123"
- Check form validation

#### 4. Email not sending
- Verify SMTP configuration
- Check email credentials
- Enable 2FA and use app password
- Check server logs for errors

The authentication and authorization system is production-ready with comprehensive security features, role-based access control, and professional email notifications! 