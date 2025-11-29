// Venue preference service - manages user venue and activity preferences
import { ref, set, get, onValue, off, DataSnapshot } from "firebase/database";
import { database } from "./firebase";
import { getUserData, updateUserProfile } from "./authService";

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
    
    // Automatically enable profile visibility when user adds venues
    // This makes sense because adding venues indicates they want to be discoverable
    try {
      await updateUserProfile(userId, { profileVisible: true });
      console.log(`✅ Enabled profile visibility for user ${userId}`);
    } catch (profileError) {
      // Log error but don't fail the entire operation if profile update fails
      console.error("❌ Error enabling profile visibility:", profileError);
    }
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
 * Subscribe to a user's venue preferences in real-time
 */
export const listenToUserVenuePreferences = (
  userId: string,
  callback: (preferences: UserVenuePreferences | null) => void
): (() => void) => {
  const preferencesRef = ref(database, `userVenuePreferences/${userId}`);

  const handleValue = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as UserVenuePreferences);
    } else {
      callback(null);
    }
  };

  const handleError = (error: Error) => {
    console.error("❌ Error listening to venue preferences:", error);
    callback(null);
  };

  onValue(preferencesRef, handleValue, handleError);

  return () => {
    off(preferencesRef, "value", handleValue);
  };
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
              // Filter out users with profileVisible === false (default to visible if not set)
              if (userData.profileVisible === false) {
                console.log(`User ${userId} filtered out from venue ${venueId} - profileVisible: false`);
                continue;
              }

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
 * Also listens to user profile changes to refresh when profileVisible changes
 */
export const listenToUsersByVenues = (
  venueIds: string[],
  callback: (usersByVenue: Record<string, VenueUser[]>) => void
): (() => void) => {
  try {
    const preferencesRef = ref(database, `userVenuePreferences`);
    const usersRef = ref(database, `users`);

    // Helper function to fetch and filter venue users
    const fetchVenueUsers = async (allPreferences: Record<string, UserVenuePreferences>): Promise<void> => {
      const usersByVenue: Record<string, VenueUser[]> = {};

      // Initialize venue arrays
      venueIds.forEach(venueId => {
        usersByVenue[venueId] = [];
      });

      console.log(`[VenueService] Fetching venue users for ${venueIds.length} venues`);
      console.log(`[VenueService] Total users with preferences: ${Object.keys(allPreferences).length}`);

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
                  // Filter out users with profileVisible === false (default to visible if not set)
                  if (userData.profileVisible === false) {
                    console.log(`[VenueService] User ${userId} filtered out from venue ${venueId} - profileVisible: false`);
                    return;
                  }

                  console.log(`[VenueService] Adding user ${userId} (${userData.username || userData.name}) to venue ${venueId}, profileVisible: ${userData.profileVisible}`);

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
                } else {
                  console.log(`[VenueService] No user data found for ${userId}`);
                }
              })
              .catch((error) => {
                console.error(`[VenueService] Error fetching user data for ${userId}:`, error);
              });

            userDataPromises.push(promise);
          }
        }
      }

      // Wait for all user data to be fetched
      await Promise.all(userDataPromises);

      // Log final counts per venue
      venueIds.forEach(venueId => {
        const count = usersByVenue[venueId]?.length || 0;
        console.log(`[VenueService] Venue ${venueId} final count: ${count} users`);
      });
      
      console.log(`[VenueService] Final venue users object:`, usersByVenue);
      callback(usersByVenue);
    };

    // Listener for user profile changes (to refresh when profileVisible changes)
    let currentPreferences: Record<string, UserVenuePreferences> | null = null;
    
    // Listener for venue preferences changes
    const unsubscribePreferences = onValue(preferencesRef, async (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        console.log(`[VenueService] No venue preferences found`);
        currentPreferences = null;
        callback({});
        return;
      }

      const allPreferences = snapshot.val() as Record<string, UserVenuePreferences>;
      // Cache preferences for user profile change listener
      currentPreferences = allPreferences;
      console.log(`[VenueService] Venue preferences changed, fetching users...`);
      await fetchVenueUsers(allPreferences);
    }, (error) => {
      console.error("❌ Error listening to venue preferences:", error);
      currentPreferences = null;
      callback({});
    });
    
    const unsubscribeUsers = onValue(usersRef, async (snapshot: DataSnapshot) => {
      // Only refresh if we have current preferences cached
      if (currentPreferences) {
        console.log(`[VenueService] User profile changed, refreshing venue users...`);
        await fetchVenueUsers(currentPreferences);
      }
    }, (error) => {
      console.error("❌ Error listening to user profiles:", error);
    });

    return () => {
      off(preferencesRef);
      off(usersRef);
    };
  } catch (error) {
    console.error("❌ Error setting up listener:", error);
    return () => {}; // Return empty unsubscribe function
  }
};

