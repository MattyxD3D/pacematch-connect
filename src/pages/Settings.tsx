import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { FitnessLevel, RadiusPreference, VisibilitySettings } from "@/contexts/UserContext";
import { SearchFilter } from "@/services/matchingService";
import { useUser } from "@/contexts/UserContext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Avatar from "@mui/material/Avatar";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LockIcon from "@mui/icons-material/Lock";
import EmailIcon from "@mui/icons-material/Email";
import LogoutIcon from "@mui/icons-material/Logout";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import HistoryIcon from "@mui/icons-material/History";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PeopleIcon from "@mui/icons-material/People";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { updateUserVisibility, updateUserLocation } from "@/services/locationService";
import { updateUserProfile, signOut, getUserData } from "@/services/authService";

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [activity, setActivity] = useState<string | null>(null);
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>("intermediate");
  const [pace, setPace] = useState("");
  const [visibleToAllLevels, setVisibleToAllLevels] = useState(true);
  const [allowedLevels, setAllowedLevels] = useState<FitnessLevel[]>(["beginner", "intermediate", "pro"]);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const [radiusPreference, setRadiusPreference] = useState<RadiusPreference>("normal");
  const [saving, setSaving] = useState(false);
  const [isEditingMatching, setIsEditingMatching] = useState(false);

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        const userData = await getUserData(user.uid);
        if (userData) {
          setUsername(userData.name || "");
          setEmail(userData.email || "");
          setActivity(userData.activity || null);
          setIsVisible(userData.visible !== false); // Default to true if not set
          setFitnessLevel(userData.fitnessLevel || "intermediate");
          setPace(userData.pace ? userData.pace.toString() : "");
          if (userData.visibility) {
            setVisibleToAllLevels(userData.visibility.visibleToAllLevels ?? true);
            setAllowedLevels(userData.visibility.allowedLevels || ["beginner", "intermediate", "pro"]);
          }
          setSearchFilter(userData.searchFilter || "all");
          setRadiusPreference(userData.radiusPreference || "normal");
        }
      }
    };
    loadUserData();
  }, [user]);

  const handleVisibilityToggle = async () => {
    if (!user) return;
    
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    
    try {
      await updateUserVisibility(user.uid, newVisibility);
      toast.success(newVisibility ? "You're now visible on the map" : "You're now invisible on the map");
    } catch (error: any) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility. Please try again.");
      setIsVisible(!newVisibility); // Revert on error
    }
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

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        name: username.trim()
      });
      setIsEditingProfile(false);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original values from user data
    if (user) {
      getUserData(user.uid).then(userData => {
        if (userData) {
          setUsername(userData.name || "");
        }
      });
    }
    setIsEditingProfile(false);
  };

  const handleSaveMatching = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const paceValue = pace ? parseFloat(pace) : null;
      const visibility: VisibilitySettings = {
        visibleToAllLevels: visibleToAllLevels,
        allowedLevels: visibleToAllLevels ? ["beginner", "intermediate", "pro"] : allowedLevels
      };

      await updateUserProfile(user.uid, {
        fitnessLevel: fitnessLevel,
        pace: paceValue,
        visibility: visibility,
        searchFilter: searchFilter,
        radiusPreference: radiusPreference
      });
      setIsEditingMatching(false);
      toast.success("Matching preferences updated successfully!");
    } catch (error: any) {
      console.error("Error saving matching preferences:", error);
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLevelToggle = (level: FitnessLevel) => {
    if (allowedLevels.includes(level)) {
      setAllowedLevels(allowedLevels.filter(l => l !== level));
    } else {
      setAllowedLevels([...allowedLevels, level]);
    }
  };

  const fitnessLevelOptions: { value: FitnessLevel; label: string }[] = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "pro", label: "Pro" }
  ];

  const radiusOptions: { value: RadiusPreference; label: string }[] = [
    { value: "nearby", label: "Nearby" },
    { value: "normal", label: "Normal" },
    { value: "wide", label: "Wide" }
  ];

  const searchFilterOptions: { value: SearchFilter; label: string }[] = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "pro", label: "Pro" }
  ];

  const getPaceUnit = () => {
    if (activity === "cycling") return "km/h";
    return "min/km";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md shadow-elevation-2 sticky top-0 z-10 border-b border-border/50"
      >
        <div className="max-w-2xl mx-auto px-6 py-5">
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

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="p-4 shadow-elevation-2 bg-card/50 backdrop-blur-sm space-y-2">
            <button
              onClick={() => navigate("/edit-profile")}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-accent transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <DirectionsRunIcon className="text-primary" style={{ fontSize: 24 }} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold">Edit Profile</h3>
                  <p className="text-xs text-muted-foreground">Update your profile information</p>
                </div>
              </div>
              <ChevronRightIcon className="text-muted-foreground" />
            </button>
            <button
              onClick={() => navigate("/workout-history")}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-accent transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-success/10">
                  <HistoryIcon className="text-success" style={{ fontSize: 24 }} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold">Workout History</h3>
                  <p className="text-xs text-muted-foreground">View all your past workouts</p>
                </div>
              </div>
              <ChevronRightIcon className="text-muted-foreground" />
            </button>
            <button
              onClick={() => navigate("/friends")}
              className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-accent transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-warning/10">
                  <PeopleIcon className="text-warning" style={{ fontSize: 24 }} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold">Friends</h3>
                  <p className="text-xs text-muted-foreground">Manage your connections</p>
                </div>
              </div>
              <ChevronRightIcon className="text-muted-foreground" />
            </button>
          </Card>
        </motion.div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
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
                    src={user?.photoURL || "https://via.placeholder.com/80"}
                    alt="Profile"
                    sx={{ width: 80, height: 80 }}
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Username</Label>
                  <p className="text-lg font-semibold">{username || "Not set"}</p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <EmailIcon className="text-muted-foreground" style={{ fontSize: 20 }} />
                    <span className="text-base">{email}</span>
                  </div>
                </div>

                {/* Activity */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Activity</Label>
                  {activity ? (
                    <div className="flex gap-2 flex-wrap">
                      {(() => {
                        const activityData = activities.find(a => a.id === activity);
                        if (!activityData) return null;
                        const Icon = activityData.icon;
                        return (
                          <div
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
                      })()}
                    </div>
                  ) : (
                    <p className="text-base text-muted-foreground">Not set</p>
                  )}
                </div>

              </div>
            ) : (
              // Edit Mode
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                  <Avatar
                    src={user?.photoURL || "https://via.placeholder.com/80"}
                    alt="Profile"
                    sx={{ width: 80, height: 80 }}
                  />
                  <Button variant="outline" size="sm" disabled>Change Photo</Button>
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
                    disabled={saving || authLoading}
                    className="flex-1 h-12 font-semibold"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Matching Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card className="p-6 space-y-6 shadow-elevation-2 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Matching Preferences</h2>
              {!isEditingMatching && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditingMatching(true)}
                  className="h-10"
                >
                  Edit Preferences
                </Button>
              )}
            </div>

            {!isEditingMatching ? (
              // Display Mode
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Fitness Level</Label>
                  <p className="text-lg font-semibold capitalize">{fitnessLevel}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Average Pace</Label>
                  <p className="text-lg font-semibold">
                    {pace ? `${pace} ${getPaceUnit()}` : "Not set"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Visibility</Label>
                  <p className="text-lg font-semibold">
                    {visibleToAllLevels ? "Visible to all levels" : `Visible to: ${allowedLevels.join(", ")}`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Search Filter</Label>
                  <p className="text-lg font-semibold capitalize">
                    {searchFilter === "all" ? "All Levels" : searchFilter}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Search Radius</Label>
                  <p className="text-lg font-semibold capitalize">{radiusPreference}</p>
                </div>
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Fitness Level</Label>
                  <Select value={fitnessLevel} onValueChange={(value) => setFitnessLevel(value as FitnessLevel)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fitnessLevelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pace">
                    Average Pace ({getPaceUnit()}) <span className="text-xs text-muted-foreground">(Optional)</span>
                  </Label>
                  <Input
                    id="pace"
                    type="number"
                    step="0.1"
                    placeholder={`e.g., ${activity === "cycling" ? "25" : "5.5"}`}
                    value={pace}
                    onChange={(e) => setPace(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Who can see you?</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="visibleToAll"
                      checked={visibleToAllLevels}
                      onCheckedChange={(checked) => {
                        setVisibleToAllLevels(checked as boolean);
                        if (checked) {
                          setAllowedLevels(["beginner", "intermediate", "pro"]);
                        }
                      }}
                    />
                    <Label htmlFor="visibleToAll" className="text-sm font-normal cursor-pointer">
                      Visible to all fitness levels
                    </Label>
                  </div>
                  
                  {!visibleToAllLevels && (
                    <div className="space-y-2 pl-6">
                      <Label className="text-sm text-muted-foreground">Select allowed levels:</Label>
                      {fitnessLevelOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`level-${option.value}`}
                            checked={allowedLevels.includes(option.value)}
                            onCheckedChange={() => handleLevelToggle(option.value)}
                          />
                          <Label htmlFor={`level-${option.value}`} className="text-sm font-normal cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Who do you want to find?</Label>
                  <Select value={searchFilter} onValueChange={(value) => setSearchFilter(value as SearchFilter)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {searchFilterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Filter matches by fitness level. You can change this anytime on the map.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Search Radius Preference</Label>
                  <Select value={radiusPreference} onValueChange={(value) => setRadiusPreference(value as RadiusPreference)}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {radiusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Controls how far the app searches for matches
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingMatching(false);
                      // Reset values
                      if (user) {
                        getUserData(user.uid).then(userData => {
                          if (userData) {
                            setFitnessLevel(userData.fitnessLevel || "intermediate");
                            setPace(userData.pace ? userData.pace.toString() : "");
                            if (userData.visibility) {
                              setVisibleToAllLevels(userData.visibility.visibleToAllLevels ?? true);
                              setAllowedLevels(userData.visibility.allowedLevels || ["beginner", "intermediate", "pro"]);
                            }
                            setSearchFilter(userData.searchFilter || "all");
                            setRadiusPreference(userData.radiusPreference || "normal");
                          }
                        });
                      }
                    }}
                    className="flex-1 h-12"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveMatching}
                    disabled={saving || authLoading}
                    className="flex-1 h-12 font-semibold"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
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
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Card className="p-6 space-y-4 shadow-elevation-2 bg-card/50 backdrop-blur-sm">
            <h2 className="text-2xl font-bold">Privacy & Data</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors cursor-pointer">
                <p className="font-medium text-foreground">Data Download</p>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">Request</Button>
              </div>
              <div className="flex items-center justify-between p-3 hover:bg-secondary rounded-lg transition-colors cursor-pointer">
                <p className="font-medium text-foreground">Delete Account</p>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Delete</Button>
              </div>
            </div>

            <div className="pt-2 px-1">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your privacy is important. You can download your data or delete your account at any time.
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full h-14 text-base font-semibold border-2 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all"
          >
            <LogoutIcon className="mr-2" style={{ fontSize: 24 }} />
            Sign Out
          </Button>
        </motion.div>
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default Settings;
