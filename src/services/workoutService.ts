// Workout service for Firebase - saves and retrieves workout history
import { ref, set, get, onValue, off, push, DataSnapshot } from "firebase/database";
import { database } from "./firebase";
import { WorkoutHistory } from "@/contexts/UserContext";

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

