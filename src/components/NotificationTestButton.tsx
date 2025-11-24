import { motion } from "framer-motion";
import { useNotificationContext } from "@/contexts/NotificationContext";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { toast } from "sonner";

export const NotificationTestButton = () => {
  const { addNotification } = useNotificationContext();

  // REMOVED: Mock users - notifications will come from real Firebase events
  // This button can be removed in production or kept for development testing
  const sendTestNotification = () => {
    toast.info("Real notifications will appear automatically from Firebase events");
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={sendTestNotification}
      className="fixed bottom-24 left-4 z-20 touch-target bg-warning text-warning-foreground rounded-full shadow-elevation-4 border-2 border-warning-foreground/20"
      style={{ width: 56, height: 56 }}
      title="Send test notification"
    >
      <NotificationsIcon style={{ fontSize: 28 }} />
    </motion.button>
  );
};
