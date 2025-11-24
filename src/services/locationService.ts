// Location service for GPS tracking and Firebase updates
import { ref, set, onValue, off, get, DataSnapshot } from "firebase/database";
import { database } from "./firebase";

/**
 * Update user's location in Firebase
 * @param {string} userId - User ID
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {boolean} visible - Whether user is visible on map
 */
export const updateUserLocation = async (
  userId: string,
  lat: number,
  lng: number,
  visible: boolean = true
): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    
    // Get existing user data
    const snapshot = await get(userRef);
    const userData = snapshot.exists() ? snapshot.val() : {};

    // Update location while preserving other data
    const updateData = {
      ...userData,
      lat,
      lng,
      visible,
      timestamp: Date.now()
    };

    // Security: Don't log user location data in production
    // Only log in development mode if needed for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`📍 Location update initiated for user`);
    }

    await set(userRef, updateData);
    
    // Security: Don't log user IDs in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Location updated successfully`);
    }
  } catch (error) {
    console.error("❌ Error updating user location:", error);
    throw error;
  }
};

/**
 * Update user visibility
 * @param {string} userId - User ID
 * @param {boolean} visible - Visibility status
 */
export const updateUserVisibility = async (userId: string, visible: boolean): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    
    // Get existing user data
    const snapshot = await get(userRef);
    const userData = snapshot.exists() ? snapshot.val() : {};

    // Update visibility while preserving other data
    await set(userRef, {
      ...userData,
      visible,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error updating user visibility:", error);
    throw error;
  }
};

/**
 * Listen to all users' locations
 * @param {Function} callback - Callback function that receives users object
 * @returns {Function} Unsubscribe function
 */
export const listenToAllUsers = (callback: (users: Record<string, any>) => void): (() => void) => {
  const usersRef = ref(database, "users");
  
  // Security: Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log("🔍 Setting up listener for all users...");
  }
  
  const unsubscribe = onValue(
    usersRef,
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        // Security: Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log("⚠️ No users found in Firebase database");
        }
        callback({});
        return;
      }
      
      const users = snapshot.val() || {};
      const userCount = Object.keys(users).length;
      
      // Security: Only log count, not individual user data
      // Logging user names, locations, and IDs is a privacy/security risk
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 Firebase listener triggered - ${userCount} user(s) in database`);
      }
      
      callback(users);
    },
    (error) => {
      console.error("❌ Error listening to users:", error);
      callback({});
    }
  );

  return () => {
    // Security: Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log("🔇 Unsubscribing from users listener");
    }
    off(usersRef);
  };
};

/**
 * Get current user's location from Firebase
 * @param {string} userId - User ID
 * @returns {Promise<Object | null>} User location data
 */
export const getUserLocation = async (userId: string): Promise<{
  lat: number | null;
  lng: number | null;
  visible: boolean;
  timestamp: number | null;
} | null> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        lat: data.lat,
        lng: data.lng,
        visible: data.visible,
        timestamp: data.timestamp
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting user location:", error);
    throw error;
  }
};

