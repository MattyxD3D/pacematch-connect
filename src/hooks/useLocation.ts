// Custom hook for GPS location tracking
// Works in web browsers and native mobile apps (via Capacitor)
import { useState, useEffect, useRef, useCallback } from "react";
import { Geolocation } from "@capacitor/geolocation";
import { updateUserLocation } from "../services/locationService";
import { isNativePlatform } from "../utils/platform";

export interface Location {
  lat: number;
  lng: number;
}

/**
 * Custom hook to track user's GPS location
 * @param {string | null} userId - Current user ID
 * @param {boolean} isTracking - Whether tracking is active
 * @param {boolean} visible - Whether user is visible on map
 * @returns {Object} { location, error, isGettingLocation }
 */
export const useLocation = (
  userId: string | null,
  isTracking: boolean,
  visible: boolean
) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const browserWatchIdRef = useRef<number | null>(null);
  const nativeWatchIdRef = useRef<string | null>(null);
  const isNative = isNativePlatform();

  const stopTracking = useCallback(async () => {
    // Stop browser geolocation
    if (browserWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(browserWatchIdRef.current);
      browserWatchIdRef.current = null;
    }
    
    // Stop Capacitor geolocation
    if (nativeWatchIdRef.current !== null) {
      try {
        await Geolocation.clearWatch({ id: nativeWatchIdRef.current });
        nativeWatchIdRef.current = null;
      } catch (err) {
        console.error("Error clearing native watch:", err);
      }
    }
  }, []);

  useEffect(() => {
    // Always track if userId exists and isTracking is true
    if (!userId || !isTracking) {
      // Stop tracking if no user or tracking disabled
      stopTracking();
      setIsGettingLocation(false);
      return;
    }

    /**
     * Start native mobile tracking using Capacitor Geolocation API
     * This provides better accuracy and battery efficiency on mobile devices
     */
    const startNativeTracking = async () => {
      setIsGettingLocation(true);

      try {
        // Request permissions first
        const permissionStatus = await Geolocation.requestPermissions();
        
        if (permissionStatus.location !== 'granted') {
          setError("Location permission denied. Please allow location access in your device settings.");
          setIsGettingLocation(false);
          return;
        }

        // Get current position first
        const currentPosition = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });

        const { latitude, longitude } = currentPosition.coords;
        const newLocation = { lat: latitude, lng: longitude };

        setLocation(newLocation);
        setError(null);
        setIsGettingLocation(false);

        // Update to Firebase
        await updateUserLocation(userId, latitude, longitude, visible);

        // Watch position for continuous updates
        const watchId = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 10000
          },
          async (position, err) => {
            if (err) {
              let errorMessage = "Location error";
              if (err.message) {
                errorMessage = err.message;
              } else if (err.code === 'PERMISSION_DENIED') {
                errorMessage = "Location permission denied. Please allow location access in your device settings.";
              } else if (err.code === 'POSITION_UNAVAILABLE') {
                errorMessage = "Location information unavailable.";
              } else if (err.code === 'TIMEOUT') {
                errorMessage = "Location request timed out.";
              }
              setError(errorMessage);
              setIsGettingLocation(false);
              return;
            }

            if (position) {
              const { latitude, longitude } = position.coords;
              const newLocation = { lat: latitude, lng: longitude };

              setLocation(newLocation);
              setError(null);

              // Update to Firebase every 5-10 seconds
              await updateUserLocation(userId, latitude, longitude, visible);
            }
          }
        );

        nativeWatchIdRef.current = watchId;
      } catch (err: any) {
        let errorMessage = "Location error";
        if (err?.message) {
          errorMessage = err.message;
        } else if (err?.code === 'PERMISSION_DENIED') {
          errorMessage = "Location permission denied. Please allow location access in your device settings.";
        }
        setError(errorMessage);
        setIsGettingLocation(false);
      }
    };

    /**
     * Start browser tracking using Web Geolocation API
     * Used when running in web browsers
     */
    const startBrowserTracking = () => {
      setIsGettingLocation(true);

      // Check if geolocation is supported
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by your browser");
        setIsGettingLocation(false);
        return;
      }

      // Get current position first (this will prompt for permission)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };

          setLocation(newLocation);
          setError(null);
          setIsGettingLocation(false);

          // Update to Firebase
          await updateUserLocation(userId, latitude, longitude, visible);

          // Watch position for updates
          browserWatchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const newLocation = { lat: latitude, lng: longitude };

              setLocation(newLocation);
              setError(null);

              // Update to Firebase every 5-10 seconds
              await updateUserLocation(userId, latitude, longitude, visible);
            },
            (err) => {
              let errorMessage = "Location error";
              switch (err.code) {
                case err.PERMISSION_DENIED:
                  errorMessage = "Location permission denied. Please allow location access in your browser settings.";
                  break;
                case err.POSITION_UNAVAILABLE:
                  errorMessage = "Location information unavailable.";
                  break;
                case err.TIMEOUT:
                  errorMessage = "Location request timed out.";
                  break;
                default:
                  errorMessage = err.message || "Unknown location error";
              }
              setError(errorMessage);
              setIsGettingLocation(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 5000
            }
          );
        },
        (err) => {
          let errorMessage = "Location error";
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please allow location access in your browser settings.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable.";
              break;
            case err.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
            default:
              errorMessage = err.message || "Unknown location error";
          }
          setError(errorMessage);
          setIsGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000
        }
      );
    };

    // Start tracking based on platform
    if (isNative) {
      startNativeTracking();
    } else {
      startBrowserTracking();
    }

    // Cleanup
    return () => {
      stopTracking();
    };
  }, [userId, isTracking, visible, stopTracking, isNative]);

  // Ensure tracking stops on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return { location, error, isGettingLocation, stopTracking };
};

