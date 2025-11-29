import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { listenToUserWorkouts } from "@/services/workoutService";

export type Activity = "running" | "cycling" | "walking";

export interface NearbyUser {
  id: number;
  name: string;
  avatar: string;
  activity: string;
  distance: string;
}

export interface WorkoutHistory {
  id: string;
  activity: Activity;
  date: Date;
  duration: number; // seconds
  distance: number; // km
  avgSpeed: number; // km/h
  nearbyUsers?: NearbyUser[]; // Users who were nearby during workout
  location?: string; // Location where workout happened
}

export type FitnessLevel = "beginner" | "intermediate" | "pro";
export type RadiusPreference = "nearby" | "normal" | "wide";

export interface VisibilitySettings {
  visibleToAllLevels: boolean;
  allowedLevels: FitnessLevel[];
}

interface UserProfile {
  username: string;
  activities: Activity[];
  gender?: string;
  photos?: string[]; // URLs or base64 encoded images
  useMetric?: boolean; // true for km/km/h, false for mi/mph
  workoutHistory?: WorkoutHistory[];
  bio?: string; // User biography
  friends?: number[]; // Array of friend user IDs
  friendRequests?: { from: number; date: Date }[]; // Pending incoming requests
  sentRequests?: number[]; // Pending outgoing requests
  // Matching preferences
  fitnessLevel?: FitnessLevel;
  pace?: number; // min/km for running/walking, km/h for cycling
  visibility?: VisibilitySettings;
  radiusPreference?: RadiusPreference;
}

interface UserContextType {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  hasActivity: (activity: Activity) => boolean;
  useMetric: boolean;
  setUseMetric: (useMetric: boolean) => void;
  addWorkout: (workout: Omit<WorkoutHistory, "id">) => void;
  workoutHistory: WorkoutHistory[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const { user } = useAuth();

  // Clear profile when user logs out or changes
  useEffect(() => {
    if (!user?.uid) {
      // User logged out - clear profile and localStorage
      setUserProfileState(null);
      localStorage.removeItem("userProfile");
      localStorage.removeItem("userProfileUserId");
      return;
    }
  }, [user?.uid]);

  // Load from localStorage on mount - only if it belongs to current user
  useEffect(() => {
    if (!user?.uid) return; // Don't load if no user is logged in

    const storedUserId = localStorage.getItem("userProfileUserId");
    const stored = localStorage.getItem("userProfile");
    
    // Only load if localStorage belongs to current user
    if (stored && storedUserId === user.uid) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (parsed.workoutHistory) {
          parsed.workoutHistory = parsed.workoutHistory.map((w: any) => ({
            ...w,
            date: new Date(w.date),
          }));
        }
        setUserProfileState(parsed);
      } catch (e) {
        console.error("Failed to parse user profile:", e);
        // Clear corrupted data
        localStorage.removeItem("userProfile");
        localStorage.removeItem("userProfileUserId");
      }
    } else if (stored && storedUserId !== user.uid) {
      // Different user's data - clear it
      console.log("⚠️ Clearing localStorage from different user");
      localStorage.removeItem("userProfile");
      localStorage.removeItem("userProfileUserId");
    }
  }, [user?.uid]);

  // Load workouts from Firebase when user is authenticated
  useEffect(() => {
    if (!user?.uid) return;

    console.log("📥 Loading workouts from Firebase for user:", user.uid);
    
    const unsubscribe = listenToUserWorkouts(user.uid, (workouts) => {
      console.log("✅ Loaded workouts from Firebase:", workouts.length);
      
      // Update user profile with workouts from Firebase
      setUserProfileState((prev) => {
        // If profile doesn't exist, create a minimal one with workouts
        if (!prev) {
          const minimalProfile: UserProfile = {
            username: "",
            activities: [],
            workoutHistory: workouts,
            useMetric: true,
          };
          // Save to localStorage with user ID
          localStorage.setItem("userProfile", JSON.stringify(minimalProfile));
          localStorage.setItem("userProfileUserId", user.uid);
          return minimalProfile;
        }
        
        // Merge Firebase workouts with existing profile
        // Firebase workouts take precedence
        const updated = {
          ...prev,
          workoutHistory: workouts,
        };
        // Save to localStorage with user ID
        localStorage.setItem("userProfile", JSON.stringify(updated));
        localStorage.setItem("userProfileUserId", user.uid);
        return updated;
      });
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid]);

  const setUserProfile = (profile: UserProfile) => {
    setUserProfileState(profile);
    if (user?.uid) {
      localStorage.setItem("userProfile", JSON.stringify(profile));
      localStorage.setItem("userProfileUserId", user.uid);
    }
  };

  const hasActivity = (activity: Activity): boolean => {
    return userProfile?.activities.includes(activity) ?? false;
  };

  const useMetric = userProfile?.useMetric ?? true;

  const setUseMetric = (metric: boolean) => {
    if (userProfile) {
      const updated = { ...userProfile, useMetric: metric };
      setUserProfile(updated);
    }
  };

  const addWorkout = (workout: Omit<WorkoutHistory, "id">) => {
    // Create a minimal profile if it doesn't exist
    const currentProfile = userProfile || {
      username: "",
      activities: [],
      workoutHistory: [],
      useMetric: true,
    };
    
    const newWorkout: WorkoutHistory = {
      ...workout,
      id: Date.now().toString(),
    };
    const updated = {
      ...currentProfile,
      workoutHistory: [...(currentProfile.workoutHistory || []), newWorkout],
    };
    setUserProfile(updated);
  };

  const workoutHistory = userProfile?.workoutHistory || [];

  return (
    <UserContext.Provider
      value={{
        userProfile,
        setUserProfile,
        hasActivity,
        useMetric,
        setUseMetric,
        addWorkout,
        workoutHistory,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
