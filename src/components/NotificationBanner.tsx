import { motion, AnimatePresence } from "framer-motion";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CloseIcon from "@mui/icons-material/Close";

interface NotificationBannerProps {
  show: boolean;
  onDismiss: () => void;
  onTap: () => void;
}

export const NotificationBanner = ({ show, onDismiss, onTap }: NotificationBannerProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute top-4 left-4 right-4 z-20"
        >
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onTap}
            className="bg-warning text-warning-foreground px-5 py-4 rounded-2xl shadow-elevation-4 flex items-center gap-3 cursor-pointer relative"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <NotificationsActiveIcon style={{ fontSize: 28 }} />
            </motion.div>
            <div className="flex-1">
              <p className="font-bold text-sm">Active user nearby!</p>
              <p className="text-xs opacity-90">Tap to start your workout</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="touch-target p-1 hover:bg-warning-foreground/10 rounded-full transition-colors"
            >
              <CloseIcon style={{ fontSize: 20 }} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
