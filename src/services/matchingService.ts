// Matching service for PACE-MATCH v1 algorithm
import { filterUsersByDistance } from "@/utils/distance";
import { calculateDistance } from "@/utils/distance";

export type Activity = "running" | "cycling" | "walking";
export type FitnessLevel = "beginner" | "intermediate" | "pro";
export type RadiusPreference = "nearby" | "normal" | "wide";

export interface VisibilitySettings {
  visibleToAllLevels: boolean;
  allowedLevels: FitnessLevel[];
}

export type SearchFilter = FitnessLevel | "all";

export interface MatchingUser {
  uid: string;
  location: { lat: number; lng: number };
  activity: Activity;
  fitnessLevel: FitnessLevel;
  pace: number; // min/km for running/walking, km/h for cycling
  visibility: VisibilitySettings;
  searchFilter?: SearchFilter; // Who do I want to find? (Beginner/Intermediate/Pro/All)
  radiusPreference?: RadiusPreference;
  profileVisible?: boolean;
  [key: string]: any; // Allow other user properties
}

export interface MatchResult {
  user: MatchingUser;
  score: number;
  distance: number; // in meters
}

// Radius lookup table: exact distances for each activity and preference combination
// Still Apply (nearby 0.5x), Normal (1x), Wide (2x)
const RADIUS_LOOKUP: Record<Activity, Record<RadiusPreference, number>> = {
  walking: {
    nearby: 100,   // Still Apply (0.5x): 100m
    normal: 200,   // Normal (1x): 200m
    wide: 400      // Wide (2x): 400m
  },
  running: {
    nearby: 200,   // Still Apply (0.5x): 200m (slightly tighter)
    normal: 350,   // Normal (1x): 350m (optimized from 500m)
    wide: 800      // Wide (2x): 800m (more reasonable)
  },
  cycling: {
    nearby: 400,   // Still Apply (0.5x): 400m (tighter)
    normal: 1000,  // Normal (1x): 1km
    wide: 2000     // Wide (2x): 2km
  }
};

/**
 * Get radius based on activity type and user preference
 * Uses direct lookup table for exact distance control
 * Still Apply (nearby): Walking 100m, Running 200m, Cycling 400m
 * Normal: Walking 200m, Running 350m, Cycling 1km
 * Wide: Walking 400m, Running 800m, Cycling 2km
 */
export function computeRadius(
  user: MatchingUser,
  nearbyCount?: number
): number {
  const activity = user.activity || "running";
  const preference = user.radiusPreference || "normal";
  
  // Return exact radius from lookup table
  return RADIUS_LOOKUP[activity]?.[preference] || RADIUS_LOOKUP.running.normal;
}

/**
 * Check if fitness levels are compatible based on visibility settings
 */
export function fitnessAllowed(
  myLevel: FitnessLevel,
  candidateLevel: FitnessLevel,
  visibility: VisibilitySettings
): boolean {
  if (visibility.visibleToAllLevels) return true;
  return visibility.allowedLevels.includes(candidateLevel);
}

/**
 * Check if paces are compatible (30% difference tolerance)
 */
export function paceCompatible(myPace: number, candidatePace: number): boolean {
  // Allow if pace not set (null, undefined, 0, or NaN)
  if (!myPace || !candidatePace || isNaN(myPace) || isNaN(candidatePace)) return true;
  
  // Prevent division by zero or very small numbers
  if (myPace <= 0.001) return true;
  
  let diff = Math.abs(myPace - candidatePace);
  let percent = diff / myPace;
  return percent <= 0.30; // Allow 30% pace difference
}

/**
 * Calculate distance between two points in meters
 */
function distanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const distKm = calculateDistance(lat1, lng1, lat2, lng2);
  return distKm ? distKm * 1000 : Infinity;
}

/**
 * Score a candidate match
 * Distance: 50%, Pace: 30%, Level: 20%
 */
export function scoreCandidate(
  user: MatchingUser,
  candidate: MatchingUser,
  radius: number
): number {
  const dist = distanceInMeters(
    user.location.lat,
    user.location.lng,
    candidate.location.lat,
    candidate.location.lng
  );

  // Distance score (closer is better, normalized to 0-1)
  const distanceScore = Math.max(0, 1 - (dist / radius));

  // Pace score (closer pace is better)
  let paceScore = 1;
  if (user.pace && candidate.pace && user.pace > 0.001 && candidate.pace > 0.001) {
    const paceDiff = Math.abs(user.pace - candidate.pace);
    const pacePercent = paceDiff / user.pace;
    paceScore = Math.max(0, 1 - pacePercent); // Normalize to 0-1
  }

  // Level score (same level = 1, different = 0.5)
  const levelScore = user.fitnessLevel === candidate.fitnessLevel ? 1 : 0.5;

  // Weighted combination
  return (distanceScore * 0.5) + (paceScore * 0.3) + (levelScore * 0.2);
}

/**
 * Main matching function
 * Returns top 5 matches ranked by score
 */
export function matchUsers(
  user: MatchingUser,
  allUsers: Record<string, any>,
  nearbyCount?: number
): MatchResult[] {
  if (user.profileVisible === false) {
    return [];
  }

  // Get fixed radius based on activity type
  const radius = computeRadius(user, nearbyCount);
  const radiusKm = radius / 1000; // Convert to km for filterUsersByDistance

  // Get nearby users within radius
  const candidates = filterUsersByDistance(
    allUsers,
    user.location.lat,
    user.location.lng,
    radiusKm,
    user.uid
  );

  // Filter for active users only (users with recent location updates within 3 minutes)
  // This ensures we only match with users who are currently working out
  const now = Date.now();
  const activeThreshold = 3 * 60 * 1000; // 3 minutes in milliseconds
  const activeCandidates = candidates.filter(candidate => {
    // User must have a timestamp indicating recent location update
    if (!candidate.timestamp) {
      console.log(`Match candidate ${candidate.id} filtered out - no timestamp (not actively tracking)`);
      return false;
    }
    
    // Check if timestamp is recent (within 3 minutes)
    const timeDiff = now - candidate.timestamp;
    const isActive = timeDiff <= activeThreshold;
    
    if (!isActive) {
      console.log(`Match candidate ${candidate.id} filtered out - timestamp too old (${Math.round(timeDiff / 1000)}s ago, threshold: 3min)`);
    }
    
    return isActive;
  });

  console.log(`Matching: ${candidates.length} nearby users → ${activeCandidates.length} with active workouts`);

  // Filter by fitness level and pace compatibility
  const filtered = activeCandidates
    .map(candidate => {
      // Ensure candidate has required fields
      const candidateFitnessLevel = candidate.fitnessLevel || "intermediate";
      const candidatePace = candidate.pace || null;
      const candidateActivity = candidate.activity || user.activity;
      const candidateVisibility = candidate.visibility || {
        visibleToAllLevels: true,
        allowedLevels: ["beginner", "intermediate", "pro"]
      };
      const candidateProfileVisible = candidate.profileVisible !== false;
      const candidateSearchFilter: SearchFilter = candidate.searchFilter || "all";

      // Only match users with same activity
      if (candidateActivity !== user.activity) {
        return null;
      }

      // Check if user's search filter matches candidate's fitness level
      const userSearchFilter = user.searchFilter || "all";
      if (userSearchFilter !== "all" && candidateFitnessLevel !== userSearchFilter) {
        return null;
      }

      if (!candidateProfileVisible) {
        return null;
      }

      if (candidateSearchFilter !== "all" && candidateSearchFilter !== user.fitnessLevel) {
        return null;
      }

      // Check if candidate's visibility filter allows user's fitness level
      if (!fitnessAllowed(user.fitnessLevel, candidateFitnessLevel, candidateVisibility)) {
        return null;
      }

      // Check pace compatibility
      if (user.pace && candidatePace && !paceCompatible(user.pace, candidatePace)) {
        return null;
      }

      return {
        ...candidate,
        fitnessLevel: candidateFitnessLevel,
        pace: candidatePace,
        activity: candidateActivity,
        visibility: candidateVisibility
      };
    })
    .filter((c): c is MatchingUser & { id: string; distance: number } => c !== null);

  // Score and rank candidates
  const ranked = filtered
    .map(candidate => {
      const matchUser: MatchingUser = {
        uid: candidate.id,
        location: { lat: candidate.lat, lng: candidate.lng },
        activity: candidate.activity,
        fitnessLevel: candidate.fitnessLevel,
        pace: candidate.pace || 0,
        visibility: candidate.visibility || {
          visibleToAllLevels: true,
          allowedLevels: ["beginner", "intermediate", "pro"]
        },
        profileVisible: candidate.profileVisible !== false,
        radiusPreference: candidate.radiusPreference,
        ...candidate
      };

      return {
        user: matchUser,
        score: scoreCandidate(user, matchUser, radius),
        distance: candidate.distance * 1000 // Convert km to meters
      };
    })
    .sort((a, b) => b.score - a.score); // Sort by score descending

  // Return top 5 matches
  return ranked.slice(0, 5);
}

/**
 * Calculate average pace from workout history
 * @param workouts - Array of workout history items
 * @param activity - Activity type to filter by
 * @returns Average pace (min/km for running/walking, km/h for cycling)
 */
export function calculatePaceFromWorkouts(
  workouts: Array<{ activity: Activity; duration: number; distance: number; avgSpeed?: number }>,
  activity: Activity
): number | null {
  // Filter workouts by activity and get most recent 5-10
  const relevantWorkouts = workouts
    .filter(w => w.activity === activity)
    .slice(-10) // Last 10 workouts
    .filter(w => w.distance > 0 && w.duration > 0);

  if (relevantWorkouts.length === 0) {
    return null;
  }

  if (activity === "cycling") {
    // For cycling, use average speed (km/h)
    const speeds = relevantWorkouts
      .map(w => w.avgSpeed || (w.distance / (w.duration / 3600)))
      .filter(s => s > 0);
    
    if (speeds.length === 0) return null;
    return speeds.reduce((a, b) => a + b, 0) / speeds.length;
  } else {
    // For running/walking, calculate min/km
    const paces = relevantWorkouts
      .map(w => {
        const distanceKm = w.distance;
        const durationMinutes = w.duration / 60;
        return durationMinutes / distanceKm;
      })
      .filter(p => p > 0 && p < 30); // Reasonable pace range (0-30 min/km)
    
    if (paces.length === 0) return null;
    return paces.reduce((a, b) => a + b, 0) / paces.length;
  }
}

