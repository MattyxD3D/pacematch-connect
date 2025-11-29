import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getUserData, updateUserProfile } from "@/services/authService";
import { DEFAULT_AVATARS, generateUserAvatar } from "@/lib/avatars";
import { storage } from "@/services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, setUserProfile } = useUser();
  
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<("running" | "cycling" | "walking")[]>([]);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user data from Firebase on mount to get onboarding selections
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const userData = await getUserData(user.uid);
          if (userData) {
            // Load username from Firebase (stored as 'name')
            if (userData.name) {
              setUsername(userData.name);
            }
            
            // Load bio from Firebase
            if (userData.bio) {
              setBio(userData.bio);
            }
            
            // Load photos from Firebase
            if (userData.photos && Array.isArray(userData.photos)) {
              setPhotos(userData.photos);
            }
            
            // Load photoURL from Firebase (profile photo/avatar)
            if (userData.photoURL) {
              setSelectedPhotoUrl(userData.photoURL);
            }
            
            // Load activities from Firebase - prioritize activities array over single activity
            if (userData.activities && Array.isArray(userData.activities) && userData.activities.length > 0) {
              setSelectedActivities(userData.activities);
            } else if (userData.activity) {
              // Fallback to single activity if array doesn't exist
              const activity = userData.activity as "running" | "cycling" | "walking";
              setSelectedActivities([activity]);
            } else {
              // Default to running if nothing is set
              setSelectedActivities(["running"]);
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

  // Handle profile photo/avatar upload
  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      // Create a reference to the file in Firebase Storage
      const storageRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${file.name}`);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      setSelectedPhotoUrl(downloadUrl);
      setShowAvatarPicker(false);
      toast.success("Profile photo updated successfully!");
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle default avatar selection
  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedPhotoUrl(avatarUrl);
    setShowAvatarPicker(false);
    toast.success("Avatar selected!");
  };

  // Get current display photo URL
  const getDisplayPhotoUrl = (): string => {
    if (selectedPhotoUrl) return selectedPhotoUrl;
    if (user?.photoURL) return user.photoURL;
    return generateUserAvatar(username || user?.displayName || user?.email || 'User');
  };

  // Handle additional photos upload (up to 3)
  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        photoURL: selectedPhotoUrl || null, // Save profile photo/avatar URL
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
        {/* Profile Picture - Clickable with Avatar Picker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative group">
            <button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              className="relative rounded-full focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-300"
            >
              <Avatar
                sx={{ width: 120, height: 120 }}
                alt="Profile"
                src={getDisplayPhotoUrl()}
                className="border-4 border-primary/20 shadow-elevation-3"
              />
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-4 border-primary/20 rounded-full">
                <CameraAltIcon className="text-white" style={{ fontSize: 40 }} />
              </div>
              {/* Selected indicator */}
              {selectedPhotoUrl && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5">
                  <CheckCircleIcon className="text-white" style={{ fontSize: 20 }} />
                </div>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowAvatarPicker(true)}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {selectedPhotoUrl ? "Change Photo" : "Add Photo"}
          </button>
        </motion.div>

        {/* Avatar Picker Modal */}
        <AnimatePresence>
          {showAvatarPicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setShowAvatarPicker(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-card rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-foreground">Choose Your Photo</h3>
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* Upload Photo Option */}
                <div className="mb-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50"
                  >
                    {uploadingPhoto ? (
                      <>
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium text-primary">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <AddPhotoAlternateIcon className="text-primary" style={{ fontSize: 28 }} />
                        <span className="font-medium text-primary">Upload Your Photo</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Max 5MB • JPG, PNG, GIF
                  </p>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm text-muted-foreground">or choose an avatar</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Default Avatars Grid */}
                <div className="grid grid-cols-4 gap-3">
                  {DEFAULT_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => handleAvatarSelect(avatar.url)}
                      className={`relative rounded-xl p-2 transition-all duration-200 hover:scale-105 ${
                        selectedPhotoUrl === avatar.url
                          ? "bg-primary/20 ring-2 ring-primary"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-full aspect-square rounded-lg"
                      />
                      {selectedPhotoUrl === avatar.url && (
                        <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                          <CheckCircleIcon className="text-white" style={{ fontSize: 14 }} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Close button */}
                <Button
                  type="button"
                  onClick={() => setShowAvatarPicker(false)}
                  className="w-full mt-6"
                  variant="outline"
                >
                  Done
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    onChange={handlePhotosUpload}
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
              <p className="text-xs text-muted-foreground">
                This name will be displayed to other users
              </p>
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
                      className="flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => {
                          handleActivityToggle(activity.id as "running" | "cycling" | "walking");
                        }}
                        onClick={(e) => e.stopPropagation()}
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
