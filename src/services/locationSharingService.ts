// Location sharing service for temporary location sharing in chat
import { ref, set, onValue, off, get, DataSnapshot } from "firebase/database";
import { database } from "./firebase";

export interface SharedLocation {
  lat: number;
  lng: number;
  startedAt: number;
  expiresAt: number;
  durationMinutes: number;
}

/**
 * Start sharing location with a friend for a specific duration
 */
export const startLocationSharing = async (
  userId: string,
  friendId: string,
  durationMinutes: 15 | 30 | 60,
  initialLocation: { lat: number; lng: number }
): Promise<void> => {
  try {
    const sharingRef = ref(database, `locationSharing/${userId}/${friendId}`);
    const startedAt = Date.now();
    const expiresAt = startedAt + (durationMinutes * 60 * 1000);

    const sharingData: SharedLocation = {
      lat: initialLocation.lat,
      lng: initialLocation.lng,
      startedAt,
      expiresAt,
      durationMinutes
    };

    await set(sharingRef, sharingData);
    console.log(`✅ Location sharing started for ${durationMinutes} minutes`);
  } catch (error) {
    console.error("❌ Error starting location sharing:", error);
    throw error;
  }
};

/**
 * Stop location sharing early
 */
export const stopLocationSharing = async (
  userId: string,
  friendId: string
): Promise<void> => {
  try {
    const sharingRef = ref(database, `locationSharing/${userId}/${friendId}`);
    await set(sharingRef, null);
    console.log(`✅ Location sharing stopped`);
  } catch (error) {
    console.error("❌ Error stopping location sharing:", error);
    throw error;
  }
};

/**
 * Update shared location (called periodically while sharing)
 */
export const updateSharedLocation = async (
  userId: string,
  friendId: string,
  location: { lat: number; lng: number }
): Promise<void> => {
  try {
    const sharingRef = ref(database, `locationSharing/${userId}/${friendId}`);
    const snapshot = await get(sharingRef);
    
    if (!snapshot.exists()) {
      // Sharing doesn't exist or expired
      return;
    }

    const currentData = snapshot.val() as SharedLocation;
    
    // Only update if sharing hasn't expired
    if (Date.now() < currentData.expiresAt) {
      await set(sharingRef, {
        ...currentData,
        lat: location.lat,
        lng: location.lng
      });
    } else {
      // Auto-cleanup expired sharing
      await set(sharingRef, null);
    }
  } catch (error) {
    console.error("❌ Error updating shared location:", error);
  }
};

/**
 * Listen to shared location updates
 */
export const listenToSharedLocation = (
  userId: string,
  friendId: string,
  callback: (location: SharedLocation | null) => void
): (() => void) => {
  const sharingRef = ref(database, `locationSharing/${userId}/${friendId}`);
  
  const unsubscribe = onValue(
    sharingRef,
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      const data = snapshot.val() as SharedLocation;
      
      // Check if expired
      if (Date.now() >= data.expiresAt) {
        // Auto-cleanup
        set(sharingRef, null).catch(console.error);
        callback(null);
        return;
      }

      callback(data);
    },
    (error) => {
      console.error("❌ Error listening to shared location:", error);
      callback(null);
    }
  );

  return () => {
    off(sharingRef);
  };
};

/**
 * Get active location sharing
 */
export const getActiveLocationSharing = async (
  userId: string,
  friendId: string
): Promise<SharedLocation | null> => {
  try {
    const sharingRef = ref(database, `locationSharing/${userId}/${friendId}`);
    const snapshot = await get(sharingRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.val() as SharedLocation;
    
    // Check if expired
    if (Date.now() >= data.expiresAt) {
      // Auto-cleanup
      await set(sharingRef, null);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Error getting active location sharing:", error);
    return null;
  }
};

