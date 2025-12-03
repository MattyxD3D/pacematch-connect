import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PeopleIcon from "@mui/icons-material/People";
import { toast } from "sonner";
import { deleteEvent, addComment, listenToComments, type EventComment } from "@/services/eventService";
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
  const [comments, setComments] = useState<EventComment[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

  const participantsCount = Array.isArray(event?.participants) 
    ? event.participants.length 
    : (event?.participants || 0);

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

  const handleAddComment = async () => {
    if (!commentText.trim() || !user?.uid || !event?.id) {
      return;
    }

    // Check if user has joined the event
    if (!isUserJoined) {
      toast.error("You must join the event to comment");
      return;
    }

    setIsAddingComment(true);
    try {
      await addComment(
        event.id,
        user.uid,
        user.displayName || user.email?.split('@')[0] || "User",
        user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'User')}`,
        commentText.trim()
      );
      setCommentText("");
      toast.success("Comment added!");
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error(error.message || "Failed to add comment");
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteClick = () => {
    if (!event || !user?.uid) return;
    
    if (event.hostId !== user.uid) {
      toast.error("Only the event creator can delete this event");
      return;
    }

    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!event || !user?.uid) return;

    try {
      await deleteEvent(String(event.id), user.uid);
      toast.success("Event deleted successfully");
      setShowDeleteDialog(false);
      onClose();
      if (onDelete) {
        onDelete(event.id);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete event");
      setShowDeleteDialog(false);
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
            {/* Enhanced Header with Gradient Background */}
            <div className="relative bg-gradient-to-r from-primary via-primary to-success p-6 pb-6 border-b border-primary/20">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-colors z-10"
                aria-label="Close event details"
              >
                <CloseIcon style={{ fontSize: 20 }} className="text-white" />
              </button>

              {/* Distance - Top Right Corner */}
              {event.distanceValue !== Infinity && (
                <div className="absolute top-4 right-16 z-10">
                  <p className="text-sm text-white/90 drop-shadow-sm">
                    {event.distance} away
                  </p>
                </div>
              )}

              <div className="space-y-4 pr-16">
                {/* Title & Type */}
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex-shrink-0">
                    {event.type === "running" && <DirectionsRunIcon className="text-white" style={{ fontSize: 24 }} />}
                    {event.type === "cycling" && <DirectionsBikeIcon className="text-white" style={{ fontSize: 24 }} />}
                    {event.type === "walking" && <DirectionsWalkIcon className="text-white" style={{ fontSize: 24 }} />}
                    {event.type === "others" && <FitnessCenterIcon className="text-white" style={{ fontSize: 24 }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1.5">
                      <h2 className="text-xl sm:text-2xl font-bold text-white truncate drop-shadow-md">{event.title}</h2>
                      {event.category === "sponsored" && (
                        <Badge className="bg-warning/20 text-warning border-warning/40 flex-shrink-0">
                          <StarIcon style={{ fontSize: 12 }} className="mr-1" />
                          Sponsored
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-white/90 line-clamp-2 drop-shadow-sm">{event.description}</p>
                  </div>
                </div>

                {/* Date & Time Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <EventIcon style={{ fontSize: 20 }} className="text-white" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 mb-0.5">Date</p>
                      <p className="text-sm font-semibold text-white">{event.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <AccessTimeIcon style={{ fontSize: 20 }} className="text-white" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 mb-0.5">Time</p>
                      <p className="text-sm font-semibold text-white">{event.time}</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  {/* Creator Actions - Edit/Delete */}
                  {isEventCreator && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleEdit}
                        variant="outline"
                        className="h-12 font-semibold bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                      >
                        <EditIcon className="mr-2" style={{ fontSize: 20 }} />
                        Edit Event
                      </Button>
                      <Button
                        onClick={handleDeleteClick}
                        variant="outline"
                        className="h-12 font-semibold bg-white/10 border-white/30 text-white hover:bg-red-500/20 hover:border-red-400/50 backdrop-blur-sm"
                      >
                        <DeleteIcon className="mr-2" style={{ fontSize: 20 }} />
                        Delete Event
                      </Button>
                    </div>
                  )}

                  {/* Join/Leave Button - Only show if user is not the event owner */}
                  {!isEventCreator && (
                    <Button
                      onClick={() => onJoin(event.id)}
                      className={`w-full h-12 font-semibold transition-all ${
                        event.isJoined
                          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-destructive shadow-lg"
                          : "bg-white/20 backdrop-blur-md text-white border-2 border-white/30 hover:bg-white/30"
                      }`}
                    >
                      {event.isJoined ? (
                        <>
                          <DeleteIcon className="mr-2" style={{ fontSize: 20 }} />
                          Leave Event
                        </>
                      ) : (
                        <>
                          <PeopleIcon className="mr-2" style={{ fontSize: 20 }} />
                          Join Event
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col overflow-hidden">
                <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border h-auto bg-muted/30">
                  <TabsTrigger 
                    value="details" 
                    className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background rounded-none font-semibold"
                  >
                    <EventIcon className="mr-2" style={{ fontSize: 18 }} />
                    Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="comments" 
                    className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-background rounded-none font-semibold"
                  >
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
                        <LocationOnIcon style={{ fontSize: 20 }} className="text-primary" />
                        Location
                      </h3>
                      <div className="bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50 rounded-xl p-4 border-2 border-border/50">
                        <p className="font-semibold text-foreground mb-2">{event.location}</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          {event.distance} from your location
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full sm:w-auto border-2 hover:bg-primary/10 hover:border-primary/50"
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
                        <EventIcon style={{ fontSize: 20 }} className="text-primary" />
                        Event Information
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50 rounded-xl p-4 border-2 border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Activity Type</p>
                          <p className="font-semibold capitalize text-foreground">{event.type}</p>
                        </div>
                        <div className="bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50 rounded-xl p-4 border-2 border-border/50">
                          <p className="text-xs text-muted-foreground mb-1">Participants</p>
                          <p className="font-semibold text-foreground">
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
                        <div className="flex items-center gap-3 bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50 rounded-xl p-4 border-2 border-border/50">
                          <Avatar src={event.hostAvatar} alt={event.hostName} sx={{ width: 48, height: 48 }} />
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{event.hostName}</p>
                            <p className="text-sm text-muted-foreground">Event Organizer</p>
                          </div>
                        </div>
                      </div>
                    ) : event.sponsorLogo ? (
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold">Official Sponsor</h3>
                        <div className="flex items-center gap-3 bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50 rounded-xl p-4 border-2 border-border/50">
                          <img src={event.sponsorLogo} alt="Sponsor" className="w-12 h-12 rounded" />
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">Sponsored Event</p>
                            <p className="text-sm text-muted-foreground">Official Brand Partnership</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </TabsContent>

                  {/* Comments Tab */}
                  <TabsContent value="comments" className="p-6 space-y-4">
                    {!isUserJoined ? (
                      <div className="text-center py-12 bg-muted/50 rounded-lg border border-border">
                        <PeopleIcon style={{ fontSize: 48 }} className="text-muted-foreground mx-auto mb-3" />
                        <p className="text-base font-semibold text-foreground">Join to see comments</p>
                        <p className="text-sm text-muted-foreground mt-1">You must join this event to view and add comments</p>
                      </div>
                    ) : (
                      <>
                        {/* Comments List */}
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                          {comments.length === 0 ? (
                            <div className="text-center py-8 bg-muted/50 rounded-lg border border-border">
                              <ChatBubbleOutlineIcon style={{ fontSize: 48 }} className="text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">No comments yet</p>
                              <p className="text-xs text-muted-foreground mt-1">Be the first to comment!</p>
                            </div>
                          ) : (
                            comments.map((comment, index) => (
                              <motion.div
                                key={comment.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex gap-3"
                              >
                                <Avatar 
                                  src={comment.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName || 'User')}`} 
                                  alt={comment.userName} 
                                  sx={{ width: 40, height: 40 }} 
                                />
                                <div className="flex-1 bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50 rounded-xl p-3 border border-border/50">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="font-semibold text-sm text-foreground">{comment.userName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {comment.timestamp ? new Date(comment.timestamp).toLocaleDateString() : "Just now"}
                                    </p>
                                  </div>
                                  <p className="text-sm text-foreground">{comment.text}</p>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>

                        {/* Add Comment */}
                        <div className="flex gap-2 pt-4 border-t border-border">
                          <Avatar 
                            src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.email || 'User')}`} 
                            alt={user?.displayName || "You"} 
                            sx={{ width: 40, height: 40 }} 
                          />
                          <div className="flex-1 flex gap-2">
                            <Input
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Add a comment..."
                              className="flex-1 bg-muted/50 border-2"
                              disabled={isAddingComment}
                              onKeyPress={(e) => {
                                if (e.key === "Enter" && !e.shiftKey && !isAddingComment) {
                                  e.preventDefault();
                                  handleAddComment();
                                }
                              }}
                            />
                            <Button 
                              onClick={handleAddComment} 
                              disabled={!commentText.trim() || isAddingComment}
                              className="bg-gradient-to-r from-primary via-primary to-success hover:from-primary/90 hover:via-primary/90 hover:to-success/90"
                            >
                              {isAddingComment ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <SendIcon style={{ fontSize: 20 }} />
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event.title}"? This action cannot be undone and will remove the event for all participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatePresence>
  );
};
