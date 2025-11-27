// Navigation utility for opening Google Maps

/**
 * Open Google Maps navigation to a specific location
 * Opens the Google Maps app externally (outside the main app)
 * Works on both mobile (opens app) and web (opens in new tab)
 * @param lat - Latitude
 * @param lng - Longitude
 */
export const openGoogleMapsNavigation = (lat: number, lng: number): void => {
  try {
    // Detect if we're on mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      let appUrl: string;
      let webUrl: string;
      
      if (isIOS) {
        // iOS: Try to open Google Maps app, fallback to Apple Maps, then web
        appUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
        webUrl = `https://maps.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        
        // Try Google Maps app first
        const googleMapsLink = document.createElement('a');
        googleMapsLink.href = appUrl;
        googleMapsLink.style.display = 'none';
        document.body.appendChild(googleMapsLink);
        googleMapsLink.click();
        document.body.removeChild(googleMapsLink);
        
        // Fallback to web after a short delay
        setTimeout(() => {
          window.open(webUrl, '_blank');
        }, 500);
      } else if (isAndroid) {
        // Android: Use intent URL scheme
        appUrl = `google.navigation:q=${lat},${lng}`;
        webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        
        // Try to open the app
        window.location.href = appUrl;
        
        // Fallback to web after a short delay
        setTimeout(() => {
          window.open(webUrl, '_blank');
        }, 500);
      } else {
        // Other mobile devices: use web version
        webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(webUrl, '_blank');
      }
    } else {
      // Desktop/Web: open in new tab
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

