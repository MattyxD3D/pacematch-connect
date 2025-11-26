/**
 * Utility functions for checking workout state
 * Workout state is stored in localStorage as 'activityState'
 */

/**
 * Check if user has an active workout session
 * @returns {boolean} True if user has an active workout, false otherwise
 */
export const isWorkoutActive = (): boolean => {
  try {
    const stored = localStorage.getItem("activityState");
    if (!stored) {
      return false;
    }
    
    const parsed = JSON.parse(stored);
    return parsed.isActive === true;
  } catch (error) {
    console.error("Error checking workout state:", error);
    return false;
  }
};

