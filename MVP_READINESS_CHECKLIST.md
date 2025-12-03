# MVP Readiness Checklist

**Goal:** Ensure PaceMatch is production-ready with all core features working.

## ✅ Core Features Status

### 1. Authentication & User Management
- [x] Email/Password sign-up with verification
- [x] Email/Password sign-in
- [x] Phone number sign-in (SMS verification)
- [x] Profile setup (first-time users)
- [x] Profile editing
- [x] Session persistence
- [ ] Google Sign-In (currently disabled - redirect loop issues on mobile)

### 2. Map & Location Services
- [x] Map display (Google Maps)
- [x] GPS location tracking
- [x] Location permissions handling
- [x] Real-time location updates
- [x] Nearby users display
- [x] Activity radius circles

### 3. Workout Tracking
- [x] Start/Stop workout
- [x] Activity type selection (Running, Cycling, Walking)
- [x] Distance tracking
- [x] Duration tracking
- [x] Route trail on map
- [x] Workout history
- [x] Workout sharing to feed

### 4. Matching & Discovery
- [x] Beacon mode (see nearby users)
- [x] Active workout mode (visible to others)
- [x] Activity-based matching
- [x] Fitness level filtering
- [x] Radius preferences (Nearby/Normal/Wide)
- [x] Distance calculations

### 5. Social Features
- [x] Feed (workout posts)
- [x] Post likes/kudos
- [x] Comments on posts
- [x] Friend requests
- [x] Friends list
- [x] Direct messaging
- [x] User profiles

### 6. Events
- [x] Create events
- [x] Join/Leave events
- [x] Event map display
- [x] Event search & filters
- [x] Event check-ins
- [x] My Events page

### 7. Settings & Preferences
- [x] Profile visibility settings
- [x] Fitness level visibility
- [x] Radius preference
- [x] Activity preferences
- [x] Sign out

## 🔧 Production Configuration

### Environment Variables Required
```bash
# .env file
VITE_GOOGLE_MAPS_API_KEY=your_key_here
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
VITE_FIREBASE_DATABASE_URL=your_database_url_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here

# Production flag (set to 'production' for production builds)
VITE_ENV=development
```

### Dummy Data Configuration
- [x] Dummy data can be disabled via environment variable
- [ ] Set `VITE_ENABLE_DUMMY_DATA=false` for production builds

### Firebase Configuration
- [x] Firebase project configured
- [x] Realtime Database rules set
- [x] Authentication providers enabled
- [ ] Email service configured (Gmail/SendGrid)
- [ ] Phone auth configured (if using)

## 🐛 Known Issues to Address

### Critical (Must Fix for MVP)
1. **Dummy Data in Production**
   - Currently enabled by default
   - Should be disabled in production builds
   - **Fix:** Use environment variable to control

2. **Google Sign-In on Mobile**
   - Redirect loop issues on Capacitor
   - Currently disabled for regular users
   - **Status:** Admin-only for now

### Medium Priority
1. **Error Handling**
   - Some error messages could be more user-friendly
   - Network error handling could be improved

2. **Performance**
   - Large workout history lists might be slow
   - Map with many markers could lag

### Low Priority (Post-MVP)
1. **Challenge Zones** (on hold)
2. **Advanced filtering options**
3. **Push notifications**

## 📱 Mobile App Build Checklist

### Android
- [ ] Generate production keystore
- [ ] Configure keystore in `capacitor.config.ts`
- [ ] Set Android OAuth Client ID in Google Cloud Console
- [ ] Test on physical device
- [ ] Test location permissions
- [ ] Test background location (if needed)

### iOS
- [ ] Configure bundle identifier
- [ ] Set up Apple Developer account
- [ ] Configure location permissions in Info.plist
- [ ] Test on physical device
- [ ] Test App Store submission process

## 🚀 Deployment Checklist

### Web Deployment
- [ ] Build production bundle: `npm run build`
- [ ] Test production build locally
- [ ] Deploy to Firebase Hosting
- [ ] Verify environment variables in production
- [ ] Test all core features in production

### Mobile Deployment
- [ ] Build Android APK/AAB
- [ ] Build iOS IPA
- [ ] Test on multiple devices
- [ ] Submit to app stores (if applicable)

## 📊 Testing Checklist

### Manual Testing
- [ ] Sign up new user
- [ ] Complete profile setup
- [ ] Start a workout
- [ ] See nearby users
- [ ] Create an event
- [ ] Join an event
- [ ] Post workout to feed
- [ ] Send friend request
- [ ] Send message
- [ ] View workout history
- [ ] Edit profile
- [ ] Sign out and sign back in

### Edge Cases
- [ ] No internet connection
- [ ] Location permission denied
- [ ] Invalid email format
- [ ] Weak password
- [ ] Very long workout duration
- [ ] Multiple rapid actions

## 🔒 Security Checklist

- [x] Firebase security rules configured
- [x] User data validation
- [x] Authentication required for sensitive operations
- [ ] Rate limiting (if needed)
- [ ] Input sanitization (verify)
- [ ] API key restrictions in Google Cloud Console

## 📝 Documentation

- [x] README.md
- [x] Feature documentation
- [ ] API documentation (if applicable)
- [ ] Deployment guide
- [ ] Troubleshooting guide

---

## Quick Production Build Steps

1. **Set environment variables:**
   ```bash
   VITE_ENV=production
   VITE_ENABLE_DUMMY_DATA=false
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Test production build:**
   ```bash
   npm run preview
   ```

4. **Deploy:**
   ```bash
   firebase deploy --only hosting
   ```

---

**Last Updated:** December 2024

