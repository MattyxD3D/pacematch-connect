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
  onShowRoute?: (lat: number, lng: number) => void;
}

export const EventDetailsPanel = ({ event, onClose, onJoin, onLeave, onEdit, onDelete, onShowRoute }: EventDetailsPanelProps) => {
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
    if (!isUserJoined && !event.isJoined) {
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
            className="fixed left-0 right-0 z-40 bg-card border-t border-border rounded-t-3xl shadow-elevation-4 flex flex-col"
            style={{ 
              bottom: `calc(4.5rem + env(safe-area-inset-bottom, 0px))`,
              maxHeight: "calc(100vh - 4.5rem - env(safe-area-inset-bottom, 0px))",
              height: "calc(100vh - 4.5rem - env(safe-area-inset-bottom, 0px))"
            }}
          >
          {/* Enhanced Header with Gradient Background */}
          <div className="relative bg-gradient-to-r from-primary via-primary to-success p-4 pb-6 rounded-t-3xl flex-shrink-0">
            {/* Drag Handle */}
            <div className="flex justify-center mb-3">
              <div className="w-12 h-1.5 bg-white/30 rounded-full" />
            </div>

            {/* Close Button - Top Right */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-colors touch-target z-10"
              aria-label="Close event details"
            >
              <CloseIcon style={{ fontSize: 20 }} className="text-white" />
            </button>


            {/* Event Header */}
            <div className="flex items-start gap-3 pr-24">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                {getActivityIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white truncate drop-shadow-md">{event.title}</h2>
                <p className="text-sm text-white/90 mt-1 line-clamp-2 drop-shadow-sm">
                  {event.description}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0">
            <div className="p-4 pb-8 space-y-4">

              {/* Who's Joining Section - Prominent, Moved Up */}
              <div className="bg-gradient-to-br from-primary/10 via-success/5 to-primary/10 rounded-xl p-5 border-2 border-primary/30 shadow-lg">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <PeopleIcon style={{ fontSize: 24 }} className="text-primary" />
                  Who's Joining ({participantsCount})
                </h3>

                {loadingParticipants ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-3">Loading participants...</p>
                  </div>
                ) : participantsData.length === 0 ? (
                  <div className="text-center py-8 bg-muted/50 rounded-lg border border-border">
                    <PeopleIcon style={{ fontSize: 48 }} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-base font-semibold text-foreground">No participants yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Be the first to join!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {participantsData.map((participant, index) => {
                      const activities = participant.activities || [];
                      const isCurrentUser = participant.id === user?.uid;

                      return (
                        <motion.div
                          key={participant.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex flex-col items-center p-3 border-2 rounded-xl bg-card hover:bg-secondary transition-all ${
                            isCurrentUser ? "border-primary ring-2 ring-primary/40 bg-primary/5" : "border-border"
                          }`}
                        >
                          <Avatar
                            src={participant.avatar}
                            alt={participant.name}
                            sx={{ width: 64, height: 64 }}
                            className={isCurrentUser ? "ring-2 ring-primary" : ""}
                          />
                          <p className="text-sm font-semibold mt-2 text-center truncate w-full">
                            {isCurrentUser ? "You" : participant.name}
                          </p>
                          {activities.length > 0 && (
                            <div className="flex gap-1 mt-1">
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

              {/* Combined Date & Time Card */}
              <div className="bg-gradient-to-br from-background via-primary/5 via-success/5 to-background rounded-xl p-4 border-2 border-primary/20 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2.5 bg-primary/15 rounded-lg">
                      <EventIcon style={{ fontSize: 20 }} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">Date</p>
                      <p className="text-sm font-bold text-foreground truncate">{event.date}</p>
                    </div>
                  </div>
                  <div className="w-px h-12 bg-border"></div>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2.5 bg-success/15 rounded-lg">
                      <AccessTimeIcon style={{ fontSize: 20 }} className="text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">Time</p>
                      <p className="text-sm font-bold text-foreground truncate">{event.time}</p>
                    </div>
                  </div>
                </div>
                {/* Distance - Subtle text below */}
                {event.distanceValue !== Infinity && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center">
                      📍 {event.distance} away
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons - Horizontal Layout */}
              <div className="flex gap-3">
                {/* View on Map Button - Enhanced */}
                <Button
                  onClick={() => {
                    if (event.lat && event.lng) {
                      // If onShowRoute callback is provided, show route on map
                      // Otherwise, fallback to opening Google Maps externally
                      if (onShowRoute) {
                        onShowRoute(event.lat, event.lng);
                        // Close the panel after showing route
                        onClose();
                      } else {
                        openGoogleMapsNavigation(event.lat, event.lng);
                      }
                    } else {
                      toast.error("Location not available");
                    }
                  }}
                  className="flex-1 min-h-[52px] text-base font-semibold text-white bg-gradient-to-r from-primary via-primary to-success hover:from-primary/90 hover:via-primary/90 hover:to-success/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
                >
                  <NavigationIcon style={{ fontSize: 20 }} className="mr-2" />
                  <span>View on Map</span>
                </Button>

                {/* Join/Leave Button - Enhanced */}
                <Button
                  onClick={() => {
                    if (event.isJoined || isUserJoined) {
                      onLeave(event.id);
                    } else {
                      onJoin(event.id);
                    }
                  }}
                  className={`flex-1 min-h-[52px] text-base font-semibold transition-all ${
                    event.isJoined || isUserJoined
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-destructive shadow-lg shadow-destructive/30"
                      : "bg-gradient-to-r from-primary via-primary to-success hover:from-primary/90 hover:via-primary/90 hover:to-success/90 text-white shadow-lg shadow-primary/30"
                  }`}
                  variant="default"
                >
                  {event.isJoined || isUserJoined ? (
                    <>
                      <CheckCircleIcon style={{ fontSize: 20 }} className="mr-2" />
                      <span className="hidden sm:inline">Joined - Leave</span>
                      <span className="sm:hidden">Leave</span>
                    </>
                  ) : (
                    <>
                      <PeopleIcon style={{ fontSize: 20 }} className="mr-2" />
                      <span>Join Event</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Event Creator/Host Section - Enhanced */}
              {event.hostName && (
                <div className="bg-gradient-to-br from-muted/60 via-muted/40 to-muted/60 rounded-xl p-4 border border-border/50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar 
                        src={event.hostAvatar} 
                        alt={event.hostName} 
                        sx={{ width: 48, height: 48 }} 
                        className="ring-2 ring-primary/20"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                        <CheckCircleIcon style={{ fontSize: 12 }} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{event.hostName}</p>
                      <p className="text-xs text-muted-foreground font-medium">Event Organizer</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Creator Actions - Edit/Delete - Enhanced */}
              {isEventCreator && (
                <div className="flex gap-3 pb-3 border-b border-border/50">
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    className="flex-1 min-h-[48px] border-2 hover:bg-primary/10 hover:border-primary/50 font-semibold"
                  >
                    <EditIcon style={{ fontSize: 20 }} className="mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Edit Event</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="outline"
                    className="flex-1 min-h-[48px] border-2 border-destructive/50 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive font-semibold"
                  >
                    <DeleteIcon style={{ fontSize: 20 }} className="mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Delete Event</span>
                    <span className="sm:hidden">Delete</span>
                  </Button>
                </div>
              )}

              {/* Comments Section */}
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-3">Comments</h3>

                {(isUserJoined || event.isJoined) ? (
                  <>
                    {/* Comments List */}
                    <div className="space-y-3 mb-4 max-h-32 overflow-y-auto">
                      {comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No comments yet</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex gap-2 group">
                            <Avatar
                              src={comment.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName || 'User')}`}
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
                        {isAddingComment ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <SendIcon style={{ fontSize: 18 }} />
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 bg-muted/50 rounded-lg border border-border">
                    <PeopleIcon style={{ fontSize: 32 }} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">Join to see comments</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You must join this event to view and add comments
                    </p>
                  </div>
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
