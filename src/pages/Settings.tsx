import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Avatar from "@mui/material/Avatar";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import LogoutIcon from "@mui/icons-material/Logout";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

const Settings = () => {
  const navigate = useNavigate();
  const { userProfile, setUserProfile } = useUser();
  const [isVisible, setIsVisible] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [username, setUsername] = useState(userProfile?.username || "");
  const [selectedActivities, setSelectedActivities] = useState<("running" | "cycling" | "walking")[]>(
    userProfile?.activities || ["running"]
  );
  const [gender, setGender] = useState(userProfile?.gender || "");
  const [email] = useState("john.doe@example.com");

  // Privacy controls - users who can/cannot see your location
  const [userPrivacySettings, setUserPrivacySettings] = useState<Record<number, boolean>>({
    1: true,  // Sarah Johnson - visible
    2: true,  // Mike Chen - visible
    3: false, // Emma Davis - hidden
    4: true,  // James Wilson - visible
    5: true,  // Lisa Anderson - visible
  });

  // Mock users list (from conversations/friend requests)
  const connectedUsers = [
    { id: 1, name: "Sarah Johnson", avatar: "https://i.pravatar.cc/150?img=1", activity: "Running" },
    { id: 2, name: "Mike Chen", avatar: "https://i.pravatar.cc/150?img=2", activity: "Cycling" },
    { id: 3, name: "Emma Davis", avatar: "https://i.pravatar.cc/150?img=3", activity: "Walking" },
    { id: 4, name: "James Wilson", avatar: "https://i.pravatar.cc/150?img=4", activity: "Running" },
    { id: 5, name: "Lisa Anderson", avatar: "https://i.pravatar.cc/150?img=5", activity: "Walking" },
  ];

  const activities = [
    { id: "running", label: "Running", icon: DirectionsRunIcon, color: "success" },
    { id: "cycling", label: "Cycling", icon: DirectionsBikeIcon, color: "primary" },
    { id: "walking", label: "Walking", icon: DirectionsWalkIcon, color: "warning" },
  ] as const;

  const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];

  const handleVisibilityToggle = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    toast.success(newVisibility ? "You're now visible on the map" : "You're now invisible on the map");
  };

  const handleUserPrivacyToggle = (userId: number, userName: string) => {
    setUserPrivacySettings(prev => ({
      ...prev,
      [userId]: !prev[userId],
    }));
    const isNowVisible = !userPrivacySettings[userId];
    toast.success(
      isNowVisible
        ? `${userName} can now see your location`
        : `Hidden your location from ${userName}`
    );
  };

  const handleSignOut = () => {
    toast.success("Signed out successfully");
    navigate("/");
  };

  const handleSaveProfile = () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (selectedActivities.length === 0) {
      toast.error("Please select at least one activity");
      return;
    }

    // Update user profile
    setUserProfile({
      username: username.trim(),
      activities: selectedActivities,
      gender: gender || undefined,
    });

    setIsEditingProfile(false);
    toast.success("Profile updated successfully!");
  };

  const handleCancelEdit = () => {
    // Reset to original values
    setUsername(userProfile?.username || "");
    setSelectedActivities(userProfile?.activities || ["running"]);
    setGender(userProfile?.gender || "");
    setIsEditingProfile(false);
  };

  const handleActivityToggle = (activityId: "running" | "cycling" | "walking") => {
    setSelectedActivities(prev => {
      if (prev.includes(activityId)) {
        // Don't allow removing the last activity
        if (prev.length === 1) {
          toast.error("You must have at least one activity selected");
          return prev;
        }
        return prev.filter(a => a !== activityId);
      } else {
        return [...prev, activityId];
      }
    });
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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Profile</h2>
              {!isEditingProfile && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile(true)}
                  className="h-10"
                >
                  Edit Profile
                </Button>
              )}
            </div>

            {!isEditingProfile ? (
              // Display Mode
              <div className="space-y-4">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                  <Avatar
                    src="https://i.pravatar.cc/150?img=5"
                    alt="Profile"
                    sx={{ width: 80, height: 80 }}
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Username</Label>
                  <p className="text-lg font-semibold">{userProfile?.username || "Not set"}</p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <EmailIcon className="text-muted-foreground" style={{ fontSize: 20 }} />
                    <span className="text-base">{email}</span>
                  </div>
                </div>

                {/* Activities */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Activities</Label>
                  <div className="flex gap-2">
                    {userProfile?.activities.map((activity) => {
                      const activityData = activities.find(a => a.id === activity);
                      if (!activityData) return null;
                      const Icon = activityData.icon;
                      return (
                        <div
                          key={activity}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                            activityData.color === 'success'
                              ? 'bg-success/10 text-success'
                              : activityData.color === 'primary'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-warning/10 text-warning'
                          }`}
                        >
                          <Icon style={{ fontSize: 18 }} />
                          <span className="text-sm font-medium">{activityData.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gender */}
                {userProfile?.gender && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Gender</Label>
                    <p className="text-base">{userProfile.gender}</p>
                  </div>
                )}
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                  <Avatar
                    src="https://i.pravatar.cc/150?img=5"
                    alt="Profile"
                    sx={{ width: 80, height: 80 }}
                  />
                  <Button variant="outline" size="sm">Change Photo</Button>
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

                {/* Activities */}
                <div className="space-y-3">
                  <Label>Activities</Label>
                  <div className="space-y-2">
                    {activities.map((activity) => {
                      const Icon = activity.icon;
                      const isSelected = selectedActivities.includes(activity.id as "running" | "cycling" | "walking");
                      
                      return (
                        <motion.div
                          key={activity.id}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer
                            ${isSelected 
                              ? activity.color === 'success'
                                ? 'border-success/30 bg-success/10'
                                : activity.color === 'primary'
                                ? 'border-primary/30 bg-primary/10'
                                : 'border-warning/30 bg-warning/10'
                              : 'border-border bg-muted/30'
                            }
                          `}
                          onClick={() => handleActivityToggle(activity.id as "running" | "cycling" | "walking")}
                        >
                          <div className="flex items-center gap-3">
                            <Icon 
                              className={
                                isSelected
                                  ? activity.color === 'success'
                                    ? 'text-success'
                                    : activity.color === 'primary'
                                    ? 'text-primary'
                                    : 'text-warning'
                                  : 'text-muted-foreground'
                              }
                              style={{ fontSize: 24 }} 
                            />
                            <span className="font-medium">{activity.label}</span>
                          </div>
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleActivityToggle(activity.id as "running" | "cycling" | "walking")}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-3">
                  <Label>Gender <span className="text-muted-foreground text-sm font-normal">(Optional)</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    {genderOptions.map((option) => (
                      <motion.button
                        key={option}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setGender(option)}
                        className={`
                          p-3 rounded-xl border-2 text-sm font-semibold transition-all duration-300
                          ${
                            gender === option
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-foreground hover:bg-secondary"
                          }
                        `}
                      >
                        {option}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="flex-1 h-12"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    className="flex-1 h-12 font-semibold"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
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
              <h2 className="text-2xl font-bold">Your Activities</h2>
              <p className="text-sm text-muted-foreground mt-1">Select activities you want to track</p>
            </div>

            <div className="space-y-3">
              {activities.map((activity) => {
                const Icon = activity.icon;
                const isSelected = selectedActivities.includes(activity.id as "running" | "cycling" | "walking");
                
                return (
                  <motion.div
                    key={activity.id}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
                      ${isSelected 
                        ? activity.color === 'success'
                          ? 'border-success/30 bg-success/10'
                          : activity.color === 'primary'
                          ? 'border-primary/30 bg-primary/10'
                          : 'border-warning/30 bg-warning/10'
                        : 'border-border bg-muted/30'
                      }
                    `}
                    onClick={() => handleActivityToggle(activity.id as "running" | "cycling" | "walking")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? activity.color === 'success' ? 'bg-success/20' : activity.color === 'primary' ? 'bg-primary/20' : 'bg-warning/20' : 'bg-muted'}`}>
                        <Icon 
                          className={
                            isSelected
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
                          {isSelected ? 'Active' : 'Not selected'}
                        </p>
                      </div>
                    </div>
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => handleActivityToggle(activity.id as "running" | "cycling" | "walking")}
                      className="scale-125"
                    />
                  </motion.div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground px-1">
              Selected activities will appear in your activity selector on the map screen. You must have at least one activity selected.
            </p>
          </Card>
        </motion.div>

        {/* Gender Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card className="p-6 space-y-4 shadow-elevation-2 bg-card/50 backdrop-blur-sm">
            <div>
              <h2 className="text-2xl font-bold">Gender</h2>
              <p className="text-sm text-muted-foreground mt-1">Optional</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {genderOptions.map((option) => (
                <motion.button
                  key={option}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setGender(option)}
                  className={`
                    p-4 rounded-xl border-2 text-sm font-semibold transition-all duration-300
                    ${
                      gender === option
                        ? "border-primary bg-primary/10 text-primary shadow-elevation-1"
                        : "border-border bg-card text-foreground hover:bg-secondary hover:border-muted"
                    }
                  `}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Privacy Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="p-6 space-y-5 shadow-elevation-2 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <LockIcon className="text-primary" style={{ fontSize: 24 }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Privacy Controls</h2>
                <p className="text-sm text-muted-foreground">Manage who can see your location</p>
              </div>
            </div>

            {connectedUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No connected users yet</p>
                <p className="text-xs mt-1">Send messages or add friends to manage privacy</p>
              </div>
            ) : (
              <div className="space-y-3">
                {connectedUsers.map((user, index) => {
                  const isVisible = userPrivacySettings[user.id] ?? true;

                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-xl border-2 border-border bg-background/50 hover:bg-accent/50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar
                          src={user.avatar}
                          alt={user.name}
                          sx={{ width: 48, height: 48 }}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {user.activity === "Running" && "🏃"}
                            {user.activity === "Cycling" && "🚴"}
                            {user.activity === "Walking" && "🚶"}
                            <span>{user.activity}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className={`text-xs font-medium ${
                            isVisible ? "text-success" : "text-muted-foreground"
                          }`}>
                            {isVisible ? "Visible" : "Hidden"}
                          </p>
                        </div>
                        <Switch
                          checked={isVisible}
                          onCheckedChange={() => handleUserPrivacyToggle(user.id, user.name)}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 px-1">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <LockIcon style={{ fontSize: 14 }} className="inline mr-1 text-muted-foreground/70" />
                Users you've hidden from won't see your location on the map. They can still send you messages.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Privacy & Data Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
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
