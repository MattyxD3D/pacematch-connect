import { useState } from "react";
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
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import SendIcon from "@mui/icons-material/Send";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import NavigationIcon from "@mui/icons-material/Navigation";
import { toast } from "sonner";
import { deleteEvent } from "@/services/eventService";
import { useAuth } from "@/hooks/useAuth";
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

  const participantsCount = Array.isArray(event?.participants) 
    ? event.participants.length 
    : (event?.participants || 0);

  if (!event) return null;

  const getActivityIcon = () => {
    switch (event.type) {
      case "running":
        return <DirectionsRunIcon className="text-success" style={{ fontSize: 24 }} />;
      case "cycling":
        return <DirectionsBikeIcon className="text-primary" style={{ fontSize: 24 }} />;
      case "walking":
        return <DirectionsWalkIcon className="text-warning" style={{ fontSize: 24 }} />;
      case "others":
      default:
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
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[80] flex items-center justify-center p-0 md:p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-full md:h-auto md:max-w-3xl my-0 md:my-8 flex"
        >
          <Card className="flex flex-col h-full md:h-auto overflow-hidden shadow-elevation-4 border-2 border-border/50 w-full">
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

                {/* Join/Leave Button */}
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
                    {event.isJoined ? "✓ Joined - Leave Event" : "Join Event"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border h-auto">
                  <TabsTrigger value="details" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                    <EventIcon className="mr-2" style={{ fontSize: 18 }} />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="comments" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                    <ChatBubbleOutlineIcon className="mr-2" style={{ fontSize: 18 }} />
                    Comments ({comments.length})
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto">
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
                </div>
              </Tabs>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
