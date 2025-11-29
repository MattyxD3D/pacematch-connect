// Navigation utility for opening Google Maps

/**
 * Open Google Maps navigation to a specific location
 * Opens the Google Maps app externally (outside the main app)
 * Works on both mobile (opens app) and web (opens in new tab)
 * 
 * Uses universal Google Maps URL that works reliably across all platforms.
 * On mobile devices, this will open in the Google Maps app if installed,
 * otherwise it opens in the browser.
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 */
export const openGoogleMapsNavigation = (lat: number, lng: number): void => {
  try {
    // Universal Google Maps URL that works across all platforms
    // This URL will:
    // - Open in Google Maps app if installed (on mobile)
    // - Open in browser if app not installed
    // - Work on iOS, Android, and Web without errors
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    
    // Open in new window/tab (or app if available on mobile)
    // Using _blank ensures it opens externally, not in the current app
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  } catch (error) {
    // Silent fallback - don't log errors to avoid console noise
    // If window.open fails, try direct navigation
    try {
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.location.href = fallbackUrl;
    } catch (fallbackError) {
      // Last resort: silently fail (user can manually open maps)
      // Don't log to avoid console errors
    }
  }
};

