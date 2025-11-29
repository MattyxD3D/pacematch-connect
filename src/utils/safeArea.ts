/**
 * Safe Area utilities for mobile devices
 * Provides JavaScript-based safe area insets as fallback when CSS env() doesn't work
 */

import React from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Initialize StatusBar for edge-to-edge display
 * This enables safe area insets to work properly
 */
export const initializeStatusBar = async () => {
  if (!Capacitor.isNativePlatform()) {
    return; // Only needed on native platforms
  }

  try {
    // Set status bar to overlay content (edge-to-edge)
    await StatusBar.setOverlaysWebView({ overlay: true });
    
    // Set status bar style (light content for dark backgrounds, dark for light)
    // You can customize this based on your app's theme
    await StatusBar.setStyle({ style: Style.Light });
    
    // Set background color (transparent for edge-to-edge)
    await StatusBar.setBackgroundColor({ color: '#00000000' });
  } catch (error) {
    console.warn('Failed to initialize StatusBar:', error);
  }
};

/**
 * Get safe area insets using JavaScript
 * Falls back to CSS env() variables if available
 */
export const getSafeAreaInsets = () => {
  if (!Capacitor.isNativePlatform()) {
    // On web, try to get from CSS custom properties
    const root = document.documentElement;
    const top = getComputedStyle(root).getPropertyValue('--safe-area-inset-top') || '0px';
    const bottom = getComputedStyle(root).getPropertyValue('--safe-area-inset-bottom') || '0px';
    const left = getComputedStyle(root).getPropertyValue('--safe-area-inset-left') || '0px';
    const right = getComputedStyle(root).getPropertyValue('--safe-area-inset-right') || '0px';
    
    return {
      top: parseFloat(top) || 0,
      bottom: parseFloat(bottom) || 0,
      left: parseFloat(left) || 0,
      right: parseFloat(right) || 0,
    };
  }

  // On native, use CSS env() if available, otherwise use defaults
  // Android typically has ~24px status bar and ~48px navigation bar
  const defaultTop = 24; // Typical Android status bar height
  const defaultBottom = 48; // Typical Android navigation bar height
  
  return {
    top: defaultTop,
    bottom: defaultBottom,
    left: 0,
    right: 0,
  };
};

/**
 * React hook to get safe area insets
 * Updates when window resizes
 */
export const useSafeAreaInsets = () => {
  const [insets, setInsets] = React.useState(getSafeAreaInsets());

  React.useEffect(() => {
    const updateInsets = () => {
      setInsets(getSafeAreaInsets());
    };

    // Update on resize
    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', updateInsets);

    // Initial update after a short delay to ensure CSS is applied
    const timeout = setTimeout(updateInsets, 100);

    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
      clearTimeout(timeout);
    };
  }, []);

  return insets;
};

