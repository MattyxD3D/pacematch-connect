# 🔧 Fix Redirect Loop & Android OAuth Client ID

## The Problem

1. **Native Google Sign-In:** Error Code 10 (Android OAuth Client ID issue)
2. **Web-based Sign-In:** Causes redirect loop on mobile

---

## ✅ Solution: Fix Native Google Sign-In (Best Option)

Since native sign-in is better UX and you want to use it, let's fix the Android OAuth Client ID properly.

### Step 1: Verify Your Two Android OAuth Client IDs

**Go to:** https://console.cloud.google.com/apis/credentials?project=pacematch-gps

**For EACH Client ID, click on it and check:**

#### Client ID 1: `891545961086-ksjs21a9p50ld02mjireesv0abenc1f5`

- [ ] **Application type:** Must be **"Android"** (not "Web application")
- [ ] **Package name:** Must be exactly **`com.pacematch.app`** (no spaces, lowercase)
- [ ] **SHA-1:** Must be **`81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`**

#### Client ID 2: `891545961086-d7gpt4pn3cp4984hra9dko5ercjkg3d9`

- [ ] **Application type:** Must be **"Android"** (not "Web application")
- [ ] **Package name:** Must be exactly **`com.pacematch.app`** (no spaces, lowercase)
- [ ] **SHA-1:** Must be **`81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`**

### Step 2: Fix the One That's Wrong

**If a Client ID has wrong values:**
1. Click "Edit" on that Client ID
2. Fix the package name or SHA-1
3. Click "Save"
4. Wait 15-30 minutes

**If BOTH are wrong:**
1. Delete both
2. Wait 5 minutes
3. Create ONE new Android OAuth Client ID with correct values
4. Wait 15-30 minutes

### Step 3: Rebuild and Test

```bash
cd /Applications/q/pacematch-connect
npm run build
npx cap sync android
```

Then in Android Studio:
- Build → Clean Project
- Build → Rebuild Project
- Run → Run 'app'

---

## 🔄 Alternative: Fix Redirect Loop (If You Want Web-Based)

If you prefer to use web-based sign-in, here's how to fix the redirect loop:

### The Issue

The redirect loop happens because:
1. User clicks "Sign in with Google"
2. App redirects to Google
3. Google redirects back to app
4. `handleRedirectResult()` might not be called properly
5. App thinks user isn't signed in
6. Redirects back to login
7. Loop continues

### The Fix

The redirect handling is already in place, but we need to ensure it's called correctly. The current code should work, but if you're still getting loops, try this:

**Make sure `handleRedirectResult()` is called BEFORE any auth checks:**

1. In `App.tsx`, it's already called on mount ✅
2. In `LoginScreen.tsx`, it's already called ✅

**If still looping, add a flag to prevent multiple redirect attempts:**

```typescript
// In LoginScreen.tsx, add a ref to track if we've already checked
const hasCheckedRedirect = useRef(false);

useEffect(() => {
  if (hasCheckedRedirect.current) return;
  if (location.pathname !== "/login") return;
  
  hasCheckedRedirect.current = true;
  
  const checkRedirectResult = async () => {
    try {
      const result = await handleRedirectResult();
      if (result) {
        console.log("✅ Google sign-in redirect handled successfully");
      }
    } catch (error) {
      console.error("Error handling redirect result:", error);
    } finally {
      // Reset after a delay to allow retry if needed
      setTimeout(() => {
        hasCheckedRedirect.current = false;
      }, 5000);
    }
  };
  
  checkRedirectResult();
}, [location.pathname]);
```

---

## 🎯 Recommendation

**Best approach:** Fix the native Google Sign-In (Option 1)
- Better UX (native UI, no browser)
- No redirect loops
- Faster
- Just need to fix Android OAuth Client ID

**Steps:**
1. Verify which of your two Client IDs is correct
2. Fix the one that's wrong (or create new one if both are wrong)
3. Wait 15-30 minutes
4. Rebuild and test

---

## 📋 Quick Checklist

- [ ] **Verified both Android OAuth Client IDs** in Google Cloud Console
- [ ] **At least one has:**
  - [ ] Application type: Android
  - [ ] Package name: `com.pacematch.app` (exact match)
  - [ ] SHA-1: `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
- [ ] **Fixed or created correct Android OAuth Client ID**
- [ ] **Waited 15-30 minutes** after creating/updating
- [ ] **Rebuilt app** after waiting
- [ ] **Tested native Google Sign-In**

---

## ✅ After Fixing

Once the Android OAuth Client ID is correct:
1. Native Google Sign-In will work
2. No redirect loops (because you're using native, not web-based)
3. Better UX for users

**The redirect loop only happens with web-based sign-in. Native sign-in doesn't have this issue!** 🚀

