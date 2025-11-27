/**
 * NotificationBell Component
 * 
 * A reusable notification bell icon that:
 * - Turns YELLOW when there are unread notifications
 * - Shows a count badge with the number of unread notifications
 * - Provides consistent styling across all screens
 * 
 * Usage:
 * <NotificationBell 
 *   unreadCount={unreadCount} 
 *   onClick={() => setShowNotificationDrawer(true)} 
 * />
 */

import { motion } from "framer-motion";
import NotificationsIcon from "@mui/icons-material/Notifications";

interface NotificationBellProps {
  /** Number of unread notifications */
  unreadCount: number;
  /** Click handler to open notification drawer */
  onClick: () => void;
  /** Optional: Background style variant for different screen themes */
  variant?: "light" | "dark";
  /** Optional: Size of the bell icon */
  size?: "sm" | "md" | "lg";
}

export const NotificationBell = ({
  unreadCount,
  onClick,
  variant = "light",
  size = "md",
}: NotificationBellProps) => {
  const hasNotifications = unreadCount > 0;

  // Size configurations
  const sizeConfig = {
    sm: { button: 32, icon: 20, badge: "min-w-[16px] h-4 text-[9px] -top-0.5 -right-0.5" },
    md: { button: 40, icon: 24, badge: "min-w-[20px] h-5 text-[11px] -top-0.5 -right-0.5" },
    lg: { button: 48, icon: 28, badge: "min-w-[24px] h-6 text-xs -top-1 -right-1" },
  };

  const config = sizeConfig[size];

  // Colors based on variant (for different background contexts)
  const bgColors = {
    light: {
      hover: "hover:bg-muted",
      ring: "ring-offset-card",
      badgeBorder: "border-card",
      iconDefault: "text-foreground",
    },
    dark: {
      hover: "hover:bg-gray-700",
      ring: "ring-offset-gray-800",
      badgeBorder: "border-gray-800",
      iconDefault: "text-white",
    },
  };

  const colors = bgColors[variant];

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className={`relative touch-target bg-transparent rounded-full transition-all ${colors.hover} ${
        hasNotifications 
          ? `ring-2 ring-yellow-400 ring-offset-2 ${colors.ring}` 
          : ''
      }`}
      style={{ width: config.button, height: config.button }}
      title={hasNotifications 
        ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` 
        : "Notifications"
      }
      aria-label={hasNotifications 
        ? `${unreadCount} unread notifications` 
        : "Notifications"
      }
    >
      {/* Bell Icon - Yellow when there are notifications */}
      <NotificationsIcon 
        style={{ fontSize: config.icon }} 
        className={hasNotifications 
          ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' 
          : colors.iconDefault
        }
      />
      
      {/* Notification Count Badge */}
      {hasNotifications && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
          className={`absolute ${config.badge} bg-yellow-500 text-gray-900 font-bold rounded-full px-1.5 flex items-center justify-center border-2 ${colors.badgeBorder} shadow-lg z-10`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.span>
      )}
      
      {/* Pulse animation for attention when there are notifications */}
      {hasNotifications && (
        <motion.span
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full bg-yellow-400/30"
        />
      )}
    </motion.button>
  );
};

export default NotificationBell;

