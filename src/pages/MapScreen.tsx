import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import ExploreIcon from "@mui/icons-material/Explore";
import PeopleIcon from "@mui/icons-material/People";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import SettingsIcon from "@mui/icons-material/Settings";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import MailIcon from "@mui/icons-material/Mail";
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
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

type FriendStatus = "not_friends" | "request_pending" | "request_received" | "friends" | "denied";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";

const MapScreen = () => {
  const navigate = useNavigate();
  const { userProfile, hasActivity } = useUser();
  const { addNotification, unreadMessageCount, unreadFriendRequestCount } = useNotificationContext();
  const [isActive, setIsActive] = useState(false);
  const [showPeopleDrawer, setShowPeopleDrawer] = useState(false);
  const [pointsTracked, setPointsTracked] = useState(0);
  const [distance, setDistance] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  
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

  // Manage tracking interval
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setDistance(prev => prev + 0.1);
        setPointsTracked(prev => prev + 1);
      }, 2000);
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
  }, [isActive]);

  const handleStartStop = () => {
    if (!isActive) {
      toast.success("Activity started! GPS tracking enabled.");
      setIsActive(true);
      setShowNotification(false);
    } else {
      toast.success(`Activity stopped. Great workout! ${distance.toFixed(1)} km tracked.`);
      setIsActive(false);
      setPointsTracked(0);
      setDistance(0);
    }
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
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute top-4 left-4 z-10"
          >
            <div className={`
              bg-gradient-to-r px-5 py-4 rounded-2xl shadow-elevation-4 flex items-center gap-3 border-2
              ${selectedActivity === 'running' 
                ? 'from-success to-success/90 text-success-foreground border-success-foreground/20'
                : selectedActivity === 'cycling'
                ? 'from-primary to-primary/90 text-primary-foreground border-primary-foreground/20'
                : 'from-warning to-warning/90 text-warning-foreground border-warning-foreground/20'
              }
            `}>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {selectedActivity === 'running' && <DirectionsRunIcon style={{ fontSize: 28 }} />}
                {selectedActivity === 'cycling' && <DirectionsBikeIcon style={{ fontSize: 28 }} />}
                {selectedActivity === 'walking' && <DirectionsWalkIcon style={{ fontSize: 28 }} />}
              </motion.div>
              <div className="flex flex-col">
                <span className="text-sm font-bold">Activity Active</span>
                <span className="text-xs opacity-90 font-medium">{distance.toFixed(1)} km • {pointsTracked} points</span>
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

        {/* Start/Stop Activity Button */}
        <motion.div 
          whileTap={{ scale: 0.97 }}
          animate={!isActive ? { scale: [1, 1.01, 1] } : {}}
          transition={!isActive ? { duration: 2, repeat: Infinity, repeatDelay: 3 } : {}}
        >
          <Button
            onClick={handleStartStop}
            className={`
              w-full h-16 text-lg font-extrabold shadow-elevation-4 transition-all duration-300 rounded-2xl
              ${
                isActive
                  ? "bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground hover:from-destructive/90 hover:to-destructive"
                  : selectedActivity === 'running'
                  ? "bg-gradient-to-r from-success to-success/90 text-success-foreground hover:from-success/90 hover:to-success"
                  : selectedActivity === 'cycling'
                  ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary"
                  : "bg-gradient-to-r from-warning to-warning/90 text-warning-foreground hover:from-warning/90 hover:to-warning"
              }
            `}
          >
            {isActive ? (
              <>
                <StopIcon className="mr-3" style={{ fontSize: 32 }} />
                Stop Activity
              </>
            ) : (
              <>
                <PlayArrowIcon className="mr-3" style={{ fontSize: 32 }} />
                Start {availableActivities.find(a => a.id === selectedActivity)?.label}
              </>
            )}
          </Button>
        </motion.div>
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
