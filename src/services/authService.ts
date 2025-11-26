// Authentication service for Google Sign-In, Phone Auth, and Email/Password
import { 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInWithPhoneNumber,
  ConfirmationResult,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, googleProvider, database } from "./firebase";

// Export ConfirmationResult type for use in components
export type { ConfirmationResult };

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
  phoneNumber: string | null;
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
    // Clean up reCAPTCHA before signing out
    // This allows reCAPTCHA to be properly reinitialized on next login
    cleanupRecaptcha();
    
    // Clear user-specific localStorage data before signing out
    localStorage.removeItem("userProfile");
    localStorage.removeItem("userProfileUserId");
    localStorage.removeItem("activityState");
    
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
        phoneNumber: user.phoneNumber || "",
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
        phoneNumber: user.phoneNumber || existingData.phoneNumber || "",
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

/**
 * Sign up with email and password
 * @param {string} email - User email address
 * @param {string} password - User password
 * @param {string} displayName - User display name
 * @returns {Promise<UserData>} User object with uid, email, displayName, and other user data
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<UserData> => {
  try {
    // Validate inputs
    if (!email || !email.includes('@')) {
      throw new Error("Please enter a valid email address");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    if (!displayName || displayName.trim().length === 0) {
      throw new Error("Please enter your name");
    }

    console.log("📧 Creating account with email:", email);
    
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update display name
    if (displayName) {
      await updateProfile(user, { displayName: displayName.trim() });
    }
    
    console.log("✅ Account created successfully! User:", user.uid);
    
    // Save user to Firebase Realtime Database
    await saveUserToDatabase(user);
    
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL
    };
  } catch (error: any) {
    console.error("❌ Error signing up:", error);
    
    // Handle specific errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("This email is already registered. Please sign in instead.");
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error("Invalid email address. Please check and try again.");
    }
    if (error.code === 'auth/weak-password') {
      throw new Error("Password is too weak. Please use a stronger password.");
    }
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error("Email/password authentication is not enabled. Please contact support.");
    }
    
    throw error;
  }
};

/**
 * Sign in with email and password
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Promise<UserData>} User object with uid, email, displayName, and other user data
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserData> => {
  try {
    // Validate inputs
    if (!email || !email.includes('@')) {
      throw new Error("Please enter a valid email address");
    }
    if (!password) {
      throw new Error("Please enter your password");
    }

    console.log("📧 Signing in with email:", email);
    
    // Sign in user
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log("✅ Sign-in successful! User:", user.uid);
    
    // Update user data in database if needed
    await saveUserToDatabase(user);
    
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL
    };
  } catch (error: any) {
    console.error("❌ Error signing in:", error);
    
    // Handle specific errors
    if (error.code === 'auth/user-not-found') {
      throw new Error("No account found with this email. Please sign up first.");
    }
    if (error.code === 'auth/wrong-password') {
      throw new Error("Incorrect password. Please try again.");
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error("Invalid email address. Please check and try again.");
    }
    if (error.code === 'auth/user-disabled') {
      throw new Error("This account has been disabled. Please contact support.");
    }
    if (error.code === 'auth/too-many-requests') {
      throw new Error("Too many failed attempts. Please try again later.");
    }
    
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User email address
 * @returns {Promise<void>}
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    // Validate email
    if (!email || !email.includes('@')) {
      throw new Error("Please enter a valid email address");
    }

    console.log("📧 Sending password reset email to:", email);
    
    // Send password reset email
    await sendPasswordResetEmail(auth, email);
    
    console.log("✅ Password reset email sent successfully");
  } catch (error: any) {
    console.error("❌ Error sending password reset email:", error);
    
    // Handle specific errors
    if (error.code === 'auth/user-not-found') {
      throw new Error("No account found with this email address.");
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error("Invalid email address. Please check and try again.");
    }
    
    throw error;
  }
};

/**
 * Initialize reCAPTCHA verifier for phone authentication
 * @returns {Promise<RecaptchaVerifier>} reCAPTCHA verifier instance
 */
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Clean up reCAPTCHA verifier and container completely
 * This should be called when user logs out to allow reCAPTCHA to be reinitialized
 */
export const cleanupRecaptcha = (): void => {
  console.log("🧹 Cleaning up reCAPTCHA...");
  
  // Clear the verifier instance
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
      console.log("✅ reCAPTCHA verifier cleared");
    } catch (e) {
      console.warn("⚠️ Error clearing reCAPTCHA verifier:", e);
    }
    recaptchaVerifier = null;
  }
  
  // Remove the container completely from DOM
  if (typeof document !== 'undefined') {
    const container = document.getElementById('recaptcha-container');
    if (container) {
      try {
        // Clear all content and attributes
        container.innerHTML = '';
        container.removeAttribute('data-sitekey');
        container.removeAttribute('data-callback');
        container.removeAttribute('data-size');
        
        // Remove from DOM
        if (container.parentElement) {
          container.parentElement.removeChild(container);
        }
        console.log("✅ reCAPTCHA container removed from DOM");
      } catch (e) {
        console.warn("⚠️ Error removing reCAPTCHA container:", e);
      }
    }
    
    // Also clean up any old containers that might exist
    const oldContainers = document.querySelectorAll('[id^="recaptcha-container"]');
    oldContainers.forEach((oldContainer) => {
      try {
        if (oldContainer.parentElement) {
          oldContainer.parentElement.removeChild(oldContainer);
        }
      } catch (e) {
        // Ignore errors
      }
    });
  }
  
  console.log("✅ reCAPTCHA cleanup complete");
};

const getRecaptchaVerifier = async (): Promise<RecaptchaVerifier> => {
  // Always create a new verifier to avoid stale instances
  // Clear existing verifier if it exists
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      // Ignore clear errors
      console.warn("⚠️ Error clearing existing reCAPTCHA verifier:", e);
    }
    recaptchaVerifier = null;
  }

  // Wait for DOM to be ready
  if (typeof document === 'undefined' || !document.body) {
    await new Promise<void>(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
      } else {
        resolve();
      }
    });
  }

  // Ensure Firebase Auth is initialized
  if (!auth) {
    throw new Error("Firebase Auth is not initialized");
  }

  // Get or create container element
  let container: HTMLElement | null = document.getElementById('recaptcha-container');
  
  // CRITICAL: If container exists and has children or reCAPTCHA attributes, we need to remove it completely
  // reCAPTCHA widgets can't be reused in the same container - must create a fresh one
  if (container && (container.children.length > 0 || container.hasAttribute('data-sitekey'))) {
    console.log("🔄 Removing existing reCAPTCHA container (has rendered widget)...");
    // Remove the container completely from DOM
    if (container.parentElement) {
      container.parentElement.removeChild(container);
    }
    // Clear the reference
    container = null;
    // Wait a bit for DOM cleanup
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // If container doesn't exist, create it
  if (!container) {
    if (!document.body) {
      throw new Error("Document body not available");
    }
    
    container = document.createElement('div');
    container.id = 'recaptcha-container';
    // Make it visible but tiny (required for reCAPTCHA)
    container.style.cssText = 'position: fixed; bottom: 0; right: 0; width: 1px; height: 1px; overflow: hidden; z-index: -1;';
    document.body.appendChild(container);
    
    // Wait for container to be in DOM
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Ensure container is in the DOM
  if (!container.parentElement) {
    if (!document.body) {
      throw new Error("Document body not available");
    }
    document.body.appendChild(container);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Verify container is valid and empty
  if (!container || !container.parentElement) {
    throw new Error("reCAPTCHA container is not properly initialized");
  }
  
  // Double-check container is empty (required for reCAPTCHA)
  if (container.children.length > 0) {
    console.warn("⚠️ Container still has children, clearing again...");
    container.innerHTML = '';
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Wait for container to be fully ready
  await new Promise(resolve => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      setTimeout(resolve, 200);
    });
  });
  
  try {
    // Create reCAPTCHA verifier with container
    // Container is required for proper initialization in many environments
    recaptchaVerifier = new RecaptchaVerifier(auth, container, {
      size: 'invisible',
      callback: () => {
        console.log("✅ reCAPTCHA verified");
      },
      'expired-callback': () => {
        console.log("⚠️ reCAPTCHA expired, resetting...");
        if (recaptchaVerifier) {
          try {
            recaptchaVerifier.clear();
          } catch (e) {
            // Ignore
          }
        }
        recaptchaVerifier = null;
      }
    });
    
    console.log("✅ reCAPTCHA verifier created successfully");
    
    // For invisible reCAPTCHA, no explicit render() is needed
    // It will render automatically when used with signInWithPhoneNumber
    
    return recaptchaVerifier;
  } catch (error: any) {
    console.error("❌ Error creating reCAPTCHA verifier:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Handle "already rendered" error specifically
    const errorMsg = error.message?.toLowerCase() || '';
    if (errorMsg.includes('already been rendered') || errorMsg.includes('already rendered')) {
      console.log("🔄 reCAPTCHA already rendered - removing container and creating new one...");
      
      // Remove the existing container completely
      if (container && container.parentElement) {
        container.parentElement.removeChild(container);
      }
      
      // Create a fresh container with a unique ID
      const newContainerId = `recaptcha-container-${Date.now()}`;
      if (!document.body) {
        throw new Error("Document body not available");
      }
      
      const newContainer = document.createElement('div');
      newContainer.id = newContainerId;
      newContainer.style.cssText = 'position: fixed; bottom: 0; right: 0; width: 1px; height: 1px; overflow: hidden; z-index: -1;';
      document.body.appendChild(newContainer);
      
      // Update the old container ID reference (for future cleanup)
      const oldContainer = document.getElementById('recaptcha-container');
      if (oldContainer) {
        oldContainer.id = `recaptcha-container-old-${Date.now()}`;
      }
      
      // Wait for new container to be ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Try again with the new container
      try {
        recaptchaVerifier = new RecaptchaVerifier(auth, newContainer, {
          size: 'invisible',
          callback: () => {
            console.log("✅ reCAPTCHA verified (new container)");
          },
          'expired-callback': () => {
            console.log("⚠️ reCAPTCHA expired, resetting...");
            if (recaptchaVerifier) {
              try {
                recaptchaVerifier.clear();
              } catch (e) {
                // Ignore
              }
            }
            recaptchaVerifier = null;
          }
        });
        
        // Update the container ID back to standard for future use
        newContainer.id = 'recaptcha-container';
        console.log("✅ reCAPTCHA verifier created successfully with new container");
        return recaptchaVerifier;
      } catch (retryError: any) {
        console.error("❌ Retry with new container also failed:", retryError);
        // Continue to fallback
      }
    }
    
    // Clean up on error
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (e) {
        // Ignore
      }
    }
    recaptchaVerifier = null;
    
    // Try alternative: without container (fallback)
    try {
      console.log("🔄 Trying reCAPTCHA without container as fallback...");
      recaptchaVerifier = new RecaptchaVerifier(auth, {
        size: 'invisible',
        callback: () => {
          console.log("✅ reCAPTCHA verified (fallback)");
        },
        'expired-callback': () => {
          console.log("⚠️ reCAPTCHA expired, resetting...");
          recaptchaVerifier = null;
        }
      });
      
      console.log("✅ reCAPTCHA verifier created (fallback method)");
      return recaptchaVerifier;
    } catch (fallbackError: any) {
      console.error("❌ Fallback also failed:", fallbackError);
      
      // Check if Firebase Auth is properly configured
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error("Phone authentication is not enabled in Firebase. Please enable it in Firebase Console.");
      }
      
      // Provide helpful error message
      const errorMsgLower = error.message?.toLowerCase() || '';
      if (errorMsgLower.includes('container') || errorMsgLower.includes('haschildnodes') || errorMsgLower.includes('dom')) {
        throw new Error("reCAPTCHA initialization failed. Please ensure Phone Authentication is enabled in Firebase Console and refresh the page.");
      }
      
      if (errorMsgLower.includes('already been rendered') || errorMsgLower.includes('already rendered')) {
        throw new Error("reCAPTCHA was already rendered. Please refresh the page and try again.");
      }
      
      throw new Error(`reCAPTCHA initialization failed: ${error.message || 'Unknown error'}. Please check Firebase Console settings and refresh the page.`);
    }
  }
};

/**
 * Send SMS verification code to phone number
 * @param {string} phoneNumber - Phone number in E.164 format (e.g., +1234567890)
 * @returns {Promise<ConfirmationResult>} Confirmation result containing verification ID
 */
export const sendPhoneVerificationCode = async (phoneNumber: string): Promise<ConfirmationResult> => {
  try {
    // Validate phone number format (should start with +)
    if (!phoneNumber.startsWith('+')) {
      throw new Error("Phone number must include country code (e.g., +1234567890)");
    }

    // Get or create reCAPTCHA verifier (async now)
    const verifier = await getRecaptchaVerifier();
    
    console.log("📱 Sending SMS verification code to:", phoneNumber);
    console.log("📱 Phone number format check:", {
      startsWithPlus: phoneNumber.startsWith('+'),
      length: phoneNumber.length,
      formatted: phoneNumber
    });
    
    // Send verification code
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    
    console.log("✅ SMS code sent successfully");
    console.log("✅ Confirmation result:", {
      verificationId: confirmationResult?.verificationId ? "Present" : "Missing"
    });
    
    // Additional diagnostic info
    if (confirmationResult?.verificationId) {
      console.log("✅ Verification ID received - SMS should be on its way!");
      console.log("📱 Check your phone for the SMS code");
      console.log("⚠️ Note: If SMS doesn't arrive, check:");
      console.log("   1. Firebase Console > Authentication > Settings > Phone numbers for testing");
      console.log("   2. Firebase Console > Usage & Billing > Check SMS quota");
      console.log("   3. Phone number format is correct (+63XXXXXXXXXX)");
    }
    
    return confirmationResult;
  } catch (error: any) {
    console.error("❌ Error sending SMS code:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Full error:", JSON.stringify(error, null, 2));
    
    // Reset verifier on error
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (e) {
        // Ignore clear errors
      }
      recaptchaVerifier = null;
    }
    
    // Handle specific errors with more detailed messages
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error("Invalid phone number. Please check the format (include country code, e.g., +1234567890).");
    }
    if (error.code === 'auth/too-many-requests') {
      throw new Error("Too many requests. Please wait a few minutes before trying again.");
    }
    if (error.code === 'auth/quota-exceeded') {
      throw new Error("SMS quota exceeded. Please try again later.");
    }
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error("Phone authentication is not enabled. Please enable Phone Authentication in Firebase Console under Authentication > Sign-in method.");
    }
    if (error.code === 'auth/captcha-check-failed') {
      throw new Error("reCAPTCHA verification failed. Please refresh the page and try again.");
    }
    if (error.code === 'auth/missing-phone-number') {
      throw new Error("Phone number is required. Please enter your phone number.");
    }
    if (error.code === 'auth/internal-error') {
      // Provide more context about internal errors
      const errorMsg = error.message?.toLowerCase() || '';
      if (errorMsg.includes('recaptcha') || errorMsg.includes('captcha')) {
        throw new Error("reCAPTCHA error. Please ensure Phone Authentication is enabled in Firebase Console and refresh the page.");
      }
      if (errorMsg.includes('app verification') || errorMsg.includes('app check')) {
        throw new Error("App verification failed. Please check Firebase Console configuration.");
      }
      throw new Error(`Authentication error: ${error.message || 'Unknown error'}. Please check that Phone Authentication is enabled in Firebase Console and try again.`);
    }
    
    // Handle reCAPTCHA-related errors
    if (error.message?.includes('recaptcha') || error.message?.includes('captcha')) {
      throw new Error("reCAPTCHA error. Please refresh the page and ensure Phone Authentication is enabled in Firebase Console.");
    }
    
    // Re-throw with user-friendly message if it has a message
    if (error.message && typeof error.message === 'string') {
      // Check if it's already a user-friendly message
      if (error.message.includes('Please') || error.message.includes('must')) {
        throw error;
      }
      throw new Error(`Failed to send verification code: ${error.message}`);
    }
    
    throw new Error("Failed to send verification code. Please check that Phone Authentication is enabled in Firebase Console and try again.");
  }
};

/**
 * Verify SMS code and sign in user
 * @param {ConfirmationResult} confirmationResult - Confirmation result from sendPhoneVerificationCode
 * @param {string} code - 6-digit verification code from SMS
 * @returns {Promise<UserData>} User object with uid, phoneNumber, and other user data
 */
export const verifyPhoneCode = async (
  confirmationResult: ConfirmationResult,
  code: string
): Promise<UserData> => {
  try {
    // Validate code format (should be 6 digits)
    if (!/^\d{6}$/.test(code)) {
      throw new Error("Verification code must be 6 digits");
    }

    console.log("🔐 Verifying SMS code...");
    
    // Verify the code
    const result = await confirmationResult.confirm(code);
    const user = result.user;
    
    console.log("✅ Phone verification successful! User:", user.uid);
    
    // Save user to Firebase Realtime Database
    await saveUserToDatabase(user);
    
    return {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      photoURL: user.photoURL
    };
  } catch (error: any) {
    console.error("❌ Error verifying SMS code:", error);
    
    // Handle specific errors
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error("Invalid verification code. Please check the code and try again.");
    }
    if (error.code === 'auth/code-expired') {
      throw new Error("Verification code has expired. Please request a new code.");
    }
    if (error.code === 'auth/session-expired') {
      throw new Error("Session expired. Please start the verification process again.");
    }
    
    throw error;
  }
};

