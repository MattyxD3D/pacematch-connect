import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import MailIcon from "@mui/icons-material/Mail";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";
import TouchAppIcon from "@mui/icons-material/TouchApp";

export type NotificationType = "message" | "friend_request" | "friend_accepted" | "poke";

export interface Notification {
  id: string;
  type: NotificationType;
  userId: number;
  userName: string;
  userAvatar: string;
  message?: string;
  timestamp: number;
  read: boolean;
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
          className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div
            onClick={() => onTap(notification)}
            className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-elevation-4 border-2 border-border/50 overflow-hidden cursor-pointer"
          >
            <div className="p-4 flex items-center gap-3">
              {/* Icon/Avatar */}
              <div className="flex-shrink-0 relative">
                <Avatar
                  src={notification.userAvatar}
                  alt={notification.userName}
                  sx={{ width: 48, height: 48 }}
                />
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                  notification.type === "message"
                    ? "bg-primary"
                    : notification.type === "friend_request"
                    ? "bg-warning"
                    : notification.type === "poke"
                    ? "bg-purple-500"
                    : "bg-success"
                }`}>
                  {notification.type === "message" && (
                    <MailIcon style={{ fontSize: 14 }} className="text-white" />
                  )}
                  {notification.type === "friend_request" && (
                    <PersonAddIcon style={{ fontSize: 14 }} className="text-white" />
                  )}
                  {notification.type === "poke" && (
                    <TouchAppIcon style={{ fontSize: 14 }} className="text-white" />
                  )}
                  {notification.type === "friend_accepted" && (
                    <span className="text-white text-xs font-bold">✓</span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {notification.userName}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {notification.type === "message" && (
                    notification.message || "Sent you a message"
                  )}
                  {notification.type === "friend_request" && "wants to add you as a friend"}
                  {notification.type === "poke" && "poked you! They're interested in matching"}
                  {notification.type === "friend_accepted" && "accepted your friend request"}
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
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleNotificationTap = (notification: Notification) => {
    dismissNotification(notification.id);
    
    if (notification.type === "message") {
      navigate("/chat", {
        state: {
          user: {
            id: notification.userId,
            name: notification.userName,
            avatar: notification.userAvatar,
          },
        },
      });
    } else if (notification.type === "friend_request") {
      // Open friend request modal or navigate to a requests page
      console.log("Open friend request:", notification);
    } else if (notification.type === "poke") {
      // Navigate to map to see the user who poked
      navigate("/map");
    } else if (notification.type === "friend_accepted") {
      navigate("/map");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const unreadMessageCount = notifications.filter(
    n => !n.read && n.type === "message"
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
    handleNotificationTap,
    unreadCount,
    unreadMessageCount,
    unreadFriendRequestCount,
    unreadPokeCount,
  };
};
