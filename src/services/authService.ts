// Authentication service for Google Sign-In
import { 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, googleProvider, database } from "./firebase";

/**
 * Check if running in a mobile device or Capacitor
 * @returns {boolean} True if mobile/Capacitor detected
 */
const isMobileOrCapacitor = (): boolean => {
  // Check for Capacitor
  if (typeof (window as any).Capacitor !== 'undefined') {
    return true;
  }
  
  // Check user agent for mobile devices
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // Check for touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check screen size (mobile typically < 768px)
  const isSmallScreen = window.innerWidth < 768;
  
  // For Chrome mobile view, check if screen is small (even without touch)
  // This catches Chrome DevTools mobile view and responsive design mode
  const isChromeMobileView = isSmallScreen && /chrome/i.test(userAgent);
  
  // Return true if: mobile UA, OR (touch device AND small screen), OR Chrome mobile view
  return isMobile || (isTouchDevice && isSmallScreen) || isChromeMobileView;
};

/**
 * Check if running in a storage-partitioned browser environment
 * (e.g., embedded browsers in Messenger, Facebook, etc.)
 * @returns {boolean} True if storage-partitioned environment detected
 */
const isStoragePartitioned = (): boolean => {
  try {
    // Try to access sessionStorage
    const testKey = '__storage_test__';
    sessionStorage.setItem(testKey, 'test');
    sessionStorage.removeItem(testKey);
    
    // Check for common embedded browser indicators
    const userAgent = navigator.userAgent.toLowerCase();
    const isEmbedded = 
      window.parent !== window || // In iframe
      userAgent.includes('wv') || // Android WebView
      userAgent.includes('messenger') || // Facebook Messenger
      userAgent.includes('fban') || // Facebook App
      userAgent.includes('fbav'); // Facebook App
    // Note: navigator.standalone === false is NORMAL for regular Safari browsers,
    // so we don't check it here to avoid false positives
    
    return isEmbedded;
  } catch (e) {
    // If sessionStorage access fails, likely storage-partitioned
    return true;
  }
};

export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Sign in with Google using redirect (better for mobile/Capacitor) or popup (desktop)
 * @returns {Promise<UserData | null>} User object with uid, displayName, email, photoURL, or null if redirect was initiated
 */
export const signInWithGoogle = async (): Promise<UserData | null> => {
  // Check if we're in a storage-partitioned environment BEFORE attempting auth
  if (isStoragePartitioned()) {
    throw new Error("STORAGE_PARTITIONED: Please open this app in your regular browser (Chrome, Safari, Firefox) instead of an embedded browser. Tap the menu icon and select 'Open in Browser'.");
  }

  // For mobile/Capacitor, always use redirect (better UX)
  // For desktop, try popup first, fallback to redirect
  const useRedirect = isMobileOrCapacitor();

  if (useRedirect) {
    // Use redirect method for mobile/Capacitor
    console.log("📱 Mobile/Capacitor detected - using redirect method");
    await signInWithRedirect(auth, googleProvider);
    // Note: signInWithRedirect doesn't return immediately - it redirects the page
    // The result will be handled by handleRedirectResult()
    return null; // Will be handled by redirect callback
  }

  // For desktop, try popup first
  try {
    console.log("🖥️ Desktop detected - trying popup method");
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Save user to Firebase Realtime Database
    await saveUserToDatabase(user);
    
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    };
  } catch (error: any) {
    // Handle specific auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Sign-in was cancelled. Please try again.");
    }
    if (error.code === 'auth/popup-blocked') {
      console.log("Popup blocked, switching to redirect method...");
      // Fallback to redirect
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    
    // Handle disallowed_useragent error - use redirect instead
    if (error.code === 'auth/unauthorized-domain' || 
        error.message?.includes('disallowed_useragent') ||
        error.message?.includes('Use secure browsers')) {
      console.log("Popup authentication blocked, switching to redirect method...");
      
      // Check again if storage-partitioned before redirect
      if (isStoragePartitioned()) {
        throw new Error("STORAGE_PARTITIONED: Please open this app in your regular browser (Chrome, Safari, Firefox) instead of an embedded browser. Tap the menu icon and select 'Open in Browser'.");
      }
      
      // Use redirect method as fallback
      await signInWithRedirect(auth, googleProvider);
      return null; // Will be handled by redirect callback
    }
    
    // Handle storage-partitioned error from redirect
    if (error.message?.includes('missing initial state') ||
        error.message?.includes('sessionStorage') ||
        error.message?.includes('storage-partitioned')) {
      throw new Error("STORAGE_PARTITIONED: Please open this app in your regular browser (Chrome, Safari, Firefox) instead of an embedded browser. Tap the menu icon and select 'Open in Browser'.");
    }
    
    // COOP warnings are logged but don't break functionality - sign-in still works
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

/**
 * Handle redirect result after signInWithRedirect
 * Call this in your App component after page load to check if user returned from redirect
 * @returns {Promise<UserData | null>} User object if redirect was successful, null otherwise
 */
export const handleRedirectResult = async (): Promise<UserData | null> => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      
      // Save user to Firebase Realtime Database
      await saveUserToDatabase(user);
      
      return {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      };
    }
    return null;
  } catch (error: any) {
    // Handle storage-partitioned error
    if (error.message?.includes('missing initial state') ||
        error.message?.includes('sessionStorage') ||
        error.message?.includes('storage-partitioned')) {
      console.error("Storage-partitioned browser detected in redirect result");
      // Don't throw - let the user try again with better guidance
      return null;
    }
    console.error("Error handling redirect result:", error);
    throw error;
  }
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

/**
 * Save user data to Firebase Realtime Database
 * @param {User} user - Firebase user object
 */
const saveUserToDatabase = async (user: User): Promise<void> => {
  try {
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    // Only update if user doesn't exist or update basic info
    if (!snapshot.exists()) {
      await set(userRef, {
        name: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        createdAt: Date.now(),
        // Profile setup fields (will be updated when user completes profile)
        activity: null,
        gender: null,
        visible: true, // Default to visible when user is created
        lat: null,
        lng: null,
        timestamp: null,
        // Matching preferences (defaults)
        fitnessLevel: "intermediate",
        pace: null, // Will be calculated from workout history
        visibility: {
          visibleToAllLevels: true,
          allowedLevels: ["beginner", "intermediate", "pro"]
        },
        searchFilter: "all", // Who do I want to find? (Beginner/Intermediate/Pro/All)
        radiusPreference: "normal"
      });
    } else {
      // Update basic info if it changed
      const existingData = snapshot.val();
      await set(userRef, {
        ...existingData,
        name: user.displayName || existingData.name,
        email: user.email || existingData.email,
        photoURL: user.photoURL || existingData.photoURL,
        // Ensure matching fields exist with defaults if missing
        fitnessLevel: existingData.fitnessLevel || "intermediate",
        visibility: existingData.visibility || {
          visibleToAllLevels: true,
          allowedLevels: ["beginner", "intermediate", "pro"]
        },
        searchFilter: existingData.searchFilter || "all",
        radiusPreference: existingData.radiusPreference || "normal"
      });
    }
  } catch (error) {
    console.error("Error saving user to database:", error);
    throw error;
  }
};

/**
 * Get user data from Firebase
 * @param {string} userId - User ID
 * @returns {Promise<any>} User data object
 */
export const getUserData = async (userId: string): Promise<any> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    throw error;
  }
};

/**
 * Update user profile data
 * @param {string} userId - User ID
 * @param {any} profileData - Profile data to update
 */
export const updateUserProfile = async (userId: string, profileData: any): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    const existingData = snapshot.exists() ? snapshot.val() : {};
    
    await set(userRef, {
      ...existingData,
      ...profileData,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function that receives user object or null
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

