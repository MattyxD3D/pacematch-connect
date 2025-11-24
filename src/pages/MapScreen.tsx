import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import PauseIcon from "@mui/icons-material/Pause";
import ExploreIcon from "@mui/icons-material/Explore";
import PeopleIcon from "@mui/icons-material/People";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import SettingsIcon from "@mui/icons-material/Settings";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import MailIcon from "@mui/icons-material/Mail";
import EventIcon from "@mui/icons-material/Event";
import TimerIcon from "@mui/icons-material/Timer";
import SpeedIcon from "@mui/icons-material/Speed";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { Drawer } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import { toast } from "sonner";
import { NotificationBanner } from "@/components/NotificationBanner";
import { MessageModal } from "@/components/MessageModal";
import { FriendRequestModal } from "@/components/FriendRequestModal";
import { ProfileView } from "@/pages/ProfileView";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { BadgeCounter } from "@/components/NotificationSystem";
import { NotificationTestButton } from "@/components/NotificationTestButton";
import { WorkoutSummaryModal } from "@/components/WorkoutSummaryModal";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

type FriendStatus = "not_friends" | "request_pending" | "request_received" | "friends" | "denied";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";

const MapScreen = () => {
  const navigate = useNavigate();
  const { userProfile, hasActivity, useMetric, addWorkout } = useUser();
  const { addNotification, unreadMessageCount, unreadFriendRequestCount } = useNotificationContext();
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPeopleDrawer, setShowPeopleDrawer] = useState(false);
  const [pointsTracked, setPointsTracked] = useState(0);
  const [distance, setDistance] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  
  // Enhanced tracking state
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [avgSpeed, setAvgSpeed] = useState(0); // km/h
  const [calories, setCalories] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showSpeedNotPace, setShowSpeedNotPace] = useState(true);
  
  // For speed calculation
  const lastDistanceRef = useRef(0);
  const lastTimeRef = useRef(0);
  
  // Get user's enabled activities from profile
  const userActivities = userProfile?.activities || ["running", "cycling", "walking"];
  const [selectedActivity, setSelectedActivity] = useState<"running" | "cycling" | "walking">(
    userActivities[0] as "running" | "cycling" | "walking"
  );
  
  const [selectedUser, setSelectedUser] = useState<typeof nearbyUsers[0] | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Activity filter for People Drawer
  const [activityFilter, setActivityFilter] = useState<"all" | "running" | "cycling" | "walking">("all");
  
  // Simulate receiving notifications (for demo purposes)
  useEffect(() => {
    // Simulate a message notification after 3 seconds
    const messageTimer = setTimeout(() => {
      addNotification({
        type: "message",
        userId: 1,
        userName: "Sarah Johnson",
        userAvatar: "https://i.pravatar.cc/150?img=1",
        message: "Hi! Want to workout together?",
      });
    }, 3000);

    // Simulate a friend request notification after 6 seconds
    const friendRequestTimer = setTimeout(() => {
      addNotification({
        type: "friend_request",
        userId: 4,
        userName: "James Wilson",
        userAvatar: "https://i.pravatar.cc/150?img=4",
      });
    }, 6000);

    return () => {
      clearTimeout(messageTimer);
      clearTimeout(friendRequestTimer);
    };
  }, [addNotification]);
  
  // Friend status tracking (mock data - replace with backend later)
  const [friendStatuses, setFriendStatuses] = useState<Record<number, { status: FriendStatus; cooldownUntil?: number }>>({
    1: { status: "not_friends" },
    2: { status: "friends" }, // Mike Chen is already a friend
    3: { status: "not_friends" },
  });
  
  const getFriendStatus = (userId: number): FriendStatus => {
    return friendStatuses[userId]?.status || "not_friends";
  };
  
  const getCooldownDays = (userId: number): number => {
    const cooldownUntil = friendStatuses[userId]?.cooldownUntil;
    if (!cooldownUntil) return 0;
    const now = Date.now();
    const diff = cooldownUntil - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const activities = [
    { id: "running", label: "Running", icon: DirectionsRunIcon, color: "success" },
    { id: "cycling", label: "Cycling", icon: DirectionsBikeIcon, color: "primary" },
    { id: "walking", label: "Walking", icon: DirectionsWalkIcon, color: "warning" },
  ] as const;

  // Filter activities based on user's profile
  const availableActivities = activities.filter(act => 
    userActivities.includes(act.id as "running" | "cycling" | "walking")
  );

  // Mock data for nearby users
  const nearbyUsers = [
    { id: 1, name: "Sarah Johnson", distance: "0.3 km", distanceValue: 0.3, activity: "Running", avatar: "https://i.pravatar.cc/150?img=1", lat: 40.7484, lng: -73.9857, photos: ["https://i.pravatar.cc/400?img=1", "https://i.pravatar.cc/400?img=11", "https://i.pravatar.cc/400?img=21"], bio: "Love running in Central Park! Looking for workout buddies 🏃‍♀️" },
    { id: 2, name: "Mike Chen", distance: "0.5 km", distanceValue: 0.5, activity: "Cycling", avatar: "https://i.pravatar.cc/150?img=2", lat: 40.7489, lng: -73.9860, photos: ["https://i.pravatar.cc/400?img=2", "https://i.pravatar.cc/400?img=12"], bio: "Cycling enthusiast and coffee lover ☕🚴" },
    { id: 3, name: "Emma Davis", distance: "0.8 km", distanceValue: 0.8, activity: "Walking", avatar: "https://i.pravatar.cc/150?img=3", lat: 40.7495, lng: -73.9870, photos: ["https://i.pravatar.cc/400?img=3", "https://i.pravatar.cc/400?img=13", "https://i.pravatar.cc/400?img=23"], bio: "Walking is my meditation 🧘‍♀️" },
    { id: 4, name: "James Wilson", distance: "1.2 km", distanceValue: 1.2, activity: "Running", avatar: "https://i.pravatar.cc/150?img=4", lat: 40.7500, lng: -73.9880, photos: ["https://i.pravatar.cc/400?img=4"] },
    { id: 5, name: "Lisa Anderson", distance: "1.5 km", distanceValue: 1.5, activity: "Cycling", avatar: "https://i.pravatar.cc/150?img=5", lat: 40.7510, lng: -73.9890, photos: ["https://i.pravatar.cc/400?img=5", "https://i.pravatar.cc/400?img=15"] },
    { id: 6, name: "Tom Martinez", distance: "2.0 km", distanceValue: 2.0, activity: "Walking", avatar: "https://i.pravatar.cc/150?img=6", lat: 40.7520, lng: -73.9900 },
  ];

  // Filter users by activity
  const filteredUsers = activityFilter === "all" 
    ? nearbyUsers 
    : nearbyUsers.filter(user => user.activity.toLowerCase() === activityFilter);

  // Sort by distance
  const sortedUsers = [...filteredUsers].sort((a, b) => a.distanceValue - b.distanceValue);

  // Enhanced tracking interval
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        
        // Simulate realistic distance updates based on activity
        const speedVariation = Math.random() * 0.2 - 0.1; // -0.1 to +0.1 variation
        let baseSpeed = 0;
        
        if (selectedActivity === "running") {
          baseSpeed = 10 + speedVariation; // 8-12 km/h
        } else if (selectedActivity === "cycling") {
          baseSpeed = 20 + speedVariation; // 15-25 km/h
        } else {
          baseSpeed = 5 + speedVariation; // 4-6 km/h
        }
        
        const distanceIncrement = baseSpeed / 3600; // km per second
        
        setDistance(prev => {
          const newDistance = prev + distanceIncrement;
          
          // Calculate current speed
          const currentTime = Date.now();
          const timeDiff = (currentTime - lastTimeRef.current) / 1000; // seconds
          
          if (timeDiff >= 1 && lastTimeRef.current > 0) {
            const distanceDiff = newDistance - lastDistanceRef.current;
            const speed = (distanceDiff / timeDiff) * 3600; // km/h
            setCurrentSpeed(speed);
            
            lastDistanceRef.current = newDistance;
            lastTimeRef.current = currentTime;
          } else if (lastTimeRef.current === 0) {
            lastTimeRef.current = currentTime;
            lastDistanceRef.current = newDistance;
          }
          
          return newDistance;
        });
        
        setPointsTracked(prev => prev + 1);
      }, 1000); // Update every second for smooth tracking
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, selectedActivity]);
  
  // Calculate average speed and calories
  useEffect(() => {
    if (elapsedTime > 0 && distance > 0) {
      const avgSpeedValue = (distance / elapsedTime) * 3600; // km/h
      setAvgSpeed(avgSpeedValue);
      
      // Calculate calories based on activity type
      let caloriesPerKm = 0;
      if (selectedActivity === "running") {
        caloriesPerKm = 100; // ~100 cal/km
      } else if (selectedActivity === "cycling") {
        caloriesPerKm = 50; // ~50 cal/km
      } else {
        caloriesPerKm = 60; // ~60 cal/km
      }
      
      setCalories(Math.round(distance * caloriesPerKm));
    }
  }, [elapsedTime, distance, selectedActivity]);

  const handleStartStop = () => {
    if (!isActive) {
      // Start activity
      toast.success("Activity started! GPS tracking enabled.");
      setIsActive(true);
      setIsPaused(false);
      setStartTime(new Date());
      setElapsedTime(0);
      setDistance(0);
      setCurrentSpeed(0);
      setAvgSpeed(0);
      setCalories(0);
      setPointsTracked(0);
      lastDistanceRef.current = 0;
      lastTimeRef.current = 0;
      setShowNotification(false);
    } else {
      // Stop activity - show summary
      setIsActive(false);
      setIsPaused(false);
      if (distance > 0) {
        setShowSummary(true);
      }
    }
  };
  
  const handlePause = () => {
    setIsPaused(!isPaused);
    toast(isPaused ? "Activity resumed" : "Activity paused");
  };
  
  const handleSaveWorkout = () => {
    // Filter nearby users who were active during the workout
    const activeNearbyUsers = nearbyUsers
      .filter(user => user.distanceValue <= 2.0) // Within 2km radius
      .slice(0, 5) // Limit to 5 users
      .map(user => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        activity: user.activity,
        distance: user.distance,
      }));

    addWorkout({
      activity: selectedActivity,
      date: startTime || new Date(),
      duration: elapsedTime,
      distance,
      avgSpeed,
      calories,
      nearbyUsers: activeNearbyUsers,
      location: "Central Park, New York", // This would come from GPS in real app
    });
    toast.success(`Workout saved! ${distance.toFixed(2)} km tracked.`);
    setShowSummary(false);
    setPointsTracked(0);
    setDistance(0);
    setElapsedTime(0);
    setCurrentSpeed(0);
    setAvgSpeed(0);
    setCalories(0);
    setStartTime(null);
  };
  
  const handleDiscardWorkout = () => {
    toast("Workout discarded");
    setShowSummary(false);
    setPointsTracked(0);
    setDistance(0);
    setElapsedTime(0);
    setCurrentSpeed(0);
    setAvgSpeed(0);
    setCalories(0);
    setStartTime(null);
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
  
  const formatPace = (kmh: number) => {
    if (kmh === 0) return "--:--";
    const minPerKm = 60 / kmh;
    const mins = Math.floor(minPerKm);
    const secs = Math.round((minPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  
  const convertDistance = (km: number) => {
    if (useMetric) return { value: km.toFixed(2), unit: "km" };
    return { value: (km * 0.621371).toFixed(2), unit: "mi" };
  };
  
  const convertSpeed = (kmh: number) => {
    if (useMetric) return { value: kmh.toFixed(1), unit: "km/h" };
    return { value: (kmh * 0.621371).toFixed(1), unit: "mph" };
  };

  const handleNotificationTap = () => {
    setShowNotification(false);
    handleStartStop();
  };

  const handleUserMarkerClick = (user: typeof nearbyUsers[0]) => {
    setSelectedUser(user);
    setShowProfileView(true);
  };

  const handleCenterOnUser = () => {
    if (selectedUser) {
      toast.success(`Centering on ${selectedUser.name}`);
      // In real implementation, this would pan the map
    }
  };

  const handleAddFriend = (userId: number) => {
    if (selectedUser) {
      setFriendStatuses(prev => ({
        ...prev,
        [userId]: { status: "request_pending" }
      }));
      toast.success(`Friend request sent to ${selectedUser.name}`);
    }
  };

  const handleAcceptFriend = (userId: number) => {
    setFriendStatuses(prev => ({
      ...prev,
      [userId]: { status: "friends" }
    }));
    setShowFriendRequestModal(false);
    toast.success("Friend request accepted!");
  };

  const handleDeclineFriend = (userId: number) => {
    // Set 7-day cooldown
    const cooldownUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);
    setFriendStatuses(prev => ({
      ...prev,
      [userId]: { status: "denied", cooldownUntil }
    }));
    setShowFriendRequestModal(false);
    toast("Friend request declined. The user won't be notified.");
  };

  const handleSendMessage = () => {
    setShowMessageModal(true);
  };

  const handleMessageSent = (message: string, isTemplate: boolean) => {
    if (selectedUser) {
      toast.success(`Message sent to ${selectedUser.name}!`);
      console.log("Message sent:", { message, isTemplate, to: selectedUser.name });
      // In real implementation, this would save to backend/Firebase
    }
    setShowMessageModal(false);
    setSelectedUser(null);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-muted">
      {/* Map Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-success/5 to-warning/10">
        {/* Map simulation with demo user markers */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="text-center space-y-4 p-8 bg-card/80 backdrop-blur-md rounded-3xl shadow-elevation-3 border border-border/50">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <ExploreIcon className="text-primary mx-auto" style={{ fontSize: 72 }} />
            </motion.div>
            <h2 className="text-2xl font-bold">Map View</h2>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              Google Maps integration will display here. This shows your location, nearby users, and activity trails.
            </p>
          </div>

          {/* Demo User Markers */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute top-1/3 left-1/4"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleUserMarkerClick(nearbyUsers[0])}
              className="relative"
            >
              <Avatar
                src={nearbyUsers[0].avatar}
                alt={nearbyUsers[0].name}
                sx={{ width: 56, height: 56, border: "3px solid #ef4444" }}
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-1 bg-destructive/30 rounded-full -z-10"
              />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="absolute top-1/2 right-1/3"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleUserMarkerClick(nearbyUsers[1])}
              className="relative"
            >
              <Avatar
                src={nearbyUsers[1].avatar}
                alt={nearbyUsers[1].name}
                sx={{ width: 56, height: 56, border: "3px solid #1976d2" }}
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="absolute -inset-1 bg-primary/30 rounded-full -z-10"
              />
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="absolute bottom-1/3 left-1/2"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleUserMarkerClick(nearbyUsers[2])}
              className="relative"
            >
              <Avatar
                src={nearbyUsers[2].avatar}
                alt={nearbyUsers[2].name}
                sx={{ width: 56, height: 56, border: "3px solid #ff9800" }}
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                className="absolute -inset-1 bg-warning/30 rounded-full -z-10"
              />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Notification Banner */}
      <NotificationBanner
        show={showNotification}
        onDismiss={() => setShowNotification(false)}
        onTap={handleNotificationTap}
      />
      
      {/* Workout Summary Modal */}
      <WorkoutSummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        onSave={handleSaveWorkout}
        onDiscard={handleDiscardWorkout}
        activity={selectedActivity}
        duration={elapsedTime}
        distance={distance}
        avgSpeed={avgSpeed}
        calories={calories}
        useMetric={useMetric}
      />

      {/* Top Bar - Right Side Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-10">
        {/* People List */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPeopleDrawer(true)}
          className="relative touch-target bg-primary text-primary-foreground rounded-full shadow-elevation-3"
          style={{ width: 56, height: 56 }}
        >
          <PeopleIcon style={{ fontSize: 28 }} />
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {sortedUsers.length}
          </span>
        </motion.button>

        {/* Events */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/events")}
          className="relative touch-target bg-card text-foreground rounded-full shadow-elevation-3 border border-border hover:border-primary transition-all"
          style={{ width: 56, height: 56 }}
        >
          <EventIcon style={{ fontSize: 28 }} />
        </motion.button>

        {/* Messages */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/messages")}
          className="relative touch-target bg-card text-foreground rounded-full shadow-elevation-3 border border-border"
          style={{ width: 56, height: 56 }}
        >
          <MailIcon style={{ fontSize: 28 }} />
          {unreadMessageCount > 0 && (
            <div className="absolute -top-1 -right-1">
              <BadgeCounter count={unreadMessageCount} variant="default" size="md" />
            </div>
          )}
        </motion.button>

        {/* My Location */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="touch-target bg-card text-primary rounded-full shadow-elevation-3 border-2 border-primary"
          style={{ width: 56, height: 56 }}
        >
          <MyLocationIcon style={{ fontSize: 28 }} />
        </motion.button>

        {/* Settings */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/settings")}
          className="touch-target bg-card text-foreground rounded-full shadow-elevation-3"
          style={{ width: 56, height: 56 }}
        >
          <SettingsIcon style={{ fontSize: 28 }} />
        </motion.button>
      </div>

      {/* Profile View Modal */}
      <AnimatePresence>
        {showProfileView && selectedUser && (
          <ProfileView
            user={selectedUser}
            friendStatus={getFriendStatus(selectedUser.id)}
            cooldownDays={getCooldownDays(selectedUser.id)}
            onClose={() => {
              setShowProfileView(false);
              setSelectedUser(null);
            }}
            onSendMessage={() => {
              setShowProfileView(false);
              handleSendMessage();
            }}
            onAddFriend={() => handleAddFriend(selectedUser.id)}
            onAcceptFriend={() => handleAcceptFriend(selectedUser.id)}
            onDeclineFriend={() => handleDeclineFriend(selectedUser.id)}
          />
        )}
      </AnimatePresence>

      {/* Message Modal */}
      <MessageModal
        show={showMessageModal}
        userName={selectedUser?.name || ""}
        onClose={() => setShowMessageModal(false)}
        onSend={handleMessageSent}
      />

      {/* Friend Request Modal */}
      <FriendRequestModal
        isOpen={showFriendRequestModal}
        onClose={() => setShowFriendRequestModal(false)}
        userName={selectedUser?.name || ""}
        onAccept={() => selectedUser && handleAcceptFriend(selectedUser.id)}
        onDecline={() => selectedUser && handleDeclineFriend(selectedUser.id)}
      />
      {/* Enhanced Stats Display */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute top-4 left-4 right-4 z-10"
          >
            <div
              className={`
              bg-card/95 backdrop-blur-md rounded-3xl shadow-elevation-4 border-2 overflow-hidden
              ${
                selectedActivity === "running"
                  ? "border-success/30"
                  : selectedActivity === "cycling"
                  ? "border-primary/30"
                  : "border-warning/30"
              }
            `}
            >
              {/* Top Section - Primary Stats */}
              <div className="p-6 space-y-4">
                {/* Activity Header with Pulsing Heart */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedActivity === "running" && (
                      <DirectionsRunIcon className="text-success" style={{ fontSize: 32 }} />
                    )}
                    {selectedActivity === "cycling" && (
                      <DirectionsBikeIcon className="text-primary" style={{ fontSize: 32 }} />
                    )}
                    {selectedActivity === "walking" && (
                      <DirectionsWalkIcon className="text-warning" style={{ fontSize: 32 }} />
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {selectedActivity.charAt(0).toUpperCase() + selectedActivity.slice(1)}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isPaused ? "Paused" : "Active"}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ scale: isPaused ? 1 : [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: isPaused ? 0 : Infinity }}
                  >
                    <FavoriteIcon
                      className={
                        selectedActivity === "running"
                          ? "text-success"
                          : selectedActivity === "cycling"
                          ? "text-primary"
                          : "text-warning"
                      }
                      style={{ fontSize: 32 }}
                    />
                  </motion.div>
                </div>

                {/* Large Primary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Time */}
                  <div className="text-center">
                    <TimerIcon className="text-muted-foreground mx-auto mb-1" style={{ fontSize: 24 }} />
                    <div className="text-3xl font-bold text-foreground tabular-nums">
                      {formatTime(elapsedTime)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Duration</div>
                  </div>

                  {/* Distance */}
                  <div className="text-center">
                    <div className="text-2xl mb-1">📍</div>
                    <div className="text-3xl font-bold text-foreground tabular-nums">
                      {convertDistance(distance).value}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {convertDistance(distance).unit}
                    </div>
                  </div>

                  {/* Speed/Pace */}
                  <button
                    onClick={() => setShowSpeedNotPace(!showSpeedNotPace)}
                    className="text-center active:scale-95 transition-transform"
                  >
                    <SpeedIcon className="text-muted-foreground mx-auto mb-1" style={{ fontSize: 24 }} />
                    <div className="text-3xl font-bold text-foreground tabular-nums">
                      {showSpeedNotPace
                        ? convertSpeed(currentSpeed).value
                        : formatPace(currentSpeed)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {showSpeedNotPace ? convertSpeed(currentSpeed).unit : "min/km"}
                    </div>
                  </button>
                </div>
              </div>

              {/* Bottom Section - Secondary Stats */}
              <div
                className={`
                grid grid-cols-2 gap-px
                ${
                  selectedActivity === "running"
                    ? "bg-success/10"
                    : selectedActivity === "cycling"
                    ? "bg-primary/10"
                    : "bg-warning/10"
                }
              `}
              >
                <div className="bg-card p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Avg Speed</div>
                  <div className="text-lg font-bold text-foreground tabular-nums">
                    {convertSpeed(avgSpeed).value}{" "}
                    <span className="text-xs font-normal">{convertSpeed(avgSpeed).unit}</span>
                  </div>
                </div>
                <div className="bg-card p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                    <LocalFireDepartmentIcon style={{ fontSize: 14 }} className="text-warning" />
                    Calories
                  </div>
                  <div className="text-lg font-bold text-foreground tabular-nums">{calories}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        {/* Activity Selector (when not active) */}
        <AnimatePresence>
          {!isActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 bg-card/95 backdrop-blur-md rounded-2xl p-5 shadow-elevation-4 border border-border/50"
            >
              <p className="text-sm font-bold mb-3 text-center">Select Activity Type</p>
              <div className={`grid gap-3 ${
                availableActivities.length === 1 ? 'grid-cols-1' : 
                availableActivities.length === 2 ? 'grid-cols-2' : 
                'grid-cols-3'
              }`}>
                {availableActivities.map((act) => {
                  const Icon = act.icon;
                  const isSelected = selectedActivity === act.id;
                  return (
                    <motion.button
                      key={act.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedActivity(act.id as typeof selectedActivity)}
                      className={`
                        flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300
                        ${isSelected 
                          ? act.color === 'success'
                            ? 'border-success bg-success/15 shadow-elevation-2'
                            : act.color === 'primary'
                            ? 'border-primary bg-primary/15 shadow-elevation-2'
                            : 'border-warning bg-warning/15 shadow-elevation-2'
                          : 'border-border bg-card/50 hover:bg-secondary'
                        }
                      `}
                    >
                      <Icon
                        className={
                          isSelected
                            ? act.color === 'success'
                              ? 'text-success'
                              : act.color === 'primary'
                              ? 'text-primary'
                              : 'text-warning'
                            : 'text-muted-foreground'
                        }
                        style={{ fontSize: 32 }}
                      />
                      <span className={`text-xs mt-2 font-semibold ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {act.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Controls removed */}

        {/* Start/Stop/Pause Activity Buttons */}
        {isActive ? (
          <div className="flex gap-3">
            <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
              <Button
                onClick={handlePause}
                className={`
                  w-full h-16 text-lg font-extrabold shadow-elevation-4 transition-all duration-300 rounded-2xl
                  ${
                    selectedActivity === "running"
                      ? "bg-gradient-to-r from-warning to-warning/90 text-warning-foreground hover:from-warning/90 hover:to-warning"
                      : selectedActivity === "cycling"
                      ? "bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground hover:from-secondary/90 hover:to-secondary"
                      : "bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground hover:from-secondary/90 hover:to-secondary"
                  }
                `}
              >
                {isPaused ? (
                  <>
                    <PlayArrowIcon className="mr-2" style={{ fontSize: 28 }} />
                    Resume
                  </>
                ) : (
                  <>
                    <PauseIcon className="mr-2" style={{ fontSize: 28 }} />
                    Pause
                  </>
                )}
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
              <Button
                onClick={handleStartStop}
                className="w-full h-16 text-lg font-extrabold shadow-elevation-4 transition-all duration-300 rounded-2xl bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground hover:from-destructive/90 hover:to-destructive"
              >
                <StopIcon className="mr-2" style={{ fontSize: 28 }} />
                Stop
              </Button>
            </motion.div>
          </div>
        ) : (
          <motion.div
            whileTap={{ scale: 0.97 }}
            animate={{ scale: [1, 1.01, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Button
              onClick={handleStartStop}
              className={`
                w-full h-16 text-lg font-extrabold shadow-elevation-4 transition-all duration-300 rounded-2xl
                ${
                  selectedActivity === "running"
                    ? "bg-gradient-to-r from-success to-success/90 text-success-foreground hover:from-success/90 hover:to-success"
                    : selectedActivity === "cycling"
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary"
                    : "bg-gradient-to-r from-warning to-warning/90 text-warning-foreground hover:from-warning/90 hover:to-warning"
                }
              `}
            >
              <PlayArrowIcon className="mr-3" style={{ fontSize: 32 }} />
              Start {availableActivities.find((a) => a.id === selectedActivity)?.label}
            </Button>
          </motion.div>
        )}
      </div>

      {/* People Drawer */}
      <Drawer
        anchor="bottom"
        open={showPeopleDrawer}
        onClose={() => setShowPeopleDrawer(false)}
        PaperProps={{
          style: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "80vh",
          },
        }}
      >
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Nearby People</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {sortedUsers.length} {sortedUsers.length === 1 ? "person" : "people"} nearby
              </p>
            </div>
            <button
              onClick={() => setShowPeopleDrawer(false)}
              className="p-2 hover:bg-accent rounded-full transition-colors touch-target"
            >
              <CloseIcon style={{ fontSize: 24 }} className="text-muted-foreground" />
            </button>
          </div>

          {/* Activity Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActivityFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activityFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-elevation-2"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              All Activities ({nearbyUsers.length})
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActivityFilter("running")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                activityFilter === "running"
                  ? "bg-success text-success-foreground shadow-elevation-2"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <DirectionsRunIcon style={{ fontSize: 18 }} />
              Running ({nearbyUsers.filter(u => u.activity === "Running").length})
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActivityFilter("cycling")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                activityFilter === "cycling"
                  ? "bg-primary text-primary-foreground shadow-elevation-2"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <DirectionsBikeIcon style={{ fontSize: 18 }} />
              Cycling ({nearbyUsers.filter(u => u.activity === "Cycling").length})
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActivityFilter("walking")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                activityFilter === "walking"
                  ? "bg-warning text-warning-foreground shadow-elevation-2"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <DirectionsWalkIcon style={{ fontSize: 18 }} />
              Walking ({nearbyUsers.filter(u => u.activity === "Walking").length})
            </motion.button>
          </div>

          {/* Users List */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {sortedUsers.length === 0 ? (
              <div className="text-center py-12">
                <PeopleIcon style={{ fontSize: 64 }} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No users found</p>
                <p className="text-xs text-muted-foreground mt-1">Try changing the activity filter</p>
              </div>
            ) : (
              sortedUsers.map((user, index) => {
                const userFriendStatus = getFriendStatus(user.id);
                
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-2xl shadow-elevation-2 border border-border/50 overflow-hidden cursor-pointer hover:shadow-elevation-3 transition-all"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowProfileView(true);
                      setShowPeopleDrawer(false);
                    }}
                  >
                    <div className="p-4">
                      {/* User Info */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="relative flex-shrink-0">
                          <Avatar 
                            src={user.avatar} 
                            alt={user.name} 
                            sx={{ width: 56, height: 56 }}
                          />
                          {/* Activity Badge */}
                          <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full ${
                            user.activity === "Running"
                              ? "bg-success"
                              : user.activity === "Cycling"
                              ? "bg-primary"
                              : "bg-warning"
                          }`}>
                            {user.activity === "Running" && (
                              <DirectionsRunIcon style={{ fontSize: 14 }} className="text-white" />
                            )}
                            {user.activity === "Cycling" && (
                              <DirectionsBikeIcon style={{ fontSize: 14 }} className="text-white" />
                            )}
                            {user.activity === "Walking" && (
                              <DirectionsWalkIcon style={{ fontSize: 14 }} className="text-white" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base truncate">{user.name}</h3>
                            {userFriendStatus === "friends" && (
                              <div className="flex-shrink-0 px-2 py-0.5 bg-success/10 border border-success rounded-full">
                                <span className="text-xs text-success font-medium">✓ Friend</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              📍 {user.distance} away
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground capitalize">
                              {user.activity}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {/* View Profile Button */}
                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowProfileView(true);
                            setShowPeopleDrawer(false);
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1 h-10 border-2"
                        >
                          View Profile
                        </Button>

                        {/* Send Message Button */}
                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowMessageModal(true);
                            setShowPeopleDrawer(false);
                          }}
                          size="sm"
                          className="flex-1 h-10 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <SendIcon style={{ fontSize: 18 }} className="mr-1.5" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </Drawer>

      {/* Test Notification Button (Demo Only) */}
      <NotificationTestButton />
    </div>
  );
};

export default MapScreen;
