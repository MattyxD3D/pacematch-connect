// Movement detection hook for workout inactivity detection
// Uses GPS position history to detect if user is stationary
import { useEffect, useRef, useCallback } from "react";

export interface Location {
  lat: number;
  lng: number;
}

interface MovementDetectionOptions {
  /** Location updates to monitor */
  location: Location | null;
  /** Whether workout is currently active */
  isActive: boolean;
  /** Whether workout is paused */
  isPaused: boolean;
  /** Callback when stationary state detected */
  onStationary: () => void;
  /** Callback when movement detected after being stationary */
  onMovementDetected?: () => void;
  /** Distance threshold in meters (default: 10m) */
  distanceThreshold?: number;
  /** Detection window in minutes (default: 5 minutes) */
  detectionWindowMinutes?: number;
}

interface LocationWithTimestamp extends Location {
  timestamp: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in meters
 */
const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (loc1.lat * Math.PI) / 180;
  const φ2 = (loc2.lat * Math.PI) / 180;
  const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Hook to detect if user is stationary during workout
 * Monitors GPS positions over a time window and detects if movement is below threshold
 */
export const useMovementDetection = ({
  location,
  isActive,
  isPaused,
  onStationary,
  onMovementDetected,
  distanceThreshold = 10, // 10 meters
  detectionWindowMinutes = 5, // 5 minutes
}: MovementDetectionOptions) => {
  const locationHistoryRef = useRef<LocationWithTimestamp[]>([]);
  const isStationaryRef = useRef(false);
  const lastStationaryCallRef = useRef<number>(0);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const workoutStartTimeRef = useRef<number | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  // Check if user has moved significantly in the detection window
  const checkMovement = useCallback((currentPaused: boolean) => {
    const now = Date.now();
    const windowMs = detectionWindowMinutes * 60 * 1000;
    const cutoffTime = now - windowMs;

    // Don't trigger stationary warning until full detection window has elapsed since workout started
    if (workoutStartTimeRef.current) {
      const timeSinceStart = now - workoutStartTimeRef.current;
      if (timeSinceStart < windowMs) {
        // Not enough time has passed since workout started, wait longer
        return;
      }
    }

    // Filter locations within the detection window
    const recentLocations = locationHistoryRef.current.filter(
      (loc) => loc.timestamp > cutoffTime
    );

    // Need at least 2 locations to calculate movement
    if (recentLocations.length < 2) {
      // Not enough data yet, wait for more locations
      return;
    }

    // Calculate total distance traveled in the window
    let totalDistance = 0;
    for (let i = 1; i < recentLocations.length; i++) {
      totalDistance += calculateDistance(
        recentLocations[i - 1],
        recentLocations[i]
      );
    }

    // Also calculate straight-line distance from first to last point
    const straightLineDistance = calculateDistance(
      recentLocations[0],
      recentLocations[recentLocations.length - 1]
    );

    // User is stationary if:
    // 1. Total distance traveled < threshold (they stayed in a small area)
    // 2. Straight-line distance < threshold (they didn't move far from starting point)
    const isCurrentlyStationary =
      totalDistance < distanceThreshold && straightLineDistance < distanceThreshold;

    // Only trigger callbacks on state changes to avoid spam
    if (isCurrentlyStationary && !isStationaryRef.current) {
      // Just became stationary - only trigger if not paused
      isStationaryRef.current = true;
      // Only call onStationary when not paused (don't warn if already paused)
      if (!currentPaused) {
        // Throttle stationary callback to once per detection window
        const timeSinceLastCall = now - lastStationaryCallRef.current;
        if (timeSinceLastCall > windowMs) {
          onStationary();
          lastStationaryCallRef.current = now;
        }
      }
    } else if (!isCurrentlyStationary && isStationaryRef.current) {
      // Movement detected after being stationary
      isStationaryRef.current = false;
      // Always call onMovementDetected when movement detected (for resume functionality)
      if (onMovementDetected) {
        onMovementDetected();
      }
    }
  }, [distanceThreshold, detectionWindowMinutes, onStationary, onMovementDetected]);

  // Add location to history when it updates
  // Continue tracking even when paused to detect movement for resume
  useEffect(() => {
    if (!location || !isActive) {
      return;
    }

    // Add new location with timestamp
    locationHistoryRef.current.push({
      ...location,
      timestamp: Date.now(),
    });

    // Keep only locations from the last (detection window + 1 minute buffer)
    const maxAge = (detectionWindowMinutes + 1) * 60 * 1000;
    const cutoffTime = Date.now() - maxAge;
    locationHistoryRef.current = locationHistoryRef.current.filter(
      (loc) => loc.timestamp > cutoffTime
    );
  }, [location, isActive, detectionWindowMinutes]);

  // Track workout start time and reset location history when workout starts
  const prevIsActiveRef = useRef<boolean>(false);
  useEffect(() => {
    // Detect transition from inactive to active
    if (isActive && !prevIsActiveRef.current) {
      // Workout just started - reset tracking
      workoutStartTimeRef.current = Date.now();
      locationHistoryRef.current = []; // Clear location history for fresh start
      isStationaryRef.current = false; // Reset stationary state
      lastStationaryCallRef.current = 0; // Reset throttle timer
    } else if (!isActive) {
      // Workout stopped - clear start time
      workoutStartTimeRef.current = null;
    }
    
    prevIsActiveRef.current = isActive;
  }, [isActive]);

  // Set up periodic checking
  useEffect(() => {
    if (!isActive) {
      cleanup();
      // Reset stationary state when workout stops
      isStationaryRef.current = false;
      return;
    }

    // Check every 30 seconds for movement
    // Continue checking even when paused to detect movement for resume
    checkIntervalRef.current = setInterval(() => {
      checkMovement(isPaused);
    }, 30000);

    // Also check immediately after locations update
    checkMovement(isPaused);

    return cleanup;
  }, [isActive, isPaused, checkMovement, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isStationary: isStationaryRef.current,
    locationCount: locationHistoryRef.current.length,
  };
};

