import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { useMatching } from "@/hooks/useMatching";
import { listenToWorkoutPosts, WorkoutPost as FirebaseWorkoutPost } from "@/services/feedService";
import { listenToUserFriends } from "@/services/friendService";
import { listenToAllUsers, updateUserVisibility } from "@/services/locationService";
import { getUserData } from "@/services/authService";
import { generateDummyWorkoutPosts, ENABLE_DUMMY_DATA } from "@/lib/dummyData";
import { formatDistance, calculateDistance } from "@/utils/distance";
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
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LocationOffIcon from "@mui/icons-material/LocationOff";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import BottomNavigation from "@/components/BottomNavigation";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@mui/material";
import { toast } from "sonner";

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
  const [friendsList, setFriendsList] = useState<string[]>([]);
  const [friendsData, setFriendsData] = useState<Record<string, any>>({});
  const [userVisibility, setUserVisibility] = useState(true);
  // TODO: Set to false in production - this is for preview/demo purposes
  const [showDummyData, setShowDummyData] = useState(true);

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
      // Add dummy posts if enabled and no real posts exist
      if (ENABLE_DUMMY_DATA && posts.length === 0) {
        const dummyPosts = generateDummyWorkoutPosts();
        setWorkoutPosts(dummyPosts);
      } else {
        setWorkoutPosts(posts);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update selectedPost when posts update (for real-time comment/kudos updates)
  useEffect(() => {
    if (selectedPost) {
      const updatedPost = workoutPosts.find(p => p.id === selectedPost.id);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }
    }
  }, [workoutPosts, selectedPost?.id]);

  // Get current user's visibility status
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchUserVisibility = async () => {
      try {
        const userData = await getUserData(currentUser.uid);
        if (userData) {
          setUserVisibility(userData.visible !== false);
        }
      } catch (error) {
        console.error("Error fetching user visibility:", error);
      }
    };

    fetchUserVisibility();
  }, [currentUser?.uid]);

  // Calculate friends online and fetch friends data from Firebase
  useEffect(() => {
    if (!currentUser?.uid) {
      setFriendsOnline(0);
      setFriendsList([]);
      setFriendsData({});
      return;
    }

    let friendsListLocal: string[] = [];
    let allUsers: Record<string, any> = {};

    // Listen to friends list
    const unsubscribeFriends = listenToUserFriends(currentUser.uid, async (friends) => {
      friendsListLocal = friends;
      setFriendsList(friends);
      
      // Fetch friend data for each friend
      const friendsDataMap: Record<string, any> = {};
      for (const friendId of friends) {
        try {
          const friendData = await getUserData(friendId);
          if (friendData) {
            friendsDataMap[friendId] = friendData;
          }
        } catch (error) {
          console.error(`Error fetching friend data for ${friendId}:`, error);
        }
      }
      setFriendsData(friendsDataMap);
      
      calculateFriendsOnline(friends, allUsers);
    });

    // Listen to all users to check who's online
    const unsubscribeUsers = listenToAllUsers((users) => {
      allUsers = users;
      calculateFriendsOnline(friendsListLocal, users);
      
      // Update friends data with latest location info
      setFriendsData((prev) => {
        const updated = { ...prev };
        friendsListLocal.forEach((friendId) => {
          if (users[friendId]) {
            updated[friendId] = { ...updated[friendId], ...users[friendId] };
          }
        });
        return updated;
      });
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

  const handleVisibilityToggle = async (checked: boolean) => {
    if (!currentUser?.uid) return;

    try {
      await updateUserVisibility(currentUser.uid, checked);
      setUserVisibility(checked);
      toast.success(checked ? "Location sharing enabled" : "Location sharing disabled");
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update visibility");
    }
  };

  // Dummy data for preview (remove in production)
  const getDummyActiveFriends = () => {
    if (!showDummyData || !location?.lat || !location?.lng) return [];
    
    const now = Date.now();
    const dummyFriends = [
      {
        id: "dummy-friend-1",
        name: "Sarah Johnson",
        username: "sarah_runs",
        photoURL: "https://i.pravatar.cc/150?img=47",
        activity: "running",
        lat: location.lat + 0.01, // ~1.1km away
        lng: location.lng + 0.01,
        visible: true,
        timestamp: now - 2 * 60 * 1000, // 2 minutes ago
        fitnessLevel: "intermediate",
        pace: 5.2,
      },
      {
        id: "dummy-friend-2",
        name: "Mike Chen",
        username: "mike_cycles",
        photoURL: "https://i.pravatar.cc/150?img=33",
        activity: "cycling",
        lat: location.lat - 0.015, // ~1.7km away
        lng: location.lng + 0.008,
        visible: true,
        timestamp: now - 5 * 60 * 1000, // 5 minutes ago
        fitnessLevel: "pro",
        pace: 25.5,
      },
      {
        id: "dummy-friend-3",
        name: "Emma Wilson",
        username: "emma_walks",
        photoURL: "https://i.pravatar.cc/150?img=20",
        activity: "walking",
        lat: location.lat + 0.008, // ~0.9km away
        lng: location.lng - 0.012,
        visible: true,
        timestamp: now - 1 * 60 * 1000, // 1 minute ago
        fitnessLevel: "beginner",
        pace: 7.8,
      },
    ];

    return dummyFriends.map((friend) => {
      const distanceKm = calculateDistance(
        location.lat,
        location.lng,
        friend.lat,
        friend.lng
      );
      
      return {
        ...friend,
        distanceKm,
      };
    }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  };

  // Get active friends (currently on a workout - recent location update)
  const getActiveFriends = () => {
    const now = Date.now();
    const activeThreshold = 10 * 60 * 1000; // 10 minutes

    const realFriends = friendsList
      .filter((friendId) => {
        const friend = friendsData[friendId];
        if (!friend || !friend.visible) return false;
        
        // Check if friend has recent location update
        if (friend.timestamp) {
          const timeDiff = now - friend.timestamp;
          return timeDiff <= activeThreshold;
        }
        return false;
      })
      .map((friendId) => {
        const friend = friendsData[friendId];
        let distanceKm: number | null = null;
        
        // Calculate distance if both users have locations
        if (location?.lat && location?.lng && friend.lat && friend.lng) {
          distanceKm = calculateDistance(
            location.lat,
            location.lng,
            friend.lat,
            friend.lng
          );
        }
        
        return {
          id: friendId,
          ...friend,
          distanceKm,
        };
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Most recent first

    // If no real friends and dummy data is enabled, show dummy data
    if (realFriends.length === 0 && showDummyData) {
      return getDummyActiveFriends();
    }

    return realFriends;
  };

  const activeFriends = getActiveFriends();

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

        {/* Friends Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">Active Friends</h2>
                  {showDummyData && activeFriends.length > 0 && activeFriends[0]?.id?.startsWith('dummy-') && (
                    <span className="text-xs px-2 py-0.5 bg-warning/20 text-warning rounded-full">
                      Demo Data
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeFriends.length} {activeFriends.length === 1 ? 'friend' : 'friends'} currently active
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {userVisibility ? (
                    <LocationOnIcon className="text-success" style={{ fontSize: 20 }} />
                  ) : (
                    <LocationOffIcon className="text-muted-foreground" style={{ fontSize: 20 }} />
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">Share Location</span>
                    <Switch
                      checked={userVisibility}
                      onCheckedChange={handleVisibilityToggle}
                      className="scale-75"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/friends")}
                  className="text-primary"
                >
                  View All
                </Button>
              </div>
            </div>

            {activeFriends.length === 0 ? (
              <div className="text-center py-8">
                <FitnessCenterIcon className="mx-auto text-muted-foreground" style={{ fontSize: 48 }} />
                <p className="text-muted-foreground mt-4">No active friends right now</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Friends will appear here when they start a workout
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeFriends.map((friend, index) => {
                  const activityIcon = 
                    friend.activity === "running" ? DirectionsRunIcon :
                    friend.activity === "cycling" ? DirectionsBikeIcon :
                    DirectionsWalkIcon;
                  const ActivityIcon = activityIcon;
                  
                  return (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate("/map")}
                    >
                      <div className="relative">
                        <Avatar
                          src={friend.photoURL || `https://ui-avatars.com/api/?name=${friend.name || friend.username || 'Friend'}`}
                          alt={friend.name || friend.username}
                          sx={{ width: 56, height: 56 }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-card flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">
                            {friend.name || friend.username || "Friend"}
                          </h3>
                          <FitnessCenterIcon className="text-success" style={{ fontSize: 16 }} />
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <ActivityIcon 
                            className={
                              friend.activity === "running" ? "text-success" :
                              friend.activity === "cycling" ? "text-primary" :
                              "text-warning"
                            }
                            style={{ fontSize: 16 }}
                          />
                          <span className="text-xs text-muted-foreground capitalize">
                            {friend.activity || "working out"}
                          </span>
                        </div>

                        {friend.distanceKm !== null && (
                          <div className="flex items-center gap-1 mt-1">
                            <LocationOnIcon className="text-primary" style={{ fontSize: 14 }} />
                            <span className="text-xs text-muted-foreground">
                              {formatDistance(friend.distanceKm)} away
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navigate to map and pass friend location as state
                            navigate("/map", {
                              state: {
                                focusFriend: {
                                  id: friend.id,
                                  lat: friend.lat,
                                  lng: friend.lng,
                                  name: friend.name || friend.username,
                                  activity: friend.activity,
                                }
                              }
                            });
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
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
