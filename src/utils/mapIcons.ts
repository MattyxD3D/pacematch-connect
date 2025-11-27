/**
 * Utility functions for creating custom map marker icons from profile pictures
 */

export type FitnessLevel = "beginner" | "intermediate" | "pro";

interface IconOptions {
  size?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: boolean;
  fitnessLevel?: FitnessLevel | string;
}

const DEFAULT_SIZE = 48;
const DEFAULT_BORDER_WIDTH = 3;
const DEFAULT_BORDER_COLOR = '#ffffff';
const CACHE_SIZE = 100; // Limit cache size to prevent memory issues
const GLOW_SIZE = 8; // Additional pixels for glow effect around the avatar

// Cache for generated icons to avoid regenerating the same icon
const iconCache = new Map<string, string>();

/**
 * Gets the glow color for a fitness level
 * @param fitnessLevel - User's fitness level
 * @returns Object with glow color and border color
 */
function getFitnessLevelColors(fitnessLevel?: FitnessLevel | string): { glowColor: string; borderColor: string } | null {
  if (!fitnessLevel) return null;
  
  const normalizedLevel = (fitnessLevel as string).toLowerCase();
  
  switch (normalizedLevel) {
    case "beginner":
      return {
        glowColor: 'rgba(59, 130, 246, 0.6)', // Blue
        borderColor: '#3b82f6' // Blue border
      };
    case "intermediate":
      return {
        glowColor: 'rgba(34, 197, 94, 0.6)', // Green
        borderColor: '#22c55e' // Green border
      };
    case "pro":
      return {
        glowColor: 'rgba(168, 85, 247, 0.6)', // Purple
        borderColor: '#a855f7' // Purple border
      };
    default:
      return null;
  }
}

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
    shadow = true,
    fitnessLevel
  } = options;

  // Get fitness level colors
  const fitnessColors = getFitnessLevelColors(fitnessLevel);
  const hasGlow = !!fitnessColors;
  
  // Increase canvas size to accommodate glow
  const canvasSize = hasGlow ? size + GLOW_SIZE * 2 : size;
  const avatarOffset = hasGlow ? GLOW_SIZE : 0;
  const avatarCenter = canvasSize / 2;

  // Create cache key
  const cacheKey = `${photoURL || name}-${size}-${borderWidth}-${borderColor}-${shadow}-${fitnessLevel || 'none'}`;
  
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
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    // Fallback to default icon if canvas is not supported
    return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }

  // Draw fitness level glow if available (drawn first, behind everything)
  if (hasGlow && fitnessColors) {
    drawGlowEffect(ctx, avatarCenter, avatarCenter, size / 2, fitnessColors.glowColor);
  }

  // Draw shadow if enabled
  if (shadow) {
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  }

  // Draw border circle with fitness level color if available
  const finalBorderColor = fitnessColors?.borderColor || borderColor;
  ctx.beginPath();
  ctx.arc(avatarCenter, avatarCenter, size / 2 - borderWidth / 2, 0, Math.PI * 2);
  ctx.fillStyle = finalBorderColor;
  ctx.fill();

  // Create clipping path for circular image
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCenter, avatarCenter, size / 2 - borderWidth, 0, Math.PI * 2);
  ctx.clip();

  // If we have a photo URL, try to load and draw it
  if (photoURL) {
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = photoURL;
      });
      
      // Draw image centered and scaled to fill the circular area
      const imgAspect = img.width / img.height;
      const circleSize = size;
      let drawWidth = circleSize;
      let drawHeight = circleSize;
      let drawX = avatarOffset;
      let drawY = avatarOffset;
      
      // Scale to cover the circle (maintain aspect ratio, fill entire circle)
      if (imgAspect > 1) {
        // Image is wider - scale height to circle, width extends
        drawHeight = circleSize;
        drawWidth = circleSize * imgAspect;
        drawX = avatarOffset - (drawWidth - circleSize) / 2;
      } else {
        // Image is taller or square - scale width to circle, height extends
        drawWidth = circleSize;
        drawHeight = circleSize / imgAspect;
        drawY = avatarOffset - (drawHeight - circleSize) / 2;
      }
      
      // Draw the image - clipping path will make it circular
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    } catch (error) {
      // If image fails to load, use fallback
      console.warn('Error loading profile image, using fallback:', error);
      drawFallbackAvatar(ctx, name, size, avatarOffset, avatarOffset);
    }
  } else {
    // No photo URL, use fallback avatar
    drawFallbackAvatar(ctx, name, size, avatarOffset, avatarOffset);
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
    fitnessLevel
  } = options;

  // Get fitness level colors
  const fitnessColors = getFitnessLevelColors(fitnessLevel);
  const hasGlow = !!fitnessColors;
  
  // Increase canvas size to accommodate glow
  const canvasSize = hasGlow ? size + GLOW_SIZE * 2 : size;
  const avatarOffset = hasGlow ? GLOW_SIZE : 0;
  const avatarCenter = canvasSize / 2;

  // Create cache key
  const cacheKey = `${photoURL || name}-${size}-${borderWidth}-${borderColor}-${fitnessLevel || 'none'}`;
  
  // Check cache first
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }

  // Draw fitness level glow if available (drawn first, behind everything)
  if (hasGlow && fitnessColors) {
    drawGlowEffect(ctx, avatarCenter, avatarCenter, size / 2, fitnessColors.glowColor);
  }

  // Draw border circle with fitness level color if available
  const finalBorderColor = fitnessColors?.borderColor || borderColor;
  ctx.beginPath();
  ctx.arc(avatarCenter, avatarCenter, size / 2 - borderWidth / 2, 0, Math.PI * 2);
  ctx.fillStyle = finalBorderColor;
  ctx.fill();

  // Create clipping path for circular image
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCenter, avatarCenter, size / 2 - borderWidth, 0, Math.PI * 2);
  ctx.clip();

  // Draw fallback immediately
  drawFallbackAvatar(ctx, name, size, avatarOffset, avatarOffset);

  // If we have a photo URL, load it asynchronously and update cache
  // Note: We need to recreate the full drawing when image loads since context state is lost
  if (photoURL) {
    // Store canvas and context for async update
    const updateCanvas = async () => {
      try {
        // Recreate the full drawing with the loaded image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = photoURL;
        });
        
        // Clear and redraw everything
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        
        // Redraw glow
        if (hasGlow && fitnessColors) {
          drawGlowEffect(ctx, avatarCenter, avatarCenter, size / 2, fitnessColors.glowColor);
        }
        
        // Redraw border
        ctx.beginPath();
        ctx.arc(avatarCenter, avatarCenter, size / 2 - borderWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = finalBorderColor;
        ctx.fill();
        
        // Recreate clipping path
        ctx.beginPath();
        ctx.arc(avatarCenter, avatarCenter, size / 2 - borderWidth, 0, Math.PI * 2);
        ctx.clip();
        
        // Draw image centered and scaled to fill circle
        const imgAspect = img.width / img.height;
        const circleSize = size;
        let drawWidth = circleSize;
        let drawHeight = circleSize;
        let drawX = avatarOffset;
        let drawY = avatarOffset;
        
        if (imgAspect > 1) {
          drawHeight = circleSize;
          drawWidth = circleSize * imgAspect;
          drawX = avatarOffset - (drawWidth - circleSize) / 2;
        } else {
          drawWidth = circleSize;
          drawHeight = circleSize / imgAspect;
          drawY = avatarOffset - (drawHeight - circleSize) / 2;
        }
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        
        // Update cache with final image
        const dataUrl = canvas.toDataURL('image/png');
        iconCache.set(cacheKey, dataUrl);
      } catch (error) {
        // Keep fallback, just cache it
        const dataUrl = canvas.toDataURL('image/png');
        iconCache.set(cacheKey, dataUrl);
      }
    };
    
    updateCanvas();
  }

  ctx.restore();
  
  const dataUrl = canvas.toDataURL('image/png');
  iconCache.set(cacheKey, dataUrl);
  return dataUrl;
}

/**
 * Draws a glow effect around a circle
 * @param ctx - Canvas context
 * @param x - Center X coordinate
 * @param y - Center Y coordinate
 * @param radius - Radius of the circle to glow around
 * @param glowColor - Color of the glow (with alpha)
 */
function drawGlowEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  glowColor: string
): void {
  // Draw multiple concentric circles with decreasing opacity for smooth glow
  const glowLayers = 4;
  const maxGlowRadius = radius + GLOW_SIZE;
  
  for (let i = 0; i < glowLayers; i++) {
    const layerRadius = radius + (maxGlowRadius - radius) * (i + 1) / glowLayers;
    const opacity = 0.6 * (1 - i / glowLayers);
    
    // Extract RGB from rgba string and create new rgba with adjusted opacity
    const colorMatch = glowColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (colorMatch) {
      const r = parseInt(colorMatch[1]);
      const g = parseInt(colorMatch[2]);
      const b = parseInt(colorMatch[3]);
      const layerColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      
      ctx.beginPath();
      ctx.arc(x, y, layerRadius, 0, Math.PI * 2);
      ctx.fillStyle = layerColor;
      ctx.fill();
    }
  }
}

/**
 * Loads an image and draws it to the canvas context within a circular area
 * The image will be centered and scaled to fill the circular clipping area
 */
function loadAndDrawImage(
  ctx: CanvasRenderingContext2D,
  photoURL: string,
  size: number,
  offsetX: number = 0,
  offsetY: number = 0
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Calculate dimensions to fill the circle while maintaining aspect ratio
        const imgAspect = img.width / img.height;
        const circleSize = size;
        
        let drawWidth = circleSize;
        let drawHeight = circleSize;
        let drawX = offsetX;
        let drawY = offsetY;
        
        // Scale image to cover the entire circle (cover behavior)
        if (imgAspect > 1) {
          // Image is wider than tall
          drawHeight = circleSize;
          drawWidth = circleSize * imgAspect;
          drawX = offsetX - (drawWidth - circleSize) / 2;
        } else {
          // Image is taller than wide or square
          drawWidth = circleSize;
          drawHeight = circleSize / imgAspect;
          drawY = offsetY - (drawHeight - circleSize) / 2;
        }
        
        // Draw the image centered and scaled to fill the circle
        // The clipping path will make it circular
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
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
 * Note: This is called within a circular clipping path, so the shape will be circular
 */
function drawFallbackAvatar(
  ctx: CanvasRenderingContext2D,
  name: string,
  size: number,
  offsetX: number = 0,
  offsetY: number = 0
): void {
  // Background gradient - will be clipped to circle by the active clipping path
  const centerX = offsetX + size / 2;
  const centerY = offsetY + size / 2;
  const radius = size / 2;
  
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, '#4f46e5'); // indigo
  gradient.addColorStop(1, '#7c3aed'); // purple
  ctx.fillStyle = gradient;
  
  // Fill the entire area - clipping path will make it circular
  ctx.fillRect(offsetX, offsetY, size, size);

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
  ctx.fillText(initials, centerX, centerY);
}

/**
 * Creates a Google Maps icon object from a profile picture
 * @param photoURL - URL of the profile picture
 * @param name - User's name for fallback
 * @param size - Size of the icon in pixels
 * @param fitnessLevel - User's fitness level for glow effect
 * @returns Google Maps icon configuration object
 */
export function createMapIcon(
  photoURL: string | null | undefined,
  name: string = 'User',
  size: number = DEFAULT_SIZE,
  fitnessLevel?: FitnessLevel | string
): google.maps.Icon {
  const hasGlow = !!getFitnessLevelColors(fitnessLevel);
  const actualSize = hasGlow ? size + GLOW_SIZE * 2 : size;
  const iconUrl = createProfileIcon(photoURL, name, { size, fitnessLevel });
  
  return {
    url: iconUrl,
    scaledSize: new google.maps.Size(actualSize, actualSize),
    anchor: new google.maps.Point(actualSize / 2, actualSize / 2),
    origin: new google.maps.Point(0, 0)
  };
}

