import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import PersonIcon from "@mui/icons-material/Person";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import Avatar from "@mui/material/Avatar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { updateUserProfile } from "@/services/authService";
import { FitnessLevel, RadiusPreference, VisibilitySettings } from "@/contexts/UserContext";
import { SearchFilter } from "@/services/matchingService";
import { DEFAULT_AVATARS, generateUserAvatar } from "@/lib/avatars";
import { storage } from "@/services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<("running" | "cycling" | "walking" | string)[]>(["running"]);
  const [customActivity, setCustomActivity] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [gender, setGender] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>("intermediate");
  const [visibleToAllLevels, setVisibleToAllLevels] = useState(true);
  const [allowedLevels, setAllowedLevels] = useState<FitnessLevel[]>(["beginner", "intermediate", "pro"]);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const [radiusPreference, setRadiusPreference] = useState<RadiusPreference>("normal");
  const [saving, setSaving] = useState(false);
  
  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Photo/Avatar state
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Additional photos state (up to 3)
  const [photos, setPhotos] = useState<string[]>([]);
  const photosInputRef = useRef<HTMLInputElement>(null);

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
          if (userData.visibility) {
            setVisibleToAllLevels(userData.visibility.visibleToAllLevels ?? true);
            setAllowedLevels(userData.visibility.allowedLevels || ["beginner", "intermediate", "pro"]);
          }
          if (userData.searchFilter) setSearchFilter(userData.searchFilter);
          if (userData.radiusPreference) setRadiusPreference(userData.radiusPreference);
          // Load existing photo URL
          if (userData.photoURL) setSelectedPhotoUrl(userData.photoURL);
          // Load additional photos
          if (userData.photos && Array.isArray(userData.photos)) {
            setPhotos(userData.photos);
          }
        }
      }
    };
    loadProfile();
  }, [user]);

  // Handle photo file upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      toast.success("Photo uploaded successfully!");
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

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select image files only");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Each image must be less than 5MB");
        return;
      }

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

  // Get current display photo URL
  const getDisplayPhotoUrl = (): string => {
    if (selectedPhotoUrl) return selectedPhotoUrl;
    if (user?.photoURL) return user.photoURL;
    return generateUserAvatar(user?.displayName || user?.email || 'User');
  };

  // Step navigation validation
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!username.trim()) {
        toast.error("Please enter a username");
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (selectedActivities.length === 0) {
        toast.error("Please select at least one preferred activity");
        return false;
      }
      return true;
    }
    return true; // Step 3 has no required fields
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

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
        visibility: visibility,
        searchFilter: searchFilter,
        radiusPreference: radiusPreference,
        photoURL: selectedPhotoUrl || user.photoURL || null, // Save the selected/uploaded photo
        photos: photos.length > 0 ? photos : null // Save additional photos
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Complete Your Profile</h1>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {/* Step 1 */}
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                currentStep >= 1 ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground'
              }`}>
                {currentStep > 1 ? <CheckCircleIcon style={{ fontSize: 20 }} /> : <span className="text-sm font-semibold">1</span>}
              </div>
              <span className={`ml-2 text-sm font-medium hidden sm:inline ${
                currentStep === 1 ? 'text-foreground' : currentStep > 1 ? 'text-primary' : 'text-muted-foreground'
              }`}>About You</span>
            </div>
            
            {/* Connector Line */}
            <div className={`h-0.5 w-12 transition-all ${
              currentStep > 1 ? 'bg-primary' : 'bg-border'
            }`} />
            
            {/* Step 2 */}
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                currentStep >= 2 ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground'
              }`}>
                {currentStep > 2 ? <CheckCircleIcon style={{ fontSize: 20 }} /> : <span className="text-sm font-semibold">2</span>}
              </div>
              <span className={`ml-2 text-sm font-medium hidden sm:inline ${
                currentStep === 2 ? 'text-foreground' : currentStep > 2 ? 'text-primary' : 'text-muted-foreground'
              }`}>Fitness</span>
            </div>
            
            {/* Connector Line */}
            <div className={`h-0.5 w-12 transition-all ${
              currentStep > 2 ? 'bg-primary' : 'bg-border'
            }`} />
            
            {/* Step 3 */}
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                currentStep >= 3 ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground'
              }`}>
                <span className="text-sm font-semibold">3</span>
              </div>
              <span className={`ml-2 text-sm font-medium hidden sm:inline ${
                currentStep === 3 ? 'text-foreground' : 'text-muted-foreground'
              }`}>Preferences</span>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: About You */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Tip Card */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <PersonIcon className="text-primary flex-shrink-0 mt-0.5" style={{ fontSize: 24 }} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Your profile helps others recognize you when matching nearby!
                  </p>
                </div>
              </div>

              {/* Profile Photo - Clickable */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-3"
              >
          <div className="relative group">
            <button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              className="relative rounded-full focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-300"
            >
              <Avatar
                sx={{ width: 96, height: 96 }}
                alt="Profile"
                src={getDisplayPhotoUrl()}
              />
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <CameraAltIcon className="text-white" style={{ fontSize: 32 }} />
              </div>
              {/* Selected indicator */}
              {selectedPhotoUrl && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <CheckCircleIcon className="text-white" style={{ fontSize: 18 }} />
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
                    onChange={handlePhotoUpload}
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

              {/* Username Input */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-lg font-semibold text-foreground">Username <span className="text-destructive">*</span></Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username (required)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 text-base"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This username will be displayed to other users
                </p>
              </div>

              {/* Gender Selection (Optional) */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">Gender <span className="text-sm font-normal text-muted-foreground">(Optional)</span></Label>
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
              </div>

              {/* Additional Photos Section (Optional) */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">Additional Photos <span className="text-sm font-normal text-muted-foreground">(Optional)</span></Label>
                <p className="text-xs text-muted-foreground">Add up to 3 photos to showcase your fitness journey</p>
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-border">
                      <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <DeleteIcon style={{ fontSize: 14 }} />
                      </button>
                    </div>
                  ))}
                  {photos.length < 3 && (
                    <label className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-accent transition-colors">
                      <input
                        ref={photosInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotosUpload}
                      />
                      <AddPhotoAlternateIcon className="text-muted-foreground" style={{ fontSize: 28 }} />
                      <span className="text-xs text-muted-foreground mt-1">Add Photo</span>
                    </label>
                  )}
                </div>
                {photos.length > 0 && photos.length < 3 && (
                  <p className="text-xs text-muted-foreground">
                    You can add {3 - photos.length} more photo{3 - photos.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Your Fitness */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Tip Card */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <FitnessCenterIcon className="text-primary flex-shrink-0 mt-0.5" style={{ fontSize: 24 }} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Select activities you enjoy - you'll match with others doing the same!
                  </p>
                </div>
              </div>

              {/* Activity Selection */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">Preferred Activities</Label>
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
              </div>

              {/* Fitness Level */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">Fitness Level</Label>
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
              </div>
            </motion.div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Tip Card */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <SettingsIcon className="text-primary flex-shrink-0 mt-0.5" style={{ fontSize: 24 }} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Control your privacy - you can change these anytime in settings.
                  </p>
                </div>
              </div>

              {/* Visibility Settings */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">Who can see you?</Label>
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
                <p className="text-xs text-muted-foreground pl-7">
                  This will help others discover you at venues and connect with workout partners nearby.
                </p>
                
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
              </div>

              {/* Search Filter - Who do you want to find? */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold text-foreground">Who do you want to find?</Label>
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

              {/* Radius Preference */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold text-foreground">Search Radius Preference</Label>
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4">
          {currentStep > 1 && (
            <Button
              type="button"
              onClick={handleBack}
              variant="outline"
              className="flex-1 h-14 text-base font-medium"
            >
              <ArrowBackIcon className="mr-2" style={{ fontSize: 20 }} />
              Back
            </Button>
          )}
          {currentStep < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex-1 h-14 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={saving || authLoading}
              className="flex-1 h-14 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Complete Setup"}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
