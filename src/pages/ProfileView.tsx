import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Avatar from "@mui/material/Avatar";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { Card } from "@/components/ui/card";
import { useState } from "react";

type FriendStatus = "not_friends" | "request_pending" | "request_received" | "friends" | "denied";

interface ProfileViewProps {
  user: {
    id: number;
    name: string;
    distance: string;
    activity: string;
    avatar: string;
    photos?: string[];
    bio?: string;
  };
  friendStatus: FriendStatus;
  cooldownDays?: number;
  onClose: () => void;
  onSendMessage: () => void;
  onAddFriend: () => void;
  onAcceptFriend: () => void;
  onDeclineFriend: () => void;
}

export const ProfileView = ({
  user,
  friendStatus,
  cooldownDays,
  onClose,
  onSendMessage,
  onAddFriend,
  onAcceptFriend,
  onDeclineFriend,
}: ProfileViewProps) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  
  const displayPhotos = user.photos && user.photos.length > 0 
    ? user.photos 
    : [user.avatar];

  const getActivityIcon = () => {
    switch (user.activity.toLowerCase()) {
      case "running":
        return <DirectionsRunIcon className="text-success" style={{ fontSize: 20 }} />;
      case "cycling":
        return <DirectionsBikeIcon className="text-primary" style={{ fontSize: 20 }} />;
      case "walking":
        return <DirectionsWalkIcon className="text-warning" style={{ fontSize: 20 }} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        exit={{ y: 50 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="overflow-hidden shadow-elevation-4 border-2 border-border/50">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-background/80 backdrop-blur-sm hover:bg-secondary rounded-full transition-colors touch-target shadow-elevation-2"
          >
            <CloseIcon fontSize="small" />
          </button>

          {/* Photo Gallery */}
          <div className="relative w-full aspect-square bg-muted">
            <motion.img
              key={selectedPhotoIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={displayPhotos[selectedPhotoIndex]}
              alt={user.name}
              className="w-full h-full object-cover"
            />
            
            {/* Photo indicators */}
            {displayPhotos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {displayPhotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === selectedPhotoIndex
                        ? "bg-white w-6"
                        : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Navigation arrows for photos */}
            {displayPhotos.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedPhotoIndex((prev) => 
                    prev === 0 ? displayPhotos.length - 1 : prev - 1
                  )}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={() => setSelectedPhotoIndex((prev) => 
                    (prev + 1) % displayPhotos.length
                  )}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                >
                  →
                </button>
              </>
            )}
          </div>

          {/* User Info */}
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <Avatar
                src={user.avatar}
                alt={user.name}
                sx={{ width: 72, height: 72, border: "3px solid hsl(var(--primary))" }}
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {getActivityIcon()}
                  <span className="text-sm text-muted-foreground">{user.activity}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  📍 {user.distance} away
                </p>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="py-3 border-t border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Friend Status Badge */}
            {friendStatus === "friends" && (
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-success/10 border-2 border-success rounded-xl">
                <CheckCircleIcon className="text-success" style={{ fontSize: 20 }} />
                <span className="text-sm font-semibold text-success">Friends</span>
              </div>
            )}

            {friendStatus === "request_pending" && (
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-warning/10 border-2 border-warning rounded-xl">
                <HourglassEmptyIcon className="text-warning" style={{ fontSize: 20 }} />
                <span className="text-sm font-semibold text-warning">Friend Request Sent</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              {friendStatus === "request_received" && (
                <div className="flex gap-2">
                  <Button
                    onClick={onAcceptFriend}
                    className="flex-1 h-12 bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <CheckCircleIcon className="mr-2" style={{ fontSize: 20 }} />
                    Accept
                  </Button>
                  <Button
                    onClick={onDeclineFriend}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    Decline
                  </Button>
                </div>
              )}

              {(friendStatus === "not_friends" || friendStatus === "denied") && (
                <Button
                  onClick={onAddFriend}
                  disabled={friendStatus === "denied"}
                  variant="outline"
                  className="w-full h-12"
                >
                  {friendStatus === "denied" ? (
                    <>
                      <HourglassEmptyIcon className="mr-2" style={{ fontSize: 20 }} />
                      Try again in {cooldownDays} day{cooldownDays !== 1 ? "s" : ""}
                    </>
                  ) : (
                    <>
                      <PersonAddIcon className="mr-2" style={{ fontSize: 20 }} />
                      Add Friend
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={onSendMessage}
                className="w-full h-12 font-semibold"
              >
                <SendIcon className="mr-2" style={{ fontSize: 20 }} />
                Send Message
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
