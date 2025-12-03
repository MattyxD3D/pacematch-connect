import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import HomeIcon from "@mui/icons-material/Home";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import EventIcon from "@mui/icons-material/Event";
import MailIcon from "@mui/icons-material/Mail";
import PersonIcon from "@mui/icons-material/Person";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { Capacitor } from "@capacitor/core";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadMessageCount } = useNotificationContext();
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);

  const navItems = [
    { path: "/", icon: HomeIcon, label: "Feed" },
    { path: "/events", icon: EventIcon, label: "Events" },
    { path: "/map", icon: MyLocationIcon, label: "Beacon" },
    { path: "/messages", icon: MailIcon, label: "Messages" },
    { path: "/settings", icon: PersonIcon, label: "Profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Calculate safe area bottom inset
  useEffect(() => {
    const updateSafeArea = () => {
      if (Capacitor.isNativePlatform()) {
        // Try to get from CSS env() first
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        const envBottom = computedStyle.getPropertyValue('env(safe-area-inset-bottom)');
        
        if (envBottom) {
          // Parse the value (e.g., "48px" -> 48)
          const value = parseFloat(envBottom);
          if (!isNaN(value)) {
            setSafeAreaBottom(value);
            return;
          }
        }
        
        // Fallback: Android typically has ~48px navigation bar
        // iOS varies but typically 0-34px depending on device
        setSafeAreaBottom(48); // Default Android navigation bar height
      } else {
        setSafeAreaBottom(0);
      }
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);
    
    // Also try after a short delay to ensure CSS is applied
    const timeout = setTimeout(updateSafeArea, 100);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-elevation-3"
      style={{
        paddingBottom: `max(env(safe-area-inset-bottom, 0px), ${safeAreaBottom}px)`,
      }}
    >
      <div className="flex items-center justify-around px-4 py-3 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const isMessages = item.path === "/messages";
          const hasUnreadMessages = isMessages && unreadMessageCount > 0;

          // Message icon color - yellow when unread
          const messageIconColor = hasUnreadMessages
            ? "text-yellow-400"
            : active
            ? "text-primary"
            : "text-muted-foreground";

          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1.5 min-w-[60px] touch-target relative"
            >
              <motion.div
                animate={{
                  scale: active ? 1.15 : 1,
                  y: active ? -3 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative"
              >
                {/* Icon container with gradient background when active */}
                <div
                  className={`relative p-2.5 rounded-xl transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-br from-primary via-primary to-success"
                      : "bg-transparent"
                  }`}
                >
                  <Icon
                    style={{ fontSize: active ? 28 : 26 }}
                    className={
                      isMessages
                        ? hasUnreadMessages
                          ? "text-yellow-400"
                          : active
                          ? "text-white"
                          : "text-muted-foreground"
                        : active
                        ? "text-white drop-shadow-sm"
                        : "text-muted-foreground"
                    }
                  />
                </div>
                
                {/* Red dot badge for unread messages */}
                {hasUnreadMessages && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full border-2 border-background shadow-lg z-10"
                  />
                )}
              </motion.div>
              <span
                className={`text-xs font-semibold transition-all duration-300 ${
                  active 
                    ? "text-primary" 
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-primary via-primary to-success shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
