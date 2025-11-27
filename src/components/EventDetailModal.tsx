import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import SendIcon from "@mui/icons-material/Send";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import NavigationIcon from "@mui/icons-material/Navigation";
import { toast } from "sonner";
import { useVenueCheckIns } from "@/hooks/useVenueCheckIns";
import { findVenueForEvent } from "@/services/venueService";
import { checkInToEventLocation, getCheckInsAtEventLocation, deleteEvent, updateEvent } from "@/services/eventService";
import { useAuth } from "@/hooks/useAuth";
import { getUserData } from "@/services/authService";
import { openGoogleMapsNavigation } from "@/utils/navigation";

type EventType = "running" | "cycling" | "walking" | "others";

interface Event {
  id: string | number;
  title: string;
  description: string;
  type: EventType;
  category: "user" | "sponsored";
  date: string;
  time: string;
  location: string;
  distance: string;
  distanceValue: number;
  participants: string[] | number;
  maxParticipants?: number;
  hostId?: string;
  hostName?: string;
  hostAvatar?: string;
  sponsorLogo?: string;
  lat: number;
  lng: number;
  isJoined?: boolean;
}

interface Participant {
  id: number;
  name: string;
  avatar: string;
  joinedAt: string;
}

interface Comment {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
}

interface EventDetailModalProps {
  event: Event | null;
  onClose: () => void;
  onJoin: (eventId: string | number) => void;
  onEdit?: (eventId: string | number) => void;
  onDelete?: (eventId: string | number) => void;
}

export const EventDetailModal = ({ event, onClose, onJoin, onEdit, onDelete }: EventDetailModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
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
    autoLoad: true
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

  // Participants will be fetched from Firebase event data
  // Use event.participants array to fetch user data
  const participants: Participant[] = [];
  const participantsCount = Array.isArray(event?.participants) 
    ? event.participants.length 
    : (event?.participants || 0);

  if (!event) return null;

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
          userName: userData.name || "Unknown User",
          userAvatar: userData.photoURL || "",
          activity: event.type
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

  const getActivityIcon = () => {
    switch (event.type) {
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

  const handleAddComment = () => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: comments.length + 1,
      userId: 999,
      userName: "You",
      userAvatar: "https://i.pravatar.cc/150?img=10",
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
      await deleteEvent(String(event.id), user.uid);
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
          className="w-full max-w-3xl my-8"
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

              <div className="space-y-4">
                {/* Title & Type */}
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-background/80 backdrop-blur-sm rounded-xl">
                    {getActivityIcon()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-2xl sm:text-3xl font-bold pr-8">{event.title}</h2>
                      {event.category === "sponsored" && (
                        <Badge className="bg-warning/10 text-warning border-warning/30 flex-shrink-0">
                          <StarIcon style={{ fontSize: 14 }} className="mr-1" />
                          Sponsored
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-2">{event.description}</p>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-3">
                    <EventIcon style={{ fontSize: 20 }} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-semibold">{event.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-3">
                    <AccessTimeIcon style={{ fontSize: 20 }} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-sm font-semibold">{event.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-3">
                    <LocationOnIcon style={{ fontSize: 20 }} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="text-sm font-semibold">{event.distance} away</p>
                    </div>
                  </div>
                </div>

                {/* Creator Actions - Edit/Delete */}
                {isEventCreator && (
                  <div className="flex gap-3 pb-3 border-b border-border">
                    <Button
                      onClick={handleEdit}
                      variant="outline"
                      className="flex-1 h-12 font-semibold"
                    >
                      <EditIcon className="mr-2" style={{ fontSize: 20 }} />
                      Edit Event
                    </Button>
                    <Button
                      onClick={handleDelete}
                      variant="outline"
                      className="flex-1 h-12 font-semibold text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <DeleteIcon className="mr-2" style={{ fontSize: 20 }} />
                      Delete Event
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => onJoin(event.id)}
                    className={`flex-1 h-12 font-semibold ${
                      event.isJoined
                        ? "bg-success/20 text-success hover:bg-success/30 border-2 border-success"
                        : ""
                    }`}
                    variant={event.isJoined ? "outline" : "default"}
                  >
                    {event.isJoined ? "✓ Joined" : "Join Event"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-4 rounded-none border-b border-border h-auto">
                <TabsTrigger value="details" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <EventIcon className="mr-2" style={{ fontSize: 18 }} />
                  Details
                </TabsTrigger>
                <TabsTrigger value="checkins" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <CheckCircleIcon className="mr-2" style={{ fontSize: 18 }} />
                  Check-ins ({checkIns.length + eventCheckIns.length})
                </TabsTrigger>
                <TabsTrigger value="participants" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <PeopleIcon className="mr-2" style={{ fontSize: 18 }} />
                  Participants ({participantsCount})
                </TabsTrigger>
                <TabsTrigger value="comments" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <ChatBubbleOutlineIcon className="mr-2" style={{ fontSize: 18 }} />
                  Comments ({comments.length})
                </TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="p-6 space-y-6">
                {/* Location */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <LocationOnIcon style={{ fontSize: 20 }} />
                    Location
                  </h3>
                  <div className="bg-muted rounded-xl p-4">
                    <p className="font-semibold">{event.location}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.distance} from your location
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => {
                        if (event.lat && event.lng) {
                          openGoogleMapsNavigation(event.lat, event.lng);
                        } else {
                          toast.error("Location not available");
                        }
                      }}
                    >
                      <NavigationIcon className="mr-2" style={{ fontSize: 16 }} />
                      View on Map
                    </Button>
                  </div>
                </div>

                {/* Event Info */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <EventIcon style={{ fontSize: 20 }} />
                    Event Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-xl p-4">
                      <p className="text-sm text-muted-foreground">Activity Type</p>
                      <p className="font-semibold capitalize mt-1">{event.type}</p>
                    </div>
                    <div className="bg-muted rounded-xl p-4">
                      <p className="text-sm text-muted-foreground">Participants</p>
                      <p className="font-semibold mt-1">
                        {participantsCount}
                        {event.maxParticipants ? ` / ${event.maxParticipants}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Check-ins Tab */}
              <TabsContent value="checkins" className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <CheckCircleIcon style={{ fontSize: 20 }} />
                      Currently Here
                    </h3>
                    {(checkIns.length > 0 || eventCheckIns.length > 0) && (
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {checkIns.length + eventCheckIns.length} checked in
                      </Badge>
                    )}
                  </div>
                  
                  {venue && (
                    <div className="bg-muted rounded-xl p-4 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        This event is at <span className="font-semibold">{venue.name}</span>
                      </p>
                      
                      {checkIns.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">People checked in at this venue:</p>
                          <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {checkIns.map((checkIn) => (
                              <div
                                key={checkIn.userId}
                                className="flex items-center gap-3 p-2 bg-background rounded-lg"
                              >
                                <Avatar
                                  src={checkIn.userAvatar}
                                  alt={checkIn.userName}
                                  sx={{ width: 32, height: 32 }}
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold">{checkIn.userName}</p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {checkIn.activity}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No one checked in yet</p>
                      )}

                      {user && (
                        <Button
                          onClick={isCheckedIn ? checkOut : () => {
                            if (venue) {
                              checkIn(venue.id, { id: venue.id, name: venue.name }, event.type)
                                .then(() => toast.success("Checked in!"))
                                .catch((err) => toast.error(err.message));
                            }
                          }}
                          variant={isCheckedIn ? "outline" : "default"}
                          className="w-full mt-3"
                          disabled={isCheckingIn}
                        >
                          {isCheckedIn ? (
                            <>
                              <CheckCircleIcon className="mr-2" style={{ fontSize: 18 }} />
                              Checked In - Check Out
                            </>
                          ) : (
                            <>
                              <LocationOnIcon className="mr-2" style={{ fontSize: 18 }} />
                              Check In Here
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {eventCheckIns.length > 0 && (
                    <div className="bg-muted rounded-xl p-4 space-y-3">
                      <p className="text-sm font-semibold">People checked in at event location:</p>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {eventCheckIns.map((checkIn: any) => (
                          <div
                            key={checkIn.userId}
                            className="flex items-center gap-3 p-2 bg-background rounded-lg"
                          >
                            <Avatar
                              src={checkIn.userAvatar}
                              alt={checkIn.userName}
                              sx={{ width: 32, height: 32 }}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-semibold">{checkIn.userName}</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {checkIn.activity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!venue && eventCheckIns.length === 0 && (
                    <div className="bg-muted rounded-xl p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        No check-ins yet. Be the first to check in!
                      </p>
                      {user && (
                        <Button
                          onClick={handleEventCheckIn}
                          variant="outline"
                          className="w-full mt-3"
                          disabled={isCheckingIn}
                        >
                          <LocationOnIcon className="mr-2" style={{ fontSize: 18 }} />
                          {isCheckingIn ? "Checking in..." : "Check In Here"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Host/Sponsor */}
                {event.category === "user" && event.hostName ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold">Hosted By</h3>
                    <div className="flex items-center gap-3 bg-muted rounded-xl p-4">
                      <Avatar src={event.hostAvatar} alt={event.hostName} sx={{ width: 48, height: 48 }} />
                      <div className="flex-1">
                        <p className="font-semibold">{event.hostName}</p>
                        <p className="text-sm text-muted-foreground">Event Organizer</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  </div>
                ) : event.sponsorLogo ? (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold">Official Sponsor</h3>
                    <div className="flex items-center gap-3 bg-muted rounded-xl p-4">
                      <img src={event.sponsorLogo} alt="Sponsor" className="w-12 h-12 rounded" />
                      <div className="flex-1">
                        <p className="font-semibold">Sponsored Event</p>
                        <p className="text-sm text-muted-foreground">Official Brand Partnership</p>
                      </div>
                    </div>
                  </div>
                ) : null}

              </TabsContent>

              {/* Participants Tab */}
              <TabsContent value="participants" className="p-6">
                <div className="space-y-3">
                  {participants.map((participant, index) => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-muted rounded-xl hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={participant.avatar} alt={participant.name} sx={{ width: 40, height: 40 }} />
                        <div>
                          <p className="font-semibold">{participant.name}</p>
                          <p className="text-xs text-muted-foreground">Joined {participant.joinedAt}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments" className="p-6 space-y-4">
                {/* Comments List */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {comments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3"
                    >
                      <Avatar src={comment.userAvatar} alt={comment.userName} sx={{ width: 40, height: 40 }} />
                      <div className="flex-1 bg-muted rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm">{comment.userName}</p>
                          <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  <Avatar src="https://i.pravatar.cc/150?img=10" alt="You" sx={{ width: 40, height: 40 }} />
                  <div className="flex-1 flex gap-2">
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <Button onClick={handleAddComment} disabled={!commentText.trim()}>
                      <SendIcon style={{ fontSize: 20 }} />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
