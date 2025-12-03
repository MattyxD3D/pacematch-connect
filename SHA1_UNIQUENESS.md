# 🔑 SHA-1 Uniqueness Explained

## Short Answer

**The SHA-1 is unique to your COMPUTER (or user account), not Android Studio.**

---

## How It Works

### Debug Keystore Location
The debug keystore is stored at:
```
~/.android/debug.keystore
```

This is in your **home directory**, not in Android Studio.

---

## When SHA-1 is the Same

✅ **Same SHA-1 if:**
- Same computer
- Same user account
- Any Android Studio version/installation
- Any Android project on that computer

**Why?** All Android projects on the same computer use the same debug keystore by default.

---

## When SHA-1 is Different

❌ **Different SHA-1 if:**
- **Different computers** (each computer has its own debug keystore)
- **Different user accounts** on the same computer (different home directories)
- **Different debug keystore** (if you manually created/used a different one)

---

## Practical Implications

### For Your Current Setup
- ✅ **Your computer** (Mac): SHA-1 is `81:55:30:46:0C:B0:FC:A5:49:B8:96:F6:0B:CE:48:B6:B3:F9:ED:CD`
- ✅ **All projects** on this computer will use this same SHA-1 (for debug builds)
- ✅ **Any Android Studio** on this computer will use this SHA-1

### If You Switch Computers
- ❌ **Different computer** = Different debug keystore = Different SHA-1
- ⚠️ You'll need to:
  1. Get the new SHA-1 from the new computer
  2. Add it to Google Cloud Console as a **second** Android OAuth Client ID
  3. (Or use the same keystore file by copying it)

---

## Multiple Developers/Computers

If other developers want to test:
- Each developer's computer has a different SHA-1
- You can add **multiple Android OAuth Client IDs** in Google Cloud Console
- Each one can have the same package name but different SHA-1s

**Example:**
- Android OAuth Client ID #1: Package `com.pacematch.app`, SHA-1 from your Mac
- Android OAuth Client ID #2: Package `com.pacematch.app`, SHA-1 from another computer

---

## Summary

| Scenario | SHA-1 |
|----------|-------|
| Same computer, different Android Studio | ✅ Same |
| Same computer, different projects | ✅ Same |
| Different computer | ❌ Different |
| Different user account | ❌ Different |

**Bottom line:** The SHA-1 is tied to your computer/user account, not Android Studio! 🖥️

