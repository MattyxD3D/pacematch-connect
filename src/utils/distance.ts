// Distance calculation utilities using Haversine formula
import { getDistance } from 'geolib';

export interface UserWithLocation {
  lat: number;
  lng: number;
  visible?: boolean;
  [key: string]: any;
}

/**
 * Calculate distance between two coordinates in kilometers
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number | null} Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number | null => {
  if (!lat1 || !lng1 || !lat2 || !lng2) {
    return null;
  }

  // geolib uses meters, convert to kilometers
  const distanceInMeters = getDistance(
    { latitude: lat1, longitude: lng1 },
    { latitude: lat2, longitude: lng2 }
  );

  return distanceInMeters / 1000; // Convert to kilometers
};

/**
 * Format distance for display
 * @param {number | null} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distanceKm: number | null | undefined): string => {
  if (distanceKm === null || distanceKm === undefined) {
    return "Unknown";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else {
    return `${distanceKm.toFixed(1)}km`;
  }
};

/**
 * Filter users by distance
 * @param {Record<string, UserWithLocation> | UserWithLocation[]} users - Object or array of user objects with lat/lng
 * @param {number} userLat - Current user's latitude
 * @param {number} userLng - Current user's longitude
 * @param {number} maxDistanceKm - Maximum distance in kilometers
 * @param {string | null} excludeUserId - User ID to exclude from results (optional)
 * @returns {Array} Filtered users with distance property
 */
export const filterUsersByDistance = (
  users: Record<string, UserWithLocation> | UserWithLocation[],
  userLat: number,
  userLng: number,
  maxDistanceKm: number,
  excludeUserId: string | null = null
): Array<UserWithLocation & { id: string; distance: number }> => {
  if (!userLat || !userLng) {
    console.log("⚠️ No user location provided for distance filter");
    return [];
  }

  if (!users || (typeof users === 'object' && !Array.isArray(users) && Object.keys(users).length === 0)) {
    console.log("⚠️ No users provided to filter");
    return [];
  }

  // Convert object to entries if needed
  const userEntries: [string, UserWithLocation][] = Array.isArray(users) 
    ? users.map((user, index) => [String(index), user])
    : Object.entries(users);

  console.log(`Filtering ${userEntries.length} users...`);

  const filtered = userEntries
    .map(([userId, userData]) => {
      // Exclude current user
      if (excludeUserId && userId === excludeUserId) {
        return null;
      }

      // Check if user has location
      if (!userData.lat || !userData.lng) {
        console.log(`User ${userId} filtered out - no location (lat: ${userData.lat}, lng: ${userData.lng})`);
        return null;
      }

      // Only hide if visible is explicitly false (default to visible if not set)
      // This checks workout location visibility
      if (userData.visible === false) {
        console.log(`User ${userId} filtered out - visible: false`);
        return null;
      }

      // Check profile visibility for discovery (default to visible if not set)
      if (userData.profileVisible === false) {
        console.log(`User ${userId} filtered out - profileVisible: false`);
        return null;
      }

      const distance = calculateDistance(
        userLat,
        userLng,
        userData.lat,
        userData.lng
      );

      if (distance === null) {
        console.log(`User ${userId} - distance calculation failed`);
        return null;
      }

      if (distance > maxDistanceKm) {
        console.log(`User ${userId} filtered out - too far: ${distance.toFixed(2)}km (max: ${maxDistanceKm}km)`);
        return null;
      }

      console.log(`✅ User ${userId} included - distance: ${distance.toFixed(2)}km, visible: ${userData.visible}`);
      return {
        id: userId,
        ...userData,
        distance
      };
    })
    .filter((user): user is UserWithLocation & { id: string; distance: number } => user !== null)
    .sort((a, b) => a.distance - b.distance); // Sort by distance

  console.log(`Distance filter result: ${filtered.length} users within ${maxDistanceKm}km`);
  return filtered;
};

