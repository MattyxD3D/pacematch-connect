import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar } from "@mui/material";
import { WorkoutPost as WorkoutPostType, getMockUserById } from "@/lib/mockData";
import { toggleKudos, getKudosForPost } from "@/lib/socialStorage";
import { ProfileView } from "@/pages/ProfileView";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ShareIcon from "@mui/icons-material/Share";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface WorkoutPostProps {
  post: WorkoutPostType;
  onCommentClick: (post: WorkoutPostType) => void;
  useMetric: boolean;
  currentUserId: number;
}

export const WorkoutPost = ({ post, onCommentClick, useMetric, currentUserId }: WorkoutPostProps) => {
  const user = getMockUserById(post.userId);
  const [kudos, setKudos] = useState<number[]>(getKudosForPost(post.id));
  const [showProfile, setShowProfile] = useState(false);
  const hasKudos = kudos.includes(currentUserId);

  const activityConfig = {
    running: { icon: DirectionsRunIcon, color: "success", label: "Running" },
    cycling: { icon: DirectionsBikeIcon, color: "primary", label: "Cycling" },
    walking: { icon: DirectionsWalkIcon, color: "warning", label: "Walking" },
  };

  const config = activityConfig[post.workout.activity];
  const Icon = config.icon;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const convertDistance = (km: number) => {
    if (useMetric) return `${km.toFixed(1)} km`;
    return `${(km * 0.621371).toFixed(1)} mi`;
  };

  const convertSpeed = (kmh: number) => {
    if (useMetric) return `${kmh.toFixed(1)} km/h`;
    return `${(kmh * 0.621371).toFixed(1)} mph`;
  };

  const handleKudos = () => {
    const nowHasKudos = toggleKudos(post.id, currentUserId);
    setKudos(getKudosForPost(post.id));
    if (nowHasKudos) {
      toast.success("Kudos given!");
    }
  };

  const handleShare = () => {
    toast.success("Share feature coming soon!");
  };

  if (!user) return null;

  return (
    <>
      <Card className="p-4 space-y-4 hover:shadow-elevation-2 transition-shadow">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Avatar 
            src={user.avatar} 
            alt={user.username} 
            sx={{ width: 48, height: 48 }}
            className="cursor-pointer"
            onClick={() => setShowProfile(true)}
          />
          <div className="flex-1">
            <h3 
              className="font-bold cursor-pointer hover:text-primary transition-colors"
              onClick={() => setShowProfile(true)}
            >
              {user.username}
            </h3>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(post.timestamp, { addSuffix: true })}
          </p>
        </div>
        <div
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
            config.color === "success"
              ? "bg-success/10 text-success"
              : config.color === "primary"
              ? "bg-primary/10 text-primary"
              : "bg-warning/10 text-warning"
          }`}
        >
          <Icon style={{ fontSize: 16 }} />
          <span className="text-xs font-medium">{config.label}</span>
        </div>
      </div>

      {/* Caption */}
      {post.caption && <p className="text-sm">{post.caption}</p>}

      {/* Workout Stats */}
      <div className="grid grid-cols-4 gap-2 bg-muted/50 rounded-lg p-3">
        <div className="text-center">
          <div className="text-lg font-bold">{formatTime(post.workout.duration)}</div>
          <div className="text-xs text-muted-foreground">Time</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{convertDistance(post.workout.distance)}</div>
          <div className="text-xs text-muted-foreground">Distance</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{convertSpeed(post.workout.avgSpeed)}</div>
          <div className="text-xs text-muted-foreground">Pace</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{post.workout.calories}</div>
          <div className="text-xs text-muted-foreground">Cal</div>
        </div>
      </div>

      {/* Photos */}
      {post.photos && post.photos.length > 0 && (
        <div className={`grid gap-2 ${post.photos.length === 1 ? 'grid-cols-1' : post.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {post.photos.slice(0, 3).map((photo, idx) => (
            <div
              key={idx}
              className={`relative rounded-lg overflow-hidden ${post.photos!.length === 3 && idx === 0 ? 'col-span-2' : ''}`}
              style={{ paddingTop: post.photos!.length === 1 ? '56.25%' : '100%' }}
            >
              <img
                src={photo}
                alt={`Workout photo ${idx + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Location */}
      {post.workout.location && (
        <p className="text-xs text-muted-foreground">📍 {post.workout.location}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-2 border-t border-border">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleKudos}
          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
        >
          {hasKudos ? (
            <FavoriteIcon className="text-red-500" style={{ fontSize: 20 }} />
          ) : (
            <FavoriteBorderIcon style={{ fontSize: 20 }} />
          )}
          <span className="font-medium">{kudos.length}</span>
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onCommentClick(post)}
          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
        >
          <ChatBubbleOutlineIcon style={{ fontSize: 20 }} />
          <span className="font-medium">{post.comments.length}</span>
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="flex items-center gap-2 text-sm hover:text-primary transition-colors ml-auto"
        >
          <ShareIcon style={{ fontSize: 20 }} />
        </motion.button>
      </div>

        {/* Kudos summary */}
        {kudos.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {kudos.length === 1 ? "1 kudos" : `${kudos.length} kudos`}
          </p>
        )}
      </Card>

      {/* Profile View Modal */}
      <AnimatePresence>
        {showProfile && (
          <ProfileView
            user={{
              id: user.id,
              name: user.username,
              distance: "2.5 km",
              activity: post.workout.activity.charAt(0).toUpperCase() + post.workout.activity.slice(1),
              avatar: user.avatar,
              photos: user.photos,
              bio: user.bio,
            }}
            friendStatus="not_friends"
            onClose={() => setShowProfile(false)}
            onSendMessage={() => {
              setShowProfile(false);
              toast.success(`Opening chat with ${user.username}`);
            }}
            onAddFriend={() => {
              toast.success(`Friend request sent to ${user.username}`);
            }}
            onAcceptFriend={() => {}}
            onDeclineFriend={() => {}}
          />
        )}
      </AnimatePresence>
    </>
  );
};
