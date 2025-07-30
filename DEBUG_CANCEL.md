# Debug Guide: Cancel Functionality Issues

## If "Cancel failed" is showing, follow these steps:

### 1. Check Browser Console
Open browser developer tools (F12) and check the console for error messages:
- Look for "Cancel log error:" messages
- Check the error status code
- Look for specific error messages from the backend

### 2. Check Backend Console
In your backend terminal, look for:
- "Delete log request for ID:" messages
- "Log found:" with log details
- "Delete result:" messages
- Any error messages

### 3. Common Issues and Solutions

#### Issue: "Log not found" (404)
**Cause:** The log ID doesn't exist or has already been deleted
**Solution:** Refresh the page and try again

#### Issue: "Not authorized to delete this log" (403)
**Cause:** The user doesn't own the vehicle associated with the log
**Solution:** Check if the user is logged in with the correct account

#### Issue: "Cannot delete approved or rejected logs" (400)
**Cause:** The log status is not "pending"
**Solution:** Only pending logs can be cancelled

#### Issue: Network Error
**Cause:** Backend server is not running or there's a connection issue
**Solution:** 
1. Check if backend server is running (`npm run dev` in backend folder)
2. Check if the API URL is correct
3. Check network connectivity

### 4. Testing Steps

1. **Create a test log:**
   - Register as a user
   - Add a vehicle
   - Create a maintenance log (it will be pending)
   - Try to cancel it

2. **Check the flow:**
   - Log should be created with status "pending"
   - Cancel button should appear
   - Clicking cancel should show success message
   - Log should disappear from the list

### 5. Backend Debug Information

The backend now logs detailed information:
```
Delete log request for ID: [log_id]
User ID: [user_id]
Log found: { logId: ..., vehicleUserId: ..., requestUserId: ..., status: ... }
Delete result: { deletedCount: 1 }
```

### 6. Frontend Debug Information

The frontend now logs:
```
Attempting to cancel log: [log_id]
Cancel response: { message: "Log removed successfully" }
```

### 7. Common Error Messages

- **"Log not found"** - Log doesn't exist
- **"Not authorized"** - User doesn't own the log
- **"Cannot delete approved or rejected logs"** - Log status is not pending
- **"Network Error"** - Backend connection issue

### 8. Quick Fixes

1. **Restart backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Clear browser cache and refresh**

3. **Check if user is logged in properly**

4. **Verify the log status is "pending"**

### 9. Database Check

If issues persist, check the database directly:
```javascript
// In MongoDB shell or Compass
db.maintenancelogs.findOne({ _id: ObjectId("log_id") })
```

This will show the log details including status and vehicle ownership. 