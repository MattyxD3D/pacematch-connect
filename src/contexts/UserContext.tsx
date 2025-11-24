import { createContext, useContext, ReactNode, useState, useEffect } from "react";

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
  calories: number;
  nearbyUsers?: NearbyUser[]; // Users who were nearby during workout
  location?: string; // Location where workout happened
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

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("userProfile");
    if (stored) {
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
      }
    }
  }, []);

  const setUserProfile = (profile: UserProfile) => {
    setUserProfileState(profile);
    localStorage.setItem("userProfile", JSON.stringify(profile));
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
    if (userProfile) {
      const newWorkout: WorkoutHistory = {
        ...workout,
        id: Date.now().toString(),
      };
      const updated = {
        ...userProfile,
        workoutHistory: [...(userProfile.workoutHistory || []), newWorkout],
      };
      setUserProfile(updated);
    }
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
