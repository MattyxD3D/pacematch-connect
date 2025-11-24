// Custom hook for finding nearby users
import { useState, useEffect } from "react";
import { listenToAllUsers } from "../services/locationService";
import { filterUsersByDistance } from "../utils/distance";

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
 * @returns {Object} { nearbyUsers, loading }
 */
export const useNearbyUsers = (
  currentLocation: Location | null,
  maxDistanceKm: number = 5,
  activityFilter: string = "all",
  genderFilter: string = "all",
  currentUserId: string | null = null
) => {
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentLocation || !currentLocation.lat || !currentLocation.lng) {
      setNearbyUsers([]);
      setLoading(false);
      return;
    }

    const unsubscribe = listenToAllUsers((users) => {
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

      console.log("Final nearby users:", filtered);
      console.log("=========================");

      setNearbyUsers(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentLocation, maxDistanceKm, activityFilter, genderFilter, currentUserId]);

  return { nearbyUsers, loading };
};

