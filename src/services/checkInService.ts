// Check-in service for Firebase - manages venue check-ins
import { ref, set, get, onValue, off, remove, DataSnapshot, query, orderByChild, equalTo } from "firebase/database";
import { database } from "./firebase";

export type Activity = "running" | "cycling" | "walking";

export interface CheckIn {
  userId: string;
  venueId: string;
  venueName: string;
  activity: Activity;
  userName: string;
  userAvatar: string;
  timestamp: number;
}

export interface UserCheckInData {
  userId: string;
  userName: string;
  userAvatar: string;
  activity: Activity;
}

export interface VenueData {
  id: string;
  name: string;
}

/**
 * Check in to a venue
 */
export const checkInToVenue = async (
  userId: string,
  venueId: string,
  venueData: VenueData,
  userData: UserCheckInData
): Promise<void> => {
  try {
    // First, check out from any previous venue
    const currentCheckIn = await getUserCheckIn(userId);
    if (currentCheckIn) {
      await checkOutFromVenue(userId, currentCheckIn.venueId);
    }

    // Create check-in record
    const checkInRef = ref(database, `checkIns/${venueId}/${userId}`);
    const checkIn: CheckIn = {
      userId,
      venueId,
      venueName: venueData.name,
      activity: userData.activity,
      userName: userData.userName,
      userAvatar: userData.userAvatar || "",
      timestamp: Date.now()
    };

    await set(checkInRef, checkIn);
    console.log(`✅ User ${userId} checked in to ${venueData.name}`);
  } catch (error) {
    console.error("❌ Error checking in to venue:", error);
    throw error;
  }
};

/**
 * Check out from a venue
 */
export const checkOutFromVenue = async (
  userId: string,
  venueId: string
): Promise<void> => {
  try {
    const checkInRef = ref(database, `checkIns/${venueId}/${userId}`);
    await remove(checkInRef);
    console.log(`✅ User ${userId} checked out from venue ${venueId}`);
  } catch (error) {
    console.error("❌ Error checking out from venue:", error);
    throw error;
  }
};

/**
 * Get all check-ins at a specific venue
 */
export const getCheckInsAtVenue = async (venueId: string): Promise<CheckIn[]> => {
  try {
    const venueCheckInsRef = ref(database, `checkIns/${venueId}`);
    const snapshot = await get(venueCheckInsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const checkIns = snapshot.val();
    return Object.values(checkIns) as CheckIn[];
  } catch (error) {
    console.error("❌ Error getting check-ins at venue:", error);
    return [];
  }
};

/**
 * Listen to check-ins at a venue in real-time
 */
export const listenToVenueCheckIns = (
  venueId: string,
  callback: (checkIns: CheckIn[]) => void
): (() => void) => {
  const venueCheckInsRef = ref(database, `checkIns/${venueId}`);
  
  const unsubscribe = onValue(
    venueCheckInsRef,
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const checkIns = snapshot.val();
      callback(Object.values(checkIns) as CheckIn[]);
    },
    (error) => {
      console.error("❌ Error listening to venue check-ins:", error);
      callback([]);
    }
  );
  
  return () => {
    off(venueCheckInsRef);
  };
};

/**
 * Get user's current check-in
 */
export const getUserCheckIn = async (userId: string): Promise<CheckIn | null> => {
  try {
    const checkInsRef = ref(database, "checkIns");
    const snapshot = await get(checkInsRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const allCheckIns = snapshot.val();
    
    // Search through all venues for this user's check-in
    for (const venueId in allCheckIns) {
      const venueCheckIns = allCheckIns[venueId];
      if (venueCheckIns[userId]) {
        return venueCheckIns[userId] as CheckIn;
      }
    }
    
    return null;
  } catch (error) {
    console.error("❌ Error getting user check-in:", error);
    return null;
  }
};

/**
 * Listen to user's current check-in in real-time
 */
export const listenToUserCheckIn = (
  userId: string,
  callback: (checkIn: CheckIn | null) => void
): (() => void) => {
  const checkInsRef = ref(database, "checkIns");
  
  const unsubscribe = onValue(
    checkInsRef,
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      
      const allCheckIns = snapshot.val();
      
      // Search through all venues for this user's check-in
      for (const venueId in allCheckIns) {
        const venueCheckIns = allCheckIns[venueId];
        if (venueCheckIns[userId]) {
          callback(venueCheckIns[userId] as CheckIn);
          return;
        }
      }
      
      callback(null);
    },
    (error) => {
      console.error("❌ Error listening to user check-in:", error);
      callback(null);
    }
  );
  
  return () => {
    off(checkInsRef);
  };
};

/**
 * Get all active check-ins across all venues
 */
export const getAllActiveCheckIns = async (): Promise<CheckIn[]> => {
  try {
    const checkInsRef = ref(database, "checkIns");
    const snapshot = await get(checkInsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allCheckIns = snapshot.val();
    const checkInsList: CheckIn[] = [];
    
    // Flatten all check-ins from all venues
    for (const venueId in allCheckIns) {
      const venueCheckIns = allCheckIns[venueId];
      for (const userId in venueCheckIns) {
        checkInsList.push(venueCheckIns[userId] as CheckIn);
      }
    }
    
    return checkInsList;
  } catch (error) {
    console.error("❌ Error getting all active check-ins:", error);
    return [];
  }
};

