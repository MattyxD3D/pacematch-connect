import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import ChatIcon from "@mui/icons-material/Chat";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";

interface PokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
  userId: string;
  onAccept: () => void;
  onDismiss: () => void;
  onChat?: () => void;
  onAddFriend?: () => void;
}

/**
 * PokeModal Component
 * 
 * This modal appears when a user receives a poke from someone.
 * A poke is a lightweight way to show interest in matching with someone.
 * 
 * The user can:
 * - Accept the poke (acknowledge it and potentially start chatting)
 * - Dismiss the poke (ignore it)
 * - Chat with the user directly
 * - Add them as a friend
 */
export const PokeModal = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
  userId,
  onAccept,
  onDismiss,
  onChat,
  onAddFriend
}: PokeModalProps) => {
  const navigate = useNavigate();

  const handleChat = () => {
    if (onChat) {
      onChat();
    } else {
      navigate("/chat", {
        state: {
          user: {
            id: userId,
            name: userName,
            avatar: userAvatar || ""
          }
        }
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-elevation-4 p-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <TouchAppIcon className="text-purple-500" style={{ fontSize: 28 }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">You Got Poked!</h2>
                  <p className="text-sm text-muted-foreground">Someone is interested in matching</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <CloseIcon />
              </Button>
            </div>

            {/* User Info */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <Avatar className="h-24 w-24 border-4 border-purple-500/30">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="text-2xl">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground">{userName}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  poked you! They're interested in matching
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Accept Poke Button */}
              <Button
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="w-full h-14 text-base font-semibold bg-purple-500 hover:bg-purple-600 text-white"
              >
                <TouchAppIcon className="mr-2" style={{ fontSize: 20 }} />
                Accept Poke
              </Button>

              {/* Chat Button */}
              {onChat && (
                <Button
                  onClick={handleChat}
                  variant="outline"
                  className="w-full h-14 text-base font-semibold"
                >
                  <ChatIcon className="mr-2" style={{ fontSize: 20 }} />
                  Start Chat
                </Button>
              )}

              {/* Add Friend Button */}
              {onAddFriend && (
                <Button
                  onClick={() => {
                    onAddFriend();
                    onClose();
                  }}
                  variant="outline"
                  className="w-full h-14 text-base font-semibold"
                >
                  <PersonAddIcon className="mr-2" style={{ fontSize: 20 }} />
                  Add Friend
                </Button>
              )}

              {/* Dismiss Button */}
              <Button
                onClick={() => {
                  onDismiss();
                  onClose();
                }}
                variant="ghost"
                className="w-full h-12 text-base text-muted-foreground hover:text-foreground"
              >
                Dismiss
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

