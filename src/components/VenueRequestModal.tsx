import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { submitVenueRequest } from "@/services/venueRequestService";

interface VenueRequestModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const VenueRequestModal = ({ onClose, onSuccess }: VenueRequestModalProps) => {
  const { user } = useAuth();
  const [venueName, setVenueName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!venueName.trim()) {
      toast.error("Please enter a venue name");
      return;
    }

    if (!location.trim()) {
      toast.error("Please enter a location");
      return;
    }

    if (!user?.uid) {
      toast.error("Please log in to submit a request");
      return;
    }

    setLoading(true);
    try {
      await submitVenueRequest(user.uid, venueName.trim(), location.trim());
      setSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
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
            className="w-full max-w-md"
          >
            <Card className="overflow-hidden shadow-elevation-4 border-2 border-border/50">
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                  <LocationOnIcon className="text-success" style={{ fontSize: 32 }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Thank you!</h2>
                  <p className="text-muted-foreground">
                    Admins will review your request as soon as possible.
                  </p>
                </div>
                <Button onClick={onClose} className="w-full h-12">
                  Close
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

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
          className="w-full max-w-md"
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

              <div className="flex items-center gap-3 pr-10">
                <div className="p-3 bg-background/80 backdrop-blur-sm rounded-xl">
                  <LocationOnIcon className="text-primary" style={{ fontSize: 28 }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Request a Venue</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Can't find your workout location? Let us know!
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="venueName" className="text-sm font-semibold">
                  Venue Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="venueName"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g., Rizal Park, UP Diliman"
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-semibold">
                  General Location <span className="text-destructive">*</span>
                </label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Quezon City, Makati, Pasig"
                  className="h-12"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Please provide the city or general area where this venue is located
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !venueName.trim() || !location.trim()}
                  className="flex-1 h-12 font-semibold"
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

