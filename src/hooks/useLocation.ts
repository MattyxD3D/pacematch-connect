// Custom hook for GPS location tracking
// Works in web browsers
import { useState, useEffect, useRef } from "react";
import { updateUserLocation } from "../services/locationService";

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

  useEffect(() => {
    // Always track if userId exists and isTracking is true
    if (!userId || !isTracking) {
      // Stop tracking if no user or tracking disabled
      if (browserWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(browserWatchIdRef.current);
        browserWatchIdRef.current = null;
      }
      return;
    }

    // Browser geolocation function
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

    // Start tracking
    startBrowserTracking();

    // Cleanup
    return () => {
      if (browserWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(browserWatchIdRef.current);
        browserWatchIdRef.current = null;
      }
    };
  }, [userId, isTracking, visible]);

  return { location, error, isGettingLocation };
};

