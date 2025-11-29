/**
 * Default Avatar Options for PaceMatch
 * Uses DiceBear API - free avatar generation service
 * https://www.dicebear.com/
 */

// Avatar styles available from DiceBear
export type AvatarStyle = 
  | "adventurer"      // Cartoon-style people
  | "adventurer-neutral" // Gender-neutral cartoon
  | "avataaars"       // Bitmoji-like avatars  
  | "big-ears"        // Cute big-eared characters
  | "big-ears-neutral" // Gender-neutral big ears
  | "bottts"          // Robot avatars
  | "fun-emoji"       // Fun emoji faces
  | "lorelei"         // Minimalist line art
  | "micah"           // Modern illustrated people
  | "notionists"      // Notion-style avatars
  | "open-peeps"      // Hand-drawn people
  | "personas"        // Simple avatar personas
  | "pixel-art"       // Retro pixel art
  | "thumbs"          // Thumbs up characters;

// Pre-defined default avatars for users to choose from
// These are seeded avatars so they're always consistent
export interface DefaultAvatar {
  id: string;
  name: string;
  url: string;
  style: AvatarStyle;
}

/**
 * Generate a DiceBear avatar URL
 * @param style - The avatar style
 * @param seed - A seed string (like username) for consistent generation
 * @param size - Image size in pixels (default 128)
 */
export const generateAvatarUrl = (
  style: AvatarStyle,
  seed: string,
  size: number = 128
): string => {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
};

/**
 * Pre-defined default avatars for profile selection
 * Each has a unique seed for consistent appearance
 */
export const DEFAULT_AVATARS: DefaultAvatar[] = [
  // Adventurer style - Cartoon people
  { id: "adv-1", name: "Runner", url: generateAvatarUrl("adventurer", "runner-pace-1"), style: "adventurer" },
  { id: "adv-2", name: "Cyclist", url: generateAvatarUrl("adventurer", "cyclist-pace-2"), style: "adventurer" },
  { id: "adv-3", name: "Walker", url: generateAvatarUrl("adventurer", "walker-pace-3"), style: "adventurer" },
  { id: "adv-4", name: "Athlete", url: generateAvatarUrl("adventurer", "athlete-pace-4"), style: "adventurer" },
  
  // Avataaars - Bitmoji-like
  { id: "ava-1", name: "Sporty", url: generateAvatarUrl("avataaars", "sporty-match-1"), style: "avataaars" },
  { id: "ava-2", name: "Active", url: generateAvatarUrl("avataaars", "active-match-2"), style: "avataaars" },
  { id: "ava-3", name: "Energetic", url: generateAvatarUrl("avataaars", "energetic-match-3"), style: "avataaars" },
  { id: "ava-4", name: "Fit", url: generateAvatarUrl("avataaars", "fit-match-4"), style: "avataaars" },
  
  // Big Ears - Cute characters
  { id: "big-1", name: "Buddy", url: generateAvatarUrl("big-ears", "buddy-pace-1"), style: "big-ears" },
  { id: "big-2", name: "Friend", url: generateAvatarUrl("big-ears", "friend-pace-2"), style: "big-ears" },
  
  // Micah - Modern illustrated
  { id: "mic-1", name: "Modern", url: generateAvatarUrl("micah", "modern-pace-1"), style: "micah" },
  { id: "mic-2", name: "Fresh", url: generateAvatarUrl("micah", "fresh-pace-2"), style: "micah" },
  
  // Fun Emoji
  { id: "fun-1", name: "Happy", url: generateAvatarUrl("fun-emoji", "happy-match-1"), style: "fun-emoji" },
  { id: "fun-2", name: "Cool", url: generateAvatarUrl("fun-emoji", "cool-match-2"), style: "fun-emoji" },
  
  // Pixel Art - Retro style
  { id: "pix-1", name: "Retro", url: generateAvatarUrl("pixel-art", "retro-pace-1"), style: "pixel-art" },
  { id: "pix-2", name: "Classic", url: generateAvatarUrl("pixel-art", "classic-pace-2"), style: "pixel-art" },
];

/**
 * Generate a random avatar based on username
 * Creates a unique avatar for each user
 */
export const generateUserAvatar = (username: string): string => {
  return generateAvatarUrl("adventurer", username, 150);
};

/**
 * Fitness-themed color backgrounds for avatars
 */
export const AVATAR_BACKGROUNDS = [
  "b6e3f4", // Light blue
  "c0aede", // Light purple  
  "d1d4f9", // Lavender
  "ffd5dc", // Light pink
  "ffdfbf", // Light orange
  "d4f4dd", // Light green
];

/**
 * Generate avatar with custom background
 */
export const generateAvatarWithBackground = (
  style: AvatarStyle,
  seed: string,
  backgroundColor?: string
): string => {
  const bg = backgroundColor || AVATAR_BACKGROUNDS[Math.floor(Math.random() * AVATAR_BACKGROUNDS.length)];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${bg}`;
};

