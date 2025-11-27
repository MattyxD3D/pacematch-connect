import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import MailIcon from "@mui/icons-material/Mail";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { 
  Notification as FirebaseNotification, 
  NotificationType,
  listenToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createNotification
} from "@/services/notificationService";

export type { NotificationType };

// Extended notification interface with backward compatibility
export interface Notification extends FirebaseNotification {
  // Backward compatibility fields (computed from fromUserId, fromUserName, fromUserAvatar)
  userId?: number | string; // Computed from fromUserId
  userName?: string; // Alias for fromUserName
  userAvatar?: string; // Alias for fromUserAvatar
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onTap: (notification: Notification) => void;
}

export const NotificationSystem = ({
  notifications,
  onDismiss,
  onTap,
}: NotificationSystemProps) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Show only the most recent unread notification
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length > 0) {
      setVisibleNotifications([unreadNotifications[0]]);
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        onDismiss(unreadNotifications[0].id);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setVisibleNotifications([]);
    }
  }, [notifications, onDismiss]);

  return (
    <AnimatePresence>
      {visibleNotifications.map((notification) => (
        <motion.div
          key={notification.id}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-4 left-4 right-4 z-[9999] max-w-md mx-auto"
        >
          <div
            onClick={() => onTap(notification)}
            className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-elevation-4 border-2 border-border/50 overflow-hidden cursor-pointer"
          >
              <div className="p-4 flex items-center gap-3">
              {/* Icon/Avatar */}
              <div className="flex-shrink-0 relative">
                <Avatar
                  src={notification.fromUserAvatar || notification.userAvatar}
                  alt={notification.fromUserName || notification.userName || "User"}
                  sx={{ width: 48, height: 48 }}
                />
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                  notification.type === "message" || notification.type === "message_request"
                    ? "bg-primary"
                    : notification.type === "friend_request"
                    ? "bg-warning"
                    : notification.type === "poke"
                    ? "bg-purple-500"
                    : notification.type === "workout_complete"
                    ? "bg-success"
                    : notification.type === "achievement"
                    ? "bg-warning"
                    : notification.type === "friend_accepted"
                    ? "bg-success"
                    : "bg-success"
                }`}>
                  {(notification.type === "message" || notification.type === "message_request") && (
                    <MailIcon style={{ fontSize: 14 }} className="text-white" />
                  )}
                  {notification.type === "friend_request" && (
                    <PersonAddIcon style={{ fontSize: 14 }} className="text-white" />
                  )}
                  {notification.type === "poke" && (
                    <TouchAppIcon style={{ fontSize: 14 }} className="text-white" />
                  )}
                  {notification.type === "friend_accepted" && (
                    <CheckCircleIcon style={{ fontSize: 14 }} className="text-white" />
                  )}
                  {notification.type === "workout_complete" && (
                    <CheckCircleIcon style={{ fontSize: 14 }} className="text-white" />
                  )}
                  {notification.type === "achievement" && (
                    <EmojiEventsIcon style={{ fontSize: 14 }} className="text-white" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {notification.fromUserName || notification.userName || "User"}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {(notification.type === "message" || notification.type === "message_request") && (
                    notification.message || "Sent you a message"
                  )}
                  {notification.type === "friend_request" && "wants to add you as a friend"}
                  {notification.type === "poke" && (notification.message || "poked you! They're interested in matching")}
                  {notification.type === "friend_accepted" && "accepted your friend request"}
                  {notification.type === "workout_complete" && (
                    notification.message || "Workout completed successfully!"
                  )}
                  {notification.type === "achievement" && (
                    notification.message || "Congrats for a new achievement!"
                  )}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(notification.id);
                }}
                className="flex-shrink-0 p-2 hover:bg-accent rounded-full transition-colors"
              >
                <CloseIcon style={{ fontSize: 18 }} className="text-muted-foreground" />
              </button>
            </div>

            {/* Progress bar */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className={`h-1 ${
                notification.type === "message"
                  ? "bg-primary"
                  : notification.type === "friend_request"
                  ? "bg-warning"
                  : notification.type === "poke"
                  ? "bg-purple-500"
                  : notification.type === "workout_complete"
                  ? "bg-success"
                  : notification.type === "achievement"
                  ? "bg-warning"
                  : "bg-success"
              }`}
            />
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

// Badge Counter Component
interface BadgeCounterProps {
  count: number;
  variant?: "default" | "primary" | "warning" | "success";
  size?: "sm" | "md" | "lg";
}

export const BadgeCounter = ({ 
  count, 
  variant = "default",
  size = "md" 
}: BadgeCounterProps) => {
  if (count <= 0) return null;

  const sizeClasses = {
    sm: "w-4 h-4 text-[10px]",
    md: "w-5 h-5 text-xs",
    lg: "w-6 h-6 text-sm",
  };

  const variantClasses = {
    default: "bg-destructive text-destructive-foreground",
    primary: "bg-primary text-primary-foreground",
    warning: "bg-warning text-warning-foreground",
    success: "bg-success text-success-foreground",
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full flex items-center justify-center font-bold
        border-2 border-background
      `}
    >
      {count > 99 ? "99+" : count}
    </motion.div>
  );
};

// Hook to manage notifications
export const useNotifications = (currentUserId?: string | null) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  // Listen to Firebase notifications
  useEffect(() => {
    if (!currentUserId) {
      setNotifications([]);
      return;
    }

    const unsubscribe = listenToNotifications(currentUserId, (firebaseNotifications) => {
      // Convert Firebase notifications to extended format with backward compatibility
      const extendedNotifications: Notification[] = firebaseNotifications.map((notif) => ({
        ...notif,
        // Backward compatibility fields
        userId: notif.fromUserId,
        userName: notif.fromUserName,
        userAvatar: notif.fromUserAvatar,
      }));
      setNotifications(extendedNotifications);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const addNotification = async (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    if (!currentUserId) return;
    
    try {
      // Convert to Firebase format
      const firebaseNotification = {
        type: notification.type,
        fromUserId: notification.fromUserId || (notification.userId as string),
        fromUserName: notification.fromUserName || notification.userName || "User",
        fromUserAvatar: notification.fromUserAvatar || notification.userAvatar || "",
        message: notification.message,
        workoutId: notification.workoutId,
        linkType: notification.linkType,
      };
      
      await createNotification(currentUserId, firebaseNotification);
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  };

  const dismissNotification = async (id: string) => {
    if (!currentUserId) return;
    
    try {
      await markNotificationAsRead(currentUserId, id);
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUserId) return;
    
    try {
      await markAllNotificationsAsRead(currentUserId);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationTap = (notification: Notification) => {
    dismissNotification(notification.id);
    
    const userId = notification.fromUserId || notification.userId;
    const userName = notification.fromUserName || notification.userName;
    const userAvatar = notification.fromUserAvatar || notification.userAvatar;
    
    if (notification.type === "message" || notification.type === "message_request") {
      navigate("/chat", {
        state: {
          user: {
            id: userId,
            name: userName,
            avatar: userAvatar,
          },
        },
      });
    } else if (notification.type === "friend_request") {
      // Navigate to friends page with requests tab
      navigate("/friends", { state: { tab: "requests" } });
    } else if (notification.type === "poke") {
      // Navigate to map, optionally with workout context if workoutId exists
      if (notification.workoutId) {
        navigate("/map", {
          state: {
            workoutId: notification.workoutId,
            focusUserId: userId,
          },
        });
      } else {
        navigate("/map", {
          state: {
            focusUserId: userId,
          },
        });
      }
    } else if (notification.type === "friend_accepted") {
      navigate("/friends", { state: { tab: "friends" } });
    } else if (notification.type === "workout_complete") {
      // Navigate to workout history page with specific workout ID
      navigate("/workout-history", { 
        state: { workoutId: notification.workoutId } 
      });
    } else if (notification.type === "achievement") {
      // Navigate to workout history or profile for achievements
      navigate("/workout-history");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadMessageCount = notifications.filter(
    n => !n.read && (n.type === "message" || n.type === "message_request")
  ).length;
  const unreadFriendRequestCount = notifications.filter(
    n => !n.read && n.type === "friend_request"
  ).length;
  const unreadPokeCount = notifications.filter(
    n => !n.read && n.type === "poke"
  ).length;

  return {
    notifications,
    addNotification,
    dismissNotification,
    markAllAsRead,
    handleNotificationTap,
    unreadCount,
    unreadMessageCount,
    unreadFriendRequestCount,
    unreadPokeCount,
  };
};
