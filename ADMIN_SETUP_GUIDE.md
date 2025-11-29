# Admin System Setup Guide

## Overview

The admin system has been successfully implemented with the following features:

- **Admin Login**: Separate login page at `/admin/login`
- **Admin Dashboard**: Overview with statistics and quick actions
- **User Management**: View, suspend, ban, and delete users
- **Analytics**: View app statistics and user insights
- **Content Moderation**: Review and manage user reports
- **Events Management**: View and manage all events
- **System Settings**: Configure feature flags and manage admin emails

## Initial Setup: Adding Your First Admin Email

To set up the admin system, you need to add your first admin email to Firebase Database.

### Method 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `pacematch-gps`
3. Navigate to **Realtime Database**
4. Click on the database URL to open the data viewer
5. Create a new node called `adminEmails` (if it doesn't exist)
6. Under `adminEmails`, add a new child node with:
   - **Key**: Your email address (e.g., `admin@example.com`)
   - **Value**: `true`

The structure should look like:
```
adminEmails
  └── admin@example.com: true
```

### Method 2: Using Firebase CLI

If you have Firebase CLI installed:

```bash
firebase database:set /adminEmails/admin@example.com true --project pacematch-gps
```

### Method 3: Using the Admin Settings Page (After First Admin is Set)

Once you have at least one admin email configured, you can:
1. Log in to `/admin/login` with that email
2. Navigate to **System Settings**
3. Add additional admin emails through the UI

## Accessing the Admin Panel

1. Navigate to `/admin` or `/admin/login` in your app
2. Sign in with an email that has admin privileges using one of these methods:
   - **Email/Password**: Use your admin email and password
   - **Google Sign-In**: Click "Sign in with Google" (admin-only feature)
3. You'll be redirected to `/admin/dashboard`

**Note**: Google Sign-In is only available for admin login. Regular users must use phone or email/password authentication.

## Admin Features

### Dashboard (`/admin/dashboard`)
- Overview statistics (total users, active users, workouts, events, reports)
- Quick action buttons
- Recent activity feed

### User Management (`/admin/users`)
- View all users with search and filters
- Suspend users (7 days by default)
- Ban users permanently
- Unban/unsuspend users
- Delete user accounts
- View reports against users

### Analytics (`/admin/analytics`)
- Key metrics and statistics
- User growth charts
- Activity distribution
- Engagement metrics
- Export data functionality

### Content Moderation (`/admin/moderation`)
- View all user reports
- Filter by status (pending/resolved)
- Resolve or dismiss reports
- View reporter and reported user details
- Link to user management for actions

### Events Management (`/admin/events`)
- View all events
- Filter by type and category
- Delete events
- View event details and participants

### System Settings (`/admin/settings`)
- Toggle feature flags:
  - New Registrations
  - Workout Tracking
  - Nearby Users
  - Notifications
  - Maintenance Mode
- Manage admin emails (add/remove)
- View system information
- Link to Firebase Console

## Security Features

1. **Admin Status Check**: Admin status is verified on every route access
2. **Database Rules**: Firebase rules prevent non-admins from accessing admin data
3. **User Status Check**: Suspended/banned users cannot access the app
4. **Email-Based Access**: Admin access is controlled via email addresses in database

## Database Rules

The database rules have been updated to:
- Allow admins to read all user data
- Allow admins to modify user status (suspend/ban)
- Allow admins to read all reports
- Allow admins to manage events
- Restrict `adminEmails` access to admins only
- Allow admins to manage `systemSettings`

## User Status Management

Users can have three statuses:
- **active**: Normal user (default)
- **suspended**: Temporarily blocked (with expiration date)
- **banned**: Permanently blocked

Suspended users are automatically blocked from accessing the app. If a suspension expires, the user can access the app again, but an admin should unsuspend them properly.

## Feature Flags

Feature flags are stored in `systemSettings/featureFlags` and can be toggled from the System Settings page:
- `newRegistrations`: Enable/disable new user sign-ups
- `workoutTracking`: Enable/disable workout features
- `nearbyUsers`: Enable/disable nearby users feature
- `notifications`: Enable/disable notifications
- `maintenanceMode`: Put app in maintenance mode

## Troubleshooting

### "Access denied" error on admin login
- Verify the email is added to `adminEmails` in Firebase Database
- Check that the email matches exactly (case-sensitive)
- Ensure the value is set to `true` (boolean, not string)

### Cannot access admin routes
- Make sure you're logged in with an admin email
- Check browser console for errors
- Verify Firebase Database rules are updated

### Users not being blocked when suspended/banned
- Check that user status is set correctly in database
- Verify `status` field is set to "suspended" or "banned"
- Check browser console for errors

## Next Steps

1. Add your first admin email using Method 1 above
2. Test admin login at `/admin/login`
3. Explore the admin dashboard
4. Add additional admin emails as needed through System Settings
5. Configure feature flags as needed

## Support

For issues or questions about the admin system, check:
- Firebase Console for database structure
- Browser console for errors
- Network tab for API calls

