import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import ThreeDRotationIcon from "@mui/icons-material/ThreeDRotation";
import ExploreIcon from "@mui/icons-material/Explore";
import PeopleIcon from "@mui/icons-material/People";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import SettingsIcon from "@mui/icons-material/Settings";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import { Drawer } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import { toast } from "sonner";
import { NotificationBanner } from "@/components/NotificationBanner";

const MapScreen = () => {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [showPeopleDrawer, setShowPeopleDrawer] = useState(false);
  const [pointsTracked, setPointsTracked] = useState(0);
  const [distance, setDistance] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<"running" | "cycling" | "walking">("running");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const activities = [
    { id: "running", label: "Running", icon: DirectionsRunIcon, color: "success" },
    { id: "cycling", label: "Cycling", icon: DirectionsBikeIcon, color: "primary" },
    { id: "walking", label: "Walking", icon: DirectionsWalkIcon, color: "warning" },
  ] as const;

  // Mock data for nearby users
  const nearbyUsers = [
    { id: 1, name: "Sarah Johnson", distance: "0.3 km", activity: "Running", avatar: "https://i.pravatar.cc/150?img=1" },
    { id: 2, name: "Mike Chen", distance: "0.5 km", activity: "Cycling", avatar: "https://i.pravatar.cc/150?img=2" },
    { id: 3, name: "Emma Davis", distance: "0.8 km", activity: "Walking", avatar: "https://i.pravatar.cc/150?img=3" },
  ];

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

  const handleToggle3D = () => {
    setIs3DMode(!is3DMode);
    toast.info(is3DMode ? "Switched to 2D view" : "Switched to 3D view");
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-muted">
      {/* Map Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-success/5 to-warning/10">
        <div className="flex items-center justify-center h-full">
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
        {/* 3D View Toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle3D}
          className={`
            touch-target rounded-full shadow-elevation-3 transition-all duration-300
            ${is3DMode ? "bg-purple text-purple-foreground" : "bg-primary text-primary-foreground"}
          `}
          style={{ width: 56, height: 56 }}
        >
          <ThreeDRotationIcon style={{ fontSize: 28 }} />
        </motion.button>

        {/* Compass/Reset (3D mode only) */}
        <AnimatePresence>
          {is3DMode && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.95 }}
              className="touch-target bg-warning text-warning-foreground rounded-full shadow-elevation-3"
              style={{ width: 56, height: 56 }}
            >
              <ExploreIcon style={{ fontSize: 28 }} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* People List */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPeopleDrawer(true)}
          className="relative touch-target bg-primary text-primary-foreground rounded-full shadow-elevation-3"
          style={{ width: 56, height: 56 }}
        >
          <PeopleIcon style={{ fontSize: 28 }} />
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {nearbyUsers.length}
          </span>
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

      {/* Activity Badge (Top Left) */}
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
              <div className="grid grid-cols-3 gap-3">
                {activities.map((act) => {
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

        {/* 3D Controls (3D mode only) */}
        <AnimatePresence>
          {is3DMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-4 bg-card/90 backdrop-blur-sm rounded-2xl p-4 shadow-elevation-3"
            >
              <p className="text-sm font-medium mb-2">3D Controls</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Tilt ↕</Button>
                <Button variant="outline" size="sm">Rotate ↺</Button>
                <Button variant="outline" size="sm">Reset</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                Start {activities.find(a => a.id === selectedActivity)?.label}
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
            maxHeight: "70vh",
          },
        }}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Nearby People</h2>
            <button
              onClick={() => setShowPeopleDrawer(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {nearbyUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-4 bg-card rounded-xl shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-300"
              >
                <Avatar src={user.avatar} alt={user.name} sx={{ width: 56, height: 56 }} />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.distance} away • {user.activity}</p>
                </div>
                <Button variant="outline" size="sm">
                  <MyLocationIcon style={{ fontSize: 20 }} className="mr-1" />
                  Center
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default MapScreen;
