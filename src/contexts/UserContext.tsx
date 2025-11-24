import { createContext, useContext, ReactNode, useState, useEffect } from "react";

export type Activity = "running" | "cycling" | "walking";

interface UserProfile {
  username: string;
  activities: Activity[];
  gender?: string;
  photos?: string[]; // URLs or base64 encoded images
}

interface UserContextType {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  hasActivity: (activity: Activity) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("userProfile");
    if (stored) {
      try {
        setUserProfileState(JSON.parse(stored));
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

  return (
    <UserContext.Provider value={{ userProfile, setUserProfile, hasActivity }}>
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
