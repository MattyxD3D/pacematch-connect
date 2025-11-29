import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { getUserData } from "@/services/authService";
import { deleteEvent, addComment, listenToComments, deleteComment, type EventComment } from "@/services/eventService";
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

interface ParticipantData {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  activity?: string;
  activities?: string[];
}

// Using EventComment from eventService for type consistency

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
  const [comments, setComments] = useState<EventComment[]>([]);
  const [participantsData, setParticipantsData] = useState<ParticipantData[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Check if current user has joined the event
  const isUserJoined = event && user?.uid && Array.isArray(event.participants) && event.participants.includes(user.uid);

  // Listen to comments from Firebase
  useEffect(() => {
    if (!event?.id) {
      setComments([]);
      return;
    }

    const unsubscribe = listenToComments(event.id, (fetchedComments) => {
      setComments(fetchedComments);
    });

    return () => {
      unsubscribe();
    };
  }, [event?.id]);

  // Fetch participant profiles when event changes
  useEffect(() => {
    if (!event?.participants || !Array.isArray(event.participants)) {
      setParticipantsData([]);
      return;
    }

    const fetchParticipants = async () => {
      setLoadingParticipants(true);
      try {
        const participantPromises = event.participants.map(async (userId: string) => {
          try {
            const userData = await getUserData(userId);
            if (userData) {
              return {
                id: userId,
                name: userData.name || userData.username || "User",
                username: userData.username,
                avatar: userData.photoURL || `https://ui-avatars.com/api/?name=${userData.name || userData.username || 'User'}`,
                activity: userData.activity,
                activities: userData.activities || (userData.activity ? [userData.activity] : []),
              };
            }
            return null;
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return null;
          }
        });

        const results = await Promise.all(participantPromises);
        setParticipantsData(results.filter((p): p is ParticipantData => p !== null));
      } catch (error) {
        console.error("Error fetching participants:", error);
      } finally {
        setLoadingParticipants(false);
      }
    };

    fetchParticipants();
  }, [event?.participants]);

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

  const getSmallActivityIcon = (activity: string) => {
    switch (activity) {
      case "running":
        return <DirectionsRunIcon className="text-success" style={{ fontSize: 14 }} />;
      case "cycling":
        return <DirectionsBikeIcon className="text-primary" style={{ fontSize: 14 }} />;
      case "walking":
        return <DirectionsWalkIcon className="text-warning" style={{ fontSize: 14 }} />;
      default:
        return null;
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !event || !user?.uid) return;

    // Check if user has joined the event
    if (!isUserJoined) {
      toast.error("Please join the event to add comments");
      return;
    }

    setIsAddingComment(true);
    try {
      await addComment(
        event.id,
        user.uid,
        user.displayName || "User",
        user.photoURL || "",
        commentText.trim()
      );
      setCommentText("");
      toast.success("Comment added!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add comment");
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!event || !user?.uid) return;

    setDeletingCommentId(commentId);
    try {
      await deleteComment(event.id, commentId, user.uid);
      toast.success("Comment deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete comment");
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Check if user can delete a comment (author or event host)
  const canDeleteComment = (comment: EventComment) => {
    if (!user?.uid || !event) return false;
    return comment.userId === user.uid || event.hostId === user.uid;
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
            className="fixed left-0 right-0 z-40 bg-card border-t border-border rounded-t-3xl shadow-elevation-4"
            style={{ 
              bottom: `calc(4.5rem + env(safe-area-inset-bottom, 0px))`,
              maxHeight: "calc(100vh - 6rem - env(safe-area-inset-bottom, 0px))"
            }}
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

          <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 10rem)" }}>
            <div className="p-4 pb-8 space-y-4">
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

              {/* Event Creator/Host Section */}
              {event.hostName && (
                <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                  <Avatar 
                    src={event.hostAvatar} 
                    alt={event.hostName} 
                    sx={{ width: 40, height: 40 }} 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{event.hostName}</p>
                    <p className="text-xs text-muted-foreground">Event Organizer</p>
                  </div>
                </div>
              )}

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

              {/* Join/Leave Button */}
              <Button
                onClick={() => {
                  if (event.isJoined) {
                    onLeave(event.id);
                  } else {
                    onJoin(event.id);
                  }
                }}
                className={`w-full min-h-[44px] ${
                  event.isJoined
                    ? "bg-success/20 text-success hover:bg-success/30 border-2 border-success"
                    : ""
                }`}
                variant={event.isJoined ? "outline" : "default"}
              >
                {event.isJoined ? (
                  <>
                    <CheckCircleIcon style={{ fontSize: 18 }} className="mr-2" />
                    <span>Joined - Leave Event</span>
                  </>
                ) : (
                  <span>Join Event</span>
                )}
              </Button>

              {/* Participants Section */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <PeopleIcon style={{ fontSize: 18 }} />
                  Who's Joining ({participantsCount})
                </h3>

                {loadingParticipants ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-xs text-muted-foreground mt-2">Loading...</p>
                  </div>
                ) : participantsData.length === 0 ? (
                  <div className="text-center py-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">No participants yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Be the first to join!</p>
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {participantsData.map((participant, index) => {
                      const activities = participant.activities || [];
                      const isCurrentUser = participant.id === user?.uid;

                      return (
                        <motion.div
                          key={participant.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex flex-col items-center p-2 border border-border rounded-lg bg-card hover:bg-secondary transition-colors min-w-[70px] flex-shrink-0 ${
                            isCurrentUser ? "ring-2 ring-primary/60" : ""
                          }`}
                        >
                          <Avatar
                            src={participant.avatar}
                            alt={participant.name}
                            sx={{ width: 40, height: 40 }}
                          />
                          <p className="text-xs font-medium mt-1.5 text-center truncate w-full max-w-[60px]">
                            {isCurrentUser ? "You" : participant.name}
                          </p>
                          {activities.length > 0 && (
                            <div className="flex gap-0.5 mt-1">
                              {activities.map((activity) => (
                                <span key={activity}>
                                  {getSmallActivityIcon(activity)}
                                </span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-3">Comments</h3>

                {/* Comments List */}
                <div className="space-y-3 mb-4 max-h-32 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-2 group">
                        <Avatar
                          src={comment.userAvatar}
                          alt={comment.userName}
                          sx={{ width: 32, height: 32 }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{comment.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.timestamp).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {canDeleteComment(comment) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deletingCommentId === comment.id}
                                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive disabled:opacity-50"
                                title="Delete comment"
                              >
                                <DeleteIcon style={{ fontSize: 16 }} />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-foreground mt-1">{comment.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                {isUserJoined ? (
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
                      disabled={isAddingComment}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || isAddingComment}
                      size="icon"
                    >
                      <SendIcon style={{ fontSize: 18 }} />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2 bg-muted/50 rounded-lg">
                    Join this event to add comments
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
};
