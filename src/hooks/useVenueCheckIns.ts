// Hook for managing venue check-ins
import { useState, useEffect, useCallback } from "react";
import {
  checkInToVenue,
  checkOutFromVenue,
  listenToVenueCheckIns,
  listenToUserCheckIn,
  getUserCheckIn,
  CheckIn,
  UserCheckInData,
  VenueData
} from "@/services/checkInService";
import { useAuth } from "./useAuth";
import { getUserData } from "@/services/authService";

export interface UseVenueCheckInsOptions {
  venueId?: string;
  autoLoad?: boolean;
}

export interface UseVenueCheckInsResult {
  checkIns: CheckIn[];
  userCheckIn: CheckIn | null;
  loading: boolean;
  error: string | null;
  checkIn: (venueId: string, venueData: VenueData, activity: "running" | "cycling" | "walking") => Promise<void>;
  checkOut: () => Promise<void>;
  isCheckedIn: boolean;
  refreshCheckIns: () => Promise<void>;
}

/**
 * Custom hook to manage venue check-ins
 */
export const useVenueCheckIns = (options: UseVenueCheckInsOptions = {}): UseVenueCheckInsResult => {
  const { venueId, autoLoad = true } = options;
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [userCheckIn, setUserCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's current check-in
  useEffect(() => {
    if (!user?.uid || !autoLoad) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToUserCheckIn(user.uid, (checkIn) => {
      setUserCheckIn(checkIn);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, autoLoad]);

  // Load check-ins for a specific venue
  useEffect(() => {
    if (!venueId || !autoLoad) {
      setCheckIns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenToVenueCheckIns(venueId, (venueCheckIns) => {
      setCheckIns(venueCheckIns);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [venueId, autoLoad]);

  const checkIn = useCallback(async (
    venueId: string,
    venueData: VenueData,
    activity: "running" | "cycling" | "walking"
  ) => {
    if (!user?.uid) {
      throw new Error("User must be logged in to check in");
    }

    try {
      setError(null);
      
      // Get user data
      const userData = await getUserData(user.uid);
      if (!userData) {
        throw new Error("User data not found");
      }

      const userCheckInData: UserCheckInData = {
        userId: user.uid,
        userName: userData.name || "Unknown User",
        userAvatar: userData.photoURL || "",
        activity
      };

      await checkInToVenue(user.uid, venueId, venueData, userCheckInData);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to check in";
      setError(errorMessage);
      throw err;
    }
  }, [user?.uid]);

  const checkOut = useCallback(async () => {
    if (!user?.uid || !userCheckIn) {
      throw new Error("No active check-in to check out from");
    }

    try {
      setError(null);
      await checkOutFromVenue(user.uid, userCheckIn.venueId);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to check out";
      setError(errorMessage);
      throw err;
    }
  }, [user?.uid, userCheckIn]);

  const refreshCheckIns = useCallback(async () => {
    if (!venueId) return;

    try {
      setLoading(true);
      setError(null);
      // The real-time listener will update automatically
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to refresh check-ins");
      setLoading(false);
    }
  }, [venueId]);

  return {
    checkIns,
    userCheckIn,
    loading,
    error,
    checkIn,
    checkOut,
    isCheckedIn: userCheckIn !== null,
    refreshCheckIns
  };
};

