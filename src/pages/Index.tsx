import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { useMatching } from "@/hooks/useMatching";
import { listenToWorkoutPosts, WorkoutPost as FirebaseWorkoutPost } from "@/services/feedService";
import { listenToUserFriends } from "@/services/friendService";
import { listenToAllUsers } from "@/services/locationService";
import { formatDistance } from "@/utils/distance";
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
  const { user: currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [selectedPost, setSelectedPost] = useState<FirebaseWorkoutPost | null>(null);
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [workoutPosts, setWorkoutPosts] = useState<FirebaseWorkoutPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendsOnline, setFriendsOnline] = useState(0);

  // Get user location for matching
  const { location } = useLocation(currentUser?.uid || null, false, true);
  
  // Memoize visibility object to prevent infinite loops
  const defaultVisibility = useMemo(() => ({
    visibleToAllLevels: true,
    allowedLevels: ["beginner", "intermediate", "pro"] as const
  }), []);
  
  const visibility = useMemo(() => 
    userProfile?.visibility || defaultVisibility,
    [userProfile?.visibility, defaultVisibility]
  );
  
  // Get top matches
  const { matches: topMatches } = useMatching({
    currentUserId: currentUser?.uid || "",
    currentLocation: location,
    activity: userProfile?.activities?.[0] || "running",
    fitnessLevel: userProfile?.fitnessLevel || "intermediate",
    pace: userProfile?.pace,
    visibility,
    radiusPreference: userProfile?.radiusPreference || "normal"
  });

  // Listen to workout posts from Firebase
  useEffect(() => {
    const unsubscribe = listenToWorkoutPosts((posts) => {
      setWorkoutPosts(posts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate friends online from Firebase
  useEffect(() => {
    if (!currentUser?.uid) {
      setFriendsOnline(0);
      return;
    }

    let friendsList: string[] = [];
    let allUsers: Record<string, any> = {};

    // Listen to friends list
    const unsubscribeFriends = listenToUserFriends(currentUser.uid, (friends) => {
      friendsList = friends;
      calculateFriendsOnline(friendsList, allUsers);
    });

    // Listen to all users to check who's online
    const unsubscribeUsers = listenToAllUsers((users) => {
      allUsers = users;
      calculateFriendsOnline(friendsList, allUsers);
    });

    const calculateFriendsOnline = (friends: string[], users: Record<string, any>) => {
      if (friends.length === 0) {
        setFriendsOnline(0);
        return;
      }

      const now = Date.now();
      const onlineThreshold = 10 * 60 * 1000; // 10 minutes in milliseconds
      
      const onlineCount = friends.filter((friendId) => {
        const user = users[friendId];
        if (!user || !user.visible) return false;
        
        // Check if user has recent location update (within last 10 minutes)
        if (user.timestamp) {
          const timeDiff = now - user.timestamp;
          return timeDiff <= onlineThreshold;
        }
        
        return false;
      }).length;

      setFriendsOnline(onlineCount);
    };

    return () => {
      unsubscribeFriends();
      unsubscribeUsers();
    };
  }, [currentUser?.uid]);

  // Use Firebase workout posts
  const allPosts = workoutPosts;

  // Filter posts based on selected activity
  const filteredPosts = selectedTab === "all"
    ? allPosts
    : allPosts.filter(post => post.workout.activity === selectedTab);

  // Calculate quick stats
  const thisWeekWorkouts = workoutHistory.filter(w => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return w.date >= weekAgo;
  }).length;

  const totalDistance = workoutHistory.reduce((sum, w) => sum + w.distance, 0);

  const handleCommentClick = (post: FirebaseWorkoutPost) => {
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

        {/* Top Matches Section */}
        {topMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Top Matches</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/map")}
                  className="text-primary"
                >
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topMatches.slice(0, 3).map((match, index) => {
                  const user = match.user;
                  const distanceKm = match.distance / 1000;
                  const score = match.score;
                  
                  return (
                    <motion.div
                      key={user.uid}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate("/map")}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <img
                            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.name || 'User'}`}
                            alt={user.name}
                            className="w-12 h-12 rounded-full border-2 border-primary"
                          />
                          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                            score >= 0.8 ? "bg-success text-white" :
                            score >= 0.6 ? "bg-primary text-white" :
                            "bg-warning text-white"
                          }`}>
                            {Math.round(score * 100)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{user.name || "User"}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{formatDistance(distanceKm)}</span>
                            <span>•</span>
                            <span className="capitalize">{user.activity}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                              {user.fitnessLevel}
                            </span>
                            {user.pace > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {user.activity === "cycling"
                                  ? `${user.pace.toFixed(1)} km/h`
                                  : `${user.pace.toFixed(1)} min/km`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

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
          {loading ? (
            <Card className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading workouts...</p>
            </Card>
          ) : filteredPosts.length === 0 ? (
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
                  currentUserId={currentUser?.uid || ""}
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
        currentUserId={currentUser?.uid || ""}
        currentUsername={userProfile?.username || currentUser?.displayName || "You"}
        currentAvatar={currentUser?.photoURL || ""}
      />
      
      <BottomNavigation />
    </div>
  );
};

export default Index;
