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
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
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
import { updateUserVisibility } from "@/services/locationService";
import { updateUserProfile, signOut, getUserData } from "@/services/authService";

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [activity, setActivity] = useState<string | null>(null);
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>("intermediate");
  const [pace, setPace] = useState("");
  const [visibleToAllLevels, setVisibleToAllLevels] = useState(true);
  const [allowedLevels, setAllowedLevels] = useState<FitnessLevel[]>(["beginner", "intermediate", "pro"]);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const [radiusPreference, setRadiusPreference] = useState<RadiusPreference>("normal");
  const [saving, setSaving] = useState(false);
  const [isEditingMatching, setIsEditingMatching] = useState(false);


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
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${
                      fitnessLevel === "beginner" ? "bg-blue-500" :
                      fitnessLevel === "intermediate" ? "bg-green-500" :
                      "bg-purple-500"
                    }`} />
                    <p className={`text-lg font-semibold capitalize ${
                      fitnessLevel === "beginner" ? "text-blue-600 dark:text-blue-400" :
                      fitnessLevel === "intermediate" ? "text-green-600 dark:text-green-400" :
                      "text-purple-600 dark:text-purple-400"
                    }`}>
                      {fitnessLevel}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fitnessLevelOptions.find(opt => opt.value === fitnessLevel)?.description}
                  </p>
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
                      <div className="flex items-center gap-2">
                        {fitnessLevel && (
                          <div className={`w-3 h-3 rounded-full ${
                            fitnessLevel === "beginner" ? "bg-blue-500" :
                            fitnessLevel === "intermediate" ? "bg-green-500" :
                            "bg-purple-500"
                          }`} />
                        )}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {fitnessLevelOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value} 
                          className="py-3 cursor-pointer focus:bg-transparent"
                        >
                          <div className={`flex flex-col gap-1 p-3 rounded-lg border-2 transition-all ${option.bgColor} ${option.borderColor} ${fitnessLevel === option.value ? 'ring-2 ring-offset-2 ring-current' : ''}`}>
                            <span className={`font-bold text-base ${option.color}`}>{option.label}</span>
                            <span className="text-xs text-muted-foreground leading-relaxed">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose the level that best matches your current fitness and training intensity.
                  </p>
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
                        <div 
                          key={option.value} 
                          className={`flex items-center space-x-3 p-2 rounded-lg border transition-all ${
                            allowedLevels.includes(option.value) 
                              ? `${option.bgColor} ${option.borderColor} border-2` 
                              : 'border-border/50'
                          }`}
                        >
                          <Checkbox
                            id={`level-${option.value}`}
                            checked={allowedLevels.includes(option.value)}
                            onCheckedChange={() => handleLevelToggle(option.value)}
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${
                              option.value === "beginner" ? "bg-blue-500" :
                              option.value === "intermediate" ? "bg-green-500" :
                              "bg-purple-500"
                            }`} />
                            <Label 
                              htmlFor={`level-${option.value}`} 
                              className={`text-sm font-medium cursor-pointer ${
                                allowedLevels.includes(option.value) ? option.color : ''
                              }`}
                            >
                              {option.label}
                            </Label>
                          </div>
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
