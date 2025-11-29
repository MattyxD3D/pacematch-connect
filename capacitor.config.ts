import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pacematch.app',
  appName: 'PaceMatch',
  webDir: 'dist',
  // Remove server config for production builds
  // Uncomment below for live reload during development
  // server: {
  //   url: 'https://pacematch-gps.web.app',
  //   cleartext: true
  // },
  android: {
    allowMixedContent: true,
    // Enable location permissions
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'INTERNET',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE'
    ],
    // Android build configuration
    buildOptions: {
      keystorePath: undefined, // Set path to your keystore for production builds
      keystoreAlias: undefined, // Set your keystore alias
      releaseType: undefined // 'AAB' or 'APK'
    }
  },
  ios: {
    // Enable location permissions for iOS
    permissions: [
      'LOCATION_WHEN_IN_USE',
      'LOCATION_ALWAYS',
      'CAMERA',
      'PHOTO_LIBRARY'
    ],
    // iOS build configuration
    scheme: 'pacematch',
    // Add your bundle identifier if different
    // bundleIdentifier: 'com.pacematch.app'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff'
    },
    Geolocation: {
      // Request location permissions
      permissions: {
        location: {
          usage: 'always' // or 'whenInUse' for foreground only
        }
      }
    }
  }
};

export default config;

