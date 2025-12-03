import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser, FitnessLevel } from "@/contexts/UserContext";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { useMatching } from "@/hooks/useMatching";
import { listenToWorkoutPosts, WorkoutPost as FirebaseWorkoutPost } from "@/services/feedService";
import { listenToUserFriends, listenToFriendRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } from "@/services/friendService";
import { listenToAllUsers, updateUserVisibility } from "@/services/locationService";
import { getUserData, updateUserProfile } from "@/services/authService";
import { reportUser, blockUser } from "@/services/userService";
import { generateDummyWorkoutPosts, ENABLE_DUMMY_DATA } from "@/lib/dummyData";
import { formatDistance, calculateDistance } from "@/utils/distance";
import { WorkoutPost } from "@/components/WorkoutPost";
import { CommentDrawer } from "@/components/CommentDrawer";
import { WorkoutHistoryFeed } from "@/components/WorkoutHistoryFeed";
import { ProfileView } from "@/pages/ProfileView";
import { WorkoutWithUser } from "@/services/workoutService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import MailIcon from "@mui/icons-material/Mail";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import EditIcon from "@mui/icons-material/Edit";
import BottomNavigation from "@/components/BottomNavigation";
import { NotificationBell } from "@/components/NotificationBell";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@mui/material";
import { toast } from "sonner";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { QuickCheckInModal } from "@/components/QuickCheckInModal";
import { listenToUserVenuePreferences, listenToUsersByVenues, VenueUser } from "@/services/venuePreferenceService";
import { getAllVenues, getVenueById } from "@/services/venueService";
import { getProfilePictureUrl } from "@/utils/profilePicture";
import { WeatherWidget } from "@/components/WeatherWidget";
import { getLocationForWeather } from "@/utils/getLocationForWeather";

type FriendStatus = "not_friends" | "request_pending" | "request_received" | "friends" | "denied";

const Index = () => {
  const navigate = useNavigate();
  const { userProfile, workoutHistory, useMetric } = useUser();
  const { user: currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [activeFriendsTab, setActiveFriendsTab] = useState<"active" | "history">("history");
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("all");
  const [selectedPost, setSelectedPost] = useState<FirebaseWorkoutPost | null>(null);
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [workoutPosts, setWorkoutPosts] = useState<FirebaseWorkoutPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendsOnline, setFriendsOnline] = useState(0);
  const [friendsList, setFriendsList] = useState<string[]>([]);
  const [friendsData, setFriendsData] = useState<Record<string, any>>({});
  const [userVisibility, setUserVisibility] = useState(true);
  const [selectedWorkoutHistoryItem, setSelectedWorkoutHistoryItem] = useState<WorkoutWithUser | null>(null);
  const [selectedActiveFriend, setSelectedActiveFriend] = useState<{ id: string; name?: string; username?: string; photoURL?: string; activity?: string } | null>(null);
  const [friendRequests, setFriendRequests] = useState<{ incoming: string[]; outgoing: string[] }>({ incoming: [], outgoing: [] });
  const [friendStatuses, setFriendStatuses] = useState<Record<string, { status: FriendStatus; cooldownUntil?: number }>>({});
  // Dummy data flag - controlled by environment variable for production
  // Set VITE_ENABLE_DUMMY_DATA=false in production
  const [showDummyData, setShowDummyData] = useState(ENABLE_DUMMY_DATA);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [generalLocation, setGeneralLocation] = useState<string>("");
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [showQuickCheckIn, setShowQuickCheckIn] = useState(false);
  const [usersByVenue, setUsersByVenue] = useState<Record<string, VenueUser[]>>({});
  const [userVenuePreferences, setUserVenuePreferences] = useState<{ venues: string[]; activities: string[] } | null>(null);
  const [username, setUsername] = useState<string>("");
  const [activeFriendData, setActiveFriendData] = useState<any>(null);
  const [loadingActiveFriendData, setLoadingActiveFriendData] = useState(false);
  
  // Notification context
  const { unreadCount, notifications, dismissNotification, markAllAsRead, handleNotificationTap } = useNotificationContext();

  // Get user location for matching
  const { location: trackingLocation } = useLocation(currentUser?.uid || null, false, true);
  
  // Get location for weather widget (one-time request on sign-in)
  const [weatherLocation, setWeatherLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Request location permission and get location for weather when user signs in
  useEffect(() => {
    if (!currentUser?.uid) {
      setWeatherLocation(null);
      return;
    }

    const fetchWeatherLocation = async () => {
      // Try to get location for weather widget
      const loc = await getLocationForWeather();
      if (loc) {
        setWeatherLocation(loc);
      }
    };

    // Request location after a short delay to ensure user is fully authenticated
    const timer = setTimeout(() => {
      fetchWeatherLocation();
    }, 500);

    return () => clearTimeout(timer);
  }, [currentUser?.uid]);
  
  // Use weather location if available, otherwise fall back to tracking location
  const location = weatherLocation || trackingLocation;
  
  // Memoize visibility object to prevent infinite loops
  const defaultVisibility = useMemo(() => ({
    visibleToAllLevels: true,
    allowedLevels: ["beginner", "intermediate", "pro"] as FitnessLevel[]
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

  // Get current user's visibility status and profile discovery settings
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchUserSettings = async () => {
      try {
        const userData = await getUserData(currentUser.uid);
        if (userData) {
          setUserVisibility(userData.visible !== false);
          setProfileVisible(userData.profileVisible !== false);
          setGeneralLocation(userData.generalLocation || "");
          // Load username from Firebase (stored as 'name' field)
          if (userData.name) {
            setUsername(userData.name);
          }
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
      }
    };

    fetchUserSettings();
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

  // Listen to friend requests
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = listenToFriendRequests(currentUser.uid, (requests) => {
      setFriendRequests(requests);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Mark all notifications as read when notification drawer opens
  useEffect(() => {
    if (showNotificationDrawer && unreadCount > 0) {
      markAllAsRead();
    }
  }, [showNotificationDrawer, unreadCount, markAllAsRead]);

  // Load user venue preferences in real-time so Meet New People updates without refresh
  useEffect(() => {
    if (!currentUser?.uid) {
      setUsersByVenue({});
      setUserVenuePreferences(null);
      return;
    }

    const unsubscribe = listenToUserVenuePreferences(currentUser.uid, (preferences) => {
      if (preferences && preferences.venues && preferences.venues.length > 0) {
        setUserVenuePreferences({
          venues: preferences.venues,
          activities: preferences.activities
        });
      } else {
        setUserVenuePreferences(null);
        setUsersByVenue({});
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser?.uid]);

  // Fetch active friend data when selected
  useEffect(() => {
    if (!selectedActiveFriend?.id) {
      setActiveFriendData(null);
      return;
    }

    const fetchFriendData = async () => {
      try {
        setLoadingActiveFriendData(true);
        const data = await getUserData(selectedActiveFriend.id);
        setActiveFriendData(data);
      } catch (error) {
        console.error("Error fetching active friend data:", error);
        toast.error("Failed to load friend profile");
        setActiveFriendData(null);
      } finally {
        setLoadingActiveFriendData(false);
      }
    };

    fetchFriendData();
  }, [selectedActiveFriend?.id]);

  // Listen to users by venues when preferences are set
  useEffect(() => {
    if (!currentUser?.uid || !userVenuePreferences || userVenuePreferences.venues.length === 0) {
      setUsersByVenue({});
      return;
    }

    console.log(`[Index] Setting up listener for venues:`, userVenuePreferences.venues);
    
    const unsubscribe = listenToUsersByVenues(
      userVenuePreferences.venues,
      (usersByVenueData) => {
        // Force console log - this should always show
        console.log(`[Index] ===== CALLBACK FIRED =====`);
        console.log(`[Index] Received venue users data:`, usersByVenueData);
        console.log(`[Index] Current user ID:`, currentUser?.uid);
        console.log(`[Index] Venue IDs we're listening to:`, userVenuePreferences.venues);
        console.log(`[Index] Data type:`, typeof usersByVenueData);
        console.log(`[Index] Data keys:`, Object.keys(usersByVenueData || {}));
        
        // Log each venue's user count
        userVenuePreferences.venues.forEach((venueId) => {
          const users = usersByVenueData[venueId] || [];
          console.log(`[Index] Venue ${venueId} has ${users.length} users:`, users);
          if (users.length > 0) {
            console.log(`[Index] First user in ${venueId}:`, users[0]);
          }
        });
        
        // Keep all users including current user
        setUsersByVenue(usersByVenueData);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid, userVenuePreferences]);

  // Get friend status for a user
  const getFriendStatus = (userId: string | number): FriendStatus => {
    const id = typeof userId === "number" ? userId.toString() : userId;
    
    // Check if already friends
    if (friendsList.includes(id)) {
      return "friends";
    }
    
    // Check if request pending (outgoing)
    if (friendRequests.outgoing.includes(id)) {
      return "request_pending";
    }
    
    // Check if request received (incoming)
    if (friendRequests.incoming.includes(id)) {
      return "request_received";
    }
    
    // Check local state
    const localStatus = friendStatuses[id];
    if (localStatus) {
      return localStatus.status;
    }
    
    return "not_friends";
  };

  // Handle workout history item click
  const handleWorkoutHistoryClick = (item: WorkoutWithUser) => {
    setSelectedWorkoutHistoryItem(item);
  };

  // Handle profile view actions
  const handleAddFriend = async (userId: string) => {
    if (!currentUser?.uid) return;
    
    try {
      await sendFriendRequest(currentUser.uid, userId);
      setFriendStatuses((prev) => ({
        ...prev,
        [userId]: { status: "request_pending" },
      }));
      toast.success("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const handleAcceptFriend = async (userId: string) => {
    if (!currentUser?.uid) return;
    
    try {
      await acceptFriendRequest(currentUser.uid, userId);
      setFriendStatuses((prev) => ({
        ...prev,
        [userId]: { status: "friends" },
      }));
      toast.success("Friend request accepted!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleDeclineFriend = async (userId: string) => {
    if (!currentUser?.uid) return;
    
    try {
      await declineFriendRequest(currentUser.uid, userId);
      setFriendStatuses((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      toast.success("Friend request declined");
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast.error("Failed to decline friend request");
    }
  };

  const handleUnfriend = async (userId: string) => {
    if (!currentUser?.uid) return;
    
    try {
      await removeFriend(currentUser.uid, userId);
      setFriendStatuses((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      toast.success("Friend removed");
      setSelectedWorkoutHistoryItem(null);
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to remove friend");
    }
  };

  const handleReportUser = async (userId: string, reason: string, details?: string) => {
    if (!currentUser?.uid) {
      toast.error("Unable to report user");
      return;
    }

    try {
      await reportUser(currentUser.uid, userId, reason, details);
      toast.success("User reported. Thank you for helping keep PaceMatch safe.");
      setSelectedActiveFriend(null);
      setActiveFriendData(null);
      setSelectedWorkoutHistoryItem(null);
    } catch (error: any) {
      console.error("Error reporting user:", error);
      toast.error(error.message || "Failed to report user. Please try again.");
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!currentUser?.uid) {
      toast.error("Unable to block user");
      return;
    }

    try {
      await blockUser(currentUser.uid, userId);
      toast.success("User has been blocked");
      setSelectedActiveFriend(null);
      setActiveFriendData(null);
      setSelectedWorkoutHistoryItem(null);
      // Refresh to remove blocked user from view
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("Error blocking user:", error);
      toast.error(error.message || "Failed to block user. Please try again.");
    }
  };

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
      // Only update visibility status, do NOT share exact GPS coordinates
      await updateUserVisibility(currentUser.uid, checked);
      setUserVisibility(checked);
      
      toast.success(checked ? "Active status enabled" : "Active status disabled");
    } catch (error) {
      console.error("Error updating visibility:", error);
      toast.error("Failed to update active status");
    }
  };

  const handleLocationSave = async () => {
    if (!currentUser?.uid) return;

    try {
      await updateUserProfile(currentUser.uid, { generalLocation: generalLocation.trim() || null });
      setIsEditingLocation(false);
      toast.success("Location updated successfully");
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
    }
  };

  /**
   * Opens Google Maps with venue location
   * Validates coordinates and handles cross-platform support (iOS, Android, Web)
   */
  const openVenueInMaps = (venue: { lat: number; lng: number; name: string } | null) => {
    if (!venue) {
      toast.error("Venue location not available");
      return;
    }

    // Validate coordinates
    const { lat, lng } = venue;
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      toast.error("Invalid venue coordinates");
      return;
    }

    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error("Venue coordinates are out of valid range");
      return;
    }

    // Universal Google Maps URL that works on iOS, Android, and Web
    // This URL will open in native Google Maps app if installed, otherwise in browser
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    
    try {
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error("Error opening maps:", error);
      toast.error("Failed to open maps. Please try again.");
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
        
        // Do NOT calculate distance - we're showing active status only, not exact location
        // Return friend data without distance information
        return {
          id: friendId,
          ...friend,
          distanceKm: null, // Explicitly set to null to ensure no distance is shown
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
        style={{
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="max-w-2xl mx-auto px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">Welcome back, {userProfile?.username || username || currentUser?.displayName || "Athlete"}! 👋</h1>
              <p className="text-sm text-muted-foreground">Stay connected with your fitness community</p>
            </div>
            {/* Notification Bell - Yellow when there are notifications */}
            <NotificationBell 
              unreadCount={unreadCount}
              onClick={() => setShowNotificationDrawer(true)}
              variant="light"
            />
          </div>
        </div>
      </motion.div>

      {/* Weather Widget */}
      {location && (
        <div className="max-w-4xl mx-auto px-6">
          <WeatherWidget location={location} useMetric={useMetric} />
        </div>
      )}

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

        {/* Conditional rendering: Show Friends first if user has venues, otherwise show Meet New People first */}
        {userVenuePreferences && userVenuePreferences.venues.length > 0 ? (
          <>
            {/* Friends Section with Tabs - Show first if user has venues */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.11 }}
            >
          <Card className="p-6">
            <Tabs value={activeFriendsTab} onValueChange={(value) => setActiveFriendsTab(value as "active" | "history")} className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <TabsList className="grid grid-cols-2 w-full sm:w-auto flex-shrink-0">
                  <TabsTrigger value="history" className="text-xs sm:text-sm">Active Users</TabsTrigger>
                  <TabsTrigger value="active" className="text-xs sm:text-sm">Active Friends</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {activeFriendsTab === "active" && (
                    <div className="flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-3">
                        {userVisibility ? (
                          <LocationOnIcon className="text-success" style={{ fontSize: 20 }} />
                        ) : (
                          <LocationOffIcon className="text-muted-foreground" style={{ fontSize: 20 }} />
                        )}
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm font-medium">
                            Show your active status to friends
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            Friends will see you're working out, but not your exact location
                          </span>
                        </div>
                      </div>
                      <Switch
                        checked={userVisibility}
                        onCheckedChange={handleVisibilityToggle}
                      />
                    </div>
                  )}
                </div>
              </div>

              <TabsContent value="history" className="mt-0">
                {!currentUser?.uid ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Please sign in to view active users</p>
                  </div>
                ) : !userVenuePreferences || userVenuePreferences.venues.length === 0 ? (
                  <div className="text-center py-8">
                    <LocationOnIcon className="mx-auto text-muted-foreground" style={{ fontSize: 48 }} />
                    <p className="text-muted-foreground mt-4">No venues selected</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Use the "Add location" button to select venues and discover people nearby
                    </p>
                    <Button
                      onClick={() => setShowQuickCheckIn(true)}
                      className="mt-4"
                    >
                      Add location
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userVenuePreferences.venues.map((venueId) => {
                      const venue = getVenueById(venueId);
                      // Include current user so they can confirm their profile is visible
                      // Users with profileVisible === false are already filtered by the service layer
                      const venueUsers = usersByVenue[venueId] || [];
                      
                      console.log(`[Index] ===== RENDERING VENUE ${venueId} =====`);
                      console.log(`[Index] Venue ${venueId} (${venue?.name}): ${venueUsers.length} users`);
                      
                      if (!venue) return null;

                      return (
                        <div key={venueId} className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <LocationOnIcon className="text-primary" style={{ fontSize: 20 }} />
                            <h3 className="font-semibold text-base">
                              {venue.name}
                            </h3>
                            {venueUsers.length > 0 && (
                              <span className="text-sm text-muted-foreground">
                                ({venueUsers.length})
                              </span>
                            )}
                            {/* View on Maps button - hidden for now */}
                            {/* <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openVenueInMaps(venue)}
                              className="h-8 px-2 text-xs ml-auto"
                              title="View on Google Maps"
                            >
                              <MapIcon style={{ fontSize: 16 }} className="mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button> */}
                          </div>
                          
                          {venueUsers.length === 0 ? (
                            <div className="text-center py-6 border border-border rounded-lg bg-muted/30">
                              <p className="text-sm text-muted-foreground">
                                No active users in this venue yet
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Other users who have added this venue will appear here
                              </p>
                            </div>
                          ) : (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                              {venueUsers.map((venueUser, index) => {
                                console.log(`[Index] ===== RENDERING USER CARD ${index} =====`, venueUser);
                                const activityIcons = {
                                  running: DirectionsRunIcon,
                                  cycling: DirectionsBikeIcon,
                                  walking: DirectionsWalkIcon
                                };
                                
                                // Ensure activities is an array
                                const activities = Array.isArray(venueUser.activities) 
                                  ? venueUser.activities 
                                  : venueUser.activities 
                                    ? [venueUser.activities] 
                                    : [];
                                
                                const isCurrentUser =
                                  String(venueUser.userId || "") === String(currentUser?.uid || "");
                                
                                console.log(`[Index] User ${venueUser.userId} activities:`, activities);
                                console.log(`[Index] User ${venueUser.userId} avatar:`, venueUser.avatar);
                                console.log(`[Index] User ${venueUser.userId} username:`, venueUser.username);
                                
                                // Get profile picture using utility function
                                const profilePictureUrl = getProfilePictureUrl(
                                  null, // photoURL not available in VenueUser, it's in avatar field
                                  venueUser.avatar,
                                  venueUser.username
                                );
                                
                                return (
                                  <motion.div
                                    key={venueUser.userId || `user-${index}`}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`flex flex-col items-center p-2 border border-border rounded-lg bg-card hover:bg-secondary transition-colors min-w-[80px] flex-shrink-0 cursor-pointer ${
                                      isCurrentUser ? "ring-2 ring-primary/60" : ""
                                    }`}
                                    onClick={() => {
                                      console.log(`[Index] Clicked on user:`, venueUser.userId);
                                    }}
                                  >
                                    <Avatar
                                      src={profilePictureUrl}
                                      alt={venueUser.username || 'User'}
                                      sx={{ width: 40, height: 40 }}
                                    />
                                    <p className="text-xs font-medium mt-1.5 text-center truncate w-full max-w-[70px]">
                                      {venueUser.username || 'User'}
                                    </p>
                                    {activities.length > 0 && (
                                      <div className="flex gap-0.5 mt-1">
                                        {activities.map((activity) => {
                                          const ActivityIcon = activityIcons[activity as keyof typeof activityIcons];
                                          if (!ActivityIcon) return null;
                                          return (
                                            <ActivityIcon
                                              key={activity}
                                              className={
                                                activity === "running" ? "text-success" :
                                                activity === "cycling" ? "text-primary" :
                                                "text-warning"
                                              }
                                              style={{ fontSize: 14 }}
                                            />
                                          );
                                        })}
                                      </div>
                                    )}
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active" className="mt-0">
                {showDummyData && activeFriends.length > 0 && activeFriends[0]?.id?.startsWith('dummy-') && (
                  <div className="mb-3">
                    <span className="text-xs px-2 py-0.5 bg-warning/20 text-warning rounded-full">
                      Demo Data
                    </span>
                  </div>
                )}
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
                          className="flex items-center gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div 
                            className="relative cursor-pointer"
                            onClick={() => setSelectedActiveFriend({
                              id: friend.id,
                              name: friend.name,
                              username: friend.username,
                              photoURL: friend.photoURL,
                              activity: friend.activity
                            })}
                          >
                            {(() => {
                              // Get profile picture using utility function
                              const profilePictureUrl = getProfilePictureUrl(
                                friend.photoURL,
                                friend.avatar,
                                friend.name || friend.username
                              );
                              return (
                                <Avatar
                                  src={profilePictureUrl}
                                  alt={friend.name || friend.username}
                                  sx={{ width: 56, height: 56 }}
                                />
                              );
                            })()}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-card flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            </div>
                          </div>
                          
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => setSelectedActiveFriend({
                              id: friend.id,
                              name: friend.name,
                              username: friend.username,
                              photoURL: friend.photoURL,
                              activity: friend.activity
                            })}
                          >
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
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedActiveFriend({
                                  id: friend.id,
                                  name: friend.name,
                                  username: friend.username,
                                  photoURL: friend.photoURL,
                                  activity: friend.activity
                                });
                              }}
                              className="flex items-center gap-1"
                            >
                              <PersonIcon style={{ fontSize: 16 }} />
                              <span className="hidden sm:inline">Profile</span>
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate("/messages", {
                                  state: { 
                                    userId: friend.id, 
                                    userName: friend.name || friend.username 
                                  }
                                });
                              }}
                              className="flex items-center gap-1"
                            >
                              <ChatIcon style={{ fontSize: 16 }} />
                              <span className="hidden sm:inline">Message</span>
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>

            {/* Profile Discovery Section - Show below if user has venues */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Meet New People</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add your general location to connect with others
                    </p>
                  </div>
                </div>

                {/* General Location Input */}
                <div className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <LocationOnIcon className="text-primary" style={{ fontSize: 20 }} />
                    <span className="text-sm font-medium">General Location</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select venues where you work out to connect with others nearby
                  </p>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      {generalLocation || "No location set"}
                    </span>
                  </div>
                  
                  {/* Quick Check-in Button */}
                  <Button
                    variant="default"
                    onClick={() => setShowQuickCheckIn(true)}
                    className="w-full h-11 border-primary bg-primary hover:bg-primary/90 text-primary-foreground mt-3 shadow-sm"
                  >
                    <LocationOnIcon style={{ fontSize: 18 }} className="mr-2" />
                    <span className="text-sm font-semibold">Add venues</span>
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        ) : (
          <>
            {/* Profile Discovery Section - Show first if user has no venues */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.11 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Meet New People</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add your general location to connect with others
                    </p>
                  </div>
                </div>

                {/* General Location Input */}
                <div className="p-4 border border-border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <LocationOnIcon className="text-primary" style={{ fontSize: 20 }} />
                    <span className="text-sm font-medium">General Location</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select venues where you work out to connect with others nearby
                  </p>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      {generalLocation || "No location set"}
                    </span>
                  </div>
                  
                  {/* Quick Check-in Button */}
                  <Button
                    variant="default"
                    onClick={() => setShowQuickCheckIn(true)}
                    className="w-full h-11 border-primary bg-primary hover:bg-primary/90 text-primary-foreground mt-3 shadow-sm"
                  >
                    <LocationOnIcon style={{ fontSize: 18 }} className="mr-2" />
                    <span className="text-sm font-semibold">Add venues</span>
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Friends Section with Tabs - Show below if user has no venues */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <Card className="p-6">
                <Tabs value={activeFriendsTab} onValueChange={(value) => setActiveFriendsTab(value as "active" | "history")} className="w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <TabsList className="grid grid-cols-2 w-full sm:w-auto flex-shrink-0">
                      <TabsTrigger value="history" className="text-xs sm:text-sm">Active Users</TabsTrigger>
                      <TabsTrigger value="active" className="text-xs sm:text-sm">Active Friends</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {activeFriendsTab === "active" && (
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-3">
                            {userVisibility ? (
                              <LocationOnIcon className="text-success" style={{ fontSize: 20 }} />
                            ) : (
                              <LocationOffIcon className="text-muted-foreground" style={{ fontSize: 20 }} />
                            )}
                            <div className="flex flex-col">
                              <span className="text-xs sm:text-sm font-medium">
                                Show your active status to friends
                              </span>
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                Friends will see you're working out, but not your exact location
                              </span>
                            </div>
                          </div>
                          <Switch
                            checked={userVisibility}
                            onCheckedChange={handleVisibilityToggle}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <TabsContent value="history" className="mt-0">
                    {!currentUser?.uid ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Please sign in to view active users</p>
                      </div>
                    ) : !userVenuePreferences || userVenuePreferences.venues.length === 0 ? (
                      <div className="text-center py-8">
                        <LocationOnIcon className="mx-auto text-muted-foreground" style={{ fontSize: 48 }} />
                        <p className="text-muted-foreground mt-4">No venues selected</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Use the "Add location" button to select venues and discover people nearby
                        </p>
                        <Button
                          onClick={() => setShowQuickCheckIn(true)}
                          className="mt-4"
                        >
                          Add location
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {userVenuePreferences.venues.map((venueId) => {
                          const venue = getVenueById(venueId);
                          const venueUsers = usersByVenue[venueId] || [];
                          
                          if (!venue) return null;

                          return (
                            <div key={venueId} className="space-y-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <LocationOnIcon className="text-primary" style={{ fontSize: 20 }} />
                                <h3 className="font-semibold text-base">
                                  {venue.name}
                                </h3>
                                {venueUsers.length > 0 && (
                                  <span className="text-sm text-muted-foreground">
                                    ({venueUsers.length})
                                  </span>
                                )}
                              </div>
                              
                              {venueUsers.length === 0 ? (
                                <div className="text-center py-6 border border-border rounded-lg bg-muted/30">
                                  <p className="text-sm text-muted-foreground">
                                    No active users in this venue yet
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Other users who have added this venue will appear here
                                  </p>
                                </div>
                              ) : (
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                  {venueUsers.map((venueUser, index) => {
                                    const activityIcons = {
                                      running: DirectionsRunIcon,
                                      cycling: DirectionsBikeIcon,
                                      walking: DirectionsWalkIcon
                                    };
                                    
                                    const activities = Array.isArray(venueUser.activities) 
                                      ? venueUser.activities 
                                      : venueUser.activities 
                                        ? [venueUser.activities] 
                                        : [];
                                    
                                    const isCurrentUser =
                                      String(venueUser.userId || "") === String(currentUser?.uid || "");
                                    
                                    // Get profile picture using utility function
                                    const profilePictureUrl = getProfilePictureUrl(
                                      null, // photoURL not available in VenueUser, it's in avatar field
                                      venueUser.avatar,
                                      venueUser.username
                                    );
                                    
                                    return (
                                      <motion.div
                                        key={venueUser.userId || `user-${index}`}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`flex flex-col items-center p-2 border border-border rounded-lg bg-card hover:bg-secondary transition-colors min-w-[80px] flex-shrink-0 cursor-pointer ${
                                          isCurrentUser ? "ring-2 ring-primary/60" : ""
                                        }`}
                                      >
                                        <Avatar
                                          src={profilePictureUrl}
                                          alt={venueUser.username || 'User'}
                                          sx={{ width: 40, height: 40 }}
                                        />
                                        <p className="text-xs font-medium mt-1.5 text-center truncate w-full max-w-[70px]">
                                          {venueUser.username || 'User'}
                                        </p>
                                        {activities.length > 0 && (
                                          <div className="flex gap-0.5 mt-1">
                                            {activities.map((activity) => {
                                              const ActivityIcon = activityIcons[activity as keyof typeof activityIcons];
                                              if (!ActivityIcon) return null;
                                              return (
                                                <ActivityIcon
                                                  key={activity}
                                                  className={
                                                    activity === "running" ? "text-success" :
                                                    activity === "cycling" ? "text-primary" :
                                                    "text-warning"
                                                  }
                                                  style={{ fontSize: 14 }}
                                                />
                                              );
                                            })}
                                          </div>
                                        )}
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="active" className="mt-0">
                    {showDummyData && activeFriends.length > 0 && activeFriends[0]?.id?.startsWith('dummy-') && (
                      <div className="mb-3">
                        <span className="text-xs px-2 py-0.5 bg-warning/20 text-warning rounded-full">
                          Demo Data
                        </span>
                      </div>
                    )}
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
                              className="flex items-center gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                            >
                              <div 
                                className="relative cursor-pointer"
                                onClick={() => setSelectedActiveFriend({
                                  id: friend.id,
                                  name: friend.name,
                                  username: friend.username,
                                  photoURL: friend.photoURL,
                                  activity: friend.activity
                                })}
                              >
                                {(() => {
                                  // Get profile picture using utility function
                                  const profilePictureUrl = getProfilePictureUrl(
                                    friend.photoURL,
                                    friend.avatar,
                                    friend.name || friend.username
                                  );
                                  return (
                                    <Avatar
                                      src={profilePictureUrl}
                                      alt={friend.name || friend.username}
                                      sx={{ width: 56, height: 56 }}
                                    />
                                  );
                                })()}
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-card flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                </div>
                              </div>
                              
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => setSelectedActiveFriend({
                                  id: friend.id,
                                  name: friend.name,
                                  username: friend.username,
                                  photoURL: friend.photoURL,
                                  activity: friend.activity
                                })}
                              >
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
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedActiveFriend({
                                      id: friend.id,
                                      name: friend.name,
                                      username: friend.username,
                                      photoURL: friend.photoURL,
                                      activity: friend.activity
                                    });
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <PersonIcon style={{ fontSize: 16 }} />
                                  <span className="hidden sm:inline">Profile</span>
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate("/messages", {
                                      state: { 
                                        userId: friend.id, 
                                        userName: friend.name || friend.username 
                                      }
                                    });
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <ChatIcon style={{ fontSize: 16 }} />
                                  <span className="hidden sm:inline">Message</span>
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </motion.div>
          </>
        )}

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
                          {(() => {
                            // Get profile picture using utility function
                            const profilePictureUrl = getProfilePictureUrl(
                              user.photoURL,
                              user.avatar,
                              user.name
                            );
                            return (
                              <img
                                src={profilePictureUrl}
                                alt={user.name}
                                className="w-12 h-12 rounded-full border-2 border-primary"
                              />
                            );
                          })()}
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

      {/* Profile View Modal for Active Friends */}
      <AnimatePresence>
        {selectedActiveFriend && activeFriendData && (() => {
          const friendId = selectedActiveFriend.id;
          const friendStatus = getFriendStatus(friendId);
          const activityLabel = selectedActiveFriend.activity 
            ? selectedActiveFriend.activity.charAt(0).toUpperCase() + selectedActiveFriend.activity.slice(1)
            : "Active";
          
          return (
            <ProfileView
              user={{
                id: friendId,
                name: activeFriendData?.name || activeFriendData?.username || selectedActiveFriend.name || selectedActiveFriend.username || "Friend",
                distance: "Active now", // Since we're not sharing exact location
                activity: activityLabel,
                avatar: activeFriendData?.photoURL || selectedActiveFriend.photoURL || `https://ui-avatars.com/api/?name=${activeFriendData?.name || activeFriendData?.username || selectedActiveFriend.name || selectedActiveFriend.username || 'Friend'}`,
                photos: activeFriendData?.photos || [],
                bio: activeFriendData?.bio,
              }}
              friendStatus={friendStatus}
              onClose={() => {
                setSelectedActiveFriend(null);
                setActiveFriendData(null);
              }}
              onSendMessage={() => {
                setSelectedActiveFriend(null);
                setActiveFriendData(null);
                navigate("/messages", {
                  state: { 
                    userId: friendId, 
                    userName: activeFriendData?.name || activeFriendData?.username || selectedActiveFriend.name || selectedActiveFriend.username 
                  }
                });
              }}
              onAddFriend={() => handleAddFriend(friendId)}
              onAcceptFriend={() => handleAcceptFriend(friendId)}
              onDeclineFriend={() => handleDeclineFriend(friendId)}
              onUnfriend={() => handleUnfriend(friendId)}
              onReport={(reason, details) => handleReportUser(friendId, reason, details)}
              onBlock={() => handleBlockUser(friendId)}
            />
          );
        })()}
      </AnimatePresence>

      {/* Profile View Modal for Workout History */}
      <AnimatePresence>
        {selectedWorkoutHistoryItem && (() => {
          const item = selectedWorkoutHistoryItem;
          const user = item.userData;
          const workout = item.workout;
          const userId = item.userId;
          
          // Calculate distance if possible
          let distance = "Unknown";
          if (location?.lat && location?.lng && user?.lat && user?.lng) {
            const distanceKm = calculateDistance(
              location.lat,
              location.lng,
              user.lat,
              user.lng
            );
            distance = formatDistance(distanceKm);
          }
          
          const friendStatus = getFriendStatus(userId);
          const activityLabel = workout.activity.charAt(0).toUpperCase() + workout.activity.slice(1);
          
          return (
            <ProfileView
              user={{
                id: userId,
                name: user?.name || user?.username || "User",
                distance: distance,
                activity: activityLabel,
                avatar: user?.photoURL || `https://ui-avatars.com/api/?name=${user?.name || user?.username || 'User'}`,
                photos: user?.photos || [],
                bio: user?.bio,
              }}
              friendStatus={friendStatus}
              onClose={() => setSelectedWorkoutHistoryItem(null)}
              onSendMessage={() => {
                setSelectedWorkoutHistoryItem(null);
                navigate("/messages", {
                  state: { userId, userName: user?.name || user?.username }
                });
              }}
              onAddFriend={() => handleAddFriend(userId)}
              onAcceptFriend={() => handleAcceptFriend(userId)}
              onDeclineFriend={() => handleDeclineFriend(userId)}
              onUnfriend={() => handleUnfriend(userId)}
              onReport={(reason, details) => handleReportUser(userId, reason, details)}
              onBlock={() => handleBlockUser(userId)}
            />
          );
        })()}
      </AnimatePresence>

      {/* Notification Drawer */}
      <AnimatePresence>
        {showNotificationDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationDrawer(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-elevation-4 p-6 pb-24 border-t border-border`}
              style={{ 
                maxHeight: '85vh',
                minHeight: '200px',
                overflowY: 'auto'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Notifications</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotificationDrawer(false)}
                  className="rounded-full"
                >
                  <CloseIcon />
                </Button>
              </div>

              {/* Notifications List - Sorted by newest first */}
              {notifications.length > 0 ? (
                <div className="space-y-2">
                  {[...notifications]
                    .sort((a, b) => b.timestamp - a.timestamp) // Newest first
                    .map((notification) => {
                      const getNotificationIcon = () => {
                        switch (notification.type) {
                          case "message":
                            return <MailIcon style={{ fontSize: 20 }} className="text-primary" />;
                          case "message_request":
                            return <ChatBubbleIcon style={{ fontSize: 20 }} className="text-blue-500" />;
                          case "friend_request":
                            return <PersonAddIcon style={{ fontSize: 20 }} className="text-warning" />;
                          case "poke":
                            return <TouchAppIcon style={{ fontSize: 20 }} className="text-purple-500" />;
                          case "friend_accepted":
                            return <CheckCircleIcon style={{ fontSize: 20 }} className="text-success" />;
                          case "workout_complete":
                            return <CheckCircleIcon style={{ fontSize: 20 }} className="text-success" />;
                          case "achievement":
                            return <EmojiEventsIcon style={{ fontSize: 20 }} className="text-warning" />;
                          case "username_change_required":
                            return <EditIcon style={{ fontSize: 20 }} className="text-warning" />;
                          default:
                            return <NotificationsIcon style={{ fontSize: 20 }} />;
                        }
                      };

                      const getNotificationTitle = () => {
                        switch (notification.type) {
                          case "message":
                            return notification.userName;
                          case "message_request":
                            return notification.userName;
                          case "friend_request":
                            return notification.userName;
                          case "poke":
                            return notification.userName;
                          case "friend_accepted":
                            return notification.userName;
                          case "workout_complete":
                            return "Workout Completed";
                          case "achievement":
                            return notification.message || "Congrats for a new achievement!";
                          case "username_change_required":
                            return "Username Change Required";
                          default:
                            return notification.userName;
                        }
                      };

                      const getNotificationMessage = () => {
                        switch (notification.type) {
                          case "message":
                            return notification.message || "Sent you a message";
                          case "message_request":
                            return "wants to start a conversation with you";
                          case "friend_request":
                            return "wants to add you as a friend";
                          case "poke":
                            return "poked you! They're interested in matching";
                          case "friend_accepted":
                            return "accepted your friend request";
                          case "workout_complete":
                            return notification.message || "Workout completed successfully!";
                          case "achievement":
                            return notification.message || "Congrats for a new achievement!";
                          case "username_change_required":
                            return notification.message || "Your username has been changed due to misuse. Please update it to an appropriate username.";
                          default:
                            return "";
                        }
                      };

                      const formatTimestamp = (timestamp: number) => {
                        const now = Date.now();
                        const diff = now - timestamp;
                        const minutes = Math.floor(diff / 60000);
                        const hours = Math.floor(diff / 3600000);
                        const days = Math.floor(diff / 86400000);

                        if (minutes < 1) return "Just now";
                        if (minutes < 60) return `${minutes}m ago`;
                        if (hours < 24) return `${hours}h ago`;
                        if (days < 7) return `${days}d ago`;
                        return new Date(timestamp).toLocaleDateString();
                      };

                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${
                            !notification.read ? 'bg-primary/5 border-primary/30' : ''
                          }`}
                          onClick={() => {
                            handleNotificationTap(notification);
                            setShowNotificationDrawer(false);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`flex-shrink-0 p-2 rounded-full ${
                              notification.type === "message"
                                ? "bg-primary/15"
                                : notification.type === "message_request"
                                ? "bg-blue-500/15"
                                : notification.type === "friend_request"
                                ? "bg-warning/15"
                                : notification.type === "poke"
                                ? "bg-purple-500/15"
                                : notification.type === "workout_complete"
                                ? "bg-success/15"
                                : notification.type === "achievement"
                                ? "bg-warning/15"
                                : notification.type === "friend_accepted"
                                ? "bg-success/15"
                                : "bg-gray-500/15"
                            }`}>
                              {getNotificationIcon()}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-sm text-foreground">
                                  {getNotificationTitle()}
                                </p>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                {getNotificationMessage()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatTimestamp(notification.timestamp)}
                              </p>
                            </div>

                            {/* Dismiss button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                              className="flex-shrink-0 p-1 hover:bg-accent rounded-full transition-colors"
                            >
                              <CloseIcon style={{ fontSize: 16 }} className="text-muted-foreground" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <NotificationsIcon className="text-muted-foreground mx-auto mb-2" style={{ fontSize: 48 }} />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick Check-in Modal */}
      {showQuickCheckIn && (
        <QuickCheckInModal
          onClose={() => setShowQuickCheckIn(false)}
        />
      )}
      
      <BottomNavigation />
    </div>
  );
};

export default Index;
