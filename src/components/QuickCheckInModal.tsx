import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { toast } from "sonner";
import { getAllVenues, searchVenues, Venue } from "@/services/venueService";
import { useVenueCheckIns } from "@/hooks/useVenueCheckIns";
import { useAuth } from "@/hooks/useAuth";

type Activity = "running" | "cycling" | "walking";

interface QuickCheckInModalProps {
  onClose: () => void;
}

export const QuickCheckInModal = ({ onClose }: QuickCheckInModalProps) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<Activity>("running");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [venues, setVenues] = useState<Venue[]>(getAllVenues());
  const { userCheckIn, checkIn, checkOut, isCheckedIn, loading } = useVenueCheckIns({ autoLoad: true });

  useEffect(() => {
    if (searchQuery.trim()) {
      setVenues(searchVenues(searchQuery));
    } else {
      setVenues(getAllVenues());
    }
  }, [searchQuery]);

  // Set selected venue if user is already checked in
  useEffect(() => {
    if (userCheckIn && !selectedVenue) {
      const venue = venues.find(v => v.id === userCheckIn.venueId);
      if (venue) {
        setSelectedVenue(venue);
        setSelectedActivity(userCheckIn.activity);
      }
    }
  }, [userCheckIn, venues, selectedVenue]);

  const handleCheckIn = async () => {
    if (!selectedVenue) {
      toast.error("Please select a venue");
      return;
    }

    if (!user?.uid) {
      toast.error("Please log in to check in");
      return;
    }

    try {
      await checkIn(selectedVenue.id, { id: selectedVenue.id, name: selectedVenue.name }, selectedActivity);
      toast.success(`Checked in to ${selectedVenue.name}!`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    if (!user?.uid) {
      return;
    }

    try {
      await checkOut();
      toast.success("Checked out successfully!");
      setSelectedVenue(null);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to check out");
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
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl my-8"
        >
          <Card className="overflow-hidden shadow-elevation-4 border-2 border-border/50">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary/10 via-success/5 to-warning/10 p-6 border-b border-border">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-sm hover:bg-secondary rounded-full transition-colors z-10"
              >
                <CloseIcon fontSize="small" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-background/80 backdrop-blur-sm rounded-xl">
                  <LocationOnIcon className="text-primary" style={{ fontSize: 28 }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Quick Check-in</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Check in to a venue to see who's there
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Current Check-in Status */}
              {isCheckedIn && userCheckIn && (
                <div className="bg-success/10 border-2 border-success/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircleIcon className="text-success" style={{ fontSize: 20 }} />
                        <p className="font-semibold text-success">Currently Checked In</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {userCheckIn.venueName} • {userCheckIn.activity}
                      </p>
                    </div>
                    <Button
                      onClick={handleCheckOut}
                      variant="outline"
                      className="border-success text-success hover:bg-success/10"
                    >
                      Check Out
                    </Button>
                  </div>
                </div>
              )}

              {/* Activity Selection */}
              <div className="space-y-3">
                <label className="text-base font-semibold">What are you doing?</label>
                <div className="grid grid-cols-3 gap-3">
                  {activities.map((activity) => {
                    const Icon = activity.icon;
                    const isSelected = selectedActivity === activity.id;
                    return (
                      <motion.button
                        key={activity.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedActivity(activity.id)}
                        className={`
                          flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300
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
                <label className="text-base font-semibold">Select Venue</label>
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

              {/* Venue List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {venues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No venues found</p>
                  </div>
                ) : (
                  venues.map((venue) => {
                    const isSelected = selectedVenue?.id === venue.id;
                    const isCheckedInHere = userCheckIn?.venueId === venue.id;
                    
                    return (
                      <motion.button
                        key={venue.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedVenue(venue)}
                        className={`
                          w-full text-left p-4 rounded-xl border-2 transition-all duration-300
                          ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-elevation-2"
                              : isCheckedInHere
                              ? "border-success bg-success/5"
                              : "border-border bg-card hover:bg-secondary"
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <LocationOnIcon
                                className={isSelected ? "text-primary" : "text-muted-foreground"}
                                style={{ fontSize: 20 }}
                              />
                              <h3 className="font-semibold">{venue.name}</h3>
                              {isCheckedInHere && (
                                <Badge className="bg-success/20 text-success border-success/30">
                                  <CheckCircleIcon style={{ fontSize: 12 }} className="mr-1" />
                                  Checked In
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{venue.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{venue.city}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCheckIn}
                  disabled={!selectedVenue || loading || isCheckedIn}
                  className="flex-1 h-12 font-semibold"
                >
                  {loading ? "Checking in..." : isCheckedIn ? "Already Checked In" : "Check In"}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

