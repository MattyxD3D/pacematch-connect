/**
 * Platform detection utilities for Capacitor
 * Helps determine if the app is running on native mobile or web
 */

import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running on a native mobile platform (iOS or Android)
 * @returns {boolean} True if running on native platform
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get the current platform name
 * @returns {'ios' | 'android' | 'web'} The platform name
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

/**
 * Check if running on iOS
 * @returns {boolean} True if running on iOS
 */
export const isIOS = (): boolean => {
  return getPlatform() === 'ios';
};

/**
 * Check if running on Android
 * @returns {boolean} True if running on Android
 */
export const isAndroid = (): boolean => {
  return getPlatform() === 'android';
};

/**
 * Check if running on web browser
 * @returns {boolean} True if running on web
 */
export const isWeb = (): boolean => {
  return getPlatform() === 'web';
};

