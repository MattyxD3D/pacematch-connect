import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import Avatar from "@mui/material/Avatar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { updateUserProfile } from "@/services/authService";
import { FitnessLevel, RadiusPreference, VisibilitySettings } from "@/contexts/UserContext";
import { SearchFilter } from "@/services/matchingService";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [activity, setActivity] = useState<"running" | "cycling" | "walking">("running");
  const [gender, setGender] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>("intermediate");
  const [pace, setPace] = useState("");
  const [visibleToAllLevels, setVisibleToAllLevels] = useState(true);
  const [allowedLevels, setAllowedLevels] = useState<FitnessLevel[]>(["beginner", "intermediate", "pro"]);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const [radiusPreference, setRadiusPreference] = useState<RadiusPreference>("normal");
  const [saving, setSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Load existing profile data if available
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const { getUserData } = await import("@/services/authService");
        const userData = await getUserData(user.uid);
        if (userData) {
          if (userData.name) setUsername(userData.name);
          if (userData.activity) setActivity(userData.activity as typeof activity);
          if (userData.gender) setGender(userData.gender);
          if (userData.fitnessLevel) setFitnessLevel(userData.fitnessLevel);
          if (userData.pace) setPace(userData.pace.toString());
          if (userData.visibility) {
            setVisibleToAllLevels(userData.visibility.visibleToAllLevels ?? true);
            setAllowedLevels(userData.visibility.allowedLevels || ["beginner", "intermediate", "pro"]);
          }
          if (userData.searchFilter) setSearchFilter(userData.searchFilter);
          if (userData.radiusPreference) setRadiusPreference(userData.radiusPreference);
        }
      }
    };
    loadProfile();
  }, [user]);

  const handleComplete = async () => {
    if (!user) {
      toast.error("Please sign in first");
      navigate("/");
      return;
    }

    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    setSaving(true);
    try {
      const paceValue = pace ? parseFloat(pace) : null;
      const visibility: VisibilitySettings = {
        visibleToAllLevels: visibleToAllLevels,
        allowedLevels: visibleToAllLevels ? ["beginner", "intermediate", "pro"] : allowedLevels
      };

      await updateUserProfile(user.uid, {
        name: username.trim(),
        activity: activity,
        gender: gender || null,
        fitnessLevel: fitnessLevel,
        pace: paceValue,
        visibility: visibility,
        searchFilter: searchFilter,
        radiusPreference: radiusPreference
      });
      toast.success("Profile created successfully!");
      navigate("/", { replace: true });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const activities = [
    { id: "running", label: "Running", icon: DirectionsRunIcon, color: "success" },
    { id: "cycling", label: "Cycling", icon: DirectionsBikeIcon, color: "primary" },
    { id: "walking", label: "Walking", icon: DirectionsWalkIcon, color: "warning" },
  ];

  const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];
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

  const handleLevelToggle = (level: FitnessLevel) => {
    if (allowedLevels.includes(level)) {
      setAllowedLevels(allowedLevels.filter(l => l !== level));
    } else {
      setAllowedLevels([...allowedLevels, level]);
    }
  };

  const getPaceUnit = () => {
    if (activity === "cycling") return "km/h";
    return "min/km";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground">Step 1 of 1</p>
        </div>

        {/* Profile Photo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex justify-center"
        >
          <Avatar
            sx={{ width: 96, height: 96 }}
            alt="Profile"
            src={user?.photoURL || "https://via.placeholder.com/96"}
          />
        </motion.div>

        {/* Username Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-2"
        >
          <Label htmlFor="username" className="text-base">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-12 text-base"
          />
        </motion.div>

        {/* Activity Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="space-y-3"
        >
          <Label className="text-base">Preferred Activity</Label>
          <div className="grid grid-cols-3 gap-3">
            {activities.map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  onClick={() => setActivity(act.id as typeof activity)}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-300
                    ${
                      activity === act.id
                        ? `border-${act.color} bg-${act.color}/10`
                        : "border-border bg-card hover:bg-secondary"
                    }
                  `}
                >
                  <Icon
                    className={activity === act.id ? `text-${act.color}` : "text-muted-foreground"}
                    style={{ fontSize: 32 }}
                  />
                  <span className={`text-xs mt-2 font-medium ${activity === act.id ? `text-${act.color}` : "text-muted-foreground"}`}>
                    {act.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Gender Selection (Optional) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="space-y-3"
        >
          <Label className="text-base">Gender (Optional)</Label>
          <div className="grid grid-cols-2 gap-3">
            {genderOptions.map((option) => (
              <button
                key={option}
                onClick={() => setGender(option)}
                className={`
                  p-3 rounded-lg border-2 text-sm font-medium transition-all duration-300
                  ${
                    gender === option
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-secondary"
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Fitness Level */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="space-y-2"
        >
          <Label className="text-base">Fitness Level</Label>
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
        </motion.div>

        {/* Pace Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="space-y-2"
        >
          <Label htmlFor="pace" className="text-base">
            Average Pace ({getPaceUnit()}) <span className="text-xs text-muted-foreground">(Optional)</span>
          </Label>
          <Input
            id="pace"
            type="number"
            step="0.1"
            placeholder={`e.g., ${activity === "cycling" ? "25" : "5.5"}`}
            value={pace}
            onChange={(e) => setPace(e.target.value)}
            className="h-12 text-base"
          />
          <p className="text-xs text-muted-foreground">
            {activity === "cycling" 
              ? "Your average cycling speed in km/h" 
              : "Your average pace in minutes per kilometer"}
          </p>
        </motion.div>

        {/* Visibility Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className="space-y-3"
        >
          <Label className="text-base">Who can see you?</Label>
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
        </motion.div>

        {/* Search Filter - Who do you want to find? */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="space-y-2"
        >
          <Label className="text-base">Who do you want to find?</Label>
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
        </motion.div>

        {/* Radius Preference */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.9 }}
          className="space-y-2"
        >
          <Label className="text-base">Search Radius Preference</Label>
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
        </motion.div>

        {/* Complete Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.0 }}
        >
          <Button
            onClick={handleComplete}
            disabled={saving || authLoading}
            className="w-full h-14 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Complete Setup"}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
