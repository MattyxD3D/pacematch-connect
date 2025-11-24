import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import MapIcon from "@mui/icons-material/Map";
import EventIcon from "@mui/icons-material/Event";
import MailIcon from "@mui/icons-material/Mail";
import PersonIcon from "@mui/icons-material/Person";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/", icon: HomeIcon, label: "Feed" },
    { path: "/map", icon: MapIcon, label: "Map" },
    { path: "/events", icon: EventIcon, label: "Events" },
    { path: "/messages", icon: MailIcon, label: "Messages" },
    { path: "/settings", icon: PersonIcon, label: "Profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-elevation-3">
      <div className="flex items-center justify-around px-4 py-3 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 min-w-[60px] touch-target relative"
            >
              <motion.div
                animate={{
                  scale: active ? 1.1 : 1,
                  y: active ? -2 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon
                  style={{ fontSize: 26 }}
                  className={active ? "text-primary" : "text-muted-foreground"}
                />
              </motion.div>
              <span
                className={`text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
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
