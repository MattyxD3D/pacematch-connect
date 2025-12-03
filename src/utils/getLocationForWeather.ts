/**
 * Utility function to get a one-time location for weather widget
 * Requests location permission and gets current position
 */
import { Geolocation } from "@capacitor/geolocation";
import { isNativePlatform } from "./platform";

export interface Location {
  lat: number;
  lng: number;
}

/**
 * Get current location for weather widget
 * Requests permission if needed and returns location
 */
export const getLocationForWeather = async (): Promise<Location | null> => {
  try {
    if (isNativePlatform()) {
      // Native platform (iOS/Android) - use Capacitor Geolocation
      try {
        // Request permissions first
        const permissionStatus = await Geolocation.requestPermissions();
        
        if (permissionStatus.location !== 'granted') {
          console.warn("⚠️ Location permission denied for weather widget");
          return null;
        }

        // Get current position
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false, // Use lower accuracy for faster response (weather doesn't need precise location)
          timeout: 10000
        });
        
        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } catch (error) {
        console.error("Error getting location (native):", error);
        return null;
      }
    } else {
      // Web platform - use browser Geolocation API
      if (!navigator.geolocation) {
        console.warn("⚠️ Geolocation not supported in this browser");
        return null;
      }

      return new Promise<Location | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.warn("⚠️ Could not get location for weather widget:", error.message);
            resolve(null);
          },
          {
            enableHighAccuracy: false, // Use lower accuracy for faster response
            timeout: 10000,
            maximumAge: 300000 // Accept cached location up to 5 minutes old
          }
        );
      });
    }
  } catch (error) {
    console.error("Error in getLocationForWeather:", error);
    return null;
  }
};

