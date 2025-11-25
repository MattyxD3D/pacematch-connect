import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CloseIcon from "@mui/icons-material/Close";
import ChatIcon from "@mui/icons-material/Chat";
import PersonIcon from "@mui/icons-material/Person";
import BlockIcon from "@mui/icons-material/Block";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import { toast } from "sonner";

type FriendStatus = "not_friends" | "request_pending" | "request_received" | "friends" | "denied";

interface MatchActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    avatar: string;
    activity: string;
    distance: string;
    fitnessLevel?: string;
  };
  friendStatus?: FriendStatus;
  cooldownDays?: number;
  onAddFriend: () => void;
  onDecline: () => void;
  onChat: () => void;
  onViewProfile: () => void;
  onPoke?: () => void;
  hasPoked?: boolean;
}

export const MatchActionsModal = ({
  isOpen,
  onClose,
  user,
  friendStatus = "not_friends",
  cooldownDays = 0,
  onAddFriend,
  onDecline,
  onChat,
  onViewProfile,
  onPoke,
  hasPoked = false
}: MatchActionsModalProps) => {
  const getActivityIcon = () => {
    switch (user.activity.toLowerCase()) {
      case "running":
        return <DirectionsRunIcon className="text-success" style={{ fontSize: 24 }} />;
      case "cycling":
        return <DirectionsBikeIcon className="text-primary" style={{ fontSize: 24 }} />;
      case "walking":
        return <DirectionsWalkIcon className="text-warning" style={{ fontSize: 24 }} />;
      default:
        return <DirectionsRunIcon style={{ fontSize: 24 }} />;
    }
  };

  const getFitnessLevelBadge = () => {
    if (!user.fitnessLevel) return null;
    const level = user.fitnessLevel.toLowerCase();
    const colors = {
      beginner: "bg-blue-100 text-blue-800",
      intermediate: "bg-green-100 text-green-800",
      pro: "bg-purple-100 text-purple-800"
    };
    return (
      <Badge className={colors[level as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {user.fitnessLevel}
      </Badge>
    );
  };

  const handleDecline = () => {
    onDecline();
    toast.success(`${user.name} has been hidden. You can see them again in 3 days.`);
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
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-elevation-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Match Found</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-10 w-10"
                >
                  <CloseIcon />
                </Button>
              </div>

              {/* User Info Card */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">{user.name}</h3>
                      {getFitnessLevelBadge()}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {getActivityIcon()}
                      <span className="text-sm capitalize">{user.activity}</span>
                      <span className="text-sm">•</span>
                      <span className="text-sm">{user.distance} away</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Poke Button - Show before Add Friend */}
                {onPoke && friendStatus === "not_friends" && !hasPoked && (
                  <Button
                    onClick={() => {
                      onPoke();
                      onClose();
                    }}
                    className="w-full h-14 text-base font-semibold bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <TouchAppIcon className="mr-2" />
                    Poke {user.name}
                  </Button>
                )}

                {hasPoked && (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full h-14 text-base font-semibold opacity-50"
                  >
                    <TouchAppIcon className="mr-2" />
                    Poke Sent
                  </Button>
                )}

                {/* Add Friend Button */}
                {friendStatus === "not_friends" && cooldownDays === 0 && (
                  <Button
                    onClick={onAddFriend}
                    variant="outline"
                    className="w-full h-14 text-base font-semibold"
                  >
                    <PersonAddIcon className="mr-2" />
                    Add Friend
                  </Button>
                )}

                {friendStatus === "request_pending" && (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full h-14 text-base font-semibold opacity-50"
                  >
                    <HourglassEmptyIcon className="mr-2" />
                    Request Pending
                  </Button>
                )}

                {friendStatus === "friends" && (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full h-14 text-base font-semibold bg-success/10 border-success/30 text-success"
                  >
                    <CheckCircleIcon className="mr-2" />
                    Friend
                  </Button>
                )}

                {cooldownDays > 0 && (
                  <div className="space-y-2">
                    <Button
                      disabled
                      variant="outline"
                      className="w-full h-14 text-base font-semibold opacity-50"
                    >
                      <PersonAddIcon className="mr-2" />
                      Add Friend
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Try again in {cooldownDays} day{cooldownDays !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                {/* Chat Button */}
                <Button
                  onClick={() => {
                    onChat();
                    onClose();
                  }}
                  className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground"
                >
                  <ChatIcon className="mr-2" />
                  Chat
                </Button>

                {/* View Profile Button */}
                <Button
                  onClick={() => {
                    onViewProfile();
                    onClose();
                  }}
                  variant="outline"
                  className="w-full h-14 text-base font-semibold"
                >
                  <PersonIcon className="mr-2" />
                  View Profile
                </Button>

                {/* Decline Button */}
                {friendStatus !== "friends" && (
                  <Button
                    onClick={handleDecline}
                    variant="ghost"
                    className="w-full h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <BlockIcon className="mr-2" />
                    Decline (Hide for 3 days)
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

