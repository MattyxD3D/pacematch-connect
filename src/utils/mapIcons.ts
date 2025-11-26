/**
 * Utility functions for creating custom map marker icons from profile pictures
 */

interface IconOptions {
  size?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: boolean;
}

const DEFAULT_SIZE = 48;
const DEFAULT_BORDER_WIDTH = 3;
const DEFAULT_BORDER_COLOR = '#ffffff';
const CACHE_SIZE = 100; // Limit cache size to prevent memory issues

// Cache for generated icons to avoid regenerating the same icon
const iconCache = new Map<string, string>();

/**
 * Creates a circular profile picture icon for Google Maps markers
 * This is an async function that loads the image and returns a data URL
 * @param photoURL - URL of the profile picture, or null/undefined for fallback
 * @param name - User's name for fallback avatar generation
 * @param options - Optional styling options
 * @returns Promise that resolves to data URL of the generated icon
 */
export async function createProfileIconAsync(
  photoURL: string | null | undefined,
  name: string = 'User',
  options: IconOptions = {}
): Promise<string> {
  const {
    size = DEFAULT_SIZE,
    borderWidth = DEFAULT_BORDER_WIDTH,
    borderColor = DEFAULT_BORDER_COLOR,
    shadow = true
  } = options;

  // Create cache key
  const cacheKey = `${photoURL || name}-${size}-${borderWidth}-${borderColor}-${shadow}`;
  
  // Check cache first
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  // Limit cache size - remove oldest entries if needed
  if (iconCache.size >= CACHE_SIZE) {
    const firstKey = iconCache.keys().next().value;
    iconCache.delete(firstKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    // Fallback to default icon if canvas is not supported
    return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }

  // Draw shadow if enabled (drawn first, behind everything)
  if (shadow) {
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  }

  // Draw border circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - borderWidth / 2, 0, Math.PI * 2);
  ctx.fillStyle = borderColor;
  ctx.fill();

  // Create clipping path for circular image
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - borderWidth, 0, Math.PI * 2);
  ctx.clip();

  // If we have a photo URL, try to load and draw it
  if (photoURL) {
    try {
      await loadAndDrawImage(ctx, photoURL, size);
    } catch (error) {
      // If image fails to load, use fallback
      console.warn('Error loading profile image, using fallback:', error);
      drawFallbackAvatar(ctx, name, size);
    }
  } else {
    // No photo URL, use fallback avatar
    drawFallbackAvatar(ctx, name, size);
  }

  ctx.restore();
  
  const dataUrl = canvas.toDataURL('image/png');
  iconCache.set(cacheKey, dataUrl);
  return dataUrl;
}

/**
 * Synchronous version that returns fallback immediately and updates when image loads
 * Use this for immediate rendering with fallback
 */
export function createProfileIcon(
  photoURL: string | null | undefined,
  name: string = 'User',
  options: IconOptions = {}
): string {
  const {
    size = DEFAULT_SIZE,
    borderWidth = DEFAULT_BORDER_WIDTH,
    borderColor = DEFAULT_BORDER_COLOR,
  } = options;

  // Create cache key
  const cacheKey = `${photoURL || name}-${size}-${borderWidth}-${borderColor}`;
  
  // Check cache first
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }

  // Draw border circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - borderWidth / 2, 0, Math.PI * 2);
  ctx.fillStyle = borderColor;
  ctx.fill();

  // Create clipping path
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - borderWidth, 0, Math.PI * 2);
  ctx.clip();

  // Draw fallback immediately
  drawFallbackAvatar(ctx, name, size);

  // If we have a photo URL, load it asynchronously and update cache
  if (photoURL) {
    loadAndDrawImage(ctx, photoURL, size)
      .then(() => {
        const dataUrl = canvas.toDataURL('image/png');
        iconCache.set(cacheKey, dataUrl);
      })
      .catch(() => {
        // Already have fallback, just cache it
        const dataUrl = canvas.toDataURL('image/png');
        iconCache.set(cacheKey, dataUrl);
      });
  }

  ctx.restore();
  
  const dataUrl = canvas.toDataURL('image/png');
  iconCache.set(cacheKey, dataUrl);
  return dataUrl;
}

/**
 * Loads an image and draws it to the canvas context
 */
function loadAndDrawImage(
  ctx: CanvasRenderingContext2D,
  photoURL: string,
  size: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Clear and redraw
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = photoURL;
  });
}

/**
 * Draws a fallback avatar with user's initials
 */
function drawFallbackAvatar(
  ctx: CanvasRenderingContext2D,
  name: string,
  size: number
): void {
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4f46e5'); // indigo
  gradient.addColorStop(1, '#7c3aed'); // purple
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Draw initials
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2);
}

/**
 * Creates a Google Maps icon object from a profile picture
 * @param photoURL - URL of the profile picture
 * @param name - User's name for fallback
 * @param size - Size of the icon in pixels
 * @returns Google Maps icon configuration object
 */
export function createMapIcon(
  photoURL: string | null | undefined,
  name: string = 'User',
  size: number = DEFAULT_SIZE
): google.maps.Icon {
  const iconUrl = createProfileIcon(photoURL, name, { size });
  
  return {
    url: iconUrl,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
    origin: new google.maps.Point(0, 0)
  };
}

