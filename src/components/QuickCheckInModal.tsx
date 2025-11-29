import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { toast } from "sonner";
import { getAllVenuesSync, searchVenues, Venue } from "@/services/venueService";
import { useAuth } from "@/hooks/useAuth";
import { saveUserVenuePreferences, getUserVenuePreferences, Activity } from "@/services/venuePreferenceService";
import { VenueRequestModal } from "./VenueRequestModal";

interface QuickCheckInModalProps {
  onClose: () => void;
}

export const QuickCheckInModal = ({ onClose }: QuickCheckInModalProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [venues, setVenues] = useState<Venue[]>(getAllVenuesSync());
  const [loading, setLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Load existing preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) return;

      try {
        const preferences = await getUserVenuePreferences(user.uid);
        if (preferences) {
          setSelectedActivities(preferences.activities || []);
          setSelectedVenues(preferences.venues || []);
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };

    loadPreferences();
  }, [user?.uid]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setVenues(searchVenues(searchQuery));
    } else {
      setVenues(getAllVenuesSync());
    }
  }, [searchQuery]);

  const handleToggleActivity = (activity: Activity) => {
    setSelectedActivities(prev => {
      if (prev.includes(activity)) {
        return prev.filter(a => a !== activity);
      } else {
        return [...prev, activity];
      }
    });
  };

  const handleToggleVenue = (venueId: string) => {
    setSelectedVenues(prev => {
      if (prev.includes(venueId)) {
        return prev.filter(id => id !== venueId);
      } else {
        return [...prev, venueId];
      }
    });
  };

  const handleSetLocation = async () => {
    if (selectedVenues.length === 0) {
      toast.error("Please select at least one venue");
      return;
    }

    if (selectedActivities.length === 0) {
      toast.error("Please select at least one activity");
      return;
    }

    if (!user?.uid) {
      toast.error("Please log in to set location");
      return;
    }

    setLoading(true);
    try {
      await saveUserVenuePreferences(user.uid, selectedVenues, selectedActivities);
      toast.success("Location preferences saved!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activity: Activity) => {
    switch (activity) {
      case "running":
        return <DirectionsRunIcon className="text-success" style={{ fontSize: 24 }} />;
      case "cycling":
        return <DirectionsBikeIcon className="text-primary" style={{ fontSize: 24 }} />;
      case "walking":
        return <DirectionsWalkIcon className="text-warning" style={{ fontSize: 24 }} />;
    }
  };

  const activities: { id: Activity; label: string; icon: typeof DirectionsRunIcon; color: string }[] = [
    { id: "running", label: "Running", icon: DirectionsRunIcon, color: "success" },
    { id: "cycling", label: "Cycling", icon: DirectionsBikeIcon, color: "primary" },
    { id: "walking", label: "Walking", icon: DirectionsWalkIcon, color: "warning" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] flex flex-col"
        >
          <Card className="flex flex-col overflow-hidden shadow-elevation-4 border-2 border-border/50 h-full">
            {/* Header - Fixed */}
            <div className="relative bg-gradient-to-br from-primary/10 via-success/5 to-warning/10 p-6 border-b border-border flex-shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-sm hover:bg-secondary rounded-full transition-colors z-10"
              >
                <CloseIcon fontSize="small" />
              </button>

              <div className="flex items-center gap-3 pr-10">
                <div className="p-3 bg-background/80 backdrop-blur-sm rounded-xl">
                  <LocationOnIcon className="text-primary" style={{ fontSize: 28 }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Add venues</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select venues and activities to display on other users. (Only your profile picture and user is visible)
                  </p>
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Activity Selection */}
              <div className="space-y-3">
                <label className="text-base font-semibold">Activities</label>
                <div className="grid grid-cols-3 gap-3">
                  {activities.map((activity) => {
                    const Icon = activity.icon;
                    const isSelected = selectedActivities.includes(activity.id);
                    return (
                      <motion.button
                        key={activity.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleActivity(activity.id)}
                        className={`
                          flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 relative
                          ${
                            isSelected
                              ? activity.color === "success"
                                ? "border-success bg-success/10 shadow-elevation-2"
                                : activity.color === "primary"
                                ? "border-primary bg-primary/10 shadow-elevation-2"
                                : "border-warning bg-warning/10 shadow-elevation-2"
                              : "border-border bg-card hover:bg-secondary"
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <CheckBoxIcon
                              className={
                                activity.color === "success"
                                  ? "text-success"
                                  : activity.color === "primary"
                                  ? "text-primary"
                                  : "text-warning"
                              }
                              style={{ fontSize: 20 }}
                            />
                          </div>
                        )}
                        <Icon
                          className={
                            isSelected
                              ? activity.color === "success"
                                ? "text-success"
                                : activity.color === "primary"
                                ? "text-primary"
                                : "text-warning"
                              : "text-muted-foreground"
                          }
                          style={{ fontSize: 32 }}
                        />
                        <span
                          className={`text-sm mt-2 font-semibold ${
                            isSelected ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {activity.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Venue Search */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-base font-semibold">Select Venue</label>
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(true)}
                    className="text-sm text-primary hover:text-primary/80 underline"
                  >
                    Can't find your venue?
                  </button>
                </div>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                  <Input
                    placeholder="Search venues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              {/* Venue List - No nested scrolling */}
              <div className="space-y-2">
                {venues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No venues found</p>
                  </div>
                ) : (
                  venues.map((venue) => {
                    const isSelected = selectedVenues.includes(venue.id);
                    
                    return (
                      <motion.button
                        key={venue.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleToggleVenue(venue.id)}
                        className={`
                          w-full text-left p-4 rounded-lg border-2 transition-all duration-200
                          ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:bg-secondary hover:border-primary/50"
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          {isSelected ? (
                            <CheckBoxIcon className="text-primary flex-shrink-0 mt-0.5" style={{ fontSize: 20 }} />
                          ) : (
                            <CheckBoxOutlineBlankIcon className="text-muted-foreground flex-shrink-0 mt-0.5" style={{ fontSize: 20 }} />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <LocationOnIcon
                                className={isSelected ? "text-primary" : "text-muted-foreground"}
                                style={{ fontSize: 18 }}
                              />
                              <h3 className="font-semibold text-base truncate">{venue.name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{venue.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{venue.city}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Action Buttons - Fixed */}
            <div className="flex gap-3 p-6 pt-4 border-t border-border flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetLocation}
                disabled={selectedVenues.length === 0 || selectedActivities.length === 0 || loading}
                className="flex-1 h-12 font-semibold"
              >
                {loading ? "Saving..." : "Set location"}
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Venue Request Modal */}
      {showRequestModal && (
        <VenueRequestModal
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            toast.success("Request submitted successfully!");
          }}
        />
      )}
    </AnimatePresence>
  );
};

