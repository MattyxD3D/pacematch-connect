import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import TimerIcon from "@mui/icons-material/Timer";
import SpeedIcon from "@mui/icons-material/Speed";
import CloseIcon from "@mui/icons-material/Close";
import PeopleIcon from "@mui/icons-material/People";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import { toast } from "sonner";
import { getUserData } from "@/services/authService";
import { CircularProgress } from "@mui/material";

interface NearbyUser {
  id: string;
  name: string;
  avatar?: string;
  activity?: string;
  distance?: string;
  distanceValue?: number;
  isSameActivity?: boolean; // Flag indicating if user's activity matches workout activity
}

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
  activity: "running" | "cycling" | "walking";
  duration: number; // in seconds
  distance: number; // in km
  avgSpeed: number; // in km/h
  useMetric: boolean;
  nearbyUsers?: NearbyUser[];
  pokes?: string[]; // Array of user IDs who poked during workout
}

export const WorkoutSummaryModal = ({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  activity,
  duration,
  distance,
  avgSpeed,
  useMetric,
  nearbyUsers = [],
  pokes = [],
}: WorkoutSummaryModalProps) => {
  const navigate = useNavigate();
  const [pokeUsers, setPokeUsers] = useState<Record<string, any>>({});
  const [loadingPokes, setLoadingPokes] = useState(false);
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);

  // Fetch user data for pokes
  useEffect(() => {
    if (!isOpen || pokes.length === 0) {
      setPokeUsers({});
      return;
    }

    const fetchPokeUsers = async () => {
      setLoadingPokes(true);
      try {
        const userDataPromises = pokes.map(async (userId) => {
          try {
            const userData = await getUserData(userId);
            return { userId, userData };
          } catch (error) {
            console.error(`Error fetching user data for ${userId}:`, error);
            return { userId, userData: null };
          }
        });

        const results = await Promise.all(userDataPromises);
        const usersMap: Record<string, any> = {};
        results.forEach(({ userId, userData }) => {
          if (userData) {
            usersMap[userId] = userData;
          }
        });
        setPokeUsers(usersMap);
      } catch (error) {
        console.error("Error fetching poke users:", error);
      } finally {
        setLoadingPokes(false);
      }
    };

    fetchPokeUsers();
  }, [isOpen, pokes]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave();
  };

  const handleDiscardClick = () => {
    setShowDiscardConfirmation(true);
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirmation(false);
    onDiscard();
    onClose();
    // Navigate back to map view
    navigate("/map");
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const convertDistance = (km: number) => {
    if (useMetric) return { value: km.toFixed(2), unit: "km" };
    return { value: (km * 0.621371).toFixed(2), unit: "mi" };
  };

  const convertSpeed = (kmh: number) => {
    if (useMetric) return { value: kmh.toFixed(1), unit: "km/h" };
    return { value: (kmh * 0.621371).toFixed(1), unit: "mph" };
  };

  const activityConfig = {
    running: { icon: DirectionsRunIcon, color: "success", label: "Running" },
    cycling: { icon: DirectionsBikeIcon, color: "primary", label: "Cycling" },
    walking: { icon: DirectionsWalkIcon, color: "warning", label: "Walking" },
  };

  const config = activityConfig[activity];
  const Icon = config.icon;
  const distanceData = convertDistance(distance);
  const speedData = convertSpeed(avgSpeed);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
      >
        <Card className="p-4 space-y-4 shadow-elevation-4 overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  config.color === "success"
                    ? "bg-success/15"
                    : config.color === "primary"
                    ? "bg-primary/15"
                    : "bg-warning/15"
                }`}
              >
                <Icon
                  className={
                    config.color === "success"
                      ? "text-success"
                      : config.color === "primary"
                      ? "text-primary"
                      : "text-warning"
                  }
                  style={{ fontSize: 24 }}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold">Workout Complete!</h2>
                <p className="text-xs text-muted-foreground">{config.label}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-accent rounded-full transition-colors"
            >
              <CloseIcon className="text-muted-foreground" style={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Nearby People Section - Most Prominent, At Top */}
          {nearbyUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2 bg-gradient-to-br from-primary/15 via-success/10 to-primary/5 rounded-lg p-3 border border-primary/30"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/20 rounded-md">
                  <PeopleIcon className="text-primary" style={{ fontSize: 18 }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Nearby People ({nearbyUsers.length})</h3>
                  <p className="text-xs text-muted-foreground">Found during workout</p>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {nearbyUsers.map((user, index) => {
                  const ActivityIcon = 
                    user.activity === "running" ? DirectionsRunIcon :
                    user.activity === "cycling" ? DirectionsBikeIcon :
                    DirectionsWalkIcon;
                  
                  // Check if user's activity matches workout activity
                  // Use isSameActivity flag if available, otherwise compare directly
                  const isSameActivity = user.isSameActivity !== undefined 
                    ? user.isSameActivity 
                    : user.activity && user.activity.toLowerCase() === activity.toLowerCase();
                  const shouldGreyOut = !isSameActivity;
                  
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (index * 0.03) }}
                      className={`flex items-center gap-2.5 p-2.5 bg-card/90 rounded-lg border transition-all ${
                        shouldGreyOut 
                          ? "opacity-50 border-border/30 hover:border-border/50 hover:bg-card/70" 
                          : "border-border/50 hover:border-primary/50 hover:bg-card"
                      }`}
                    >
                      <Avatar className={`w-12 h-12 border-2 flex-shrink-0 ${
                        shouldGreyOut ? "border-border/30" : "border-primary/50"
                      }`}>
                        <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} />
                        <AvatarFallback className="text-sm font-bold">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${
                          shouldGreyOut ? "text-muted-foreground" : ""
                        }`}>{user.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {user.activity && (
                            <span className={`text-xs capitalize flex items-center gap-1 px-1.5 py-0.5 rounded ${
                              shouldGreyOut 
                                ? "text-muted-foreground bg-muted/30" 
                                : "text-foreground bg-muted/50"
                            }`}>
                              <ActivityIcon style={{ fontSize: 12 }} />
                              {user.activity}
                            </span>
                          )}
                          {user.distance && (
                            <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted/30 rounded">
                              {user.distance}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Workout Stats - Compact Display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-muted/30 rounded-lg p-3 border border-border/50"
          >
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Summary</h4>
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
              {/* Total Time */}
              <div className="text-center">
                <TimerIcon className="text-primary mx-auto mb-0.5" style={{ fontSize: 16 }} />
                <p className="text-base font-bold tabular-nums">
                  {formatTime(duration)}
                </p>
                <p className="text-[10px] text-muted-foreground">Time</p>
              </div>

              {/* Distance */}
              <div className="text-center">
                <Icon
                  className={
                    config.color === "success"
                      ? "text-success mx-auto mb-0.5"
                      : config.color === "primary"
                      ? "text-primary mx-auto mb-0.5"
                      : "text-warning mx-auto mb-0.5"
                  }
                  style={{ fontSize: 16 }}
                />
                <p className="text-base font-bold tabular-nums">
                  {distanceData.value}
                </p>
                <p className="text-[10px] text-muted-foreground">{distanceData.unit}</p>
              </div>

              {/* Average Speed */}
              <div className="text-center">
                <SpeedIcon className="text-success mx-auto mb-0.5" style={{ fontSize: 16 }} />
                <p className="text-base font-bold tabular-nums">
                  {speedData.value}
                </p>
                <p className="text-[10px] text-muted-foreground">{speedData.unit}</p>
              </div>
            </div>
          </motion.div>

          {/* Pokes Received Section */}
          {pokes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <TouchAppIcon className="text-primary" style={{ fontSize: 16 }} />
                <h3 className="font-semibold text-xs">Pokes ({pokes.length})</h3>
              </div>
              {loadingPokes ? (
                <div className="flex items-center justify-center py-2">
                  <CircularProgress size={20 } />
                </div>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {pokes.map((pokeUserId) => {
                    const userData = pokeUsers[pokeUserId];
                    const userName = userData?.name || "Unknown User";
                    const userAvatar = userData?.photoURL;
                    
                    return (
                      <motion.div
                        key={pokeUserId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`} />
                          <AvatarFallback className="text-xs">{userName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{userName}</p>
                          <p className="text-[10px] text-muted-foreground">Poked you</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Empty State */}
          {pokes.length === 0 && nearbyUsers.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center py-4"
            >
              <PeopleIcon className="text-muted-foreground mx-auto mb-1" style={{ fontSize: 32 }} />
              <p className="text-xs text-muted-foreground">No nearby people or pokes during this workout</p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSave}
              className="w-full h-11 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Workout
            </Button>
            <Button 
              onClick={handleDiscardClick} 
              className="w-full h-11 text-sm font-bold bg-red-600 hover:bg-red-700 text-white"
            >
              Discard
            </Button>
          </div>

          {/* Discard Confirmation Dialog */}
          <AlertDialog open={showDiscardConfirmation} onOpenChange={setShowDiscardConfirmation}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard Workout?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to discard this workout? All data will be lost and cannot be recovered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDiscard}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>
      </motion.div>
    </div>
  );
};
