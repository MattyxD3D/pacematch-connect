// Custom hook for matching users using PACE-MATCH algorithm
import { useState, useEffect, useRef, useMemo } from "react";
import { listenToAllUsers } from "@/services/locationService";
import { matchUsers, MatchingUser, MatchResult, Activity, FitnessLevel, RadiusPreference, VisibilitySettings, SearchFilter } from "@/services/matchingService";
import { getUserData } from "@/services/authService";

export interface UseMatchingOptions {
  currentUserId: string;
  currentLocation: { lat: number; lng: number } | null;
  activity: Activity;
  fitnessLevel?: FitnessLevel;
  pace?: number;
  visibility?: VisibilitySettings;
  searchFilter?: SearchFilter; // Who do I want to find?
  radiusPreference?: RadiusPreference;
}

export interface UseMatchingResult {
  matches: MatchResult[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to get matched users in real-time
 */
export const useMatching = (options: UseMatchingOptions): UseMatchingResult => {
  const {
    currentUserId,
    currentLocation,
    activity,
    fitnessLevel = "intermediate",
    pace,
    visibility = { visibleToAllLevels: true, allowedLevels: ["beginner", "intermediate", "pro"] },
    searchFilter = "all",
    radiusPreference = "normal"
  } = options;

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  // Extract location coordinates for stable dependency comparison
  const locationLat = currentLocation?.lat;
  const locationLng = currentLocation?.lng;
  const locationKey = useMemo(() => 
    locationLat && locationLng ? `${locationLat.toFixed(6)},${locationLng.toFixed(6)}` : null,
    [locationLat, locationLng]
  );

  // Memoize visibility to prevent infinite loops
  const stableVisibility = useMemo(() => visibility, [
    visibility?.visibleToAllLevels,
    JSON.stringify(visibility?.allowedLevels)
  ]);

  // Load current user's matching preferences
  useEffect(() => {
    if (!currentUserId) return;
    
    const loadUserData = async () => {
      try {
        const data = await getUserData(currentUserId);
        setUserData(data);
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Failed to load user data");
      }
    };
    loadUserData();
  }, [currentUserId]);

  // Perform matching when location or user data changes
  useEffect(() => {
    if (!currentLocation || !locationLat || !locationLng) {
      setMatches([]);
      setLoading(false);
      return;
    }

    if (!userData && currentUserId) {
      setLoading(true);
      return;
    }

    // Use user data from Firebase or fallback to provided options
    const effectiveFitnessLevel = userData?.fitnessLevel || fitnessLevel;
    const effectivePace = userData?.pace || pace || null;
    const effectiveVisibility = userData?.visibility || stableVisibility;
    const effectiveSearchFilter = userData?.searchFilter || searchFilter;
    const effectiveRadiusPreference = userData?.radiusPreference || radiusPreference;
    const effectiveActivity = userData?.activity || activity;

    // Create matching user object
    const matchingUser: MatchingUser = {
      uid: currentUserId,
      location: currentLocation,
      activity: effectiveActivity,
      fitnessLevel: effectiveFitnessLevel,
      pace: effectivePace || 0,
      visibility: effectiveVisibility,
      searchFilter: effectiveSearchFilter,
      radiusPreference: effectiveRadiusPreference
    };

    const unsubscribe = listenToAllUsers((allUsers) => {
      try {
        // Count nearby users for density calculation
        const nearbyCount = Object.keys(allUsers).length;

        // Perform matching
        const results = matchUsers(matchingUser, allUsers, nearbyCount);
        setMatches(results);
        setError(null);
      } catch (err: any) {
        console.error("Error matching users:", err);
        setError(err.message || "Failed to match users");
        setMatches([]);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [
    locationKey,
    currentUserId,
    activity,
    fitnessLevel,
    pace,
    stableVisibility,
    searchFilter,
    radiusPreference,
    userData
  ]);

  return { matches, loading, error };
};

