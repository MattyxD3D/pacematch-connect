// Navigation utility for opening Google Maps

/**
 * Open Google Maps navigation to a specific location
 * Opens the Google Maps app externally (outside the main app)
 * @param lat - Latitude
 * @param lng - Longitude
 */
export const openGoogleMapsNavigation = (lat: number, lng: number): void => {
  try {
    // Detect if we're on mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Try to open Google Maps app directly
      // iOS and Android support this URL scheme
      const appUrl = `google.navigation:q=${lat},${lng}`;
      
      // Try to open the app, fallback to web if app not installed
      window.location.href = appUrl;
      
      // Fallback to web after a short delay if app doesn't open
      setTimeout(() => {
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(webUrl, '_blank');
      }, 500);
    } else {
      // Desktop: open in new tab
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(webUrl, '_blank');
    }
  } catch (error) {
    console.error("Error opening Google Maps:", error);
    // Fallback to web version
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(webUrl, '_blank');
  }
};

