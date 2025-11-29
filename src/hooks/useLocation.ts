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
  // Throttle Firebase updates to every 5-10 seconds (use 7.5 seconds as middle ground)
  const lastFirebaseUpdateRef = useRef<number>(0);
  const FIREBASE_UPDATE_INTERVAL = 7500; // 7.5 seconds (middle of 5-10 second range)

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

        // Always update Firebase on initial position (no throttling for first update)
        lastFirebaseUpdateRef.current = Date.now();
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

              // Throttle Firebase updates to every 5-10 seconds
              const now = Date.now();
              const timeSinceLastUpdate = now - lastFirebaseUpdateRef.current;
              
              if (timeSinceLastUpdate >= FIREBASE_UPDATE_INTERVAL) {
                lastFirebaseUpdateRef.current = now;
                await updateUserLocation(userId, latitude, longitude, visible);
              }
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
      console.log("🌐 Starting browser GPS tracking...");
      setIsGettingLocation(true);

      // Check if we're in a secure context (HTTPS or localhost)
      // Geolocation API requires secure context in modern browsers
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        console.warn("⚠️ Not in a secure context (HTTPS). Geolocation may not work.");
        console.warn("⚠️ Current protocol:", window.location.protocol);
        console.warn("⚠️ To fix: Use HTTPS or localhost for development.");
      }

      // Check if geolocation is supported
      if (!navigator.geolocation) {
        const errorMsg = "Geolocation is not supported by your browser";
        console.error("❌", errorMsg);
        setError(errorMsg);
        setIsGettingLocation(false);
        return;
      }

      // Check permission state if Permissions API is available (Chrome, Edge, etc.)
      // This is done asynchronously but doesn't block the geolocation request
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName })
          .then((permissionStatus) => {
            console.log("📍 Permission state:", permissionStatus.state);
            
            if (permissionStatus.state === 'denied') {
              const errorMsg = "Location permission denied. Please allow location access in your browser settings.";
              console.error("❌", errorMsg);
              setError(errorMsg);
              setIsGettingLocation(false);
              return;
            }
            
            // Listen for permission changes
            permissionStatus.onchange = () => {
              console.log("📍 Permission state changed to:", permissionStatus.state);
              if (permissionStatus.state === 'granted') {
                // Permission was granted, retry getting position if we don't have one yet
                console.log("📍 Permission granted, location should start working now...");
                // The watchPosition will automatically start working once permission is granted
              } else if (permissionStatus.state === 'denied') {
                setError("Location permission denied. Please allow location access in your browser settings.");
                setIsGettingLocation(false);
              }
            };
          })
          .catch((err) => {
            // Permissions API might not be fully supported, continue anyway
            console.log("⚠️ Permissions API not fully supported, continuing with geolocation request...", err);
          });
      }

      console.log("📍 Requesting current position (will prompt for permission if needed)...");
      
      // Track which accuracy setting worked so we can use it for watchPosition
      let workingAccuracy = true; // Start with high accuracy
      
      // Try to get position with retry logic
      const tryGetPosition = (attempt: number = 1, useHighAccuracy: boolean = true) => {
        const maxAttempts = 2;
        const currentTimeout = useHighAccuracy ? 15000 : 30000; // 30s for low accuracy (network geolocation can be slow)
        const currentMaxAge = useHighAccuracy ? 0 : 120000; // Accept cached location up to 2 minutes for low accuracy
        
        console.log(`📍 Attempting to get position (attempt ${attempt}/${maxAttempts}, highAccuracy: ${useHighAccuracy}, timeout: ${currentTimeout}ms)`);
        
        navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };

          console.log("✅ GPS position obtained:", newLocation);
          console.log(`📍 Position accuracy: ${accuracy?.toFixed(1) || 'unknown'}m, highAccuracy setting: ${useHighAccuracy}`);
          
          // Remember which accuracy setting worked
          workingAccuracy = useHighAccuracy;
          
          setLocation(newLocation);
          setError(null);
          setIsGettingLocation(false);

          // Always update Firebase on initial position (no throttling for first update)
          lastFirebaseUpdateRef.current = Date.now();
          try {
            await updateUserLocation(userId, latitude, longitude, visible);
            console.log("✅ Location updated to Firebase");
          } catch (error) {
            console.error("❌ Error updating location to Firebase:", error);
          }

          // Watch position for updates - use the same accuracy setting that worked
          console.log(`📍 Starting continuous GPS tracking (highAccuracy: ${workingAccuracy})...`);
          browserWatchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const newLocation = { lat: latitude, lng: longitude };

              setLocation(newLocation);
              setError(null);

              // Throttle Firebase updates to every 5-10 seconds
              const now = Date.now();
              const timeSinceLastUpdate = now - lastFirebaseUpdateRef.current;
              
              if (timeSinceLastUpdate >= FIREBASE_UPDATE_INTERVAL) {
                lastFirebaseUpdateRef.current = now;
                try {
                  await updateUserLocation(userId, latitude, longitude, visible);
                } catch (error) {
                  console.error("❌ Error updating location to Firebase:", error);
                }
              }
            },
            (err) => {
              let errorMessage = "Location error";
              console.error(`❌ watchPosition error - code: ${err.code}, message: "${err.message}"`);
              switch (err.code) {
                case err.PERMISSION_DENIED:
                  errorMessage = "Location permission denied. Please allow location access in your browser settings.";
                  console.error("❌ GPS Permission denied:", err);
                  break;
                case err.POSITION_UNAVAILABLE:
                  errorMessage = "Location information unavailable. Your location is still being tracked when available.";
                  console.error("❌ GPS Position unavailable:", err);
                  // Don't stop tracking - watchPosition will retry automatically
                  return;
                case err.TIMEOUT:
                  errorMessage = "Location request timed out. Retrying...";
                  console.error("❌ GPS Request timeout:", err);
                  // Don't stop tracking - watchPosition will retry automatically
                  return;
                default:
                  errorMessage = err.message || "Unknown location error";
                  console.error("❌ GPS Error:", err);
              }
              setError(errorMessage);
              setIsGettingLocation(false);
            },
            {
              // Use the same accuracy setting that worked for getCurrentPosition
              enableHighAccuracy: workingAccuracy,
              timeout: workingAccuracy ? 15000 : 30000, // Match the timeout used for getCurrentPosition
              maximumAge: 10000 // Accept positions up to 10 seconds old
            }
          );
        },
        (err) => {
          let errorMessage = "Location error";
          let shouldRetry = false;
          
          // Log detailed error information for debugging
          console.error(`❌ getCurrentPosition error - code: ${err.code}, message: "${err.message}"`);
          console.error(`❌ Error details - attempt: ${attempt}/${maxAttempts}, highAccuracy: ${useHighAccuracy}`);
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please allow location access in your browser settings.";
              console.error("❌ GPS Permission denied on initial request");
              console.error("💡 Tip: Check browser URL bar for location icon, or go to browser Settings > Privacy > Location");
              break;
            case err.POSITION_UNAVAILABLE:
              // If high accuracy failed and we haven't retried with low accuracy, try again
              if (useHighAccuracy && attempt < maxAttempts) {
                console.warn(`⚠️ GPS Position unavailable with high accuracy (attempt ${attempt}). Retrying with lower accuracy...`);
                console.warn("💡 This is normal on desktop browsers - they use network-based location instead of GPS");
                shouldRetry = true;
                setTimeout(() => tryGetPosition(attempt + 1, false), 1000);
                return; // Don't set error yet, wait for retry
              }
              errorMessage = "GPS signal unavailable. Please check:\n• You're in an area with GPS coverage\n• Location services are enabled\n• Try moving to an open area";
              console.error("❌ GPS Position unavailable after all attempts");
              console.error("💡 Possible causes: Browser blocked, no network location available, or location services disabled at OS level");
              break;
            case err.TIMEOUT:
              // If timeout and we haven't retried, try with lower accuracy
              if (useHighAccuracy && attempt < maxAttempts) {
                console.warn(`⚠️ GPS Request timeout with high accuracy (attempt ${attempt}). Retrying with lower accuracy and longer timeout...`);
                shouldRetry = true;
                setTimeout(() => tryGetPosition(attempt + 1, false), 1000);
                return; // Don't set error yet, wait for retry
              }
              errorMessage = "Location request timed out. Please try again or check your GPS signal.";
              console.error("❌ GPS Request timeout after all attempts");
              console.error("💡 Network geolocation can be slow. Try refreshing the page.");
              break;
            default:
              errorMessage = err.message || "Unknown location error";
              console.error("❌ GPS Error on initial request:", err);
          }
          
          if (!shouldRetry) {
            setError(errorMessage);
            setIsGettingLocation(false);
          }
        },
        {
          enableHighAccuracy: useHighAccuracy,
          timeout: currentTimeout,
          maximumAge: currentMaxAge
        }
      );
      };
      
      // Start first attempt
      tryGetPosition(1, true);
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

