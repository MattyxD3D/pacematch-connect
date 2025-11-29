// Notification service for Firebase - manages persistent notifications
import { ref, set, get, onValue, off, update, DataSnapshot, push, remove } from "firebase/database";
import { database } from "./firebase";

export type NotificationType = 
  | "message" 
  | "message_request" 
  | "friend_request" 
  | "friend_accepted" 
  | "poke" 
  | "workout_complete" 
  | "achievement"
  | "report_submitted"
  // Admin moderation notification types
  | "admin_comment_deleted"
  | "admin_event_deleted"
  | "admin_event_cancelled"
  | "admin_warning"
  | "admin_comment_suspended"
  | "admin_comment_restored";

export interface Notification {
  id: string;
  type: NotificationType;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  message?: string;
  timestamp: number;
  read: boolean;
  workoutId?: string; // For poke notifications linking to workout
  linkType?: string; // For navigation context
  // Admin moderation fields
  eventId?: string; // For event-related notifications
  eventTitle?: string; // Event title for context
  reason?: string; // Admin action reason
  adminId?: string; // Admin who took action
}

/**
 * Create a notification in Firebase
 */
export const createNotification = async (
  userId: string,
  notification: Omit<Notification, "id" | "timestamp" | "read">
): Promise<string> => {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    const newNotificationRef = push(notificationsRef);
    const notificationId = newNotificationRef.key!;
    
    const notificationData: Notification = {
      ...notification,
      id: notificationId,
      timestamp: Date.now(),
      read: false,
    };
    
    await set(newNotificationRef, notificationData);
    console.log(`✅ Notification created for user ${userId}: ${notification.type}`);
    return notificationId;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error;
  }
};

/**
 * Listen to user's notifications in real-time
 */
export const listenToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): (() => void) => {
  const notificationsRef = ref(database, `notifications/${userId}`);
  
  const unsubscribe = onValue(
    notificationsRef,
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const notificationsData = snapshot.val();
      const notifications: Notification[] = Object.entries(notificationsData)
        .map(([id, data]: [string, any]) => ({
          ...data,
          id,
        }))
        .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
      
      callback(notifications);
    },
    (error) => {
      console.error("❌ Error listening to notifications:", error);
      callback([]);
    }
  );
  
  return () => {
    off(notificationsRef);
  };
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  try {
    const notificationRef = ref(database, `notifications/${userId}/${notificationId}`);
    await update(notificationRef, { read: true });
    console.log(`✅ Notification ${notificationId} marked as read`);
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    const snapshot = await get(notificationsRef);
    
    if (!snapshot.exists()) {
      return;
    }
    
    const notificationsData = snapshot.val();
    const updates: Record<string, boolean> = {};
    
    Object.keys(notificationsData).forEach((notificationId) => {
      if (!notificationsData[notificationId].read) {
        updates[`${notificationId}/read`] = true;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await update(notificationsRef, updates);
      console.log(`✅ Marked all notifications as read for user ${userId}`);
    }
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Delete a notification (optional - for user cleanup)
 */
export const deleteNotification = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  try {
    const notificationRef = ref(database, `notifications/${userId}/${notificationId}`);
    await remove(notificationRef);
    console.log(`✅ Notification ${notificationId} deleted`);
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    const snapshot = await get(notificationsRef);
    
    if (!snapshot.exists()) {
      return 0;
    }
    
    const notificationsData = snapshot.val();
    return Object.values(notificationsData).filter(
      (notification: any) => !notification.read
    ).length;
  } catch (error) {
    console.error("❌ Error getting unread notification count:", error);
    return 0;
  }
};

