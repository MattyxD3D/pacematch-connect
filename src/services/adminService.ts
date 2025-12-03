// Admin service for managing admin functionality
import { ref, get, set, remove, onValue, query, orderByChild, equalTo, startAt, endAt, push } from "firebase/database";
import { database } from "./firebase";
import { AuthUser } from "@/hooks/useAuth";
import { createNotification, NotificationType } from "./notificationService";

const getAdminKey = (email: string) =>
  email.trim().toLowerCase().replace(/[.#$[\]]/g, "_");

/**
 * Check if an email is an admin
 */
export const checkAdminStatus = async (email: string | null): Promise<boolean> => {
  if (!email) return false;
  
  try {
    const adminRef = ref(database, `adminEmails/${getAdminKey(email)}`);
    const snapshot = await get(adminRef);
    return snapshot.exists() && snapshot.val() === true;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

/**
 * Check if current user is admin
 * @param {AuthUser | null} user - Current user object
 * @returns {Promise<boolean>} True if user is admin
 */
export const isAdmin = async (user: AuthUser | null): Promise<boolean> => {
  if (!user || !user.email) return false;
  return await checkAdminStatus(user.email);
};

/**
 * Get list of all admin emails
 * @returns {Promise<string[]>} Array of admin email addresses
 */
export const getAdminEmails = async (): Promise<string[]> => {
  try {
    const adminRef = ref(database, "adminEmails");
    const snapshot = await get(adminRef);
    
    if (!snapshot.exists()) return [];
    
    const emails: string[] = [];
    snapshot.forEach((child) => {
      if (child.val() === true) {
        emails.push(child.key || "");
      }
      return false;
    });
    
    return emails;
  } catch (error) {
    console.error("Error getting admin emails:", error);
    throw error;
  }
};

/**
 * Add new admin email
 * @param {string} email - Email address to add as admin
 * @returns {Promise<void>}
 */
export const addAdminEmail = async (email: string): Promise<void> => {
  try {
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email address");
    }
    
    const adminRef = ref(database, `adminEmails/${getAdminKey(email)}`);
    await set(adminRef, true);
  } catch (error) {
    console.error("Error adding admin email:", error);
    throw error;
  }
};

/**
 * Remove admin email
 * @param {string} email - Email address to remove from admins
 * @returns {Promise<void>}
 */
export const removeAdminEmail = async (email: string): Promise<void> => {
  try {
    const adminRef = ref(database, `adminEmails/${getAdminKey(email)}`);
    await remove(adminRef);
  } catch (error) {
    console.error("Error removing admin email:", error);
    throw error;
  }
};

/**
 * Promote user to admin by their email
 * @param {string} email - Email address to promote to admin
 * @returns {Promise<void>}
 */
export const promoteUserToAdmin = async (email: string): Promise<void> => {
  try {
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email address");
    }
    await addAdminEmail(email);
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    throw error;
  }
};

/**
 * Demote admin (remove admin privileges)
 * @param {string} email - Email address to demote from admin
 * @returns {Promise<void>}
 */
export const demoteAdmin = async (email: string): Promise<void> => {
  try {
    await removeAdminEmail(email);
  } catch (error) {
    console.error("Error demoting admin:", error);
    throw error;
  }
};

/**
 * Check if a user is an admin by their email
 * @param {string} email - Email address to check
 * @returns {Promise<boolean>} True if user is admin
 */
export const isUserAdmin = async (email: string | null | undefined): Promise<boolean> => {
  if (!email) return false;
  return await checkAdminStatus(email);
};

/**
 * Get all users for management
 * @returns {Promise<any[]>} Array of all users
 */
export const getAllUsers = async (): Promise<any[]> => {
  try {
    const usersRef = ref(database, "users");
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) return [];
    
    const users: any[] = [];
    snapshot.forEach((child) => {
      users.push({
        uid: child.key,
        ...child.val()
      });
      return false;
    });
    
    return users;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  }
};

/**
 * Suspend user account
 * @param {string} userId - User ID to suspend
 * @param {number} durationDays - Duration in days (optional, default 7)
 * @param {string} reason - Reason for suspension
 * @returns {Promise<void>}
 */
export const suspendUser = async (
  userId: string,
  durationDays: number = 7,
  reason: string = "Violation of terms of service"
): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }
    
    const userData = snapshot.val();
    const suspendedUntil = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
    
    await set(userRef, {
      ...userData,
      status: "suspended",
      suspendedUntil,
      suspendedReason: reason,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error suspending user:", error);
    throw error;
  }
};

/**
 * Ban user account permanently
 * @param {string} userId - User ID to ban
 * @param {string} reason - Reason for ban
 * @returns {Promise<void>}
 */
export const banUser = async (userId: string, reason: string = "Violation of terms of service"): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }
    
    const userData = snapshot.val();
    
    await set(userRef, {
      ...userData,
      status: "banned",
      bannedAt: Date.now(),
      bannedReason: reason,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error banning user:", error);
    throw error;
  }
};

/**
 * Request username change due to misuse
 * Changes username to default format and sends notification
 * @param {string} userId - User ID to change username
 * @param {string} reason - Reason for username change
 * @param {string} adminId - Admin user ID
 * @param {string} adminName - Admin name
 * @returns {Promise<void>}
 */
export const requestUsernameChange = async (
  userId: string,
  reason: string = "Inappropriate username",
  adminId: string,
  adminName: string
): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }
    
    const userData = snapshot.val();
    const defaultUsername = `user ${userId.substring(0, 8)}`;
    
    // Update username to default format
    await set(userRef, {
      ...userData,
      username: defaultUsername,
      usernameChanged: true,
      usernameChangeReason: reason,
      usernameChangedAt: Date.now(),
      usernameChangedBy: adminId,
      updatedAt: Date.now()
    });
    
    // Send notification to user
    await createNotification(userId, {
      type: "username_change_required",
      fromUserId: adminId,
      fromUserName: adminName || "Admin",
      fromUserAvatar: "",
      message: `Your username has been changed due to misuse. Please update it to an appropriate username. Reason: ${reason}`,
      reason,
      adminId
    });
    
    console.log(`✅ Username changed for user ${userId} to ${defaultUsername}`);
  } catch (error) {
    console.error("Error requesting username change:", error);
    throw error;
  }
};

/**
 * Unban user account
 * @param {string} userId - User ID to unban
 * @returns {Promise<void>}
 */
export const unbanUser = async (userId: string): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }
    
    const userData = snapshot.val();
    
    await set(userRef, {
      ...userData,
      status: "active",
      bannedAt: null,
      bannedReason: null,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error unbanning user:", error);
    throw error;
  }
};

/**
 * Unsuspend user account
 * @param {string} userId - User ID to unsuspend
 * @returns {Promise<void>}
 */
export const unsuspendUser = async (userId: string): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }
    
    const userData = snapshot.val();
    
    await set(userRef, {
      ...userData,
      status: "active",
      suspendedUntil: null,
      suspendedReason: null,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error unsuspending user:", error);
    throw error;
  }
};

/**
 * Get reports against a specific user
 * @param {string} userId - User ID
 * @returns {Promise<any[]>} Array of reports
 */
export const getUserReports = async (userId: string): Promise<any[]> => {
  try {
    const reportsRef = ref(database, "reports");
    const snapshot = await get(reportsRef);
    
    if (!snapshot.exists()) return [];
    
    const reports: any[] = [];
    snapshot.forEach((child) => {
      const report = child.val();
      if (report.reportedUserId === userId) {
        reports.push({
          id: child.key,
          ...report
        });
      }
      return false;
    });
    
    return reports.sort((a, b) => (b.reportedAt || 0) - (a.reportedAt || 0));
  } catch (error) {
    console.error("Error getting user reports:", error);
    throw error;
  }
};

/**
 * Get all reports for moderation
 * @returns {Promise<any[]>} Array of all reports
 */
export const getAllReports = async (): Promise<any[]> => {
  try {
    const reportsRef = ref(database, "reports");
    const snapshot = await get(reportsRef);
    
    if (!snapshot.exists()) return [];
    
    const reports: any[] = [];
    snapshot.forEach((child) => {
      reports.push({
        id: child.key,
        ...child.val()
      });
      return false;
    });
    
    return reports.sort((a, b) => (b.reportedAt || 0) - (a.reportedAt || 0));
  } catch (error) {
    console.error("Error getting all reports:", error);
    throw error;
  }
};

/**
 * Resolve a report
 * @param {string} reportId - Report ID
 * @param {string} action - Action taken (e.g., "warned", "suspended", "banned", "dismissed")
 * @returns {Promise<void>}
 */
export const resolveReport = async (reportId: string, action: string = "resolved"): Promise<void> => {
  try {
    const reportRef = ref(database, `reports/${reportId}`);
    const snapshot = await get(reportRef);
    
    if (!snapshot.exists()) {
      throw new Error("Report not found");
    }
    
    const reportData = snapshot.val();
    
    await set(reportRef, {
      ...reportData,
      status: "resolved",
      resolvedAt: Date.now(),
      resolvedAction: action
    });
  } catch (error) {
    console.error("Error resolving report:", error);
    throw error;
  }
};

/**
 * Get system statistics
 * @returns {Promise<any>} System stats object
 */
export const getSystemStats = async (): Promise<any> => {
  try {
    // Get all users
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);
    
    let totalUsers = 0;
    let activeUsers = 0;
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    if (usersSnapshot.exists()) {
      usersSnapshot.forEach((child) => {
        totalUsers++;
        const userData = child.val();
        const lastActivity = userData.timestamp || userData.createdAt || 0;
        if (lastActivity >= thirtyDaysAgo) {
          activeUsers++;
        }
        return false;
      });
    }
    
    // Get all workouts
    const workoutsRef = ref(database, "workouts");
    const workoutsSnapshot = await get(workoutsRef);
    let totalWorkouts = 0;
    
    if (workoutsSnapshot.exists()) {
      workoutsSnapshot.forEach((userWorkouts) => {
        userWorkouts.forEach(() => {
          totalWorkouts++;
          return false;
        });
        return false;
      });
    }
    
    // Get all events
    const eventsRef = ref(database, "events");
    const eventsSnapshot = await get(eventsRef);
    let totalEvents = 0;
    
    if (eventsSnapshot.exists()) {
      eventsSnapshot.forEach(() => {
        totalEvents++;
        return false;
      });
    }
    
    // Get pending reports
    const reportsRef = ref(database, "reports");
    const reportsSnapshot = await get(reportsRef);
    let pendingReports = 0;
    
    if (reportsSnapshot.exists()) {
      reportsSnapshot.forEach((child) => {
        const report = child.val();
        if (!report.status || report.status === "pending") {
          pendingReports++;
        }
        return false;
      });
    }
    
    return {
      totalUsers,
      activeUsers,
      totalWorkouts,
      totalEvents,
      pendingReports
    };
  } catch (error) {
    console.error("Error getting system stats:", error);
    throw error;
  }
};

/**
 * Delete user account
 * @param {string} userId - User ID to delete
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await remove(userRef);
    
    // Also remove user's workouts
    const workoutsRef = ref(database, `workouts/${userId}`);
    await remove(workoutsRef);
    
    // Remove from friends lists
    const friendsRef = ref(database, `friends/${userId}`);
    await remove(friendsRef);
    
    // Remove friend requests
    const friendRequestsRef = ref(database, `friendRequests/${userId}`);
    await remove(friendRequestsRef);
    
    // Note: We don't delete messages/conversations to preserve chat history
    // Events created by user will remain but hostId will be invalid
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

/**
 * Log admin action
 * @param {string} adminEmail - Admin email who performed the action
 * @param {string} action - Action type (e.g., "promote_admin", "suspend_user", "delete_user")
 * @param {any} details - Additional details about the action
 * @returns {Promise<void>}
 */
export const logAdminAction = async (
  adminEmail: string,
  action: string,
  details: any = {}
): Promise<void> => {
  try {
    const logsRef = ref(database, "adminLogs");
    const newLogRef = push(logsRef);
    
    await set(newLogRef, {
      adminEmail,
      action,
      details,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error("Error logging admin action:", error);
    // Don't throw - logging failures shouldn't break admin actions
  }
};

/**
 * Get admin action logs
 * @param {number} limit - Maximum number of logs to return (default: 100)
 * @returns {Promise<any[]>} Array of admin logs
 */
export const getAdminLogs = async (limit: number = 100): Promise<any[]> => {
  try {
    const logsRef = ref(database, "adminLogs");
    const snapshot = await get(logsRef);
    
    if (!snapshot.exists()) return [];
    
    const logs: any[] = [];
    snapshot.forEach((child) => {
      logs.push({
        id: child.key,
        ...child.val()
      });
      return false;
    });
    
    // Sort by timestamp (newest first) and limit
    return logs
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limit);
  } catch (error) {
    console.error("Error getting admin logs:", error);
    throw error;
  }
};

/**
 * Remove a photo from user's profile
 * @param {string} userId - User ID
 * @param {number} photoIndex - Index of photo to remove from photos array (optional, if not provided removes all)
 * @returns {Promise<void>}
 */
export const removeUserPhoto = async (userId: string, photoIndex?: number): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }
    
    const userData = snapshot.val();
    const photos = userData.photos || [];
    
    if (photoIndex !== undefined) {
      // Remove specific photo by index
      if (photoIndex >= 0 && photoIndex < photos.length) {
        const updatedPhotos = photos.filter((_: any, index: number) => index !== photoIndex);
        await set(userRef, {
          ...userData,
          photos: updatedPhotos.length > 0 ? updatedPhotos : null,
          updatedAt: Date.now()
        });
      } else {
        throw new Error("Invalid photo index");
      }
    } else {
      // Remove all photos
      await set(userRef, {
        ...userData,
        photos: null,
        updatedAt: Date.now()
      });
    }
  } catch (error) {
    console.error("Error removing user photo:", error);
    throw error;
  }
};

/**
 * Remove user's main photoURL (profile picture from auth)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const removeUserPhotoURL = async (userId: string): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      throw new Error("User not found");
    }
    
    const userData = snapshot.val();
    
    await set(userRef, {
      ...userData,
      photoURL: null,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error removing user photoURL:", error);
    throw error;
  }
};

// ============ ADMIN MODERATION NOTIFICATIONS ============

export type AdminActionType = 
  | "comment_deleted"
  | "event_deleted"
  | "event_cancelled"
  | "warning"
  | "comment_suspended"
  | "comment_restored";

interface AdminNotificationOptions {
  userId: string;
  adminId: string;
  adminName: string;
  actionType: AdminActionType;
  reason: string;
  eventId?: string;
  eventTitle?: string;
  commentText?: string;
}

/**
 * Send a notification to a user about an admin action
 * This centralizes all admin-to-user notifications
 */
export const sendAdminNotification = async (options: AdminNotificationOptions): Promise<void> => {
  const { userId, adminId, adminName, actionType, reason, eventId, eventTitle, commentText } = options;

  // Map action types to notification types and messages
  const notificationMap: Record<AdminActionType, { type: NotificationType; message: string }> = {
    comment_deleted: {
      type: "admin_comment_deleted",
      message: eventTitle 
        ? `Your comment on "${eventTitle}" was removed by a moderator. Reason: ${reason}`
        : `Your comment was removed by a moderator. Reason: ${reason}`
    },
    event_deleted: {
      type: "admin_event_deleted",
      message: eventTitle 
        ? `Your event "${eventTitle}" was deleted by a moderator. Reason: ${reason}`
        : `Your event was deleted by a moderator. Reason: ${reason}`
    },
    event_cancelled: {
      type: "admin_event_cancelled",
      message: eventTitle 
        ? `Your event "${eventTitle}" was cancelled by a moderator. Reason: ${reason}`
        : `Your event was cancelled by a moderator. Reason: ${reason}`
    },
    warning: {
      type: "admin_warning",
      message: `You have received a warning from a moderator: ${reason}`
    },
    comment_suspended: {
      type: "admin_comment_suspended",
      message: `Your commenting privileges have been suspended. Reason: ${reason}`
    },
    comment_restored: {
      type: "admin_comment_restored",
      message: `Your commenting privileges have been restored.`
    }
  };

  const { type, message } = notificationMap[actionType];

  try {
    await createNotification(userId, {
      type,
      fromUserId: adminId,
      fromUserName: adminName || "Admin",
      fromUserAvatar: "", // Admin notifications don't need avatar
      message,
      eventId,
      eventTitle,
      reason,
      adminId
    });

    console.log(`✅ Admin notification sent to user ${userId}: ${actionType}`);
  } catch (error) {
    console.error("❌ Error sending admin notification:", error);
    // Don't throw - notification failures shouldn't break admin actions
  }
};

/**
 * Send warning to a user
 */
export const warnUser = async (
  userId: string,
  adminId: string,
  adminName: string,
  reason: string
): Promise<void> => {
  try {
    // Log the warning in admin logs
    await logAdminAction(adminName, "warn_user", { userId, reason });
    
    // Send notification to user
    await sendAdminNotification({
      userId,
      adminId,
      adminName,
      actionType: "warning",
      reason
    });

    // Optionally store warning in user's record
    const warningsRef = ref(database, `users/${userId}/warnings`);
    const newWarningRef = push(warningsRef);
    await set(newWarningRef, {
      adminId,
      adminName,
      reason,
      timestamp: Date.now()
    });

    console.log(`✅ Warning sent to user ${userId}`);
  } catch (error) {
    console.error("❌ Error warning user:", error);
    throw error;
  }
};

/**
 * Get warnings for a user
 */
export const getUserWarnings = async (userId: string): Promise<any[]> => {
  try {
    const warningsRef = ref(database, `users/${userId}/warnings`);
    const snapshot = await get(warningsRef);
    
    if (!snapshot.exists()) return [];
    
    const warnings: any[] = [];
    snapshot.forEach((child) => {
      warnings.push({
        id: child.key,
        ...child.val()
      });
      return false;
    });
    
    return warnings.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch (error) {
    console.error("Error getting user warnings:", error);
    return [];
  }
};

