import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FriendRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar?: string;
  onAccept: () => void;
  onDecline: () => void;
}

export const FriendRequestModal = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
  onAccept,
  onDecline,
}: FriendRequestModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-background rounded-t-[20px] sm:rounded-[20px] p-6 animate-slide-in-bottom shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-accent transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-foreground mb-6">
          Friend Request
        </h2>

        {/* User Info */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-5xl font-bold mb-4 shadow-lg">
            {userAvatar || userName.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">{userName}</h3>
          <p className="text-muted-foreground">
            wants to add you as a friend
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onDecline}
            className="flex-1 h-14 text-base border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            Decline
          </Button>
          <Button
            onClick={onAccept}
            className="flex-1 h-14 text-base bg-[hsl(142,76%,36%)] hover:bg-[hsl(142,76%,30%)] text-white transition-colors"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};
