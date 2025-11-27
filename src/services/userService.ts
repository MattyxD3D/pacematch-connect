// User service for blocking and reporting users
import { ref, set, get, remove } from "firebase/database";
import { database } from "./firebase";

/**
 * Block a user - prevents them from messaging you and hides them from your view
 * Also checks for bidirectional blocking
 */
export const blockUser = async (userId: string, blockedUserId: string): Promise<void> => {
  try {
    // Check if the user to be blocked has already blocked the requester (bidirectional check)
    const reverseBlockRef = ref(database, `blockedUsers/${blockedUserId}/${userId}`);
    const reverseBlockSnapshot = await get(reverseBlockRef);
    const isMutuallyBlocked = reverseBlockSnapshot.exists();

    // Block the user
    const blockRef = ref(database, `blockedUsers/${userId}/${blockedUserId}`);
    await set(blockRef, {
      blockedAt: Date.now(),
      blockedUserId,
      isMutual: isMutuallyBlocked
    });

    // If reverse block exists, update it to mark as mutual
    if (isMutuallyBlocked) {
      const reverseBlockData = reverseBlockSnapshot.val();
      await set(reverseBlockRef, {
        ...reverseBlockData,
        isMutual: true
      });
    }

    console.log(`✅ User ${blockedUserId} blocked by ${userId}${isMutuallyBlocked ? ' (mutual blocking)' : ''}`);
  } catch (error) {
    console.error("❌ Error blocking user:", error);
    throw error;
  }
};

/**
 * Unblock a user
 */
export const unblockUser = async (userId: string, blockedUserId: string): Promise<void> => {
  try {
    const blockRef = ref(database, `blockedUsers/${userId}/${blockedUserId}`);
    await remove(blockRef);
    console.log(`✅ User ${blockedUserId} unblocked by ${userId}`);
  } catch (error) {
    console.error("❌ Error unblocking user:", error);
    throw error;
  }
};

/**
 * Check if a user is blocked
 */
export const isUserBlocked = async (userId: string, otherUserId: string): Promise<boolean> => {
  try {
    const blockRef = ref(database, `blockedUsers/${userId}/${otherUserId}`);
    const snapshot = await get(blockRef);
    return snapshot.exists();
  } catch (error) {
    console.error("❌ Error checking if user is blocked:", error);
    return false;
  }
};

/**
 * Get list of blocked user IDs for a user
 */
export const getBlockedUsers = async (userId: string): Promise<string[]> => {
  try {
    const blockedRef = ref(database, `blockedUsers/${userId}`);
    const snapshot = await get(blockedRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    return Object.keys(snapshot.val());
  } catch (error) {
    console.error("❌ Error getting blocked users:", error);
    return [];
  }
};

/**
 * Report a user
 */
export const reportUser = async (
  reporterId: string,
  reportedUserId: string,
  reason: string,
  details?: string
): Promise<void> => {
  try {
    const reportRef = ref(database, `reports/${Date.now()}_${reporterId}_${reportedUserId}`);
    await set(reportRef, {
      reporterId,
      reportedUserId,
      reason,
      details: details || "",
      reportedAt: Date.now()
    });
    console.log(`✅ User ${reportedUserId} reported by ${reporterId}`);
  } catch (error) {
    console.error("❌ Error reporting user:", error);
    throw error;
  }
};

