import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { getUserData } from "@/services/authService";
import { checkInToEventLocation, getCheckInsAtEventLocation, deleteEvent, updateEvent } from "@/services/eventService";
import { findVenueForEvent } from "@/services/venueService";
import { useVenueCheckIns } from "@/hooks/useVenueCheckIns";
import { openGoogleMapsNavigation } from "@/utils/navigation";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import NavigationIcon from "@mui/icons-material/Navigation";
import { toast } from "sonner";

type EventType = "running" | "cycling" | "walking" | "others";

interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  category: "user" | "sponsored";
  date: string;
  time: string;
  location: string;
  distance: string;
  distanceValue: number;
  participants: string[];
  maxParticipants?: number;
  hostId?: string;
  hostName?: string;
  hostAvatar?: string;
  lat: number;
  lng: number;
  isJoined?: boolean;
}

interface Comment {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
}

interface EventDetailsPanelProps {
  event: Event | null;
  onClose: () => void;
  onJoin: (eventId: string) => void;
  onLeave: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
}

export const EventDetailsPanel = ({ event, onClose, onJoin, onLeave, onEdit, onDelete }: EventDetailsPanelProps) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [eventCheckIns, setEventCheckIns] = useState<any[]>([]);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Find venue for event location
  const venue = event ? findVenueForEvent(event.lat, event.lng) : null;
  const venueId = venue?.id;

  // Get check-ins for this venue/event
  const { checkIns, userCheckIn, checkIn, checkOut, isCheckedIn } = useVenueCheckIns({
    venueId: venueId,
    autoLoad: true,
  });

  // Load check-ins at event location
  useEffect(() => {
    if (!event?.id) return;

    const loadCheckIns = async () => {
      try {
        const checkInsData = await getCheckInsAtEventLocation(String(event.id));
        setEventCheckIns(checkInsData);
      } catch (error) {
        console.error("Error loading event check-ins:", error);
      }
    };

    loadCheckIns();
  }, [event?.id]);

  const participantsCount = Array.isArray(event?.participants)
    ? event.participants.length
    : 0;

  const getActivityIcon = (type: EventType) => {
    switch (type) {
      case "running":
        return <DirectionsRunIcon className="text-success" style={{ fontSize: 24 }} />;
      case "cycling":
        return <DirectionsBikeIcon className="text-primary" style={{ fontSize: 24 }} />;
      case "walking":
        return <DirectionsWalkIcon className="text-warning" style={{ fontSize: 24 }} />;
      case "others":
        return <FitnessCenterIcon className="text-secondary" style={{ fontSize: 24 }} />;
    }
  };

  const handleEventCheckIn = async () => {
    if (!user?.uid || !event) return;

    try {
      setIsCheckingIn(true);
      const userData = await getUserData(user.uid);
      if (!userData) {
        throw new Error("User data not found");
      }

      await checkInToEventLocation(
        String(event.id),
        user.uid,
        {
          userId: user.uid,
          userName: userData.name || "Unknown User",
          userAvatar: userData.photoURL || "",
          activity: event.type,
        }
      );

      toast.success("Checked in to event location!");

      // Reload check-ins
      const checkInsData = await getCheckInsAtEventLocation(String(event.id));
      setEventCheckIns(checkInsData);
    } catch (error: any) {
      toast.error(error.message || "Failed to check in");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !event) return;

    const newComment: Comment = {
      id: comments.length + 1,
      userId: user?.uid ? parseInt(user.uid) : 0,
      userName: user?.displayName || "You",
      userAvatar: user?.photoURL || "",
      text: commentText,
      timestamp: "Just now",
    };

    setComments([...comments, newComment]);
    setCommentText("");
    toast.success("Comment added!");
  };

  const handleDelete = async () => {
    if (!event || !user?.uid) return;
    
    if (event.hostId !== user.uid) {
      toast.error("Only the event creator can delete this event");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteEvent(event.id, user.uid);
      toast.success("Event deleted successfully");
      onClose();
      if (onDelete) {
        onDelete(event.id);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete event");
    }
  };

  const handleEdit = () => {
    if (!event || !user?.uid) return;
    
    if (event.hostId !== user.uid) {
      toast.error("Only the event creator can edit this event");
      return;
    }

    if (onEdit) {
      onEdit(event.id);
    }
  };

  // Check if current user is the event creator
  const isEventCreator = event && user?.uid && event.hostId === user.uid;


  return (
    <AnimatePresence>
      {event ? (
        <>
          {/* Backdrop - Click outside to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border rounded-t-3xl shadow-elevation-4"
            style={{ maxHeight: "60vh" }}
          >
          {/* Drag Handle with Close Button */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex-1 flex justify-center">
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
            </div>
            {/* Close Button - X button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors touch-target"
              aria-label="Close event details"
            >
              <CloseIcon style={{ fontSize: 24 }} className="text-foreground" />
            </button>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "calc(60vh - 60px)" }}>
            <div className="p-4 space-y-4">
              {/* Event Header */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  {getActivityIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold truncate">{event.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Event Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <EventIcon style={{ fontSize: 18 }} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground truncate">{event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <AccessTimeIcon style={{ fontSize: 18 }} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground truncate">{event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <LocationOnIcon style={{ fontSize: 18 }} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground truncate min-w-0">{event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <PeopleIcon style={{ fontSize: 18 }} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground truncate">
                    {participantsCount}
                    {event.maxParticipants ? ` / ${event.maxParticipants}` : ""} <span className="hidden xs:inline">participants</span>
                  </span>
                </div>
              </div>

              {/* Distance Badge */}
              <div>
                <Badge variant="outline" className="text-sm">
                  {event.distance} away
                </Badge>
              </div>

              {/* View on Map Button */}
              <Button
                onClick={() => {
                  if (event.lat && event.lng) {
                    openGoogleMapsNavigation(event.lat, event.lng);
                  } else {
                    toast.error("Location not available");
                  }
                }}
                variant="outline"
                className="w-full min-h-[44px]"
              >
                <NavigationIcon style={{ fontSize: 18 }} className="mr-2" />
                <span>View on Map</span>
              </Button>

              {/* Creator Actions - Edit/Delete */}
              {isEventCreator && (
                <div className="flex gap-2 pb-2 border-b border-border">
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    className="flex-1 min-h-[44px]"
                  >
                    <EditIcon style={{ fontSize: 18 }} className="mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Edit Event</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="outline"
                    className="flex-1 min-h-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <DeleteIcon style={{ fontSize: 18 }} className="mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Delete Event</span>
                    <span className="sm:hidden">Delete</span>
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => {
                    if (event.isJoined) {
                      onLeave(event.id);
                    } else {
                      onJoin(event.id);
                    }
                  }}
                  className="flex-1 min-h-[44px]"
                  variant={event.isJoined ? "outline" : "default"}
                >
                  {event.isJoined ? (
                    <>
                      <CheckCircleIcon style={{ fontSize: 18 }} className="mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Leave Event</span>
                      <span className="sm:hidden">Leave</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Join Event</span>
                      <span className="sm:hidden">Join</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleEventCheckIn}
                  variant="outline"
                  disabled={isCheckingIn}
                  className="min-h-[44px]"
                >
                  <CheckCircleIcon style={{ fontSize: 18 }} className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Check In</span>
                  <span className="sm:hidden">Check In</span>
                </Button>
              </div>

              {/* Check-ins Count */}
              {eventCheckIns.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {eventCheckIns.length} checked in at this location
                </div>
              )}

              {/* Comments Section */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-3">Comments</h3>

                {/* Comments List */}
                <div className="space-y-3 mb-4 max-h-32 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2">
                        <Avatar
                          src={comment.userAvatar}
                          alt={comment.userName}
                          sx={{ width: 32, height: 32 }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{comment.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-foreground mt-1">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    size="icon"
                  >
                    <SendIcon style={{ fontSize: 18 }} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
};

