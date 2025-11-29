// Custom hook for finding nearby users
import { useState, useEffect, useRef } from "react";
import { listenToAllUsers } from "../services/locationService";
import { filterUsersByDistance } from "../utils/distance";
import { addEncounteredUser } from "../services/encounteredUsersService";

export interface NearbyUser {
  id: string;
  name?: string;
  email?: string;
  photoURL?: string;
  activity?: string | null;
  gender?: string | null;
  lat: number;
  lng: number;
  visible?: boolean;
  distance: number;
  [key: string]: any;
}

export interface Location {
  lat: number;
  lng: number;
}

/**
 * Custom hook to find and filter nearby users
 * @param {Location | null} currentLocation - { lat, lng } of current user
 * @param {number} maxDistanceKm - Maximum distance in kilometers
 * @param {string} activityFilter - Filter by activity: "running", "cycling", "walking", or "all"
 * @param {string} genderFilter - Filter by gender: "male", "female", or "all"
 * @param {string | null} currentUserId - Current user's ID to exclude from results
 * @param {boolean} isWorkoutActive - Whether to show nearby users (always true now - shows users when location is available)
 * @returns {Object} { nearbyUsers, loading }
 */
export const useNearbyUsers = (
  currentLocation: Location | null,
  maxDistanceKm: number = 5,
  activityFilter: string = "all",
  genderFilter: string = "all",
  currentUserId: string | null = null,
  isWorkoutActive: boolean = true // Default to true - show users when location is available
) => {
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  // Track which users we've already recorded encounters for in this session
  // to avoid duplicate tracking on every location update
  const trackedEncountersRef = useRef<Set<string>>(new Set());
  const lastEncounterCheckRef = useRef<number>(0);

  useEffect(() => {
    // Show nearby users when location is available (not just during active workout)
    // This allows users to see who's nearby even when not actively working out
    if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
      setNearbyUsers([]);
      setLoading(false);
      return;
    }

    // Store the latest users data for periodic re-evaluation
    let latestUsers: Record<string, any> = {};

    // Function to filter and update nearby users
    const filterAndUpdateUsers = (users: Record<string, any>) => {
      latestUsers = users;
      // Use currentLocation from closure (will be latest value when effect re-runs)
      console.log("=== NEARBY USERS DEBUG ===");
      console.log("All users from Firebase:", users);
      console.log("Total users in database:", Object.keys(users || {}).length);
      console.log("Current user ID:", currentUserId);
      console.log("Current location:", currentLocation);
      console.log("Max distance:", maxDistanceKm);
      
      if (!users || Object.keys(users).length === 0) {
        console.log("⚠️ No users in Firebase database!");
        setNearbyUsers([]);
        setLoading(false);
        return;
      }
      
      // Filter out current user
      const otherUsers = { ...users };
      if (currentUserId && otherUsers[currentUserId]) {
        console.log("Removing current user from list");
        delete otherUsers[currentUserId];
      }

      console.log("Other users (after filtering self):", otherUsers);
      console.log("Other users count:", Object.keys(otherUsers).length);

      if (Object.keys(otherUsers).length === 0) {
        console.log("⚠️ No other users found (only yourself in database)");
        setNearbyUsers([]);
        setLoading(false);
        return;
      }

      // Filter by distance (with additional safety check to exclude current user)
      let filtered = filterUsersByDistance(
        otherUsers,
        currentLocation.lat,
        currentLocation.lng,
        maxDistanceKm,
        currentUserId // Extra safety: exclude current user in distance filter too
      );

      console.log("Users after distance filter:", filtered);
      console.log("Users after distance filter count:", filtered.length);

      // Track encounters for users within discovery radius
      // Throttle to avoid excessive database writes (check every 10 seconds)
      const now = Date.now();
      if (currentUserId && now - lastEncounterCheckRef.current > 10000) {
        lastEncounterCheckRef.current = now;
        
        filtered.forEach((user) => {
          // Only track if we haven't tracked this user in this session
          // or if it's been more than 5 minutes since last tracking
          const encounterKey = `${user.id}`;
          
          if (!trackedEncountersRef.current.has(encounterKey)) {
            // Track the encounter
            addEncounteredUser(
              currentUserId,
              user.id,
              user.distance,
              { lat: user.lat, lng: user.lng }
            ).catch((error) => {
              // Silently fail - encounter tracking is non-critical
              if (process.env.NODE_ENV === 'development') {
                console.error("Error tracking encounter:", error);
              }
            });
            
            trackedEncountersRef.current.add(encounterKey);
            
            // Clean up old tracked encounters after 5 minutes to allow re-tracking
            setTimeout(() => {
              trackedEncountersRef.current.delete(encounterKey);
            }, 5 * 60 * 1000);
          }
        });
      }

      // Filter by activity
      if (activityFilter !== "all") {
        filtered = filtered.filter(
          (user) => user.activity === activityFilter
        );
      }

      // Filter by gender
      if (genderFilter !== "all") {
        filtered = filtered.filter((user) => user.gender === genderFilter);
      }

      // Only hide users if visible is explicitly false (default to visible if not set)
      const beforeVisibility = filtered.length;
      filtered = filtered.filter((user) => {
        const isVisible = user.visible !== false;
        if (!isVisible) {
          console.log(`User ${user.id} filtered out - visible:`, user.visible);
        }
        return isVisible;
      });

      console.log(`Visibility filter: ${beforeVisibility} → ${filtered.length}`);

      // Filter by active workout status - only show users with recent location updates (within 10 minutes)
      // This ensures users are only visible when they have an active workout session
      // Using 10 minutes to match "active friends" threshold and allow for brief pauses
      const beforeActiveFilter = filtered.length;
      // Reuse 'now' from line 102 - no need to redeclare
      const activeThreshold = 10 * 60 * 1000; // 10 minutes in milliseconds
      
      filtered = filtered.filter((user) => {
        // User must have a timestamp indicating recent location update
        if (!user.timestamp) {
          console.log(`User ${user.id} filtered out - no timestamp (not actively tracking)`);
          return false;
        }
        
        // Check if timestamp is recent (within 3 minutes)
        const timeDiff = now - user.timestamp;
        const isActive = timeDiff <= activeThreshold;
        
        if (!isActive) {
          console.log(`User ${user.id} filtered out - timestamp too old (${Math.round(timeDiff / 1000)}s ago, threshold: 10min)`);
        }
        
        return isActive;
      });

      console.log(`Active workout filter: ${beforeActiveFilter} → ${filtered.length}`);

      console.log("Final nearby users:", filtered);
      console.log("=========================");

      setNearbyUsers(filtered);
      setLoading(false);
    };

    // Set up Firebase listener
    const unsubscribe = listenToAllUsers(filterAndUpdateUsers);

    // Set up periodic re-evaluation to filter out inactive users
    // This ensures users who stopped working out are removed even if Firebase doesn't update
    const intervalId = setInterval(() => {
      if (Object.keys(latestUsers).length > 0) {
        // Re-run filtering with latest data to remove inactive users
        filterAndUpdateUsers(latestUsers);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [currentLocation, maxDistanceKm, activityFilter, genderFilter, currentUserId, isWorkoutActive]);

  return { nearbyUsers, loading };
};

