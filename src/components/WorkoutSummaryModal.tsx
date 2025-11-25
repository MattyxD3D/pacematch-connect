import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import TimerIcon from "@mui/icons-material/Timer";
import SpeedIcon from "@mui/icons-material/Speed";
import ShareIcon from "@mui/icons-material/Share";
import CloseIcon from "@mui/icons-material/Close";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
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
}

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (photos?: string[], caption?: string) => void;
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
  const [photos, setPhotos] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [pokeUsers, setPokeUsers] = useState<Record<string, any>>({});
  const [loadingPokes, setLoadingPokes] = useState(false);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (photos.length >= 3) {
      toast.error("Maximum 3 photos allowed");
      return;
    }

    Array.from(files).forEach(file => {
      if (photos.length >= 3) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(photos.length > 0 ? photos : undefined, caption.trim() || undefined);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md"
      >
        <Card className="p-6 space-y-6 shadow-elevation-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-full ${
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
                  style={{ fontSize: 32 }}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Workout Complete!</h2>
                <p className="text-sm text-muted-foreground">{config.label} Session</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <CloseIcon className="text-muted-foreground" />
            </button>
          </div>

          {/* Achievement Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-center py-4"
          >
            <div className="text-6xl mb-2">🎉</div>
            <p className="text-lg font-semibold">Workout Complete!</p>
          </motion.div>

          {/* Pokes Received Section */}
          {pokes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <TouchAppIcon className="text-primary" style={{ fontSize: 20 }} />
                <h3 className="font-semibold text-sm">Pokes Received ({pokes.length})</h3>
              </div>
              {loadingPokes ? (
                <div className="flex items-center justify-center py-4">
                  <CircularProgress size={24} />
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {pokes.map((pokeUserId) => {
                    const userData = pokeUsers[pokeUserId];
                    const userName = userData?.name || "Unknown User";
                    const userAvatar = userData?.photoURL;
                    
                    return (
                      <motion.div
                        key={pokeUserId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg border border-border"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`} />
                          <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{userName}</p>
                          <p className="text-xs text-muted-foreground">Poked you during workout</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Nearby People Section */}
          {nearbyUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <PeopleIcon className="text-primary" style={{ fontSize: 20 }} />
                <h3 className="font-semibold text-sm">Nearby People ({nearbyUsers.length})</h3>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {nearbyUsers.map((user) => {
                  const ActivityIcon = 
                    user.activity === "running" ? DirectionsRunIcon :
                    user.activity === "cycling" ? DirectionsBikeIcon :
                    DirectionsWalkIcon;
                  
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg border border-border"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {user.activity && (
                            <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                              <ActivityIcon style={{ fontSize: 12 }} />
                              {user.activity}
                            </span>
                          )}
                          {user.distance && (
                            <>
                              {user.activity && <span className="text-xs text-muted-foreground">•</span>}
                              <span className="text-xs text-muted-foreground">{user.distance}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {pokes.length === 0 && nearbyUsers.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center py-8"
            >
              <PeopleIcon className="text-muted-foreground mx-auto mb-2" style={{ fontSize: 48 }} />
              <p className="text-sm text-muted-foreground">No nearby people or pokes during this workout</p>
            </motion.div>
          )}

          {/* Photo Upload Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <h3 className="font-semibold text-sm">Add Photos (Optional)</h3>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border">
                  <img src={photo} alt={`Workout ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <DeleteIcon style={{ fontSize: 14 }} />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-accent transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <AddPhotoAlternateIcon className="text-muted-foreground" style={{ fontSize: 24 }} />
                  <span className="text-xs text-muted-foreground mt-1">Add</span>
                </label>
              )}
            </div>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              maxLength={280}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">{caption.length}/280</p>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSave}
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              Save Workout
            </Button>
            <div className="flex gap-3">
              <Button onClick={onDiscard} variant="outline" className="flex-1 h-11">
                Discard
              </Button>
              <Button variant="secondary" className="flex-1 h-11">
                <ShareIcon className="mr-2" style={{ fontSize: 20 }} />
                Share
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
