import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getUserData, updateUserProfile } from "@/services/authService";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, setUserProfile } = useUser();
  
  const [username, setUsername] = useState(userProfile?.username || "");
  const [bio, setBio] = useState(userProfile?.bio || "");
  const [gender, setGender] = useState(userProfile?.gender || "");
  const [photos, setPhotos] = useState<string[]>(userProfile?.photos || []);
  const [selectedActivities, setSelectedActivities] = useState<("running" | "cycling" | "walking")[]>(
    userProfile?.activities || []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user data from Firebase on mount to get onboarding selections
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const userData = await getUserData(user.uid);
          if (userData) {
            // Load username from Firebase
            if (userData.name) {
              setUsername(userData.name);
            }
            
            // Load gender from Firebase and lock it
            if (userData.gender) {
              setGender(userData.gender);
            }
            
            // Load activity from Firebase (onboarding saves as single value)
            // Convert to array format for checkboxes
            if (userData.activity) {
              const activity = userData.activity as "running" | "cycling" | "walking";
              setSelectedActivities([activity]);
            } else if (userProfile?.activities && userProfile.activities.length > 0) {
              // Fallback to userProfile if Firebase doesn't have it
              setSelectedActivities(userProfile.activities);
            }
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user]);

  const activities = [
    { id: "running", label: "Running", icon: DirectionsRunIcon, color: "success" },
    { id: "cycling", label: "Cycling", icon: DirectionsBikeIcon, color: "primary" },
    { id: "walking", label: "Walking", icon: DirectionsWalkIcon, color: "warning" },
  ] as const;

  const handleActivityToggle = (activityId: "running" | "cycling" | "walking") => {
    setSelectedActivities(prev => {
      if (prev.includes(activityId)) {
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (photos.length >= 3) {
      toast.error("Maximum 3 photos allowed");
      return;
    }

    Array.from(files).forEach(file => {
      if (photos.length >= 3) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in to save changes");
      return;
    }

    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (selectedActivities.length === 0) {
      toast.error("Please select at least one activity");
      return;
    }

    setSaving(true);
    try {
      // Prepare data to save to Firebase
      const profileData: any = {
        name: username.trim(), // Save username as 'name' in Firebase
        bio: bio.trim() || null,
        photos: photos.length > 0 ? photos : null,
        // Save activities - use first activity as primary activity for compatibility
        activity: selectedActivities[0], // Primary activity (for backward compatibility)
        activities: selectedActivities, // Array of all selected activities
      };

      // Save to Firebase
      await updateUserProfile(user.uid, profileData);

      // Also update local context
      setUserProfile({
        ...userProfile!,
        username: username.trim(),
        bio: bio.trim(),
        gender,
        photos,
        activities: selectedActivities,
      });

      toast.success("Profile updated successfully!");
      navigate("/settings");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md shadow-elevation-2 sticky top-0 z-10 border-b border-border/50"
      >
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/settings")}
            className="touch-target p-2 hover:bg-secondary rounded-xl transition-all duration-200"
          >
            <ArrowBackIcon style={{ fontSize: 28 }} />
          </motion.button>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6 pb-10">
        {/* Profile Picture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center"
        >
          <Avatar
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || 'User')}&size=120`}
            alt="Profile"
            sx={{ width: 120, height: 120 }}
            className="border-4 border-primary/20 shadow-elevation-3"
          />
        </motion.div>

        {/* Photos Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 space-y-4">
            <div>
              <Label className="text-lg font-bold">Photos</Label>
              <p className="text-sm text-muted-foreground">Add up to 3 photos</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border">
                  <img src={photo} alt={`Profile ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <DeleteIcon style={{ fontSize: 16 }} />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-accent transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <AddPhotoAlternateIcon className="text-muted-foreground" style={{ fontSize: 32 }} />
                  <span className="text-xs text-muted-foreground mt-2">Add Photo</span>
                </label>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Basic Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 space-y-4">
            <Label className="text-lg font-bold">Basic Info</Label>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender} disabled>
                <SelectTrigger className="h-12" disabled>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Gender cannot be changed after onboarding</p>
            </div>
          </Card>
        </motion.div>

        {/* Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 space-y-4">
            <div>
              <Label className="text-lg font-bold">Activities</Label>
              <p className="text-sm text-muted-foreground">Select at least one</p>
            </div>
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
                    <div className="flex items-center gap-3 flex-1">
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
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivityToggle(activity.id as "running" | "cycling" | "walking");
                      }}
                      className="flex-shrink-0"
                    >
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          handleActivityToggle(activity.id as "running" | "cycling" | "walking");
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="w-full h-12 text-base font-bold"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default EditProfile;
