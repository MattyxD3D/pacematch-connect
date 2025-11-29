/**
 * Profile Picture Utility
 * Provides consistent profile picture retrieval across the app
 * Prioritizes: photoURL → avatar → generated avatar
 */

import { generateUserAvatar } from "@/lib/avatars";

/**
 * Get profile picture URL with consistent fallback logic
 * @param photoURL - Primary profile picture URL from Firebase (photoURL field)
 * @param avatar - Secondary avatar URL (avatar field)
 * @param name - User's name or username for fallback avatar generation
 * @returns Profile picture URL (never returns empty string)
 */
export function getProfilePictureUrl(
  photoURL?: string | null,
  avatar?: string | null,
  name?: string | null
): string {
  // Priority 1: Use photoURL if available
  if (photoURL && photoURL.trim() !== "") {
    return photoURL;
  }

  // Priority 2: Use avatar if available
  if (avatar && avatar.trim() !== "") {
    return avatar;
  }

  // Priority 3: Generate avatar from name/username
  const displayName = name || "User";
  return generateUserAvatar(displayName);
}

/**
 * Get profile picture URL from user data object
 * Handles various user data structures used throughout the app
 * @param userData - User data object (can have photoURL, avatar, name, username fields)
 * @returns Profile picture URL (never returns empty string)
 */
export function getProfilePictureFromUserData(userData: {
  photoURL?: string | null;
  avatar?: string | null;
  name?: string | null;
  username?: string | null;
}): string {
  return getProfilePictureUrl(
    userData.photoURL,
    userData.avatar,
    userData.name || userData.username || undefined
  );
}

