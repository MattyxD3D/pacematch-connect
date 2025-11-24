import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Avatar from "@mui/material/Avatar";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import LogoutIcon from "@mui/icons-material/Logout";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

const Settings = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [username, setUsername] = useState("JohnDoe");
  const [email] = useState("john.doe@example.com");
  const [enabledActivities, setEnabledActivities] = useState({
    running: true,
    cycling: true,
    walking: true,
  });

  const activities = [
    { id: "running", label: "Running", icon: DirectionsRunIcon, color: "success" },
    { id: "cycling", label: "Cycling", icon: DirectionsBikeIcon, color: "primary" },
    { id: "walking", label: "Walking", icon: DirectionsWalkIcon, color: "warning" },
  ] as const;

  const handleVisibilityToggle = () => {
    setIsVisible(!isVisible);
    toast.success(isVisible ? "You're now invisible on the map" : "You're now visible on the map");
  };

  const handleActivityToggle = (activityId: keyof typeof enabledActivities) => {
    setEnabledActivities(prev => ({
      ...prev,
      [activityId]: !prev[activityId],
    }));
    const activityName = activities.find(a => a.id === activityId)?.label;
    toast.success(`${activityName} ${!enabledActivities[activityId] ? 'enabled' : 'disabled'}`);
  };

  const handleSignOut = () => {
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md shadow-elevation-2 sticky top-0 z-10 border-b border-border/50"
      >
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/map")}
            className="touch-target p-2 hover:bg-secondary rounded-xl transition-all duration-200"
          >
            <ArrowBackIcon style={{ fontSize: 28 }} />
          </motion.button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6 space-y-6 pb-10">
        {/* Visibility Toggle - Prominent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="p-6 shadow-elevation-3 border-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <motion.div 
                  animate={isVisible ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`p-4 rounded-2xl transition-all duration-300 ${isVisible ? "bg-success/15 shadow-elevation-1" : "bg-muted"}`}
                >
                  {isVisible ? (
                    <VisibilityIcon className="text-success" style={{ fontSize: 32 }} />
                  ) : (
                    <VisibilityOffIcon className="text-muted-foreground" style={{ fontSize: 32 }} />
                  )}
                </motion.div>
                <div>
                  <h3 className="text-lg font-bold">Show on map</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isVisible ? "Visible to others" : "Hidden from others"}
                  </p>
                </div>
              </div>
              <Switch checked={isVisible} onCheckedChange={handleVisibilityToggle} className="scale-110" />
            </div>
          </Card>
        </motion.div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="p-6 space-y-6 shadow-elevation-2 bg-card/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold">Profile</h2>

            {/* Profile Photo */}
            <div className="flex items-center gap-4">
              <Avatar
                src="https://i.pravatar.cc/150?img=5"
                alt="Profile"
                sx={{ width: 80, height: 80 }}
              />
              <Button variant="outline">Change Photo</Button>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2 h-12 px-4 bg-muted rounded-lg">
                <EmailIcon className="text-muted-foreground" style={{ fontSize: 20 }} />
                <span className="text-sm text-muted-foreground">{email}</span>
              </div>
            </div>

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button onClick={handleSaveProfile} className="w-full h-14 text-base font-semibold shadow-elevation-2">
                Save Changes
              </Button>
            </motion.div>
          </Card>
        </motion.div>

        {/* Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="p-6 space-y-5 shadow-elevation-2 bg-card/50 backdrop-blur-sm">
            <div>
              <h2 className="text-2xl font-bold">Activity Types</h2>
              <p className="text-sm text-muted-foreground mt-1">Select which activities you want to track</p>
            </div>

            <div className="space-y-3">
              {activities.map((activity) => {
                const Icon = activity.icon;
                const isEnabled = enabledActivities[activity.id as keyof typeof enabledActivities];
                
                return (
                  <motion.div
                    key={activity.id}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
                      ${isEnabled 
                        ? activity.color === 'success'
                          ? 'border-success/30 bg-success/10'
                          : activity.color === 'primary'
                          ? 'border-primary/30 bg-primary/10'
                          : 'border-warning/30 bg-warning/10'
                        : 'border-border bg-muted/30'
                      }
                    `}
                    onClick={() => handleActivityToggle(activity.id as keyof typeof enabledActivities)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isEnabled ? activity.color === 'success' ? 'bg-success/20' : activity.color === 'primary' ? 'bg-primary/20' : 'bg-warning/20' : 'bg-muted'}`}>
                        <Icon 
                          className={
                            isEnabled
                              ? activity.color === 'success'
                                ? 'text-success'
                                : activity.color === 'primary'
                                ? 'text-primary'
                                : 'text-warning'
                              : 'text-muted-foreground'
                          }
                          style={{ fontSize: 28 }} 
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{activity.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {isEnabled ? 'Available' : 'Hidden'}
                        </p>
                      </div>
                    </div>
                    <Checkbox 
                      checked={isEnabled}
                      onCheckedChange={() => handleActivityToggle(activity.id as keyof typeof enabledActivities)}
                      className="scale-125"
                    />
                  </motion.div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground px-1">
              Disabled activities will be hidden from your activity selector and won't appear in your profile.
            </p>
          </Card>
        </motion.div>

        {/* Privacy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="p-6 space-y-4 shadow-elevation-2 bg-card/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold">Privacy & Data</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors cursor-pointer">
                <span className="text-sm">Location sharing</span>
                <span className="text-sm text-muted-foreground">On</span>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors cursor-pointer">
                <span className="text-sm">Data usage</span>
                <span className="text-sm text-muted-foreground">Learn more</span>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors cursor-pointer">
                <span className="text-sm">Privacy policy</span>
                <span className="text-sm text-muted-foreground">View</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="p-6 space-y-4 shadow-elevation-2 bg-card/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold">Account</h2>

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSignOut}
                variant="destructive"
                className="w-full h-14 text-base font-semibold shadow-elevation-2"
              >
                <LogoutIcon className="mr-2" style={{ fontSize: 24 }} />
                Sign Out
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
