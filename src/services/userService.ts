// User service for blocking, reporting, and moderation functions
import { ref, set, get, remove, update } from "firebase/database";
import { database } from "./firebase";
import { getAdminEmails } from "./adminService";
import { createNotification } from "./notificationService";
import { getUserData } from "./authService";

// ============ COMMENTING SUSPENSION ============

export interface CommentingSuspension {
  suspended: boolean;
  suspendedAt: number;
  suspendedUntil?: number; // Optional: for temporary suspensions
  reason: string;
  adminId: string;
}

/**
 * Suspend a user's commenting privileges
 */
export const suspendCommenting = async (
  userId: string,
  adminId: string,
  reason: string,
  suspendedUntil?: number
): Promise<void> => {
  try {
    const suspensionRef = ref(database, `users/${userId}/commentingSuspension`);
    const suspension: CommentingSuspension = {
      suspended: true,
      suspendedAt: Date.now(),
      suspendedUntil: suspendedUntil || undefined,
      reason,
      adminId
    };
    
    await set(suspensionRef, suspension);
    console.log(`✅ Commenting suspended for user ${userId}`);
  } catch (error) {
    console.error("❌ Error suspending commenting:", error);
    throw error;
  }
};

/**
 * Restore a user's commenting privileges
 */
export const restoreCommenting = async (userId: string): Promise<void> => {
  try {
    const suspensionRef = ref(database, `users/${userId}/commentingSuspension`);
    await remove(suspensionRef);
    console.log(`✅ Commenting restored for user ${userId}`);
  } catch (error) {
    console.error("❌ Error restoring commenting:", error);
    throw error;
  }
};

/**
 * Check if a user's commenting is suspended
 * Returns null if not suspended, or the suspension details if suspended
 */
export const isCommentingSuspended = async (userId: string): Promise<CommentingSuspension | null> => {
  try {
    const suspensionRef = ref(database, `users/${userId}/commentingSuspension`);
    const snapshot = await get(suspensionRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const suspension = snapshot.val() as CommentingSuspension;
    
    // Check if temporary suspension has expired
    if (suspension.suspendedUntil && suspension.suspendedUntil < Date.now()) {
      // Auto-restore if suspension period has passed
      await restoreCommenting(userId);
      return null;
    }
    
    return suspension.suspended ? suspension : null;
  } catch (error) {
    console.error("❌ Error checking commenting suspension:", error);
    return null;
  }
};

// ============ USER BLOCKING ============

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

    // Notify all admins about the new report
    try {
      const adminEmails = await getAdminEmails();
      const reporterData = await getUserData(reporterId);
      const reportedUserData = await getUserData(reportedUserId);

      // Create notifications for all admins
      // Note: We need to get admin user IDs from emails - for now, we'll store in a special admin notifications node
      // Or we can create a notification system that admins check
      const adminNotificationsRef = ref(database, `adminNotifications`);
      const notificationRef = ref(database, `adminNotifications/${Date.now()}_${reporterId}_${reportedUserId}`);
      await set(notificationRef, {
        type: "report_submitted",
        reporterId,
        reportedUserId,
        reporterName: reporterData?.name || reporterData?.username || "Unknown",
        reportedUserName: reportedUserData?.name || reportedUserData?.username || "Unknown",
        reason,
        details: details || "",
        timestamp: Date.now(),
        read: false
      });

      console.log(`✅ Admin notification created for report`);
    } catch (notificationError) {
      // Don't fail the report if notification fails
      console.error("❌ Error creating admin notification:", notificationError);
    }
  } catch (error) {
    console.error("❌ Error reporting user:", error);
    throw error;
  }
};

