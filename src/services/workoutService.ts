// Workout service for Firebase - saves and retrieves workout history
import { ref, set, get, onValue, off, push, DataSnapshot } from "firebase/database";
import { database } from "./firebase";
import { WorkoutHistory } from "@/contexts/UserContext";
import { getUserData } from "./authService";

export interface WorkoutWithUser {
  workout: WorkoutHistory;
  userId: string;
  userData: any;
}

/**
 * Save a workout to Firebase
 */
export const saveWorkout = async (
  userId: string,
  workout: Omit<WorkoutHistory, "id">
): Promise<string> => {
  try {
    const workoutsRef = ref(database, `workouts/${userId}`);
    const newWorkoutRef = push(workoutsRef);
    const workoutId = newWorkoutRef.key!;
    
    const workoutData = {
      ...workout,
      id: workoutId,
      date: workout.date.getTime(), // Convert Date to timestamp
      createdAt: Date.now()
    };
    
    await set(newWorkoutRef, workoutData);
    console.log(`✅ Workout saved: ${workoutId}`);
    return workoutId;
  } catch (error) {
    console.error("❌ Error saving workout:", error);
    throw error;
  }
};

/**
 * Get all workouts for a user
 */
export const getUserWorkouts = async (userId: string): Promise<WorkoutHistory[]> => {
  try {
    const workoutsRef = ref(database, `workouts/${userId}`);
    const snapshot = await get(workoutsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const workouts = snapshot.val();
    return Object.values(workouts).map((w: any) => ({
      ...w,
      date: new Date(w.date), // Convert timestamp back to Date
    })) as WorkoutHistory[];
  } catch (error) {
    console.error("❌ Error getting user workouts:", error);
    throw error;
  }
};

/**
 * Listen to user's workouts in real-time
 */
export const listenToUserWorkouts = (
  userId: string,
  callback: (workouts: WorkoutHistory[]) => void
): (() => void) => {
  const workoutsRef = ref(database, `workouts/${userId}`);
  
  const unsubscribe = onValue(
    workoutsRef,
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const workouts = snapshot.val();
      const workoutList = Object.values(workouts).map((w: any) => ({
        ...w,
        date: new Date(w.date),
      })) as WorkoutHistory[];
      
      callback(workoutList);
    },
    (error) => {
      console.error("❌ Error listening to workouts:", error);
      callback([]);
    }
  );
  
  return () => {
    off(workoutsRef);
  };
};

/**
 * Get all workouts from all users
 * @param currentUserId - Current user ID to filter out
 * @returns Promise of workouts with user information
 */
export const getAllUsersWorkouts = async (
  currentUserId: string
): Promise<WorkoutWithUser[]> => {
  try {
    const workoutsRef = ref(database, "workouts");
    const snapshot = await get(workoutsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const allWorkouts: WorkoutWithUser[] = [];
    const workoutsData = snapshot.val();
    
    // Iterate through all users' workouts
    for (const userId in workoutsData) {
      // Skip current user's workouts
      if (userId === currentUserId) continue;
      
      const userWorkouts = workoutsData[userId];
      if (!userWorkouts) continue;
      
      // Get user data
      let userData: any = null;
      try {
        userData = await getUserData(userId);
      } catch (error) {
        console.error(`Error fetching user data for ${userId}:`, error);
        continue;
      }
      
      if (!userData) continue;
      
      // Process each workout
      const workouts = Object.values(userWorkouts) as any[];
      for (const workout of workouts) {
        allWorkouts.push({
          workout: {
            ...workout,
            date: new Date(workout.date), // Convert timestamp back to Date
          } as WorkoutHistory,
          userId,
          userData,
        });
      }
    }
    
    // Sort by date (most recent first)
    return allWorkouts.sort(
      (a, b) => b.workout.date.getTime() - a.workout.date.getTime()
    );
  } catch (error) {
    console.error("❌ Error getting all users' workouts:", error);
    return [];
  }
};

/**
 * Listen to all users' workouts in real-time
 * @param currentUserId - Current user ID to filter out
 * @param callback - Callback function that receives workouts with user data
 * @returns Unsubscribe function
 */
export const listenToAllUsersWorkouts = (
  currentUserId: string,
  callback: (workouts: WorkoutWithUser[]) => void
): (() => void) => {
  const workoutsRef = ref(database, "workouts");
  const userDataCache: Record<string, any> = {};
  
  const unsubscribe = onValue(
    workoutsRef,
    async (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const allWorkouts: WorkoutWithUser[] = [];
      const workoutsData = snapshot.val();
      
      // Collect all user IDs we need to fetch
      const userIdsToFetch = new Set<string>();
      for (const userId in workoutsData) {
        if (userId === currentUserId) continue;
        userIdsToFetch.add(userId);
      }
      
      // Fetch user data for all users (use cache when available)
      const userDataPromises = Array.from(userIdsToFetch).map(async (userId) => {
        if (userDataCache[userId]) {
          return { userId, userData: userDataCache[userId] };
        }
        
        try {
          const userData = await getUserData(userId);
          if (userData) {
            userDataCache[userId] = userData;
            return { userId, userData };
          }
        } catch (error) {
          console.error(`Error fetching user data for ${userId}:`, error);
        }
        return null;
      });
      
      const userDataResults = await Promise.all(userDataPromises);
      const userDataMap = new Map<string, any>();
      userDataResults.forEach((result) => {
        if (result) {
          userDataMap.set(result.userId, result.userData);
        }
      });
      
      // Process workouts
      for (const userId in workoutsData) {
        if (userId === currentUserId) continue;
        
        const userWorkouts = workoutsData[userId];
        if (!userWorkouts) continue;
        
        const userData = userDataMap.get(userId);
        if (!userData) continue;
        
        const workouts = Object.values(userWorkouts) as any[];
        for (const workout of workouts) {
          allWorkouts.push({
            workout: {
              ...workout,
              date: new Date(workout.date),
            } as WorkoutHistory,
            userId,
            userData,
          });
        }
      }
      
      // Sort by date (most recent first)
      const sorted = allWorkouts.sort(
        (a, b) => b.workout.date.getTime() - a.workout.date.getTime()
      );
      
      callback(sorted);
    },
    (error) => {
      console.error("❌ Error listening to all users' workouts:", error);
      callback([]);
    }
  );
  
  return () => {
    off(workoutsRef);
  };
};

