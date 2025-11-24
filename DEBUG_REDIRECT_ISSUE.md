# 🔍 Debug: Redirect After Sign-In Issue

## Problem
After signing in, user is not being directed to the home page (map/profile-setup), but instead to the old/legacy version of the app.

## Possible Causes

### 1. **Wrong URL Being Accessed**
- **New app (pacematch-connect)**: `http://localhost:8080`
- **Old app (pacematch-app)**: `http://localhost:3000` (or other port)

**Check:** Make sure you're accessing `http://localhost:8080` (the new app)

### 2. **Firebase Redirect URL Configuration**
Firebase might have the old app's URL configured as the redirect URL.

**Fix:** Check Firebase Console → Authentication → Settings → Authorized domains
- Should include: `localhost:8080` (new app)
- Remove or update: `localhost:3000` (old app)

### 3. **Browser Cache/Storage**
Old session data might be cached.

**Fix:**
- Clear browser cache
- Clear localStorage/sessionStorage
- Try incognito/private window

### 4. **Multiple Apps Running**
Both old and new apps might be running, causing confusion.

**Fix:** Stop the old app:
```bash
# Kill old app processes
pkill -f "pacematch-app"
# Or find and kill specific port
lsof -ti:3000 | xargs kill
```

## Debug Steps Added

I've added console logging to track the redirect flow:

1. **LoginScreen.tsx:**
   - Logs when sign-in starts
   - Logs when sign-in succeeds
   - Logs user data from Firebase
   - Logs navigation decisions

2. **App.tsx:**
   - Logs when app mounts
   - Logs current route changes
   - Logs ProtectedRoute decisions

3. **ProtectedRoute:**
   - Logs authentication state
   - Logs redirect decisions

## How to Debug

1. **Open Browser Console (F12)**
2. **Clear console**
3. **Sign in with Google**
4. **Watch console logs:**
   - Look for: `🔐 Starting Google Sign-In...`
   - Look for: `✅ Sign-in successful!`
   - Look for: `📋 User data from Firebase:`
   - Look for: `🗺️ User has activity, redirecting to /map` OR `👤 User needs profile setup, redirecting to /profile-setup`
   - Look for: `📍 Current route:`

5. **Check what happens:**
   - Does it navigate to `/map` or `/profile-setup`?
   - Does it redirect back to `/` (login)?
   - Does it go to a different URL entirely?

## Expected Flow

```
1. User clicks "Sign in with Google"
   → 🔐 Starting Google Sign-In...

2. Google popup/redirect happens
   → (User authenticates)

3. Sign-in completes
   → ✅ Sign-in successful! User: {uid}

4. Fetch user data from Firebase
   → 📋 User data from Firebase: {activity: "running", ...}

5. Navigate based on profile completion
   → 🗺️ User has activity, redirecting to /map
   OR
   → 👤 User needs profile setup, redirecting to /profile-setup

6. ProtectedRoute checks authentication
   → 🔒 ProtectedRoute - loading: false, user: {uid}
   → ✅ ProtectedRoute - user authenticated, rendering children

7. Route changes
   → 📍 Current route: /map (or /profile-setup)
```

## Quick Fixes

### Fix 1: Verify You're on the Right URL
```bash
# Make sure you're accessing:
http://localhost:8080

# NOT:
http://localhost:3000  # (old app)
```

### Fix 2: Stop Old App
```bash
cd /Applications/PaceMatch_GPS
pkill -f "pacematch-app"
```

### Fix 3: Clear Browser Data
- Open DevTools (F12)
- Application tab → Clear storage
- Or use incognito window

### Fix 4: Check Firebase Console
1. Go to Firebase Console
2. Authentication → Settings → Authorized domains
3. Make sure `localhost:8080` is listed
4. Remove `localhost:3000` if it's there

## Next Steps

After trying the fixes above, tell me:
1. What URL are you accessing? (`localhost:8080` or `localhost:3000`?)
2. What do you see in the browser console after signing in?
3. What route does it navigate to? (check the URL bar)
4. Does it show the new app's UI or the old app's UI?

