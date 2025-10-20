# Password Management Endpoints Guide

This document outlines all password-related endpoints in the CN Terminal Web App.

## 📋 Table of Contents

1. [User Change Password](#1-user-change-password)
2. [Admin Reset User Password](#2-admin-reset-user-password)
3. [Forgot Password](#3-forgot-password)
4. [Reset Password with Token](#4-reset-password-with-token)

---

## 1. User Change Password

**Endpoint**: `PUT /api/auth/change-password`  
**Authentication**: Required (Bearer Token)  
**Authorization**: Any authenticated user

### Description
Allows users to change their own password. Requires the current password for verification.

### Request Body
```json
{
  "currentPassword": "111111@1A",
  "newPassword": "NewPassword123@"
}
```

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Response Success (200)
```json
{
  "message": "Password changed successfully"
}
```

### Response Errors
- **400**: Current password is incorrect or validation failed
- **401**: Unauthorized (invalid/missing token)
- **500**: Internal server error

### Example Usage
```javascript
const token = 'your-jwt-token';
const response = await fetch('http://localhost:5000/api/auth/change-password', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    currentPassword: '111111@1A',
    newPassword: 'NewPassword123@'
  })
});
```

---

## 2. Admin Reset User Password

**Endpoint**: `PUT /api/auth/users/:id/reset-password`  
**Authentication**: Required (Bearer Token)  
**Authorization**: ADMIN only

### Description
Allows administrators to reset any user's password without requiring the current password. This is useful for account recovery or admin-initiated password resets.

### URL Parameters
- `id` (string, required): The user ID whose password should be reset

### Request Body
```json
{
  "newPassword": "NewPassword123@"
}
```

### Password Requirements
Same as user change password (see above).

### Response Success (200)
```json
{
  "message": "Password reset successfully",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### Response Errors
- **400**: Invalid password or validation failed
- **403**: Forbidden - Admin access required
- **404**: User not found
- **500**: Internal server error

### Example Usage
```javascript
const token = 'admin-jwt-token';
const userId = 'cmg00p60u0000hpi13g7wzfnf';
const response = await fetch(`http://localhost:5000/api/auth/users/${userId}/reset-password`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    newPassword: 'NewPassword123@'
  })
});
```

---

## 3. Forgot Password

**Endpoint**: `POST /api/auth/forgot-password`  
**Authentication**: Not required  
**Authorization**: Public

### Description
Initiates a password reset flow by sending a reset link to the user's email.

### Request Body
```json
{
  "email": "user@example.com"
}
```

### Response Success (200)
```json
{
  "message": "Password reset email sent"
}
```

### Response Errors
- **400**: Email is required
- **500**: Internal server error

### Notes
- Always returns success even if email doesn't exist (security best practice)
- Reset token expires after a configured time period
- Email contains a link to reset password page with token

---

## 4. Reset Password with Token

**Endpoint**: `POST /api/auth/reset-password`  
**Authentication**: Not required  
**Authorization**: Public (requires valid token)

### Description
Resets the password using a token received via email from the forgot password flow.

### Request Body
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPassword123@"
}
```

### Password Requirements
Same as user change password (see above).

### Response Success (200)
```json
{
  "message": "Password reset successfully"
}
```

### Response Errors
- **400**: Invalid or expired token, or validation failed
- **500**: Internal server error

---

## 🔐 Password Validation Rules

All password endpoints enforce the following validation rules:

1. **Minimum Length**: 8 characters
2. **Uppercase**: At least 1 uppercase letter (A-Z)
3. **Lowercase**: At least 1 lowercase letter (a-z)
4. **Number**: At least 1 digit (0-9)
5. **Special Character**: At least 1 special character (!@#$%^&*(),.?":{}|<>)

### Example Valid Passwords
- `Password123!`
- `Admin@2024`
- `SecureP@ss1`
- `111111@1A`

### Example Invalid Passwords
- `password` (no uppercase, number, or special char)
- `PASSWORD123` (no lowercase or special char)
- `Pass@1` (too short, minimum 8 characters)
- `Password123` (no special character)

---

## 🔍 Debugging & Logging

All password-related endpoints include comprehensive logging:

### Login Logs
- Email and password received
- User lookup result
- Password verification result
- Available users (if login fails)

### Password Change Logs
- User attempting change
- Current password verification
- New password validation
- Success/failure status

### Admin Password Reset Logs
- Admin user performing reset
- Target user details
- Password validation
- Success/failure status

### Viewing Logs
When backend is running with `npm run dev`, all logs appear in the terminal in real-time.

---

## 🛠️ Testing Password Endpoints

### Using cURL

**User Change Password:**
```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"currentPassword":"111111@1A","newPassword":"NewPassword123@"}'
```

**Admin Reset Password:**
```bash
curl -X PUT http://localhost:5000/api/auth/users/USER_ID/reset-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"newPassword":"NewPassword123@"}'
```

### Using Postman

1. Import the Swagger documentation from `/api-docs`
2. Set the Bearer token in Authorization
3. Use the request examples above

---

## 🚨 Common Issues & Solutions

### Issue: "Current password is incorrect"
**Solution**: 
- Check that you're using the correct current password
- Look at terminal logs to see password verification result
- Ensure no extra spaces in password

### Issue: "New password validation failed"
**Solution**:
- Ensure password meets all validation rules (8+ chars, uppercase, lowercase, number, special char)
- Check the `details` field in the error response for specific validation failures

### Issue: "Forbidden - Admin access required"
**Solution**:
- Ensure you're using an admin user's token
- Verify the token is valid and not expired
- Check that the user has ADMIN role

### Issue: Token not working
**Solution**:
- Verify JWT_SECRET is set in .env file
- Restart the backend server after adding JWT_SECRET
- Generate a fresh token by logging in again

---

## 📝 Security Notes

1. **Never log actual passwords** - All logs show only partial passwords (last 4 characters)
2. **Always hash passwords** - Using bcrypt with 12 salt rounds
3. **Current password required** - Users must provide current password to change it
4. **Admin bypass** - Admins can reset passwords without current password (useful for account recovery)
5. **Token expiration** - JWT tokens expire after 24 hours
6. **Reset tokens** - Password reset tokens are single-use and time-limited

---

## 🔄 Migration & Setup

If you need to reset or create admin credentials:

```bash
# Create first admin
npm run create-admin

# Update admin password
npm run update-admin-password
```

See `backend/scripts/README-CREATE-ADMIN.md` for more details.



