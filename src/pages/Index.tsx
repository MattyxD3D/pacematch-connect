import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { mockWorkoutPosts, WorkoutPost as WorkoutPostType } from "@/lib/mockData";
import { WorkoutPost } from "@/components/WorkoutPost";
import { CommentDrawer } from "@/components/CommentDrawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HomeIcon from "@mui/icons-material/Home";
import MapIcon from "@mui/icons-material/Map";
import EventIcon from "@mui/icons-material/Event";
import ChatIcon from "@mui/icons-material/Chat";
import PersonIcon from "@mui/icons-material/Person";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import BottomNavigation from "@/components/BottomNavigation";

const Index = () => {
  const navigate = useNavigate();
  const { userProfile, workoutHistory, useMetric } = useUser();
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<WorkoutPostType | null>(null);
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);

  // Mock current user ID
  const currentUserId = 999;

  // Filter posts based on selected activity
  const filteredPosts = selectedTab === "all"
    ? mockWorkoutPosts
    : mockWorkoutPosts.filter(post => post.workout.activity === selectedTab);

  // Calculate quick stats
  const thisWeekWorkouts = workoutHistory.filter(w => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return w.date >= weekAgo;
  }).length;

  const totalDistance = workoutHistory.reduce((sum, w) => sum + w.distance, 0);
  const friendsOnline = 8; // Mock value

  const handleCommentClick = (post: WorkoutPostType) => {
    setSelectedPost(post);
    setIsCommentDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md shadow-elevation-2 sticky top-0 z-10 border-b border-border/50"
      >
        <div className="max-w-4xl mx-auto px-6 py-5">
          <h1 className="text-3xl font-bold mb-1">Welcome back, {userProfile?.username || "Athlete"}! 👋</h1>
          <p className="text-sm text-muted-foreground">Stay connected with your fitness community</p>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-success/10">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{thisWeekWorkouts}</div>
                <div className="text-xs text-muted-foreground mt-1">Workouts this week</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success">
                  {useMetric ? totalDistance.toFixed(0) : (totalDistance * 0.621371).toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total {useMetric ? "km" : "mi"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-warning">{friendsOnline}</div>
                <div className="text-xs text-muted-foreground mt-1">Friends online</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Activity Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-12">
              <TabsTrigger value="all" className="text-xs">All Friends</TabsTrigger>
              <TabsTrigger value="running" className="text-xs">
                <DirectionsRunIcon style={{ fontSize: 16 }} className="mr-1" />
                Running
              </TabsTrigger>
              <TabsTrigger value="cycling" className="text-xs">
                <DirectionsBikeIcon style={{ fontSize: 16 }} className="mr-1" />
                Cycling
              </TabsTrigger>
              <TabsTrigger value="walking" className="text-xs">
                <DirectionsWalkIcon style={{ fontSize: 16 }} className="mr-1" />
                Walking
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {filteredPosts.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No workouts to show yet</p>
              <p className="text-sm text-muted-foreground mt-2">Start a workout to see it here!</p>
              <Button onClick={() => navigate("/map")} className="mt-4">
                Go to Map
              </Button>
            </Card>
          ) : (
            filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <WorkoutPost
                  post={post}
                  onCommentClick={handleCommentClick}
                  useMetric={useMetric}
                  currentUserId={currentUserId}
                />
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      {/* Comment Drawer */}
      <CommentDrawer
        isOpen={isCommentDrawerOpen}
        post={selectedPost}
        onClose={() => setIsCommentDrawerOpen(false)}
        currentUserId={currentUserId}
        currentUsername={userProfile?.username || "You"}
        currentAvatar="https://i.pravatar.cc/150?img=5"
      />
      
      <BottomNavigation />
    </div>
  );
};

export default Index;
