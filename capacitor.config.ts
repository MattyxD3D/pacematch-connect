import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pacematch.app',
  appName: 'PaceMatch',
  webDir: 'dist',
  server: {
    // For development, you can uncomment this to test against Firebase hosting
    // url: 'https://pacematch-gps.web.app',
    // cleartext: true
    // For production APK, leave this commented (uses local files)
  },
  android: {
    allowMixedContent: true,
    // Enable location permissions
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'INTERNET'
    ]
  },
  ios: {
    // Enable location permissions for iOS
    permissions: [
      'LOCATION_WHEN_IN_USE',
      'LOCATION_ALWAYS'
    ]
  }
};

export default config;

