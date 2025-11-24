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
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import ShareIcon from "@mui/icons-material/Share";
import SendIcon from "@mui/icons-material/Send";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import LinkIcon from "@mui/icons-material/Link";
import { toast } from "sonner";

type EventType = "running" | "cycling" | "walking";

interface Event {
  id: number;
  title: string;
  description: string;
  type: EventType;
  category: "user" | "sponsored";
  date: string;
  time: string;
  location: string;
  distance: string;
  distanceValue: number;
  participants: number;
  maxParticipants?: number;
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
  onJoin: (eventId: number) => void;
}

export const EventDetailModal = ({ event, onClose, onJoin }: EventDetailModalProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      userId: 1,
      userName: "Sarah Johnson",
      userAvatar: "https://i.pravatar.cc/150?img=1",
      text: "Super excited for this event! Can't wait to meet everyone!",
      timestamp: "2 hours ago",
    },
    {
      id: 2,
      userId: 2,
      userName: "Mike Chen",
      userAvatar: "https://i.pravatar.cc/150?img=2",
      text: "Is there a recommended pace for this run?",
      timestamp: "1 hour ago",
    },
    {
      id: 3,
      userId: 3,
      userName: "Emma Davis",
      userAvatar: "https://i.pravatar.cc/150?img=3",
      text: "Looking forward to it! See you all there 🎉",
      timestamp: "30 minutes ago",
    },
  ]);

  // Mock participants data
  const participants: Participant[] = [
    { id: 1, name: "Sarah Johnson", avatar: "https://i.pravatar.cc/150?img=1", joinedAt: "3 days ago" },
    { id: 2, name: "Mike Chen", avatar: "https://i.pravatar.cc/150?img=2", joinedAt: "2 days ago" },
    { id: 3, name: "Emma Davis", avatar: "https://i.pravatar.cc/150?img=3", joinedAt: "2 days ago" },
    { id: 4, name: "James Wilson", avatar: "https://i.pravatar.cc/150?img=4", joinedAt: "1 day ago" },
    { id: 5, name: "Lisa Anderson", avatar: "https://i.pravatar.cc/150?img=5", joinedAt: "1 day ago" },
    { id: 6, name: "Tom Martinez", avatar: "https://i.pravatar.cc/150?img=6", joinedAt: "12 hours ago" },
    { id: 7, name: "Rachel Green", avatar: "https://i.pravatar.cc/150?img=7", joinedAt: "8 hours ago" },
    { id: 8, name: "David Kim", avatar: "https://i.pravatar.cc/150?img=8", joinedAt: "5 hours ago" },
  ];

  if (!event) return null;

  const getActivityIcon = () => {
    switch (event.type) {
      case "running":
        return <DirectionsRunIcon className="text-success" style={{ fontSize: 24 }} />;
      case "cycling":
        return <DirectionsBikeIcon className="text-primary" style={{ fontSize: 24 }} />;
      case "walking":
        return <DirectionsWalkIcon className="text-warning" style={{ fontSize: 24 }} />;
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

  const handleShare = (method: string) => {
    toast.success(`Event shared via ${method}!`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://app.example.com/events/${event.id}`);
    toast.success("Event link copied to clipboard!");
  };

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
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="sm:w-auto h-12 font-semibold"
                  >
                    <ShareIcon className="mr-2" style={{ fontSize: 20 }} />
                    Share
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border h-auto">
                <TabsTrigger value="details" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <EventIcon className="mr-2" style={{ fontSize: 18 }} />
                  Details
                </TabsTrigger>
                <TabsTrigger value="participants" className="py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <PeopleIcon className="mr-2" style={{ fontSize: 18 }} />
                  Participants ({participants.length})
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
                    <Button variant="outline" size="sm" className="mt-3">
                      <LocationOnIcon className="mr-2" style={{ fontSize: 16 }} />
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
                        {event.participants}
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

                {/* Share Options */}
                <div className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ShareIcon style={{ fontSize: 20 }} />
                    Share Event
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleShare("Message")}
                      className="h-auto flex-col py-3 gap-2"
                    >
                      <SendIcon style={{ fontSize: 24 }} />
                      <span className="text-xs">Message</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      className="h-auto flex-col py-3 gap-2"
                    >
                      <LinkIcon style={{ fontSize: 24 }} />
                      <span className="text-xs">Copy Link</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleShare("Social")}
                      className="h-auto flex-col py-3 gap-2"
                    >
                      <ShareIcon style={{ fontSize: 24 }} />
                      <span className="text-xs">Social</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleShare("More")}
                      className="h-auto flex-col py-3 gap-2"
                    >
                      <ShareIcon style={{ fontSize: 24 }} />
                      <span className="text-xs">More</span>
                    </Button>
                  </div>
                </div>
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
