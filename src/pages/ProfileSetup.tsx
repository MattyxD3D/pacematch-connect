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
  const [selectedActivities, setSelectedActivities] = useState<("running" | "cycling" | "walking" | string)[]>(["running"]);
  const [customActivity, setCustomActivity] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
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
          // Load activities - support both old single activity and new array format
          if (userData.activities && Array.isArray(userData.activities)) {
            setSelectedActivities(userData.activities);
          } else if (userData.activity) {
            setSelectedActivities([userData.activity as "running" | "cycling" | "walking"]);
          }
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
      // Ensure at least one activity is selected
      if (selectedActivities.length === 0) {
        toast.error("Please select at least one preferred activity");
        setSaving(false);
        return;
      }

      const paceValue = pace ? parseFloat(pace) : null;
      const visibility: VisibilitySettings = {
        visibleToAllLevels: visibleToAllLevels,
        allowedLevels: visibleToAllLevels ? ["beginner", "intermediate", "pro"] : allowedLevels
      };

      // Get primary activity (first selected, or running if available, otherwise first)
      const primaryActivity = selectedActivities.find(a => ["running", "cycling", "walking"].includes(a)) as "running" | "cycling" | "walking" || selectedActivities[0] as "running" | "cycling" | "walking" || "running";

      await updateUserProfile(user.uid, {
        name: username.trim(),
        activity: primaryActivity, // Keep for backward compatibility (use first standard activity or first selected)
        activities: selectedActivities.filter(a => a.trim() !== "") as ("running" | "cycling" | "walking")[], // Save as array
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
  const fitnessLevelOptions: { value: FitnessLevel; label: string; description: string; color: string; bgColor: string; borderColor: string }[] = [
    { 
      value: "beginner", 
      label: "Beginner", 
      description: "Just starting out or getting back into fitness. You're building a foundation and learning the basics.",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    { 
      value: "intermediate", 
      label: "Intermediate", 
      description: "Regular exerciser with a consistent routine. You can handle moderate workouts and are comfortable with your activity.",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/30",
      borderColor: "border-green-200 dark:border-green-800"
    },
    { 
      value: "pro", 
      label: "Pro", 
      description: "Advanced athlete with high performance goals. You train regularly at high intensity and push your limits.",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
      borderColor: "border-purple-200 dark:border-purple-800"
    }
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

  const handleActivityToggle = (activityId: "running" | "cycling" | "walking") => {
    if (selectedActivities.includes(activityId)) {
      setSelectedActivities(selectedActivities.filter(a => a !== activityId));
    } else {
      setSelectedActivities([...selectedActivities, activityId]);
    }
  };

  const handleAddCustomActivity = () => {
    if (customActivity.trim() && !selectedActivities.includes(customActivity.trim())) {
      setSelectedActivities([...selectedActivities, customActivity.trim()]);
      setCustomActivity("");
      setShowCustomInput(false);
    }
  };

  const handleRemoveActivity = (activityToRemove: string) => {
    setSelectedActivities(selectedActivities.filter(a => a !== activityToRemove));
  };

  const hasRunning = selectedActivities.includes("running");

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
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || 'User')}&size=96`}
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
          <Label className="text-base">Preferred Activities</Label>
          <div className="grid grid-cols-3 gap-3">
            {activities.map((act) => {
              const Icon = act.icon;
              const isSelected = selectedActivities.includes(act.id);
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => handleActivityToggle(act.id)}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-300 relative
                    ${
                      isSelected
                        ? `border-${act.color} bg-${act.color}/10`
                        : "border-border bg-card hover:bg-secondary"
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <Icon
                    className={isSelected ? `text-${act.color}` : "text-muted-foreground"}
                    style={{ fontSize: 32 }}
                  />
                  <span className={`text-xs mt-2 font-medium ${isSelected ? `text-${act.color}` : "text-muted-foreground"}`}>
                    {act.label}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Custom Activity Input */}
          <div className="space-y-2">
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="w-full p-3 rounded-lg border-2 border-dashed border-border bg-card hover:bg-secondary text-muted-foreground text-sm font-medium transition-all"
              >
                + Add Other Activity
              </button>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter activity name"
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomActivity();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddCustomActivity}
                  disabled={!customActivity.trim()}
                  variant="outline"
                >
                  Add
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowCustomInput(false);
                    setCustomActivity("");
                  }}
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Display Selected Custom Activities */}
          {selectedActivities.filter(a => !["running", "cycling", "walking"].includes(a)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedActivities
                .filter(a => !["running", "cycling", "walking"].includes(a))
                .map((activity) => (
                  <div
                    key={activity}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
                  >
                    <span className="text-sm font-medium text-primary">{activity}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(activity)}
                      className="text-primary hover:text-primary/70 text-sm font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>
          )}
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
          className="space-y-3"
        >
          <Label className="text-base">Fitness Level</Label>
          <div className="space-y-3">
            {fitnessLevelOptions.map((option) => {
              const isSelected = fitnessLevel === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setFitnessLevel(option.value)}
                  className={`
                    w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-300 text-left
                    ${isSelected 
                      ? `${option.bgColor} ${option.borderColor} ring-2 ring-offset-2 ring-current` 
                      : 'border-border bg-card hover:bg-secondary'
                    }
                  `}
                >
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                    option.value === "beginner" ? "bg-blue-500" :
                    option.value === "intermediate" ? "bg-green-500" :
                    "bg-purple-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className={`font-bold text-base block ${isSelected ? option.color : 'text-foreground'}`}>
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed block mt-1">
                      {option.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Choose the level that best matches your current fitness and training intensity.
          </p>
        </motion.div>

        {/* Pace Input - Only show if running is selected */}
        {hasRunning && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="space-y-2"
          >
            <Label htmlFor="pace" className="text-base">
              Average Pace (min/km) <span className="text-xs text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="pace"
              type="number"
              step="0.1"
              placeholder="e.g., 5.5"
              value={pace}
              onChange={(e) => setPace(e.target.value)}
              className="h-12 text-base"
            />
            <p className="text-xs text-muted-foreground">
              Your average running pace in minutes per kilometer
            </p>
          </motion.div>
        )}

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
            <div className="space-y-3 pl-6 mt-3">
              <Label className="text-sm text-muted-foreground block mb-2">Select allowed levels:</Label>
              <div className="space-y-2">
                {fitnessLevelOptions.map((option) => (
                  <div 
                    key={option.value} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      allowedLevels.includes(option.value) 
                        ? `${option.bgColor} ${option.borderColor}` 
                        : 'border-border/50 bg-card'
                    }`}
                    onClick={() => handleLevelToggle(option.value)}
                  >
                    <Checkbox
                      id={`level-${option.value}`}
                      checked={allowedLevels.includes(option.value)}
                      onCheckedChange={() => handleLevelToggle(option.value)}
                      className="flex-shrink-0"
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        option.value === "beginner" ? "bg-blue-500" :
                        option.value === "intermediate" ? "bg-green-500" :
                        "bg-purple-500"
                      }`} />
                      <Label 
                        htmlFor={`level-${option.value}`} 
                        className={`text-sm font-medium cursor-pointer flex-1 ${
                          allowedLevels.includes(option.value) ? option.color : 'text-foreground'
                        }`}
                      >
                        {option.label}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
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
