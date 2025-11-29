// Encountered users service - tracks users you've encountered within discovery radius
import { ref, set, get, onValue, off, remove, DataSnapshot } from "firebase/database";
import { database } from "./firebase";

export interface EncounteredUser {
  userId: string;
  encounteredAt: number; // First encounter timestamp
  lastSeenAt: number; // Most recent encounter timestamp
  distance: number; // Last known distance in km
  lat: number; // Last known location
  lng: number; // Last known location
  count: number; // Total number of encounters
}

/**
 * Add or update an encountered user record
 * @param userId - Current user's ID
 * @param encounteredUserId - ID of the user encountered
 * @param distance - Distance in km when encountered
 * @param location - Location where encounter happened {lat, lng}
 */
export const addEncounteredUser = async (
  userId: string,
  encounteredUserId: string,
  distance: number,
  location: { lat: number; lng: number }
): Promise<void> => {
  try {
    const encounterRef = ref(database, `encounteredUsers/${userId}/${encounteredUserId}`);
    
    // Get existing encounter data if it exists
    const snapshot = await get(encounterRef);
    const existingData = snapshot.exists() ? snapshot.val() : null;
    
    const now = Date.now();
    
    if (existingData) {
      // Update existing encounter
      await set(encounterRef, {
        userId: encounteredUserId,
        encounteredAt: existingData.encounteredAt, // Keep original encounter time
        lastSeenAt: now,
        distance,
        lat: location.lat,
        lng: location.lng,
        count: (existingData.count || 1) + 1
      });
    } else {
      // Create new encounter record
      await set(encounterRef, {
        userId: encounteredUserId,
        encounteredAt: now,
        lastSeenAt: now,
        distance,
        lat: location.lat,
        lng: location.lng,
        count: 1
      });
    }
  } catch (error) {
    console.error("❌ Error adding encountered user:", error);
    // Don't throw - this is a background tracking feature
  }
};

/**
 * Listen to user's encountered users history
 * @param userId - Current user's ID
 * @param callback - Callback function that receives encountered users object
 * @returns Unsubscribe function
 */
export const listenToEncounteredUsers = (
  userId: string,
  callback: (encounters: Record<string, EncounteredUser>) => void
): (() => void) => {
  const encountersRef = ref(database, `encounteredUsers/${userId}`);
  
  const unsubscribe = onValue(
    encountersRef,
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback({});
        return;
      }
      
      const encounters = snapshot.val() || {};
      callback(encounters);
    },
    (error) => {
      console.error("❌ Error listening to encountered users:", error);
      callback({});
    }
  );

  return () => {
    off(encountersRef);
  };
};

/**
 * Cleanup encounters older than 90 days
 * @param userId - Current user's ID
 */
export const cleanupOldEncounters = async (userId: string): Promise<void> => {
  try {
    const encountersRef = ref(database, `encounteredUsers/${userId}`);
    const snapshot = await get(encountersRef);
    
    if (!snapshot.exists()) {
      return;
    }
    
    const encounters = snapshot.val() || {};
    const now = Date.now();
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000); // 90 days in milliseconds
    
    const cleanupPromises: Promise<void>[] = [];
    
    Object.entries(encounters).forEach(([encounteredUserId, encounterData]: [string, any]) => {
      // Check if lastSeenAt is older than 90 days
      if (encounterData.lastSeenAt && encounterData.lastSeenAt < ninetyDaysAgo) {
        const encounterRef = ref(database, `encounteredUsers/${userId}/${encounteredUserId}`);
        cleanupPromises.push(remove(encounterRef).then(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🧹 Cleaned up old encounter: ${encounteredUserId}`);
          }
        }));
      }
    });
    
    await Promise.all(cleanupPromises);
    
    if (cleanupPromises.length > 0 && process.env.NODE_ENV === 'development') {
      console.log(`✅ Cleaned up ${cleanupPromises.length} old encounter(s)`);
    }
  } catch (error) {
    console.error("❌ Error cleaning up old encounters:", error);
    // Don't throw - cleanup is a background operation
  }
};

/**
 * Get encountered users (one-time fetch, not real-time)
 * @param userId - Current user's ID
 * @returns Promise with encountered users object
 */
export const getEncounteredUsers = async (
  userId: string
): Promise<Record<string, EncounteredUser>> => {
  try {
    const encountersRef = ref(database, `encounteredUsers/${userId}`);
    const snapshot = await get(encountersRef);
    
    if (!snapshot.exists()) {
      return {};
    }
    
    return snapshot.val() || {};
  } catch (error) {
    console.error("❌ Error getting encountered users:", error);
    return {};
  }
};

