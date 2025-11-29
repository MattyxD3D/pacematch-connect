import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@mui/material";
import React, { useState, useEffect } from "react";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import TimerIcon from "@mui/icons-material/Timer";
import SpeedIcon from "@mui/icons-material/Speed";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonIcon from "@mui/icons-material/Person";
import { format } from "date-fns";
import { toast } from "sonner";
import type { WorkoutHistory, NearbyUser } from "@/contexts/UserContext";
import { useAuth } from "@/hooks/useAuth";
import { useUser } from "@/contexts/UserContext";
import { sendFriendRequest } from "@/services/friendService";
import { listenToFriendRequests } from "@/services/friendService";
import { ProfileView } from "@/pages/ProfileView";

interface WorkoutDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutHistory;
  useMetric: boolean;
}

type FriendStatus = "not_friends" | "request_pending" | "request_received" | "friends" | "denied";

export const WorkoutDetailModal = ({
  isOpen,
  onClose,
  workout,
  useMetric,
}: WorkoutDetailModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile } = useUser();
  const [friendStatuses, setFriendStatuses] = useState<Record<string, { status: FriendStatus; cooldownUntil?: number }>>({});
  const [friendRequests, setFriendRequests] = useState<{ incoming: string[]; outgoing: string[] }>({ incoming: [], outgoing: [] });
  const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
  const [showProfileView, setShowProfileView] = useState(false);

  // Listen to friend requests
  useEffect(() => {
    if (!user?.uid || !isOpen) return;
    
    const unsubscribe = listenToFriendRequests(user.uid, (requests) => {
      setFriendRequests(requests);
    });

    return () => unsubscribe();
  }, [user?.uid, isOpen]);

  // Determine friend status for a user
  const getFriendStatus = (userId: string | number): FriendStatus => {
    const id = typeof userId === "number" ? userId.toString() : userId;
    
    // Check if already friends
    const friends = userProfile?.friends || [];
    if (friends.some((f: any) => String(f) === id)) {
      return "friends";
    }
    
    // Check if request pending (outgoing)
    if (friendRequests.outgoing.includes(id)) {
      return "request_pending";
    }
    
    // Check if request received (incoming)
    if (friendRequests.incoming.includes(id)) {
      return "request_received";
    }
    
    // Check local state
    const localStatus = friendStatuses[id];
    if (localStatus) {
      return localStatus.status;
    }
    
    return "not_friends";
  };

  const handleAddFriend = async (userData: NearbyUser) => {
    if (!user?.uid) {
      toast.error("You must be logged in to add friends");
      return;
    }

    const userId = typeof userData.id === "number" ? userData.id.toString() : userData.id;
    
    try {
      await sendFriendRequest(user.uid, userId);
      setFriendStatuses(prev => ({
        ...prev,
        [userId]: { status: "request_pending" }
      }));
      toast.success(`Friend request sent to ${userData.name}`);
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request. Please try again.");
    }
  };

  const handleSendMessage = (userData: NearbyUser) => {
    navigate("/chat", {
      state: {
        user: {
          id: userData.id,
          name: userData.name,
          avatar: userData.avatar || ""
        }
      }
    });
    onClose(); // Close workout modal when navigating
  };

  const handleViewProfile = (userData: NearbyUser) => {
    setSelectedUser(userData);
    setShowProfileView(true);
  };

  const getCooldownDays = (userId: string | number): number => {
    const id = typeof userId === "number" ? userId.toString() : userId;
    const cooldownUntil = friendStatuses[id]?.cooldownUntil;
    if (!cooldownUntil) return 0;
    const now = Date.now();
    const diff = cooldownUntil - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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

  const getActivityConfig = (activity: "running" | "cycling" | "walking") => {
    const configs = {
      running: { 
        icon: DirectionsRunIcon, 
        color: "success", 
        label: "Running",
        bgClass: "bg-success/10",
        textClass: "text-success",
        borderClass: "border-success/30"
      },
      cycling: { 
        icon: DirectionsBikeIcon, 
        color: "primary", 
        label: "Cycling",
        bgClass: "bg-primary/10",
        textClass: "text-primary",
        borderClass: "border-primary/30"
      },
      walking: { 
        icon: DirectionsWalkIcon, 
        color: "warning", 
        label: "Walking",
        bgClass: "bg-warning/10",
        textClass: "text-warning",
        borderClass: "border-warning/30"
      },
    };
    return configs[activity];
  };

  const config = getActivityConfig(workout.activity);
  const Icon = config.icon;
  const distanceData = convertDistance(workout.distance);
  const speedData = convertSpeed(workout.avgSpeed);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full mx-4 max-h-[95vh] sm:max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[95vh] sm:max-h-[90vh]">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <DialogHeader>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className={`p-2 sm:p-3 rounded-xl ${config.bgClass} flex-shrink-0`}>
                  <Icon className={config.textClass} style={{ fontSize: 24 }} sx={{ fontSize: { xs: 24, sm: 32 } }} />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg sm:text-2xl leading-tight">{config.label} Session</DialogTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                    {format(new Date(workout.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Caption */}
            {(workout as any).caption && (
              <div className="p-3 sm:p-4 bg-muted/30 rounded-lg border border-border">
                <p className="text-xs sm:text-sm leading-relaxed">{(workout as any).caption}</p>
              </div>
            )}

            {/* Location */}
            {workout.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <LocationOnIcon style={{ fontSize: 18 }} sx={{ fontSize: { xs: 18, sm: 20 } }} className="flex-shrink-0" />
                <span className="text-xs sm:text-sm truncate">{workout.location}</span>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <Card className={`${config.bgClass} border-2 ${config.borderClass}`}>
                <CardContent className="p-3 sm:p-4 text-center">
                  <TimerIcon className={config.textClass} sx={{ fontSize: { xs: 20, sm: 28 } }} />
                  <div className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2">{formatTime(workout.duration)}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Duration</div>
                </CardContent>
              </Card>

              <Card className={`${config.bgClass} border-2 ${config.borderClass}`}>
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="text-2xl sm:text-3xl">📍</div>
                  <div className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2">
                    {distanceData.value}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{distanceData.unit}</div>
                </CardContent>
              </Card>

              <Card className={`${config.bgClass} border-2 ${config.borderClass}`}>
                <CardContent className="p-3 sm:p-4 text-center">
                  <SpeedIcon className={config.textClass} sx={{ fontSize: { xs: 20, sm: 28 } }} />
                  <div className="text-lg sm:text-2xl font-bold mt-1 sm:mt-2">
                    {speedData.value}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{speedData.unit}</div>
                </CardContent>
              </Card>
            </div>

            {/* Photos */}
            {(workout as any).photos && (workout as any).photos.length > 0 && (
              <div className={`grid gap-3 ${(workout as any).photos.length === 1 ? 'grid-cols-1' : (workout as any).photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {(workout as any).photos.map((photo: string, idx: number) => (
                  <div
                    key={idx}
                    className={`relative rounded-xl overflow-hidden ${(workout as any).photos.length === 3 && idx === 0 ? 'col-span-2' : ''}`}
                    style={{ paddingTop: (workout as any).photos.length === 1 ? '56.25%' : '100%' }}
                  >
                    <img
                      src={photo}
                      alt={`Workout photo ${idx + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Route Map Placeholder */}
            <Card>
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-primary/10 via-success/5 to-warning/10 rounded-lg h-32 sm:h-48 flex items-center justify-center border border-border">
                  <div className="text-center px-2">
                    <LocationOnIcon className="text-muted-foreground mx-auto mb-1 sm:mb-2" sx={{ fontSize: { xs: 32, sm: 48 } }} />
                    <p className="text-xs sm:text-sm text-muted-foreground">Route map preview</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">GPS tracking feature coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nearby Users During Workout */}
            {workout.nearbyUsers && workout.nearbyUsers.length > 0 && (
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <PeopleIcon className="text-primary flex-shrink-0" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                    <h3 className="text-base sm:text-lg font-bold">
                      People Nearby During Workout
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {workout.nearbyUsers.length} {workout.nearbyUsers.length === 1 ? "person was" : "people were"} active nearby during your workout
                  </p>

                  <div className="space-y-2 sm:space-y-3">
                    {workout.nearbyUsers.map((user, index) => {
                      const friendStatus = getFriendStatus(user.id);
                      const cooldownDays = getCooldownDays(user.id);
                      
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors border border-border"
                        >
                          <button
                            onClick={() => handleViewProfile(user)}
                            className="flex-shrink-0"
                          >
                            <Avatar
                              src={user.avatar}
                              alt={user.name}
                              sx={{ width: 48, height: 48, cursor: "pointer" }}
                              className="sm:w-[56px] sm:h-[56px]"
                            />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                              <button
                                onClick={() => handleViewProfile(user)}
                                className="font-semibold hover:underline text-left text-sm sm:text-base truncate max-w-[120px] sm:max-w-none"
                              >
                                {user.name}
                              </button>
                              {friendStatus === "friends" && (
                                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-success/10 border border-success rounded-full flex-shrink-0">
                                  <CheckCircleIcon className="text-success" sx={{ fontSize: { xs: 12, sm: 14 } }} />
                                  <span className="text-[10px] sm:text-xs text-success font-medium">Friends</span>
                                </div>
                              )}
                              {friendStatus === "request_pending" && (
                                <div className="px-1.5 sm:px-2 py-0.5 bg-warning/10 border border-warning rounded-full flex-shrink-0">
                                  <span className="text-[10px] sm:text-xs text-warning font-medium">Request Sent</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                              <span>
                                {user.activity === "Running" && "🏃"}
                                {user.activity === "Cycling" && "🚴"}
                                {user.activity === "Walking" && "🚶"}
                              </span>
                              <span className="capitalize">{user.activity?.toLowerCase()}</span>
                              <span>•</span>
                              <span className="truncate">{user.distance} away</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProfile(user);
                              }}
                              className="h-8 sm:h-9 px-2 sm:px-3"
                              title="View Profile"
                            >
                              <PersonIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                            </Button>
                            {friendStatus === "not_friends" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddFriend(user);
                                }}
                                disabled={cooldownDays > 0}
                                className="h-8 sm:h-9 px-2 sm:px-3 text-xs"
                                title={cooldownDays > 0 ? `Try again in ${cooldownDays} day${cooldownDays !== 1 ? 's' : ''}` : "Add Friend"}
                              >
                                <PersonAddIcon sx={{ fontSize: { xs: 16, sm: 18 } }} className="mr-0.5 sm:mr-1" />
                                <span className="hidden sm:inline">Add</span>
                              </Button>
                            )}
                            {friendStatus === "request_pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="h-8 sm:h-9 px-2 sm:px-3 text-xs"
                              >
                                <span className="hidden sm:inline">Pending</span>
                                <span className="sm:hidden">...</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendMessage(user);
                              }}
                              className="h-8 sm:h-9 px-2 sm:px-3"
                              title="Send Message"
                            >
                              <SendIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="space-y-1.5 sm:space-y-2">
                      <p className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5 sm:gap-2">
                        <PeopleIcon className="flex-shrink-0" sx={{ fontSize: { xs: 16, sm: 18 } }} />
                        Social Workout Feature
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                        Connect with people who were active nearby during your workout. Send friend requests to stay motivated together or message them to plan future workouts!
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Privacy:</span> These users could also see your activity in their nearby workouts during this time.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No nearby users message */}
            {(!workout.nearbyUsers || workout.nearbyUsers.length === 0) && (
              <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                  <PeopleIcon className="text-muted-foreground/30 mx-auto mb-2 sm:mb-3" sx={{ fontSize: { xs: 40, sm: 56 } }} />
                  <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">No One Nearby</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                    No other users were active within 2km during this workout
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Try working out in popular areas or during peak times to connect with other fitness enthusiasts!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Close Button */}
            <Button onClick={onClose} className="w-full h-11 sm:h-12" size="lg">
              Close
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>

      {/* Profile View Modal */}
      <AnimatePresence>
        {showProfileView && selectedUser && (
          <ProfileView
            user={{
              id: selectedUser.id,
              name: selectedUser.name,
              distance: selectedUser.distance || "Unknown",
              activity: selectedUser.activity || "Active",
              avatar: selectedUser.avatar || "",
              photos: [],
              bio: ""
            }}
            friendStatus={getFriendStatus(selectedUser.id)}
            cooldownDays={getCooldownDays(selectedUser.id)}
            onClose={() => {
              setShowProfileView(false);
              setSelectedUser(null);
            }}
            onSendMessage={() => {
              setShowProfileView(false);
              handleSendMessage(selectedUser);
            }}
            onAddFriend={() => {
              handleAddFriend(selectedUser);
              setShowProfileView(false);
            }}
            onAcceptFriend={() => {
              // This would be handled by the friend request modal
              setShowProfileView(false);
            }}
            onDeclineFriend={() => {
              // This would be handled by the friend request modal
              setShowProfileView(false);
            }}
          />
        )}
      </AnimatePresence>
    </Dialog>
  );
};
