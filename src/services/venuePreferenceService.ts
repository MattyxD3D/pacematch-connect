// Venue preference service - manages user venue and activity preferences
import { ref, set, get, onValue, off, DataSnapshot } from "firebase/database";
import { database } from "./firebase";
import { getUserData } from "./authService";

export type Activity = "running" | "cycling" | "walking";

export interface UserVenuePreferences {
  userId: string;
  venues: string[]; // Array of venue IDs
  activities: Activity[];
  updatedAt: number;
}

export interface VenueUser {
  userId: string;
  username: string;
  avatar: string;
  activities: Activity[];
}

/**
 * Save user venue preferences
 */
export const saveUserVenuePreferences = async (
  userId: string,
  venues: string[],
  activities: Activity[]
): Promise<void> => {
  try {
    const preferencesRef = ref(database, `userVenuePreferences/${userId}`);
    const preferences: UserVenuePreferences = {
      userId,
      venues,
      activities,
      updatedAt: Date.now()
    };

    await set(preferencesRef, preferences);
    console.log(`✅ Saved venue preferences for user ${userId}`);
  } catch (error) {
    console.error("❌ Error saving venue preferences:", error);
    throw error;
  }
};

/**
 * Get user venue preferences
 */
export const getUserVenuePreferences = async (
  userId: string
): Promise<UserVenuePreferences | null> => {
  try {
    const preferencesRef = ref(database, `userVenuePreferences/${userId}`);
    const snapshot = await get(preferencesRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val() as UserVenuePreferences;
  } catch (error) {
    console.error("❌ Error getting venue preferences:", error);
    throw error;
  }
};

/**
 * Get users who have selected specific venues
 */
export const getUsersByVenues = async (
  venueIds: string[]
): Promise<Record<string, VenueUser[]>> => {
  try {
    const preferencesRef = ref(database, `userVenuePreferences`);
    const snapshot = await get(preferencesRef);

    if (!snapshot.exists()) {
      return {};
    }

    const allPreferences = snapshot.val() as Record<string, UserVenuePreferences>;
    const usersByVenue: Record<string, VenueUser[]> = {};

    // Initialize venue arrays
    venueIds.forEach(venueId => {
      usersByVenue[venueId] = [];
    });

    // Process each user's preferences
    for (const [userId, preferences] of Object.entries(allPreferences)) {
      if (!preferences || !preferences.venues || !preferences.activities) {
        continue;
      }

      // Check which venues this user has selected
      for (const venueId of preferences.venues) {
        if (venueIds.includes(venueId)) {
          // Get user data for username and avatar
          try {
            const userData = await getUserData(userId);
            if (userData) {
              const venueUser: VenueUser = {
                userId,
                username: userData.username || userData.name || "User",
                avatar: userData.photoURL || userData.avatar || "",
                activities: preferences.activities
              };

              if (!usersByVenue[venueId]) {
                usersByVenue[venueId] = [];
              }
              usersByVenue[venueId].push(venueUser);
            }
          } catch (error) {
            console.error(`Error fetching user data for ${userId}:`, error);
          }
        }
      }
    }

    return usersByVenue;
  } catch (error) {
    console.error("❌ Error getting users by venues:", error);
    throw error;
  }
};

/**
 * Listen to users by venues in real-time
 */
export const listenToUsersByVenues = (
  venueIds: string[],
  callback: (usersByVenue: Record<string, VenueUser[]>) => void
): (() => void) => {
  try {
    const preferencesRef = ref(database, `userVenuePreferences`);

    const unsubscribe = onValue(preferencesRef, async (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback({});
        return;
      }

      const allPreferences = snapshot.val() as Record<string, UserVenuePreferences>;
      const usersByVenue: Record<string, VenueUser[]> = {};

      // Initialize venue arrays
      venueIds.forEach(venueId => {
        usersByVenue[venueId] = [];
      });

      // Process each user's preferences
      const userDataPromises: Promise<void>[] = [];

      for (const [userId, preferences] of Object.entries(allPreferences)) {
        if (!preferences || !preferences.venues || !preferences.activities) {
          continue;
        }

        // Check which venues this user has selected
        for (const venueId of preferences.venues) {
          if (venueIds.includes(venueId)) {
            // Get user data for username and avatar
            const promise = getUserData(userId)
              .then((userData) => {
                if (userData) {
                  const venueUser: VenueUser = {
                    userId,
                    username: userData.username || userData.name || "User",
                    avatar: userData.photoURL || userData.avatar || "",
                    activities: preferences.activities
                  };

                  if (!usersByVenue[venueId]) {
                    usersByVenue[venueId] = [];
                  }
                  usersByVenue[venueId].push(venueUser);
                }
              })
              .catch((error) => {
                console.error(`Error fetching user data for ${userId}:`, error);
              });

            userDataPromises.push(promise);
          }
        }
      }

      // Wait for all user data to be fetched
      await Promise.all(userDataPromises);

      callback(usersByVenue);
    }, (error) => {
      console.error("❌ Error listening to users by venues:", error);
      callback({});
    });

    return () => {
      off(preferencesRef);
    };
  } catch (error) {
    console.error("❌ Error setting up listener:", error);
    return () => {}; // Return empty unsubscribe function
  }
};

