import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import CloseIcon from "@mui/icons-material/Close";
import { Button } from "@/components/ui/button";

interface PokeNotificationModalProps {
  isOpen: boolean;
  userName: string;
  userAvatar?: string;
  onClose: () => void;
  onViewProfile: () => void;
  onChat: () => void;
}

/**
 * PokeNotificationModal Component
 * 
 * A prominent notification that appears in the center of the screen
 * when someone pokes you. Highlights the user who poked you.
 */
export const PokeNotificationModal = ({
  isOpen,
  userName,
  userAvatar,
  onClose,
  onViewProfile,
  onChat
}: PokeNotificationModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Notification Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card rounded-3xl shadow-elevation-4 border-2 border-purple-500/50 overflow-hidden">
              {/* Pulsing border effect */}
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(168, 85, 247, 0.7)",
                    "0 0 0 10px rgba(168, 85, 247, 0)",
                    "0 0 0 0 rgba(168, 85, 247, 0)"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-3xl pointer-events-none"
              />

              <div className="p-6 space-y-4 relative">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors z-10"
                >
                  <CloseIcon style={{ fontSize: 20 }} className="text-muted-foreground" />
                </button>

                {/* Icon and Title */}
                <div className="flex flex-col items-center gap-3 pt-2">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center"
                  >
                    <TouchAppIcon className="text-purple-500" style={{ fontSize: 40 }} />
                  </motion.div>
                  
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-1">
                      You Got Poked!
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Someone is interested in matching
                    </p>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex flex-col items-center gap-3 py-2">
                  <Avatar className="h-20 w-20 border-4 border-purple-500/50 ring-4 ring-purple-500/20">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="text-2xl bg-purple-500/20 text-purple-500">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground">{userName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      poked you! They're nearby
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => {
                      onViewProfile();
                      onClose();
                    }}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    View Profile
                  </Button>
                  <Button
                    onClick={() => {
                      onChat();
                      onClose();
                    }}
                    className="flex-1 h-12 bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    Chat
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

