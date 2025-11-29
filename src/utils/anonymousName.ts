/**
 * Get display name for a user - returns username if set, otherwise generates anonymous fallback
 * @param username - User's chosen username (from profile)
 * @param uid - Firebase user ID
 * @param activity - User's primary activity (running, cycling, walking)
 * @returns Display name to show to other users
 */
export function getDisplayName(
  username: string | null | undefined,
  uid: string,
  activity: string | null | undefined
): string {
  // If username is set and not empty, use it
  if (username && username.trim()) {
    return username.trim();
  }

  // Generate anonymous fallback name based on activity
  // Use last 4 characters of UID (converted to number) for uniqueness
  const uidSuffix = uid.slice(-4);
  // Convert hex characters to numbers (0-9, a-f -> 0-15)
  let numericSuffix = 0;
  for (let i = 0; i < uidSuffix.length; i++) {
    const char = uidSuffix[i];
    const value = parseInt(char, 16) || 0;
    numericSuffix = numericSuffix * 16 + value;
  }
  // Ensure it's a 3-digit number (0-999)
  numericSuffix = numericSuffix % 1000;

  // Map activity to prefix
  const activityPrefix = (() => {
    const act = activity?.toLowerCase();
    if (act === "running") return "Runner";
    if (act === "cycling") return "Cyclist";
    if (act === "walking") return "Walker";
    return "Athlete";
  })();

  return `${activityPrefix}${numericSuffix.toString().padStart(3, "0")}`;
}

