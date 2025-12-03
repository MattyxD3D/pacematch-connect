import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import { formatDistance } from "@/utils/distance";

interface Event {
  id: string;
  title: string;
  description: string;
  type: "running" | "cycling" | "walking" | "others";
  date: string;
  time: string;
  location: string;
  lat: number;
  lng: number;
  hostName: string;
  hostAvatar?: string;
  participants?: string[];
  distance?: string;
  distanceValue?: number;
}

interface NearestEventModalProps {
  isOpen: boolean;
  event: Event | null;
  onClose: () => void;
  onViewDetails: () => void;
}

export const NearestEventModal = ({
  isOpen,
  event,
  onClose,
  onViewDetails
}: NearestEventModalProps) => {
  if (!event) return null;

  const getActivityIcon = () => {
    switch (event.type) {
      case "running":
        return <DirectionsRunIcon style={{ fontSize: 24 }} className="text-success" />;
      case "cycling":
        return <DirectionsBikeIcon style={{ fontSize: 24 }} className="text-primary" />;
      case "walking":
        return <DirectionsWalkIcon style={{ fontSize: 24 }} className="text-warning" />;
      default:
        return <FitnessCenterIcon style={{ fontSize: 24 }} className="text-secondary" />;
    }
  };

  const participantsCount = Array.isArray(event.participants) ? event.participants.length : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-card rounded-3xl shadow-elevation-4 border-2 border-primary/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary via-primary to-success p-4 pb-6 relative">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-background/20 hover:bg-background/30 transition-colors"
                >
                  <CloseIcon style={{ fontSize: 20 }} className="text-white" />
                </button>
                <div className="flex items-center gap-3 mt-2">
                  <div className="p-2 bg-background/20 rounded-full">
                    {getActivityIcon()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">Nearest Event Found!</h3>
                    <p className="text-xs text-white/80">We found an event near you</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Event Title */}
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">{event.title}</h2>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  )}
                </div>

                {/* Event Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Date & Time */}
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                    <EventIcon style={{ fontSize: 18 }} className="text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-semibold truncate">{event.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                    <AccessTimeIcon style={{ fontSize: 18 }} className="text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm font-semibold truncate">{event.time}</p>
                    </div>
                  </div>
                </div>

                {/* Distance & Participants */}
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2">
                    <LocationOnIcon style={{ fontSize: 18 }} className="text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="text-sm font-bold text-primary">
                        {event.distance || "Unknown"}
                      </p>
                    </div>
                  </div>
                  {participantsCount > 0 && (
                    <div className="flex items-center gap-2">
                      <PeopleIcon style={{ fontSize: 18 }} className="text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Joining</p>
                        <p className="text-sm font-bold text-foreground">{participantsCount}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Host Info */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={event.hostAvatar} />
                    <AvatarFallback>{event.hostName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Hosted by</p>
                    <p className="text-sm font-semibold truncate">{event.hostName}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={onViewDetails}
                    className="flex-1 bg-gradient-to-r from-primary via-primary to-success hover:from-primary/90 hover:via-primary/90 hover:to-success/90"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

