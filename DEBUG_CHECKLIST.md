# 🐛 Debug Checklist

## Current Status
- ✅ Dev server running on port 8080
- ✅ No linter errors
- ✅ TypeScript compilation successful

## Common Issues to Check

### 1. **Environment Variables**
- [ ] Check `.env` file exists
- [ ] Verify `VITE_GOOGLE_MAPS_API_KEY` is set
- [ ] Restart dev server after changing `.env`

### 2. **Firebase Configuration**
- [ ] Firebase config matches your project
- [ ] Realtime Database is enabled
- [ ] Database rules allow authenticated users
- [ ] Google Sign-In is enabled in Firebase Console

### 3. **Authentication Flow**
- [ ] Login screen loads
- [ ] Google Sign-In button works
- [ ] Popup/redirect authentication works
- [ ] User data saves to Firebase
- [ ] Redirects to profile-setup or map correctly

### 4. **Profile Setup**
- [ ] Profile setup screen loads
- [ ] Can enter username
- [ ] Can select activity type
- [ ] Can select gender
- [ ] Saves to Firebase successfully
- [ ] Redirects to map after completion

### 5. **Map Screen**
- [ ] Map loads (Google Maps API)
- [ ] "Start Activity" button works
- [ ] GPS permission requested
- [ ] Location tracking starts when activity active
- [ ] Location updates to Firebase
- [ ] User marker appears on map
- [ ] Nearby users appear (if any)
- [ ] Activity trail draws correctly

### 6. **Settings Screen**
- [ ] Settings screen loads
- [ ] Visibility toggle works
- [ ] Profile editing works
- [ ] Sign out works

## Quick Debug Commands

```bash
# Check if server is running
curl http://localhost:8080

# Check environment variables
cat .env

# Check Firebase connection
# Open browser console and check for Firebase errors

# Check for TypeScript errors
npm run build

# Check for linting errors
npm run lint
```

## Browser Console Checks

Open browser DevTools (F12) and check:

1. **Console Tab:**
   - [ ] No red errors
   - [ ] Firebase connection successful
   - [ ] Google Maps API loaded
   - [ ] Location permission granted

2. **Network Tab:**
   - [ ] Firebase requests succeed (200 status)
   - [ ] Google Maps API loads
   - [ ] No CORS errors

3. **Application Tab:**
   - [ ] Firebase auth token exists (after login)
   - [ ] Local storage has user data

## Common Error Messages

### "Google Maps API key is missing"
- **Fix:** Add `VITE_GOOGLE_MAPS_API_KEY` to `.env` file
- **Restart:** Dev server after adding

### "Firebase: Error (auth/popup-closed-by-user)"
- **Fix:** User closed popup - normal behavior, just try again

### "Geolocation permission denied"
- **Fix:** Allow location access in browser settings
- **Test:** Try in Chrome/Safari (not embedded browsers)

### "No users nearby"
- **Fix:** This is normal if you're the only user
- **Test:** Open app in multiple browser tabs with different accounts

### "Error loading Google Maps"
- **Fix:** Check API key is valid and has Maps JavaScript API enabled
- **Check:** Google Cloud Console > APIs & Services

## Testing Steps

1. **Test Login:**
   ```
   - Open http://localhost:8080
   - Click "Sign in with Google"
   - Complete authentication
   - Should redirect to profile-setup or map
   ```

2. **Test Profile Setup:**
   ```
   - Enter username
   - Select activity (running/cycling/walking)
   - Select gender (optional)
   - Click "Complete Setup"
   - Should redirect to map
   ```

3. **Test Map:**
   ```
   - Map should load
   - Click "Start Activity"
   - Grant location permission
   - Your marker should appear
   - Blue trail should draw as you move
   ```

4. **Test Settings:**
   ```
   - Click Settings icon
   - Toggle visibility
   - Edit profile
   - Sign out
   ```

## Next Steps

Tell me what specific issue you're experiencing and I'll help debug it!

Common issues to report:
- What screen are you on?
- What action are you trying?
- What error message do you see?
- What happens vs. what should happen?

