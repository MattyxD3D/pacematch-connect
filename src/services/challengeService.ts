// Challenge service - manages challenge zones, participation, and leaderboards
import { ref, set, get, onValue, off, remove, DataSnapshot, push, runTransaction } from "firebase/database";
import { database } from "./firebase";
import { calculateDistance } from "@/utils/distance";

export interface ChallengeZone {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  points: number; // points awarded per workout (default 10)
  active: boolean;
  visible: boolean;
  createdAt: number;
}

export interface ChallengeParticipation {
  userId: string;
  zoneId: string;
  date: string; // YYYY-MM-DD format
  workoutId: string;
  timestamp: number;
  points: number;
}

export interface ChallengeLeaderboardEntry {
  userId: string;
  zoneId: string;
  totalPoints: number;
  workoutsCount: number;
  lastWorkoutDate: string; // YYYY-MM-DD format
}

/**
 * Create a new challenge zone (admin only)
 */
export const createChallengeZone = async (
  zone: Omit<ChallengeZone, "id" | "createdAt">
): Promise<string> => {
  try {
    const zonesRef = ref(database, "challengeZones");
    const newZoneRef = push(zonesRef);
    const zoneId = newZoneRef.key!;

    const zoneData: ChallengeZone = {
      ...zone,
      id: zoneId,
      createdAt: Date.now(),
    };

    await set(newZoneRef, zoneData);
    console.log(`✅ Challenge zone created: ${zoneId}`);
    return zoneId;
  } catch (error) {
    console.error("❌ Error creating challenge zone:", error);
    throw error;
  }
};

/**
 * Update a challenge zone (admin only)
 */
export const updateChallengeZone = async (
  zoneId: string,
  updates: Partial<Omit<ChallengeZone, "id" | "createdAt">>
): Promise<void> => {
  try {
    const zoneRef = ref(database, `challengeZones/${zoneId}`);
    const snapshot = await get(zoneRef);

    if (!snapshot.exists()) {
      throw new Error("Challenge zone not found");
    }

    const currentData = snapshot.val() as ChallengeZone;
    const updatedData = {
      ...currentData,
      ...updates,
    };

    await set(zoneRef, updatedData);
    console.log(`✅ Challenge zone updated: ${zoneId}`);
  } catch (error) {
    console.error("❌ Error updating challenge zone:", error);
    throw error;
  }
};

/**
 * Delete a challenge zone (admin only)
 */
export const deleteChallengeZone = async (zoneId: string): Promise<void> => {
  try {
    const zoneRef = ref(database, `challengeZones/${zoneId}`);
    await remove(zoneRef);
    console.log(`✅ Challenge zone deleted: ${zoneId}`);
  } catch (error) {
    console.error("❌ Error deleting challenge zone:", error);
    throw error;
  }
};

/**
 * Get all challenge zones
 */
export const getAllChallengeZones = async (): Promise<ChallengeZone[]> => {
  try {
    const zonesRef = ref(database, "challengeZones");
    const snapshot = await get(zonesRef);

    if (!snapshot.exists()) {
      return [];
    }

    const zones = snapshot.val();
    return Object.values(zones) as ChallengeZone[];
  } catch (error) {
    console.error("❌ Error getting challenge zones:", error);
    throw error;
  }
};

/**
 * Get active and visible challenge zones
 */
export const getActiveChallengeZones = async (): Promise<ChallengeZone[]> => {
  try {
    const zones = await getAllChallengeZones();
    return zones.filter((zone) => zone.active && zone.visible);
  } catch (error) {
    console.error("❌ Error getting active challenge zones:", error);
    throw error;
  }
};

/**
 * Listen to challenge zones in real-time
 */
export const listenToChallengeZones = (
  callback: (zones: ChallengeZone[]) => void
): (() => void) => {
  const zonesRef = ref(database, "challengeZones");

  const unsubscribe = onValue(
    zonesRef,
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const zones = snapshot.val();
      const zoneList = Object.values(zones) as ChallengeZone[];
      callback(zoneList);
    },
    (error) => {
      console.error("❌ Error listening to challenge zones:", error);
      callback([]);
    }
  );

  return () => {
    off(zonesRef);
  };
};

/**
 * Check if a user location is within a challenge zone
 */
export const checkUserInZone = (
  userLat: number,
  userLng: number,
  zone: ChallengeZone
): boolean => {
  if (!userLat || !userLng) {
    return false;
  }

  const distanceKm = calculateDistance(userLat, userLng, zone.lat, zone.lng);
  if (distanceKm === null) {
    return false;
  }

  const distanceMeters = distanceKm * 1000;
  return distanceMeters <= zone.radius;
};

/**
 * Get today's date string in YYYY-MM-DD format
 */
const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Check if user has already earned points today for a zone
 */
export const hasEarnedPointsToday = async (
  userId: string,
  zoneId: string
): Promise<boolean> => {
  try {
    const today = getTodayDateString();
    const participationRef = ref(
      database,
      `challengeParticipation/${userId}/${zoneId}/${today}`
    );
    const snapshot = await get(participationRef);
    return snapshot.exists();
  } catch (error) {
    console.error("❌ Error checking today's participation:", error);
    return false;
  }
};

/**
 * Award challenge points to a user (once per day per zone)
 * Uses Firebase transaction to prevent duplicate awards
 */
export const awardChallengePoints = async (
  userId: string,
  zoneId: string,
  workoutId: string,
  zone: ChallengeZone
): Promise<boolean> => {
  try {
    const today = getTodayDateString();

    // Check if already earned today
    const alreadyEarned = await hasEarnedPointsToday(userId, zoneId);
    if (alreadyEarned) {
      console.log(
        `⏭️ User ${userId} already earned points for zone ${zoneId} today`
      );
      return false;
    }

    // Use transaction to prevent race conditions
    const participationRef = ref(
      database,
      `challengeParticipation/${userId}/${zoneId}/${today}`
    );

    await runTransaction(participationRef, (currentData) => {
      // If data already exists, don't award again
      if (currentData) {
        return currentData;
      }

      // Create participation record
      const participation: ChallengeParticipation = {
        userId,
        zoneId,
        date: today,
        workoutId,
        timestamp: Date.now(),
        points: zone.points,
      };

      return participation;
    });

    // Update leaderboard
    await updateLeaderboard(userId, zoneId, zone.points, today);

    console.log(
      `✅ Awarded ${zone.points} points to user ${userId} for zone ${zoneId}`
    );
    return true;
  } catch (error) {
    console.error("❌ Error awarding challenge points:", error);
    throw error;
  }
};

/**
 * Update leaderboard for a zone
 */
const updateLeaderboard = async (
  userId: string,
  zoneId: string,
  points: number,
  date: string
): Promise<void> => {
  try {
    const leaderboardRef = ref(
      database,
      `challengeLeaderboards/${zoneId}/${userId}`
    );

    await runTransaction(leaderboardRef, (currentData) => {
      if (currentData) {
        // Update existing entry
        return {
          ...currentData,
          totalPoints: (currentData.totalPoints || 0) + points,
          workoutsCount: (currentData.workoutsCount || 0) + 1,
          lastWorkoutDate: date,
        };
      } else {
        // Create new entry
        return {
          userId,
          zoneId,
          totalPoints: points,
          workoutsCount: 1,
          lastWorkoutDate: date,
        };
      }
    });
  } catch (error) {
    console.error("❌ Error updating leaderboard:", error);
    // Don't throw - leaderboard update failure shouldn't prevent points award
  }
};

/**
 * Get user's challenge stats for a zone
 */
export const getUserChallengeStats = async (
  userId: string,
  zoneId: string
): Promise<{
  totalPoints: number;
  workoutsCount: number;
  lastWorkoutDate: string | null;
  earnedToday: boolean;
}> => {
  try {
    const leaderboardRef = ref(
      database,
      `challengeLeaderboards/${zoneId}/${userId}`
    );
    const snapshot = await get(leaderboardRef);

    const earnedToday = await hasEarnedPointsToday(userId, zoneId);

    if (!snapshot.exists()) {
      return {
        totalPoints: 0,
        workoutsCount: 0,
        lastWorkoutDate: null,
        earnedToday,
      };
    }

    const data = snapshot.val() as ChallengeLeaderboardEntry;
    return {
      totalPoints: data.totalPoints || 0,
      workoutsCount: data.workoutsCount || 0,
      lastWorkoutDate: data.lastWorkoutDate || null,
      earnedToday,
    };
  } catch (error) {
    console.error("❌ Error getting user challenge stats:", error);
    return {
      totalPoints: 0,
      workoutsCount: 0,
      lastWorkoutDate: null,
      earnedToday: false,
    };
  }
};

/**
 * Get leaderboard for a zone (top N users)
 */
export const getZoneLeaderboard = async (
  zoneId: string,
  limit: number = 20
): Promise<ChallengeLeaderboardEntry[]> => {
  try {
    const leaderboardRef = ref(database, `challengeLeaderboards/${zoneId}`);
    const snapshot = await get(leaderboardRef);

    if (!snapshot.exists()) {
      return [];
    }

    const entries = snapshot.val();
    const leaderboard = Object.values(entries) as ChallengeLeaderboardEntry[];

    // Sort by totalPoints (descending), then by workoutsCount (descending)
    leaderboard.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.workoutsCount - a.workoutsCount;
    });

    return leaderboard.slice(0, limit);
  } catch (error) {
    console.error("❌ Error getting zone leaderboard:", error);
    return [];
  }
};

/**
 * Get all zones a user is currently in
 */
export const getZonesUserIsIn = (
  userLat: number,
  userLng: number,
  zones: ChallengeZone[]
): ChallengeZone[] => {
  if (!userLat || !userLng) {
    return [];
  }

  return zones.filter((zone) => {
    if (!zone.active) {
      return false;
    }
    return checkUserInZone(userLat, userLng, zone);
  });
};

