import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import Avatar from "@mui/material/Avatar";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "sonner";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { setUserProfile } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [activities, setActivities] = useState<("running" | "cycling" | "walking")[]>(["running"]);
  const [gender, setGender] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Limit to 3 photos
    if (photos.length >= 3) {
      toast.error("You can only upload up to 3 photos");
      return;
    }

    const newFiles = Array.from(files).slice(0, 3 - photos.length);
    
    newFiles.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Photo size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    if (activities.length === 0) {
      toast.error("Please select at least one activity");
      return;
    }

    // Save profile data
    setUserProfile({
      username: username.trim(),
      activities,
      gender: gender || undefined,
      photos: photos.length > 0 ? photos : undefined,
    });

    toast.success("Profile created successfully!");
    navigate("/map");
  };

  const activityOptions = [
    { id: "running", label: "Running", icon: DirectionsRunIcon, color: "success" },
    { id: "cycling", label: "Cycling", icon: DirectionsBikeIcon, color: "primary" },
    { id: "walking", label: "Walking", icon: DirectionsWalkIcon, color: "warning" },
  ];

  const handleActivityToggle = (activityId: "running" | "cycling" | "walking") => {
    setActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(a => a !== activityId);
      } else {
        return [...prev, activityId];
      }
    });
  };

  const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-base text-muted-foreground">Let's personalize your experience</p>
        </motion.div>

        {/* Photo Upload */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.5, 
            delay: 0.2,
            type: "spring",
            stiffness: 200 
          }}
          className="space-y-4"
        >
          <div className="text-center">
            <Label className="text-lg font-semibold">Profile Photos</Label>
            <p className="text-sm text-muted-foreground mt-1">Add 2-3 photos to your profile</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Existing photos */}
            {photos.map((photo, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative aspect-square rounded-2xl overflow-hidden border-2 border-primary shadow-elevation-2"
              >
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive rounded-full hover:bg-destructive/90 transition-colors"
                >
                  <CloseIcon style={{ fontSize: 16 }} className="text-destructive-foreground" />
                </button>
              </motion.div>
            ))}

            {/* Add photo button */}
            {photos.length < 3 && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: photos.length * 0.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-border bg-muted hover:bg-secondary hover:border-primary transition-all duration-300 flex flex-col items-center justify-center gap-2"
              >
                <AddPhotoAlternateIcon style={{ fontSize: 32 }} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Add Photo</span>
              </motion.button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </motion.div>

        {/* Username Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-3"
        >
          <Label htmlFor="username" className="text-lg font-semibold">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-14 text-base border-2 focus:border-primary transition-all"
          />
        </motion.div>

        {/* Activity Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-4"
        >
          <div>
            <Label className="text-lg font-semibold">Select Activities</Label>
            <p className="text-sm text-muted-foreground mt-1">Choose one or more activities</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {activityOptions.map((act, idx) => {
              const Icon = act.icon;
              const isSelected = activities.includes(act.id as "running" | "cycling" | "walking");
              return (
                <motion.button
                  key={act.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + idx * 0.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleActivityToggle(act.id as "running" | "cycling" | "walking")}
                  className={`
                    flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden
                    ${isSelected 
                      ? act.color === 'success' 
                        ? 'border-success bg-success/10 shadow-elevation-2' 
                        : act.color === 'primary'
                        ? 'border-primary bg-primary/10 shadow-elevation-2'
                        : 'border-warning bg-warning/10 shadow-elevation-2'
                      : "border-border bg-card hover:bg-secondary hover:border-muted"
                    }
                  `}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 bg-success rounded-full flex items-center justify-center"
                    >
                      <span className="text-success-foreground text-xs">✓</span>
                    </motion.div>
                  )}
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
                    style={{ fontSize: 36 }}
                  />
                  <span className={`text-sm mt-2 font-semibold ${isSelected ? 'text-foreground' : "text-muted-foreground"}`}>
                    {act.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Gender Selection (Optional) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="space-y-4"
        >
          <Label className="text-lg font-semibold">Gender <span className="text-muted-foreground text-sm font-normal">(Optional)</span></Label>
          <div className="grid grid-cols-2 gap-3">
            {genderOptions.map((option, idx) => (
              <motion.button
                key={option}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + idx * 0.05 }}
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
        </motion.div>

        {/* Complete Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <motion.div
            whileTap={{ scale: 0.98 }}
            animate={username ? { scale: [1, 1.02, 1] } : {}}
            transition={username ? { duration: 1, repeat: Infinity, repeatDelay: 2 } : {}}
          >
            <Button
              onClick={handleComplete}
              disabled={!username.trim()}
              className="w-full h-16 text-lg font-bold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Setup
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
