// Main map screen with Waze-like proximity matching
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/animations.css";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  Polyline,
  useJsApiLoader
} from "@react-google-maps/api";
import {
  Box,
  Button as MuiButton,
  Fab,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar as MuiAvatar,
  IconButton,
  Divider,
  Slider
} from "@mui/material";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { useNavigate, useLocation as useRouterLocation } from "react-router-dom";
import { useUser, Activity } from "@/contexts/UserContext";
import { useLocation } from "@/hooks/useLocation";
import { useNearbyUsers } from "@/hooks/useNearbyUsers";
import { useMatching } from "@/hooks/useMatching";
import { useAuth } from "@/hooks/useAuth";
import { formatDistance } from "@/utils/distance";
import { SearchFilter } from "@/services/matchingService";
import { isWorkoutActive } from "@/utils/workoutState";
import { updateUserProfile } from "@/services/authService";
import FilterListIcon from "@mui/icons-material/FilterList";
import { NearbyUsersAccordion } from "@/components/NearbyUsersAccordion";
import { updateUserVisibility } from "@/services/locationService";
import { saveWorkout } from "@/services/workoutService";
import { listenToFriendRequests, removeFriend } from "@/services/friendService";
import { getUserConversations } from "@/services/messageService";
import { listenToPokes, sendPoke, acceptPoke, dismissPoke, hasPokedUser } from "@/services/pokeService";
import { PokeModal } from "@/components/PokeModal";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import PauseIcon from "@mui/icons-material/Pause";
import ExploreIcon from "@mui/icons-material/Explore";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import GroupIcon from "@mui/icons-material/Group";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PublicIcon from "@mui/icons-material/Public";
import TimerIcon from "@mui/icons-material/Timer";
import SpeedIcon from "@mui/icons-material/Speed";
import FavoriteIcon from "@mui/icons-material/Favorite";
import {
  Settings as SettingsIconMui,
  MyLocation as MyLocationMui,
  CenterFocusStrong,
  People as PeopleMui,
  Close,
  PlayArrow,
  Stop,
  DirectionsRun as DirectionsRunMui,
  ViewInAr,
  ViewComfy,
  Navigation,
  Explore as ExploreMui,
  ZoomIn,
  ZoomOut
} from "@mui/icons-material";
import { toast } from "sonner";
import { NotificationBanner } from "@/components/NotificationBanner";
import { MessageModal } from "@/components/MessageModal";
import { FriendRequestModal } from "@/components/FriendRequestModal";
import { ProfileView } from "@/pages/ProfileView";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { BadgeCounter } from "@/components/NotificationSystem";
import { WorkoutSummaryModal } from "@/components/WorkoutSummaryModal";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import MailIcon from "@mui/icons-material/Mail";
import BottomNavigation from "@/components/BottomNavigation";

type FriendStatus = "not_friends" | "request_pending" | "request_received" | "friends" | "denied";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";

const libraries: ("places")[] = ["places"];

// Map container style
const mapContainerStyle = {
  width: "100%",
  height: "100vh"
};

// Default map center (will be overridden by user location)
const defaultCenter = {
  lat: 14.5995,
  lng: 120.9842 // Manila, Philippines
};

// Marker colors based on activity
const getMarkerColor = (activity?: string | null): string => {
  switch (activity) {
    case "running":
      return "🟢"; // Green for running
    case "cycling":
      return "🔵"; // Blue for cycling
    case "walking":
      return "🟡"; // Yellow for walking
    default:
      return "⚪"; // White/gray for unknown
  }
};

/**
 * Calculate zoom level from distance in meters
 */
const calculateZoomFromMeters = (distanceMeters: number): number => {
  if (distanceMeters >= 50000) return 10; // 50km
  if (distanceMeters >= 20000) return 11; // 20km
  if (distanceMeters >= 10000) return 12; // 10km
  if (distanceMeters >= 5000) return 13; // 5km
  if (distanceMeters >= 2000) return 14; // 2km
  if (distanceMeters >= 1000) return 15; // 1km
  if (distanceMeters >= 500) return 16; // 500m
  if (distanceMeters >= 250) return 17; // 250m
  if (distanceMeters >= 150) return 18; // 150m
  if (distanceMeters >= 100) return 18.5; // 100m
  if (distanceMeters >= 50) return 19; // 50m
  return 19.5; // Very close (25m or less)
};

interface Location {
  lat: number;
  lng: number;
}

interface LocationHistoryPoint {
  lat: number;
  lng: number;
}

interface UserTrails {
  [userId: string]: LocationHistoryPoint[];
}

interface MapRef {
  panTo: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
  setTilt: (tilt: number) => void;
  setHeading: (heading: number) => void;
  setCenter: (center: { lat: number; lng: number }) => void;
  setOptions: (options: any) => void;
}

/**
 * MapScreen Component
 * Main screen showing map with user location and nearby users
 */
const MapScreen = () => {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const { user } = useAuth();
  const { userProfile, hasActivity, useMetric, addWorkout, setUserProfile } = useUser();
  const { addNotification, unreadMessageCount, unreadFriendRequestCount, notifications, unreadCount, dismissNotification, markAllAsRead, handleNotificationTap } = useNotificationContext();
  
  // Get focusFriend from navigation state (when coming from Index page)
  const focusFriend = routerLocation.state?.focusFriend;
  
  // Google Maps state
  const [visible, setVisible] = useState(true);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(15);
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [locationHistory, setLocationHistory] = useState<LocationHistoryPoint[]>([]);
  const [userTrails, setUserTrails] = useState<UserTrails>({});
  const [mapTilt, setMapTilt] = useState(0);
  const [mapHeading, setMapHeading] = useState(0);
  const [is3DMode, setIs3DMode] = useState(false);
  const [isWazeMode, setIsWazeMode] = useState(false);
  const [userHeading, setUserHeading] = useState<number | null>(null);
  const [isNavigationStyle, setIsNavigationStyle] = useState(false);
  const [viewDistanceMeters, setViewDistanceMeters] = useState(150);
  const [showViewDistanceControl, setShowViewDistanceControl] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<"close" | "medium" | "far">("medium");
  
  // Workout tracking state
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // Sidebar visibility toggle - starts closed
  const [lastViewedMatchesCount, setLastViewedMatchesCount] = useState(0); // Track viewed matches for notification
  const hasAutoOpenedRef = useRef(false); // Track if sidebar was auto-opened to prevent re-opening
  const [showStopConfirmation, setShowStopConfirmation] = useState(false); // Confirmation dialog for stopping session
  const [showMatchesDrawer, setShowMatchesDrawer] = useState(false); // Matches drawer visibility toggle
  const [pointsTracked, setPointsTracked] = useState(0);
  const [distance, setDistance] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [avgSpeed, setAvgSpeed] = useState(0); // km/h
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null); // Track when pause started
  const [totalPausedTime, setTotalPausedTime] = useState(0); // Total paused duration in seconds
  const [showSummary, setShowSummary] = useState(false);
  const [showSpeedNotPace, setShowSpeedNotPace] = useState(true);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const lastDistanceRef = useRef(0);
  const lastTimeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<Location | null>(null);
  const processedUserIdsRef = useRef<Set<string>>(new Set());
  const nearbyUsersRef = useRef<any[]>([]);
  
  // Get user's enabled activities from profile
  // Handle both 'activities' (array) and 'activity' (single value) for backward compatibility
  const userActivities = userProfile?.activities?.length > 0 
    ? userProfile.activities 
    : (userProfile as any)?.activity 
      ? [(userProfile as any).activity as Activity]
      : ["running", "cycling", "walking"];
  const [selectedActivity, setSelectedActivity] = useState<"running" | "cycling" | "walking">(
    userActivities[0] as "running" | "cycling" | "walking"
  );
  
  // Track previous userActivities to detect changes
  const prevUserActivitiesRef = useRef<Activity[]>(userActivities);
  
  // Update selectedActivity when user profile activities change
  useEffect(() => {
    if (userActivities && userActivities.length > 0) {
      const prevActivities = prevUserActivitiesRef.current;
      const activitiesChanged = JSON.stringify(prevActivities) !== JSON.stringify(userActivities);
      
      if (activitiesChanged) {
        // If current selectedActivity is not in new userActivities, switch to first available
        if (!userActivities.includes(selectedActivity)) {
          setSelectedActivity(userActivities[0] as "running" | "cycling" | "walking");
        }
        // Update ref for next comparison
        prevUserActivitiesRef.current = userActivities;
      }
    }
  }, [userActivities, selectedActivity]);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPokeModal, setShowPokeModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const [declinedUsers, setDeclinedUsers] = useState<Record<string, number>>({}); // userId -> cooldownUntil timestamp
  const [visibleToFriendsOnly, setVisibleToFriendsOnly] = useState(false);
  
  // Poke state
  const [pokes, setPokes] = useState<string[]>([]); // Array of user IDs who poked the current user (for notifications)
  const [hasPokedUsers, setHasPokedUsers] = useState<Record<string, boolean>>({}); // Track which users we've poked
  const [workoutPokes, setWorkoutPokes] = useState<string[]>([]); // Pokes received during current workout session
  const [workoutNearbyUsers, setWorkoutNearbyUsers] = useState<any[]>([]); // Nearby users during workout
  const notifiedPokesRef = useRef<Set<string>>(new Set()); // Track which pokes we've already notified
  
  // Activity filter for People Sidebar
  const [activityFilter, setActivityFilter] = useState<"all" | "running" | "cycling" | "walking">("all");
  
  // Friend requests and messages for sidebar
  const [friendRequests, setFriendRequests] = useState<{ incoming: string[]; outgoing: string[] }>({ incoming: [], outgoing: [] });
  const [messageRequests, setMessageRequests] = useState<any[]>([]);
  const [friendRequestUsers, setFriendRequestUsers] = useState<Record<string, any>>({});
  const [messageRequestUsers, setMessageRequestUsers] = useState<Record<string, any>>({});
  const [loadingFriendRequestUsers, setLoadingFriendRequestUsers] = useState(false);
  const [loadingMessageRequestUsers, setLoadingMessageRequestUsers] = useState(false);
  
  // Load Google Maps API
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey || '',
    libraries: libraries
  });

  // Get user's current location - tracking controlled by activity button
  const { location, error: locationError, isGettingLocation } = useLocation(
    user?.uid || null,
    isActive, // Use isActive instead of isActivityActive
    visible
  );
  
  // Calculate bearing (direction) between two points
  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
    
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalize to 0-360
  };

  // Calculate camera center offset to position user at bottom of screen
  const calculateCameraOffset = (userLat: number, userLng: number, heading: number, offsetDistance: number = 0.002): Location => {
    const headingRad = (heading || 0) * Math.PI / 180;
    const offsetLat = userLat + offsetDistance * Math.cos(headingRad);
    const offsetLng = userLng + offsetDistance * Math.sin(headingRad);
    return { lat: offsetLat, lng: offsetLng };
  };

  // Load searchFilter and friendsOnly visibility from user profile
  useEffect(() => {
    if (user) {
      import("@/services/authService").then(({ getUserData }) => {
        getUserData(user.uid).then((userData) => {
          if (userData?.searchFilter) {
            setSearchFilter(userData.searchFilter);
          }
          if (userData?.visibleToFriendsOnly !== undefined) {
            setVisibleToFriendsOnly(userData.visibleToFriendsOnly);
          }
        });
      });
    } else if (userProfile && (userProfile as any).searchFilter) {
      setSearchFilter((userProfile as any).searchFilter);
    }
  }, [user, userProfile]);

  // Load declined users from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("declinedUsers");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Filter out expired cooldowns
        const now = Date.now();
        const active = Object.entries(parsed).reduce((acc, [userId, cooldownUntil]) => {
          if (typeof cooldownUntil === "number" && cooldownUntil > now) {
            acc[userId] = cooldownUntil;
          }
          return acc;
        }, {} as Record<string, number>);
        setDeclinedUsers(active);
        localStorage.setItem("declinedUsers", JSON.stringify(active));
      } catch (e) {
        console.error("Error loading declined users:", e);
      }
    }
  }, []);

  // Restore activity state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("activityState");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.isActive) {
          setIsActive(true);
          setIsPaused(parsed.isPaused || false);
          setSelectedActivity(parsed.selectedActivity || selectedActivity);
          setDistance(parsed.distance || 0);
          setCurrentSpeed(parsed.currentSpeed || 0);
          setAvgSpeed(parsed.avgSpeed || 0);
          setPointsTracked(parsed.pointsTracked || 0);
          
          // Restore startTime and calculate elapsed time
          if (parsed.startTime) {
            const savedStartTime = new Date(parsed.startTime);
            setStartTime(savedStartTime);
            setTotalPausedTime(parsed.totalPausedTime || 0);
            if (parsed.isPaused && parsed.pauseStartTime) {
              setPauseStartTime(new Date(parsed.pauseStartTime));
            }
            // Calculate elapsed time based on saved start time
            const now = new Date();
            const totalElapsed = Math.floor((now.getTime() - savedStartTime.getTime()) / 1000);
            // If paused, use saved elapsed time, otherwise calculate from start time minus paused time
            setElapsedTime(parsed.isPaused ? (parsed.elapsedTime || 0) : (totalElapsed - (parsed.totalPausedTime || 0)));
          }
          
          console.log("✅ Restored activity state from localStorage");
        }
      } catch (e) {
        console.error("Error loading activity state:", e);
        // Clear corrupted data
        localStorage.removeItem("activityState");
      }
    }
  }, []); // Only run on mount

  // Save activity state to localStorage whenever it changes
  useEffect(() => {
    if (isActive) {
      const stateToSave = {
        isActive,
        isPaused,
        startTime: startTime?.toISOString() || null,
        elapsedTime,
        totalPausedTime,
        pauseStartTime: pauseStartTime?.toISOString() || null,
        distance,
        currentSpeed,
        avgSpeed,
        pointsTracked,
        selectedActivity
      };
      localStorage.setItem("activityState", JSON.stringify(stateToSave));
    } else {
      // Clear saved state when activity is stopped
      localStorage.removeItem("activityState");
    }
  }, [isActive, isPaused, startTime, elapsedTime, distance, currentSpeed, avgSpeed, pointsTracked, selectedActivity]);

  // Listen to friend requests
  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubscribe = listenToFriendRequests(user.uid, (requests) => {
      setFriendRequests(requests);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Listen to pokes
  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubscribe = listenToPokes(user.uid, (pokeUserIds) => {
      setPokes(pokeUserIds);
      
      // Only process pokes and create notifications when workout is active
      if (isActive) {
        // Track pokes received during workout
        setWorkoutPokes(prev => {
          const newPokes = pokeUserIds.filter(id => !prev.includes(id));
          return [...prev, ...newPokes];
        });
        
        // Create notifications only for NEW pokes (not already notified) during active workout
        if (pokeUserIds.length > 0 && addNotification) {
          const newPokeUserIds = pokeUserIds.filter(id => !notifiedPokesRef.current.has(id));
          
          // Mark all current pokes as notified
          pokeUserIds.forEach(id => notifiedPokesRef.current.add(id));
          
          // Get user data for new pokes and create notifications
          newPokeUserIds.forEach(async (pokeUserId) => {
            try {
              const { getUserData } = await import("@/services/authService");
              const userData = await getUserData(pokeUserId);
              if (userData) {
                addNotification({
                  type: "poke",
                  userId: parseInt(pokeUserId) || 0,
                  userName: userData.name || "Someone",
                  userAvatar: userData.photoURL || ""
                });
              }
            } catch (error) {
              console.error("Error fetching poke user data:", error);
            }
          });
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid, isActive]);

  // Fetch user data for friend requests
  useEffect(() => {
    if (friendRequests.incoming.length === 0) {
      setFriendRequestUsers({});
      return;
    }

    const fetchFriendRequestUsers = async () => {
      setLoadingFriendRequestUsers(true);
      try {
        const { getUserData } = await import("@/services/authService");
        const userDataPromises = friendRequests.incoming.map(async (userId) => {
          try {
            const userData = await getUserData(userId);
            return { userId, userData };
          } catch (error) {
            console.error(`Error fetching user data for ${userId}:`, error);
            return { userId, userData: null };
          }
        });

        const results = await Promise.all(userDataPromises);
        const usersMap: Record<string, any> = {};
        results.forEach(({ userId, userData }) => {
          if (userData) {
            usersMap[userId] = userData;
          }
        });
        setFriendRequestUsers(usersMap);
      } catch (error) {
        console.error("Error fetching friend request users:", error);
      } finally {
        setLoadingFriendRequestUsers(false);
      }
    };

    fetchFriendRequestUsers();
  }, [friendRequests.incoming]);

  // Load message requests (conversations with unread messages from non-friends)
  useEffect(() => {
    if (!user?.uid) return;

    const loadMessageRequests = async () => {
      try {
        const conversations = await getUserConversations(user.uid);
        // Filter for conversations with unread messages from non-friends
        const friends = userProfile?.friends || [];
        const requests = conversations.filter(conv => 
          conv.unreadCount > 0 && !friends.some((f: any) => String(f) === conv.otherUserId)
        );
        setMessageRequests(requests);
      } catch (error) {
        console.error("Error loading message requests:", error);
      }
    };

    loadMessageRequests();
    // Refresh every 30 seconds
    const interval = setInterval(loadMessageRequests, 30000);
    return () => clearInterval(interval);
  }, [user?.uid, userProfile?.friends]);

  // Auto-open sidebar only if there are new friend requests or message requests
  useEffect(() => {
    const hasNewRequests = friendRequests.incoming.length > 0 || messageRequests.length > 0;
    if (hasNewRequests && !hasAutoOpenedRef.current) {
      setShowSidebar(true);
      hasAutoOpenedRef.current = true;
    }
  }, [friendRequests.incoming.length, messageRequests.length]);

  // Fetch user data for message requests
  useEffect(() => {
    if (messageRequests.length === 0) {
      setMessageRequestUsers({});
      return;
    }

    const fetchMessageRequestUsers = async () => {
      setLoadingMessageRequestUsers(true);
      try {
        const { getUserData } = await import("@/services/authService");
        const uniqueUserIds = [...new Set(messageRequests.map(conv => conv.otherUserId))];
        const userDataPromises = uniqueUserIds.map(async (userId) => {
          try {
            const userData = await getUserData(userId);
            return { userId, userData };
          } catch (error) {
            console.error(`Error fetching user data for ${userId}:`, error);
            return { userId, userData: null };
          }
        });

        const results = await Promise.all(userDataPromises);
        const usersMap: Record<string, any> = {};
        results.forEach(({ userId, userData }) => {
          if (userData) {
            usersMap[userId] = userData;
          }
        });
        setMessageRequestUsers(usersMap);
      } catch (error) {
        console.error("Error fetching message request users:", error);
      } finally {
        setLoadingMessageRequestUsers(false);
      }
    };

    fetchMessageRequestUsers();
  }, [messageRequests]);

  // Mark all notifications as read when notification drawer opens
  // This makes the red indicator disappear when user views notifications
  useEffect(() => {
    if (showNotificationDrawer && unreadCount > 0) {
      // Mark all notifications as read when user opens the drawer to view them
      // This removes the red indicator from the notification bell
      markAllAsRead();
    }
  }, [showNotificationDrawer]);

  // Get matched users using matching algorithm
  const { matches, loading: matchesLoading } = useMatching({
    currentUserId: user?.uid || "",
    currentLocation: location,
    activity: selectedActivity,
    fitnessLevel: userProfile?.fitnessLevel || "intermediate",
    pace: userProfile?.pace,
    visibility: userProfile?.visibility || {
      visibleToAllLevels: true,
      allowedLevels: ["beginner", "intermediate", "pro"]
    },
    searchFilter: searchFilter,
    radiusPreference: userProfile?.radiusPreference || "normal"
  });

  // Update last viewed count when matches change and sidebar is open
  useEffect(() => {
    if (showSidebar && matches.length > 0) {
      setLastViewedMatchesCount(matches.length);
    }
  }, [showSidebar, matches.length]);

  // Get nearby users from hook (fallback for non-matched display)
  const { nearbyUsers: nearbyUsersFromHook, loading: usersLoading } = useNearbyUsers(
    location,
    50,
    "all",
    "all",
    user?.uid || null
  );

  
  // Friend status tracking (mock data - replace with backend later)
  const [friendStatuses, setFriendStatuses] = useState<Record<string, { status: FriendStatus; cooldownUntil?: number }>>({});
  
  const getFriendStatus = (userId: string | number): FriendStatus => {
    const id = typeof userId === "number" ? userId.toString() : userId;
    
    // Check if already friends
    const friends = userProfile?.friends || [];
    if (friends.some((f: any) => String(f) === id)) {
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
  
  const getCooldownDaysForFriend = (userId: string | number): number => {
    const id = typeof userId === "number" ? userId.toString() : userId;
    const cooldownUntil = friendStatuses[id]?.cooldownUntil;
    if (!cooldownUntil) return 0;
    const now = Date.now();
    const diff = cooldownUntil - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const activities = [
    { id: "running", label: "Running", icon: DirectionsRunIcon, color: "success" },
    { id: "cycling", label: "Cycling", icon: DirectionsBikeIcon, color: "primary" },
    { id: "walking", label: "Walking", icon: DirectionsWalkIcon, color: "warning" },
  ] as const;

  // Filter activities based on user's profile
  // Ensure we always have at least the default activities if userActivities is empty
  const availableActivities = userActivities.length > 0
    ? activities.filter(act => 
        userActivities.includes(act.id as "running" | "cycling" | "walking")
      )
    : activities; // Fallback to all activities if userActivities is empty

  // Use matched users if available, otherwise fallback to nearby users
  // Filter out declined users (within cooldown period)
  const now = Date.now();
  const matchedUsersForDisplay = useMemo(() => {
    return matches
      .filter((match) => {
        const userId = match.user.uid;
        const cooldownUntil = declinedUsers[userId];
        return !cooldownUntil || cooldownUntil <= now;
      })
      .map((match) => ({
        id: match.user.uid,
        // Use 'name' field from Firebase (username), not displayName from Google
        name: match.user.name || "User",
        distance: formatDistance(match.distance / 1000),
        distanceValue: match.distance / 1000,
        activity: match.user.activity || "Running",
        avatar: match.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.user.name || 'User')}&size=150`,
        lat: match.user.location.lat,
        lng: match.user.location.lng,
        matchScore: match.score,
        fitnessLevel: match.user.fitnessLevel,
        pace: match.user.pace
      }));
  }, [matches, declinedUsers, now]);

  // Use nearby users from hook, or fallback to mock data for UI features
  const nearbyUsers = useMemo(() => {
    let result;
    if (matchedUsersForDisplay.length > 0) {
      result = matchedUsersForDisplay;
    } else if (nearbyUsersFromHook.length > 0) {
      result = nearbyUsersFromHook.map((userData: any) => ({
        id: userData.id,
        name: userData.name || "User",
        distance: formatDistance(userData.distance),
        distanceValue: userData.distance,
        activity: userData.activity || "Running",
        avatar: userData.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&size=150`,
        lat: userData.lat,
        lng: userData.lng,
        photos: [],
        bio: ""
      }));
    } else {
      result = [];
    }
    
    // Update ref with latest value
    nearbyUsersRef.current = result;
    return result;
  }, [matchedUsersForDisplay, nearbyUsersFromHook]);

  // Track nearby users during workout - using ref to prevent infinite loops
  const nearbyUserIdsString = useMemo(() => 
    nearbyUsers.map(u => u.id).sort().join(','),
    [nearbyUsers]
  );
  
  const previousUserIdsRef = useRef<string>('');
  
  useEffect(() => {
    if (!isActive) {
      // Reset tracking when workout stops
      processedUserIdsRef.current.clear();
      previousUserIdsRef.current = '';
      return;
    }
    
    // Check if user IDs have actually changed
    if (nearbyUserIdsString === previousUserIdsRef.current) {
      return; // No change, skip update
    }
    
    // Update the ref to current state
    previousUserIdsRef.current = nearbyUserIdsString;
    
    // Get current nearby users from ref (always has latest value)
    const currentNearbyUsers = nearbyUsersRef.current;
    if (currentNearbyUsers.length === 0) return;
    
    // Create a set of current user IDs
    const currentUserIds = new Set(currentNearbyUsers.map(u => u.id));
    
    // Find users that haven't been processed yet
    const newUserIds = Array.from(currentUserIds).filter((id: string) => !processedUserIdsRef.current.has(id));
    
    if (newUserIds.length === 0) return;
    
    // Mark these users as processed
    newUserIds.forEach((id: string) => processedUserIdsRef.current.add(id));
    
    // Update workout nearby users state with REAL Firebase users
    // These users come from Firebase via useNearbyUsers hook -> locationService -> Firebase Realtime Database
    setWorkoutNearbyUsers(prev => {
      const existingIds = new Set(prev.map(u => u.id));
      const newUsers = currentNearbyUsers
        .filter(user => newUserIds.includes(user.id) && !existingIds.has(user.id))
        .map(user => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          activity: user.activity,
          distance: user.distance,
          distanceValue: user.distanceValue
        }));
      
      if (newUsers.length === 0) {
        return prev;
      }
      
      console.log(`✅ Added ${newUsers.length} real Firebase user(s) to workout tracking:`, newUsers.map(u => u.name));
      return [...prev, ...newUsers];
    });
  }, [isActive, nearbyUserIdsString]);

  // Filter users by activity
  const filteredUsers = activityFilter === "all" 
    ? nearbyUsers 
    : nearbyUsers.filter(user => user.activity.toLowerCase() === activityFilter);

  // Sort by distance
  const sortedUsers = [...filteredUsers].sort((a, b) => a.distanceValue - b.distanceValue);

  // Track location history for trail when activity is active
  useEffect(() => {
    if (isActive && location) {
      const lastPoint = lastLocationRef.current;
      
      // Check if location actually changed (avoid duplicate processing)
      if (lastPoint && 
          Math.abs(lastPoint.lat - location.lat) < 0.00001 && 
          Math.abs(lastPoint.lng - location.lng) < 0.00001) {
        return; // Location hasn't changed significantly, skip update
      }
      
      // Calculate heading before updating history (only if we have a previous point)
      let newHeading: number | null = null;
      if (lastPoint) {
        const distance = Math.sqrt(
          Math.pow(lastPoint.lat - location.lat, 2) + 
          Math.pow(lastPoint.lng - location.lng, 2)
        );
        
        // Only calculate heading if moved significantly
        if (distance > 0.00001) {
          newHeading = calculateBearing(
            lastPoint.lat,
            lastPoint.lng,
            location.lat,
            location.lng
          );
        }
      }
      
      // Update location history
      setLocationHistory((prev) => {
        const newHistory = [...prev, { lat: location.lat, lng: location.lng }];
        return newHistory.slice(-100);
      });
      
      // Update ref to track last location
      lastLocationRef.current = { lat: location.lat, lng: location.lng };
      
      // Update heading if calculated
      if (newHeading !== null) {
        setUserHeading((prevHeading) => {
          if (prevHeading === null || Math.abs(prevHeading - newHeading!) > 1) {
            return newHeading!;
          }
          return prevHeading;
        });
        
        if (isWazeMode && mapRef && isLoaded && window.google) {
          mapRef.setHeading(newHeading);
          setMapHeading(newHeading);
        }
      }
    } else if (!isActive) {
      setLocationHistory([]);
      setUserHeading(null);
      lastLocationRef.current = null;
    }
  }, [location, isActive, isWazeMode, mapRef, isLoaded]);

  // Timer interval - runs continuously when active (even when paused, to show paused time)
  useEffect(() => {
    if (isActive && startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        // Calculate total elapsed time from start
        const totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        // Subtract paused time
        let currentPausedTime = totalPausedTime;
        if (isPaused && pauseStartTime) {
          // Add current pause duration
          currentPausedTime += Math.floor((now.getTime() - pauseStartTime.getTime()) / 1000);
        }
        
        const activeElapsed = totalElapsed - currentPausedTime;
        setElapsedTime(activeElapsed);
        
        // Only update distance and speed when not paused and location is available
        if (!isPaused && location) {
          setPointsTracked(prev => prev + 1);
          
          // Calculate distance from location history
          if (locationHistory.length > 1) {
            let totalDistance = 0;
            for (let i = 1; i < locationHistory.length; i++) {
              const prev = locationHistory[i - 1];
              const curr = locationHistory[i];
              // Haversine formula for distance
              const R = 6371; // Earth's radius in km
              const dLat = (curr.lat - prev.lat) * Math.PI / 180;
              const dLng = (curr.lng - prev.lng) * Math.PI / 180;
              const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(prev.lat * Math.PI / 180) * Math.cos(curr.lat * Math.PI / 180) *
                        Math.sin(dLng/2) * Math.sin(dLng/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              totalDistance += R * c;
            }
            setDistance(totalDistance);
            
            // Calculate current speed
            const currentTime = Date.now();
            const timeDiff = (currentTime - lastTimeRef.current) / 1000; // seconds
            
            if (timeDiff >= 1 && lastTimeRef.current > 0) {
              const distanceDiff = totalDistance - lastDistanceRef.current;
              const speed = (distanceDiff / timeDiff) * 3600; // km/h
              setCurrentSpeed(speed);
              
              lastDistanceRef.current = totalDistance;
              lastTimeRef.current = currentTime;
            } else if (lastTimeRef.current === 0) {
              lastTimeRef.current = currentTime;
              lastDistanceRef.current = totalDistance;
            }
          }
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, startTime, pauseStartTime, totalPausedTime, location, locationHistory]);
  
  // Calculate average speed
  useEffect(() => {
    if (elapsedTime > 0 && distance > 0) {
      const avgSpeedValue = (distance / elapsedTime) * 3600; // km/h
      setAvgSpeed(avgSpeedValue);
    }
  }, [elapsedTime, distance]);

  const handleStartStop = () => {
    if (!isActive) {
      // Start activity
      toast.success("Activity started! GPS tracking enabled.");
      setIsActive(true);
      setIsPaused(false);
      setStartTime(new Date());
      setElapsedTime(0);
      setDistance(0);
      setCurrentSpeed(0);
      setAvgSpeed(0);
      setPointsTracked(0);
      setTotalPausedTime(0);
      setPauseStartTime(null);
      lastDistanceRef.current = 0;
      lastTimeRef.current = 0;
      setShowNotification(false);
      // Reset workout tracking
      setWorkoutPokes([]);
      setWorkoutNearbyUsers([]);
    } else {
      // Show confirmation dialog before stopping
      setShowStopConfirmation(true);
    }
  };

  const handleConfirmStop = () => {
    // Stop activity - show summary
    setIsActive(false);
    setIsPaused(false);
    setPauseStartTime(null);
    setShowStopConfirmation(false);
    
    // Log real Firebase users detected during workout
    if (workoutNearbyUsers.length > 0) {
      console.log(`✅ Found ${workoutNearbyUsers.length} real Firebase users during workout:`, workoutNearbyUsers);
    } else {
      console.log("⚠️ No real Firebase users detected during workout");
    }
    
    // Add dummy users for testing ONLY if no real Firebase users were detected
    // Real Firebase data is always prioritized - dummy data is fallback for testing
    if (workoutNearbyUsers.length === 0) {
      console.log("🧪 Adding dummy users for testing purposes");
      setWorkoutNearbyUsers(generateDummyNearbyUsers());
    }
    
    // Always show summary when stopping activity (to show nearby people and stats)
    // Use a delay to ensure the stop confirmation dialog is fully closed first
    setTimeout(() => {
      setShowSummary(true);
    }, 300);
  };
  
  const handlePause = () => {
    if (!isPaused) {
      // Pausing - record pause start time
      setPauseStartTime(new Date());
      setIsPaused(true);
      toast("Activity paused");
    } else {
      // Resuming - calculate and add paused duration
      if (pauseStartTime) {
        const pauseDuration = Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000);
        setTotalPausedTime(prev => prev + pauseDuration);
        setPauseStartTime(null);
      }
      setIsPaused(false);
      toast("Activity resumed");
    }
  };
  
  // Generate dummy nearby users for testing (only used when no real Firebase users detected)
  const generateDummyNearbyUsers = () => {
    console.log("🧪 Generating dummy users for testing (no real Firebase users detected)");
    const dummyUsers = [
      {
        id: "dummy-user-1",
        name: "Sarah Johnson",
        avatar: "https://i.pravatar.cc/150?img=47",
        activity: "running",
        distance: "0.5 km",
        distanceValue: 0.5
      },
      {
        id: "dummy-user-2",
        name: "Mike Chen",
        avatar: "https://i.pravatar.cc/150?img=33",
        activity: "cycling",
        distance: "1.2 km",
        distanceValue: 1.2
      },
      {
        id: "dummy-user-3",
        name: "Emma Wilson",
        avatar: "https://i.pravatar.cc/150?img=20",
        activity: "walking",
        distance: "0.8 km",
        distanceValue: 0.8
      },
      {
        id: "dummy-user-4",
        name: "James Wilson",
        avatar: "https://i.pravatar.cc/150?img=12",
        activity: "running",
        distance: "1.5 km",
        distanceValue: 1.5
      },
      {
        id: "dummy-user-5",
        name: "Lisa Anderson",
        avatar: "https://i.pravatar.cc/150?img=5",
        activity: "cycling",
        distance: "0.9 km",
        distanceValue: 0.9
      },
      {
        id: "dummy-user-6",
        name: "Alex Runner",
        avatar: "https://ui-avatars.com/api/?name=Alex+Runner&size=120&background=4CAF50&color=fff",
        activity: "running",
        distance: "1.8 km",
        distanceValue: 1.8
      },
      {
        id: "dummy-user-7",
        name: "Sophie Martinez",
        avatar: "https://i.pravatar.cc/150?img=68",
        activity: "cycling",
        distance: "2.1 km",
        distanceValue: 2.1
      },
      {
        id: "dummy-user-8",
        name: "David Active",
        avatar: "https://ui-avatars.com/api/?name=David+Active&size=120&background=E91E63&color=fff",
        activity: "walking",
        distance: "1.3 km",
        distanceValue: 1.3
      }
    ];
    return dummyUsers;
  };

  const handleSaveWorkout = async () => {
    if (!user?.uid) {
      toast.error("You must be logged in to save workouts");
      return;
    }

    // Use workoutNearbyUsers - all REAL Firebase users detected during the workout session
    // These are populated from Firebase via useNearbyUsers hook and locationService
    let activeNearbyUsers = workoutNearbyUsers.map(user => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      activity: user.activity,
      distance: user.distance,
    }));

    // Log what we're saving
    const realUserCount = activeNearbyUsers.filter(u => !u.id.startsWith('dummy-')).length;
    const dummyUserCount = activeNearbyUsers.filter(u => u.id.startsWith('dummy-')).length;
    
    if (realUserCount > 0) {
      console.log(`✅ Saving workout with ${realUserCount} real Firebase users`);
    }
    if (dummyUserCount > 0) {
      console.log(`🧪 Including ${dummyUserCount} dummy users for testing`);
    }

    // Add dummy users for testing ONLY if no real Firebase users were detected
    // Real Firebase data is always prioritized - dummy data is fallback for testing
    if (activeNearbyUsers.length === 0) {
      console.log("🧪 No real users detected - adding dummy users for testing");
      activeNearbyUsers = generateDummyNearbyUsers();
    }

    const workoutData = {
      activity: selectedActivity,
      date: startTime || new Date(),
      duration: elapsedTime,
      distance,
      avgSpeed,
      calories: 0, // Calories removed from UI but still required in data structure
      nearbyUsers: activeNearbyUsers,
      location: "Central Park, New York", // This would come from GPS in real app
    };

    try {
      // Save to Firebase Realtime Database
      console.log("💾 Saving workout to Firebase:", workoutData);
      const workoutId = await saveWorkout(user.uid, workoutData);
      console.log("✅ Workout saved successfully to Firebase");
      
      // Also save to localStorage via context (for offline/fallback)
      addWorkout(workoutData);
      
      // Add workout completion notification with workout ID
      addNotification({
        type: "workout_complete",
        userId: parseInt(user.uid) || 0,
        userName: "Workout Complete",
        userAvatar: "",
        message: `Great job! You completed ${distance.toFixed(2)} km of ${selectedActivity}`,
        workoutId: workoutId
      });
      console.log("✅ Workout completion notification added. Unread count should update.");
      
      toast.success(`Workout saved! ${distance.toFixed(2)} km tracked.`, {
        position: "bottom-center"
      });
      setShowSummary(false);
      setPointsTracked(0);
      setDistance(0);
      setElapsedTime(0);
      setCurrentSpeed(0);
      setAvgSpeed(0);
      setStartTime(null);
    } catch (error) {
      console.error("Error saving workout:", error);
      toast.error("Failed to save workout. Please try again.");
    }
  };
  
  const handleDiscardWorkout = () => {
    toast("Workout discarded");
    setShowSummary(false);
    setPointsTracked(0);
    setDistance(0);
    setElapsedTime(0);
    setCurrentSpeed(0);
    setAvgSpeed(0);
    setStartTime(null);
    setTotalPausedTime(0);
    setPauseStartTime(null);
    setWorkoutPokes([]);
    setWorkoutNearbyUsers([]);
  };
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };
  
  const formatPace = (kmh: number) => {
    if (kmh === 0) return "--:--";
    const minPerKm = 60 / kmh;
    const mins = Math.floor(minPerKm);
    const secs = Math.round((minPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  
  const convertDistance = (km: number) => {
    if (useMetric) return { value: km.toFixed(2), unit: "km" };
    return { value: (km * 0.621371).toFixed(2), unit: "mi" };
  };
  
  const convertSpeed = (kmh: number) => {
    if (useMetric) return { value: kmh.toFixed(1), unit: "km/h" };
    return { value: (kmh * 0.621371).toFixed(1), unit: "mph" };
  };

  const handleNotificationBannerTap = () => {
    setShowNotification(false);
    handleStartStop();
  };

  // Removed test notification simulation - notifications now come from Firebase events only

  const handleUserMarkerClick = (user: typeof nearbyUsers[0]) => {
    setSelectedUser(user);
    setShowProfileView(true);
  };

  const handleCenterOnUser = () => {
    if (selectedUser) {
      toast.success(`Centering on ${selectedUser.name}`);
      // In real implementation, this would pan the map
    }
  };

  const handleAddFriend = (userId: string | number) => {
    const id = typeof userId === "number" ? userId.toString() : userId;
    if (selectedUser) {
      setFriendStatuses(prev => ({
        ...prev,
        [id]: { status: "request_pending" }
      }));
      toast.success(`Friend request sent to ${selectedUser.name}`);
    }
  };

  const handleAcceptFriend = (userId: string | number) => {
    const id = typeof userId === "number" ? userId.toString() : userId;
    setFriendStatuses(prev => ({
      ...prev,
      [id]: { status: "friends" }
    }));
    setShowFriendRequestModal(false);
    toast.success("Friend request accepted!");
  };

  const handleDeclineFriend = (userId: string | number) => {
    const id = typeof userId === "number" ? userId.toString() : userId;
    // Set 7-day cooldown
    const cooldownUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);
    setFriendStatuses(prev => ({
      ...prev,
      [id]: { status: "denied", cooldownUntil }
    }));
    setShowFriendRequestModal(false);
    toast("Friend request declined. The user won't be notified.");
  };

  const handleUnfriend = async (userId: string | number) => {
    if (!user?.uid) {
      toast.error("You must be logged in to unfriend someone");
      return;
    }

    const id = typeof userId === "number" ? userId.toString() : userId;
    
    try {
      // Remove from Firebase
      await removeFriend(user.uid, id);
      
      // Update local state
      setFriendStatuses(prev => ({
        ...prev,
        [id]: { status: "not_friends" }
      }));
      
      // Update userProfile context
      if (userProfile) {
        const updatedFriends = (userProfile.friends || []).filter(
          (f: any) => String(f) !== id
        );
        setUserProfile({
          ...userProfile,
          friends: updatedFriends
        });
      }
      
      // Also remove from localStorage socialStorage
      const { unfriend: unfriendLocal } = await import("@/lib/socialStorage");
      if (typeof userId === "number") {
        unfriendLocal(userId);
      }
      
      toast.success(`Unfriended ${selectedUser?.name || "user"}`);
      setShowProfileView(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error unfriending user:", error);
      toast.error("Failed to unfriend. Please try again.");
    }
  };

  const handleSendMessage = () => {
    setShowMessageModal(true);
  };

  const handleMessageSent = (message: string, isTemplate: boolean) => {
    if (selectedUser) {
      toast.success(`Message sent to ${selectedUser.name}!`);
      console.log("Message sent:", { message, isTemplate, to: selectedUser.name });
      // In real implementation, this would save to backend/Firebase
    }
    setShowMessageModal(false);
    setSelectedUser(null);
  };

  // Auto-follow user with camera offset in navigation-style mode
  useEffect(() => {
    if (isNavigationStyle && isWazeMode && location && mapRef && isLoaded && window.google) {
      const updateTimer = setTimeout(() => {
        const cameraCenter = calculateCameraOffset(
          location.lat, 
          location.lng, 
          userHeading || 0,
          0.002
        );
        
        mapRef.panTo(cameraCenter);
        mapRef.setTilt(67.5);
        if (userHeading !== null) {
          mapRef.setHeading(userHeading);
          setMapHeading(userHeading);
        }
      }, 1000);
      
      return () => clearTimeout(updateTimer);
    }
  }, [location, isNavigationStyle, isWazeMode, userHeading, mapRef, isLoaded]);

  // Track other users' movement trails
  useEffect(() => {
    if (nearbyUsers.length === 0) return;
    
    // Batch all trail updates into a single state update
    setUserTrails((prev) => {
      const updated = { ...prev };
      let hasChanges = false;
      
      nearbyUsers.forEach((userData: any) => {
        if (userData.lat && userData.lng) {
          const userId = userData.id;
          const currentTrail = prev[userId] || [];
          const lastPoint = currentTrail[currentTrail.length - 1];
          
          if (!lastPoint || 
              (Math.abs(lastPoint.lat - userData.lat) > 0.0001 || 
               Math.abs(lastPoint.lng - userData.lng) > 0.0001)) {
            const newTrail = [...currentTrail, { lat: userData.lat, lng: userData.lng }];
            updated[userId] = newTrail.slice(-50);
            hasChanges = true;
          }
        }
      });
      
      // Only return new object if there were actual changes
      return hasChanges ? updated : prev;
    });
  }, [nearbyUsers]);

  // Handle focusFriend from navigation (when coming from Index page)
  useEffect(() => {
    if (focusFriend && focusFriend.lat && focusFriend.lng && mapRef && isLoaded && window.google) {
      // Center map on friend's location
      const friendCenter = { lat: focusFriend.lat, lng: focusFriend.lng };
      setMapCenter(friendCenter);
      mapRef.panTo(friendCenter);
      mapRef.setCenter(friendCenter);
      setMapZoom(16); // Zoom in a bit to focus on friend
      
      // Clear the focusFriend from state after handling
      navigate("/map", { replace: true, state: {} });
    }
  }, [focusFriend, mapRef, isLoaded]);

  // Update map center when location changes
  // When workout is active, always keep map centered on user (locked perspective)
  useEffect(() => {
    if (!location || !location.lat || !location.lng || !mapRef || !isLoaded || !window.google) {
      return;
    }
    
    // Don't update center if we're focusing on a friend
    if (focusFriend) {
      return;
    }
    
    // Debounce map updates to prevent excessive re-renders
    const updateTimer = setTimeout(() => {
      if (!isNavigationStyle) {
        // Only update if center changed significantly (avoid tiny updates)
        setMapCenter((prev) => {
          const distance = Math.sqrt(
            Math.pow(prev.lat - location.lat, 2) + 
            Math.pow(prev.lng - location.lng, 2)
          );
          // Only update if moved more than ~10 meters
          if (distance > 0.0001) {
            return { lat: location.lat, lng: location.lng };
          }
          return prev;
        });
        
        // Center map on user when workout is active (locked), otherwise allow free panning
        if (isActive) {
          mapRef.panTo({ lat: location.lat, lng: location.lng });
          mapRef.setCenter({ lat: location.lat, lng: location.lng });
        } else {
          // When inactive, only pan if user hasn't manually moved the map
          // This allows free dragging when workout is not active
        }
      } else if (isNavigationStyle) {
        const cameraCenter = calculateCameraOffset(location.lat, location.lng, userHeading || 0);
        setMapCenter((prev) => {
          const distance = Math.sqrt(
            Math.pow(prev.lat - cameraCenter.lat, 2) + 
            Math.pow(prev.lng - cameraCenter.lng, 2)
          );
          if (distance > 0.0001) {
            return cameraCenter;
          }
          return prev;
        });
        mapRef.panTo(cameraCenter);
        if (isActive) {
          mapRef.setCenter(cameraCenter);
        }
      }
    }, 100); // Small delay to batch updates
    
    return () => clearTimeout(updateTimer);
  }, [location, isNavigationStyle, userHeading, mapRef, isLoaded, isActive]);

  // Get zoom radius for selected activity and zoom level
  const getZoomRadiusForActivity = (
    activity: "running" | "cycling" | "walking",
    zoomLevel: "close" | "medium" | "far"
  ): number => {
    const zoomConfig = {
      running: {
        close: 200,    // 200m - really close
        medium: 2000,  // 2km - current default
        far: 5000      // 5km - wide view
      },
      cycling: {
        close: 500,    // 500m - close
        medium: 5000,  // 5km - medium
        far: 15000     // 15km - very wide
      },
      walking: {
        close: 50,     // 50m - really close
        medium: 150,   // 150m - medium
        far: 300       // 300m - wider view
      }
    };
    return zoomConfig[activity][zoomLevel];
  };

  // Update zoom level based on activity and zoom level setting
  useEffect(() => {
    if (location && mapRef && isLoaded && window.google && selectedActivity) {
      const radius = getZoomRadiusForActivity(selectedActivity, zoomLevel);
      const calculatedZoom = calculateZoomFromMeters(radius);
      setMapZoom(calculatedZoom);
      mapRef.setZoom(calculatedZoom);
      if (!isNavigationStyle) {
        mapRef.panTo({ lat: location.lat, lng: location.lng });
      }
    }
  }, [selectedActivity, zoomLevel, location, mapRef, isLoaded, isNavigationStyle]);

  // Lock/unlock map when workout is active
  useEffect(() => {
    if (mapRef && isLoaded && window.google) {
      // Lock map when workout is active (isActive = true)
      // But allow zoom controls so user can zoom in/out on their location
      mapRef.setOptions({
        draggable: !isActive, // Disable dragging/panning when workout is active
        scrollwheel: true, // Allow scroll zoom
        disableDoubleClickZoom: !!isActive, // Disable double-click zoom when workout is active
        gestureHandling: isActive ? "cooperative" : "auto" // Allow zoom but not pan when workout is active
      });
      
      // Force center on user when workout is active
      if (isActive && location) {
        mapRef.setCenter({ lat: location.lat, lng: location.lng });
      }
    }
  }, [isActive, mapRef, isLoaded, location]);

  const onMapLoad = useCallback((map: any) => {
    setMapRef(map);
    if (window.google && window.google.maps) {
      map.setOptions({
        mapTypeId: window.google.maps.MapTypeId.ROADMAP
      });
      
      // Lock map when workout is active (disable dragging but allow zoom)
      if (isActive) {
        map.setOptions({
          draggable: false, // Disable dragging/panning
          scrollwheel: true, // Allow scroll zoom
          disableDoubleClickZoom: true, // Disable double-click zoom
          gestureHandling: "cooperative" // Allow zoom gestures but not pan
        });
      }
    }
  }, [isActive]);

  const onMarkerClick = (userData: any) => {
    // Ensure user data structure matches ProfileView expectations
    // Use 'name' field from Firebase (username), not displayName from Google
    setSelectedUser({
      id: userData.id,
      name: userData.name || "User", // Always use username from Firebase, never displayName
      distance: userData.distance || formatDistance(userData.distanceValue || 0),
      activity: userData.activity || "Running",
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&size=150`,
      photos: userData.photos || [],
      bio: userData.bio || ""
    });
    setShowProfileView(true); // Open ProfileView directly instead of MatchActionsModal
  };

  const handleUpdateSearchFilter = async (newFilter: SearchFilter) => {
    setSearchFilter(newFilter);
    setShowFilterModal(false);
    
    // Save to Firebase
    if (user) {
      try {
        await updateUserProfile(user.uid, { searchFilter: newFilter });
        toast.success(`Now finding: ${newFilter === "all" ? "All Levels" : newFilter}`);
      } catch (error) {
        console.error("Error updating search filter:", error);
        toast.error("Failed to update filter");
      }
    }
  };

  const handleDeclineMatch = (userId: string) => {
    // Set 3-day cooldown
    const cooldownUntil = Date.now() + (3 * 24 * 60 * 60 * 1000);
    const updated = { ...declinedUsers, [userId]: cooldownUntil };
    setDeclinedUsers(updated);
    localStorage.setItem("declinedUsers", JSON.stringify(updated));
    setShowProfileView(false);
    setSelectedUser(null);
  };

  // Poke handlers
  const handlePoke = async (userId: string) => {
    if (!user?.uid) {
      toast.error("You must be logged in to poke someone");
      return;
    }

    // Check if user has active workout session
    if (!isActive && !isWorkoutActive()) {
      toast.error("You must have an active workout session to poke someone");
      return;
    }

    try {
      await sendPoke(user.uid, userId);
      setHasPokedUsers(prev => ({ ...prev, [userId]: true }));
      toast.success("Poke sent! They'll be notified.");
    } catch (error) {
      console.error("Error sending poke:", error);
      toast.error("Failed to send poke. Please try again.");
    }
  };

  const handleAcceptPoke = async (fromUserId: string) => {
    if (!user?.uid) return;

    try {
      await acceptPoke(user.uid, fromUserId);
      toast.success("Poke accepted!");
      setShowPokeModal(false);
    } catch (error) {
      console.error("Error accepting poke:", error);
      toast.error("Failed to accept poke.");
    }
  };

  const handleDismissPoke = async (fromUserId: string) => {
    if (!user?.uid) return;

    try {
      await dismissPoke(user.uid, fromUserId);
      toast("Poke dismissed");
      setShowPokeModal(false);
    } catch (error) {
      console.error("Error dismissing poke:", error);
      toast.error("Failed to dismiss poke.");
    }
  };

  const getCooldownDays = (userId: string): number => {
    const cooldownUntil = declinedUsers[userId];
    if (!cooldownUntil) return 0;
    const now = Date.now();
    const diff = cooldownUntil - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const onInfoWindowClose = () => {
    setSelectedUser(null);
  };

  const handleCenterOnUserMap = (userData: any) => {
    if (mapRef && userData) {
      const newCenter = { lat: userData.lat, lng: userData.lng };
      mapRef.panTo(newCenter);
      mapRef.setZoom(16);
      setTimeout(() => {
        setMapCenter(newCenter);
        setMapZoom(16);
      }, 100);
      setShowUserList(false);
      setSelectedUser(userData);
    }
  };


  if (!googleMapsApiKey) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          Google Maps API key is missing. Please check your .env file.
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          Error loading Google Maps: {loadError.message}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-muted pb-20">
      {/* People Sidebar - Toggleable */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* Overlay - Click outside to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/20 z-20"
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-card border-r border-border shadow-elevation-3 z-30 flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-5 flex-1 overflow-y-auto min-h-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Activity Feed</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Matches, requests & messages
              </p>
            </div>
          </div>

          {/* Friend Requests Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Friend Requests</h3>
              <BadgeCounter count={friendRequests.incoming.length} variant="default" size="sm" />
            </div>
            {loadingFriendRequestUsers ? (
              <div className="flex items-center justify-center py-4">
                <CircularProgress size={24} />
              </div>
            ) : friendRequests.incoming.length > 0 ? (
              <div className="space-y-2">
                {friendRequests.incoming.slice(0, 3).map((userId) => {
                  const userData = friendRequestUsers[userId];
                  const userName = userData?.name || "Unknown User";
                  const userAvatar = userData?.photoURL;
                  const userActivity = userData?.activity;
                  const userFitnessLevel = userData?.fitnessLevel;
                  
                  return (
                    <motion.div
                      key={userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer relative"
                      onClick={() => {
                        setShowSidebar(false); // Auto-close sidebar
                        navigate("/friends", { state: { tab: "requests" } });
                      }}
                    >
                      {/* New badge */}
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        NEW
                      </span>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`} />
                          <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 pr-8">
                          <p className="text-sm font-medium truncate">
                            {userName} wants to be friends
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {userActivity && (
                              <span className="text-xs text-muted-foreground capitalize">
                                {userActivity}
                              </span>
                            )}
                            {userFitnessLevel && (
                              <>
                                {userActivity && <span className="text-xs text-muted-foreground">•</span>}
                                <span className="text-xs text-muted-foreground capitalize">
                                  {userFitnessLevel}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">No friend requests</p>
              </div>
            )}
          </div>

          {/* Message Requests Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Message Requests</h3>
              <BadgeCounter count={messageRequests.length} variant="default" size="sm" />
            </div>
            {loadingMessageRequestUsers ? (
              <div className="flex items-center justify-center py-4">
                <CircularProgress size={24} />
              </div>
            ) : messageRequests.length > 0 ? (
              <div className="space-y-2">
                {messageRequests.slice(0, 3).map((conv) => {
                  const userData = messageRequestUsers[conv.otherUserId];
                  const userName = userData?.name || "Unknown User";
                  const userAvatar = userData?.photoURL;
                  
                  return (
                    <motion.div
                      key={conv.conversationId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer relative"
                      onClick={() => {
                        setShowSidebar(false); // Auto-close sidebar
                        if (userData) {
                          navigate("/chat", {
                            state: {
                              user: {
                                id: conv.otherUserId,
                                name: userData.name || "Unknown",
                                avatar: userData.photoURL || ""
                              }
                            }
                          });
                        }
                      }}
                    >
                      {/* New badge */}
                      <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        NEW
                      </span>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}`} />
                          <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 pr-8">
                          <p className="text-sm font-medium truncate">
                            Message from {userName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {conv.lastMessage || "No message preview"}
                          </p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <BadgeCounter count={conv.unreadCount} variant="default" size="sm" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">No message requests</p>
              </div>
            )}
          </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Google Maps */}
      <motion.div 
        className="absolute inset-0" 
        style={{ 
          left: showSidebar ? '320px' : '0',
          width: showSidebar ? 'calc(100% - 320px)' : '100%',
          transition: 'left 0.3s ease-in-out, width 0.3s ease-in-out'
        }}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={mapZoom}
          tilt={(is3DMode || isWazeMode) ? mapTilt : 0}
          heading={(is3DMode || isWazeMode) ? mapHeading : 0}
          onLoad={onMapLoad}
          options={{
            disableDefaultUI: false,
            zoomControl: false, // Zoom controls disabled
            streetViewControl: false,
            mapTypeControl: false, // Map/Satellite toggle disabled
            fullscreenControl: false, // Fullscreen button disabled
            mapTypeId: isLoaded && window.google?.maps ? window.google.maps.MapTypeId.ROADMAP : undefined,
            // Lock map when workout is active (isActive = true)
            draggable: !isActive, // Disable dragging when workout is active
            scrollwheel: true, // Allow scroll zoom even when workout is active
            disableDoubleClickZoom: !!isActive, // Disable double-click zoom when workout is active
            gestureHandling: (isActive ? "cooperative" : "auto") as "cooperative" | "auto" | "greedy" | "none" // Allow zoom gestures but not pan when workout is active
          }}
        >
          {/* Current user's activity trail */}
          {isActive && locationHistory.length > 1 && (
            <Polyline
              path={locationHistory}
              options={{
                strokeColor: "#1976d2",
                strokeOpacity: 0.6,
                strokeWeight: 4,
                geodesic: true
              }}
            />
          )}

          {/* Other users' movement trails */}
          {Object.entries(userTrails).map(([userId, trail]) => {
            if (trail.length > 1) {
              return (
                <Polyline
                  key={`trail-${userId}`}
                  path={trail}
                  options={{
                    strokeColor: "#d32f2f",
                    strokeOpacity: 0.4,
                    strokeWeight: 3,
                    geodesic: true
                  }}
                />
              );
            }
            return null;
          })}

          {/* Current user's marker - Always visible when location is available */}
          {location && location.lat && location.lng && isLoaded && window.google && (
            <>
              <Marker
                position={{ lat: location.lat, lng: location.lng }}
                title={isActive ? "You are here (Active)" : "You are here"}
                zIndex={1000}
                icon={{
                  url: isActive 
                    ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                    : "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: isActive 
                    ? new window.google.maps.Size(48, 48) 
                    : new window.google.maps.Size(40, 40),
                  anchor: new window.google.maps.Point(isActive ? 24 : 20, isActive ? 24 : 20)
                }}
                animation={isActive && window.google.maps.Animation ? window.google.maps.Animation.BOUNCE : undefined}
              />
              {/* Circle around user location for better visibility when active */}
              {isActive && window.google.maps && (
                <Marker
                  position={{ lat: location.lat, lng: location.lng }}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#2196F3",
                    fillOpacity: 0.3,
                    strokeColor: "#1976D2",
                    strokeWeight: 2,
                  }}
                  zIndex={999}
                />
              )}
            </>
          )}

          {/* Nearby users' markers */}
          {nearbyUsers
            .filter((userData: any) => userData.id !== user?.uid)
            .map((userData: any) => {
              const hasTrail = userTrails[userData.id] && userTrails[userData.id].length > 1;
              const matchScore = userData.matchScore;
              const scorePercent = matchScore ? Math.round(matchScore * 100) : null;
              return isLoaded && window.google ? (
                <Marker
                  key={userData.id}
                  position={{ lat: userData.lat, lng: userData.lng }}
                  title={`${userData.name || "User"}${hasTrail ? " (Moving)" : ""}${scorePercent ? ` - ${scorePercent}% match` : ""}`}
                  onClick={() => onMarkerClick(userData)}
                  icon={{
                    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    scaledSize: hasTrail 
                      ? new window.google.maps.Size(36, 36) 
                      : new window.google.maps.Size(32, 32)
                  }}
                  animation={hasTrail && window.google.maps.Animation ? window.google.maps.Animation.DROP : undefined}
                />
              ) : null;
            })}

          {/* Info window for selected user */}
          {selectedUser && selectedUser.lat && selectedUser.lng && (
            <InfoWindow
              position={{
                lat: selectedUser.lat,
                lng: selectedUser.lng
              }}
              onCloseClick={onInfoWindowClose}
            >
              <Box sx={{ padding: 1, minWidth: 200 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                  {selectedUser.name || "User"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {getMarkerColor(selectedUser.activity)} {selectedUser.activity || "Active"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {formatDistance(selectedUser.distanceValue || selectedUser.distance || 0)} away
                </Typography>
                <MuiButton
                  variant="contained"
                  size="small"
                  fullWidth
                  startIcon={<CenterFocusStrong />}
                  onClick={() => handleCenterOnUserMap(selectedUser)}
                  sx={{ mt: 1 }}
                >
                  Center on Location
                </MuiButton>
              </Box>
            </InfoWindow>
          )}
        </GoogleMap>
      </motion.div>

      {/* Notification Banner */}
      <NotificationBanner
        show={showNotification}
        onDismiss={() => setShowNotification(false)}
        onTap={handleNotificationBannerTap}
      />

      {/* Workout Summary Modal */}
      <WorkoutSummaryModal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        onSave={handleSaveWorkout}
        onDiscard={handleDiscardWorkout}
        activity={selectedActivity}
        duration={elapsedTime}
        distance={distance}
        avgSpeed={avgSpeed}
        useMetric={useMetric}
        nearbyUsers={workoutNearbyUsers}
        pokes={workoutPokes}
      />

      {/* Top Bar - Beacon Mode Header - Only visible when workout is not active */}
      {!isActive && (
        <div className="absolute top-0 left-0 right-0 z-[60] bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Beacon Mode</h2>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotificationDrawer(true)}
            className={`relative touch-target bg-transparent rounded-full hover:bg-gray-700 transition-all ${
              unreadCount > 0 ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-gray-800' : ''
            }`}
            style={{ width: 40, height: 40 }}
            title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : "Notifications"}
          >
            <NotificationsIcon 
              style={{ fontSize: 24 }} 
              className={unreadCount > 0 ? 'text-red-400' : 'text-white'}
            />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center border-2 border-gray-800 shadow-lg animate-pulse z-10">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>
        </div>
      )}

      {/* Right Side Controls - No Background */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-3 z-10">
        {/* Filter Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilterModal(true)}
          className={`relative touch-target rounded-full shadow-elevation-3 border-2 ${
            searchFilter !== "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-foreground border-border"
          }`}
          style={{ width: 56, height: 56 }}
          title={`Filter: ${searchFilter === "all" ? "All Levels" : searchFilter.charAt(0).toUpperCase() + searchFilter.slice(1)}`}
        >
          <FilterListIcon style={{ fontSize: 28 }} />
          {searchFilter !== "all" && (
            <span className={`absolute -top-1 -right-1 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-background ${
              searchFilter === "beginner" 
                ? "bg-blue-500" 
                : searchFilter === "intermediate" 
                ? "bg-green-500" 
                : "bg-purple-500"
            }`}>
              {searchFilter === "beginner" ? "B" : searchFilter === "intermediate" ? "I" : "P"}
            </span>
          )}
        </motion.button>

        {/* Zoom Level Button - Only visible when workout is active */}
        {isActive && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              // Cycle through zoom levels: close → medium → far → close
              setZoomLevel((current) => {
                if (current === "close") return "medium";
                if (current === "medium") return "far";
                return "close";
              });
            }}
            className={`touch-target rounded-full shadow-elevation-3 border-2 transition-all ${
              zoomLevel !== "medium"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary"
            }`}
            style={{ width: 56, height: 56 }}
            title={`Zoom: ${zoomLevel === "close" ? "Close" : zoomLevel === "medium" ? "Medium" : "Far"}`}
          >
            {zoomLevel === "close" ? (
              <ZoomIn style={{ fontSize: 28 }} />
            ) : zoomLevel === "medium" ? (
              <ViewComfy style={{ fontSize: 28 }} />
            ) : (
              <ZoomOut style={{ fontSize: 28 }} />
            )}
          </motion.button>
        )}

        {/* Poke Notification Button - Only visible when workout is active */}
        {isActive && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowMatchesDrawer(true);
              // Scroll to poked users when opened via poke button
              setTimeout(() => {
                const firstPokedElement = document.querySelector('[data-poked="true"]');
                if (firstPokedElement) {
                  firstPokedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 300);
            }}
            className={`relative touch-target rounded-full shadow-elevation-3 border-2 transition-all ${
              showMatchesDrawer && pokes.length > 0
                ? "bg-primary/20 border-primary"
                : "bg-card border-border hover:border-primary"
            }`}
            style={{ width: 56, height: 56 }}
            title={pokes.length > 0 ? `${pokes.length} poke${pokes.length > 1 ? 's' : ''} received` : "No pokes"}
          >
            <NotificationsIcon 
              style={{ fontSize: 28 }} 
              className="text-foreground"
            />
            {pokes.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-background animate-pulse">
                {pokes.length > 9 ? '9+' : pokes.length}
              </span>
            )}
          </motion.button>
        )}

        {/* People Sidebar Toggle */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const newState = !showSidebar;
            setShowSidebar(newState);
            // Mark matches as viewed when sidebar is opened
            if (newState) {
              setLastViewedMatchesCount(matches.length);
            }
          }}
          className={`relative touch-target rounded-full shadow-elevation-3 border-2 transition-all ${
            showSidebar
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-foreground border-border hover:border-primary"
          }`}
          style={{ width: 56, height: 56 }}
          title={showSidebar ? "Hide sidebar" : "Show sidebar"}
        >
          <PeopleIcon style={{ fontSize: 28 }} />
        </motion.button>

        {/* Recenter Button - Only visible when workout is not active */}
        {!isActive && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (location && mapRef && isLoaded && window.google) {
                const center = { lat: location.lat, lng: location.lng };
                mapRef.panTo(center);
                mapRef.setCenter(center);
                setMapCenter(center);
                toast.success("Map recentered on your location");
              }
            }}
            className="touch-target bg-card text-foreground rounded-full shadow-elevation-3 border-2 border-border hover:border-primary transition-all"
            style={{ width: 56, height: 56 }}
            title="Recenter on your location"
          >
            <MyLocationMui style={{ fontSize: 28 }} />
          </motion.button>
        )}
      </div>

      {/* Profile View Modal */}
      <AnimatePresence>
        {showProfileView && selectedUser && (
          <ProfileView
            user={selectedUser}
            friendStatus={getFriendStatus(selectedUser.id)}
            cooldownDays={getCooldownDays(selectedUser.id) || getCooldownDaysForFriend(selectedUser.id)}
            onClose={() => {
              setShowProfileView(false);
              setSelectedUser(null);
            }}
            onSendMessage={() => {
              setShowProfileView(false);
              handleSendMessage();
            }}
            onAddFriend={() => handleAddFriend(selectedUser.id)}
            onAcceptFriend={() => handleAcceptFriend(selectedUser.id)}
            onDeclineFriend={() => handleDeclineFriend(selectedUser.id)}
            onUnfriend={() => handleUnfriend(selectedUser.id)}
            onPoke={isActive ? () => handlePoke(selectedUser.id) : undefined}
            hasPoked={hasPokedUsers[selectedUser.id] || false}
            isWorkoutActive={isActive}
          />
        )}
      </AnimatePresence>

      {/* Message Modal */}
      <MessageModal
        show={showMessageModal}
        userName={selectedUser?.name || ""}
        onClose={() => setShowMessageModal(false)}
        onSend={handleMessageSent}
      />

      {/* Friend Request Modal */}
      <FriendRequestModal
        isOpen={showFriendRequestModal}
        onClose={() => setShowFriendRequestModal(false)}
        userName={selectedUser?.name || ""}
        onAccept={() => selectedUser && handleAcceptFriend(selectedUser.id)}
        onDecline={() => selectedUser && handleDeclineFriend(selectedUser.id)}
      />

      {/* Poke Modal */}
      {selectedUser && (
        <PokeModal
          isOpen={showPokeModal}
          onClose={() => {
            setShowPokeModal(false);
            setSelectedUser(null);
          }}
          userName={selectedUser.name || "User"}
          userAvatar={selectedUser.avatar}
          userId={selectedUser.id}
          onAccept={() => selectedUser && handleAcceptPoke(selectedUser.id)}
          onDismiss={() => selectedUser && handleDismissPoke(selectedUser.id)}
          onChat={() => {
            handleSendMessage();
            setShowPokeModal(false);
          }}
          onAddFriend={() => {
            handleAddFriend(selectedUser.id);
            setShowPokeModal(false);
          }}
        />
      )}

      {/* Stop Activity Confirmation Dialog */}
      <AlertDialog open={showStopConfirmation} onOpenChange={setShowStopConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to stop your {selectedActivity} session? Your workout will be saved and you can review it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStop}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Stop Activity
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Combined Minimalistic Control - Active State */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute bottom-20 left-0 right-0 px-4 z-10"
          >
            <div
              className={`
              bg-card/95 backdrop-blur-md rounded-2xl shadow-elevation-4 border border-border/50 overflow-hidden
              ${
                selectedActivity === "running"
                  ? "border-success/30"
                  : selectedActivity === "cycling"
                  ? "border-primary/30"
                  : "border-warning/30"
              }
            `}
            >
              {/* Stats Row */}
              <div className="px-4 py-2.5 border-b border-border/30">
                <div className="grid grid-cols-3 gap-2">
                  {/* Time */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground tabular-nums">
                      {formatTime(elapsedTime)}
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Time</div>
                  </div>

                  {/* Distance */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground tabular-nums">
                      {convertDistance(distance).value}
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">{convertDistance(distance).unit}</div>
                  </div>

                  {/* Average Speed */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground tabular-nums">
                      {convertSpeed(avgSpeed).value}
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">{convertSpeed(avgSpeed).unit}</div>
                  </div>
                </div>
              </div>

              {/* Buttons Row */}
              <div className="px-3 py-3">
                <div className="flex items-center justify-center gap-3">
                  {/* Pause Button */}
                  <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                    <Button
                      onClick={handlePause}
                      className={`
                        w-full h-14 text-base font-extrabold shadow-elevation-4 transition-all duration-300 rounded-xl
                        ${
                          selectedActivity === "running"
                            ? "bg-gradient-to-r from-warning to-warning/90 text-warning-foreground hover:from-warning/90 hover:to-warning"
                            : selectedActivity === "cycling"
                            ? "bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground hover:from-secondary/90 hover:to-secondary"
                            : "bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground hover:from-secondary/90 hover:to-secondary"
                        }
                      `}
                    >
                      {isPaused ? (
                        <>
                          <PlayArrowIcon className="mr-2" style={{ fontSize: 24 }} />
                          Resume
                        </>
                      ) : (
                        <>
                          <PauseIcon className="mr-2" style={{ fontSize: 24 }} />
                          Pause
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* Stop Button */}
                  <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
                    <Button
                      onClick={() => setShowStopConfirmation(true)}
                      className="w-full h-14 text-base font-extrabold shadow-elevation-4 transition-all duration-300 rounded-xl bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground hover:from-destructive/90 hover:to-destructive"
                    >
                      <StopIcon className="mr-2" style={{ fontSize: 24 }} />
                      Stop
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Combined Minimalistic Control - Inactive State */}
      <AnimatePresence>
        {!isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute bottom-20 left-0 right-0 px-4 z-10"
          >
            <div
              className={`
              bg-card/95 backdrop-blur-md rounded-2xl shadow-elevation-4 border border-border/50 overflow-hidden
              ${
                selectedActivity === "running"
                  ? "border-success/30"
                  : selectedActivity === "cycling"
                  ? "border-primary/30"
                  : "border-warning/30"
              }
            `}
            >
              {/* Stats Row */}
              <div className="px-4 py-2.5 border-b border-border/30">
                <div className="grid grid-cols-3 gap-2">
                  {/* Time */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground tabular-nums">
                      00:00
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Time</div>
                  </div>

                  {/* Average Speed */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground tabular-nums">
                      --
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Avg. speed (km/h)</div>
                  </div>

                  {/* Distance */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground tabular-nums">
                      0.00
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Distance (km)</div>
                  </div>
                </div>
              </div>

              {/* Buttons Row */}
              <div className="px-3 py-3">
                <div className="flex items-center justify-center gap-4">
                  {/* Activity Selector Button (Left) */}
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        // Cycle through available activities
                        const currentIndex = availableActivities.findIndex(a => a.id === selectedActivity);
                        const nextIndex = (currentIndex + 1) % availableActivities.length;
                        setSelectedActivity(availableActivities[nextIndex].id as typeof selectedActivity);
                      }}
                      className={`
                        relative flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300
                        ${
                          selectedActivity === "running"
                            ? "border-success bg-success/15 shadow-elevation-2"
                            : selectedActivity === "cycling"
                            ? "border-primary bg-primary/15 shadow-elevation-2"
                            : "border-warning bg-warning/15 shadow-elevation-2"
                        }
                      `}
                    >
                      {selectedActivity === "running" && (
                        <DirectionsRunIcon className="text-success" style={{ fontSize: 24 }} />
                      )}
                      {selectedActivity === "cycling" && (
                        <DirectionsBikeIcon className="text-primary" style={{ fontSize: 24 }} />
                      )}
                      {selectedActivity === "walking" && (
                        <DirectionsWalkIcon className="text-warning" style={{ fontSize: 24 }} />
                      )}
                      <CheckCircleIcon 
                        className={
                          selectedActivity === "running"
                            ? "text-success"
                            : selectedActivity === "cycling"
                            ? "text-primary"
                            : "text-warning"
                        }
                        style={{ fontSize: 14, position: 'absolute', top: -2, right: -2 }}
                      />
                    </motion.button>
                    <span className="text-[10px] font-medium text-foreground">
                      {availableActivities.find((a) => a.id === selectedActivity)?.label || selectedActivity}
                    </span>
                  </div>

                  {/* Start Button (Middle) - Circular */}
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      animate={{ scale: [1, 1.01, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      onClick={handleStartStop}
                      className={`
                        flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 transition-all duration-300 shadow-elevation-4
                        ${
                          selectedActivity === "running"
                            ? "bg-gradient-to-r from-success to-success/90 text-success-foreground border-success hover:from-success/90 hover:to-success"
                            : selectedActivity === "cycling"
                            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground border-primary hover:from-primary/90 hover:to-primary"
                            : "bg-gradient-to-r from-warning to-warning/90 text-warning-foreground border-warning hover:from-warning/90 hover:to-warning"
                        }
                      `}
                    >
                      <span className="text-base font-extrabold">Start</span>
                    </motion.button>
                  </div>

                  {/* Filter Button (Right) */}
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowFilterModal(true)}
                      className={`
                        relative flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300
                        ${
                          searchFilter !== "all"
                            ? "border-primary bg-primary/15 shadow-elevation-2"
                            : "border-border bg-card/50 hover:bg-secondary"
                        }
                      `}
                      title={`Filter: ${searchFilter === "all" ? "All Levels" : searchFilter.charAt(0).toUpperCase() + searchFilter.slice(1)}`}
                    >
                      <FilterListIcon 
                        className={searchFilter !== "all" ? "text-primary" : "text-muted-foreground"}
                        style={{ fontSize: 24 }} 
                      />
                      {searchFilter !== "all" && (
                        <span className={`absolute -top-1 -right-1 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-background ${
                          searchFilter === "beginner" 
                            ? "bg-blue-500" 
                            : searchFilter === "intermediate" 
                            ? "bg-green-500" 
                            : "bg-purple-500"
                        }`}>
                          {searchFilter === "beginner" ? "B" : searchFilter === "intermediate" ? "I" : "P"}
                        </span>
                      )}
                    </motion.button>
                    <span className="text-[10px] font-medium text-foreground">Filter</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>




      {/* Nearby Matches Drawer */}
      <AnimatePresence>
        {showMatchesDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMatchesDrawer(false)}
              className="fixed inset-0 z-40 backdrop-blur-sm"
              style={{ 
                pointerEvents: 'auto',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 40
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-elevation-4 p-6 ${
                isActive ? 'pb-6' : 'pb-24'
              } border-t border-border`}
              style={{ 
                pointerEvents: 'auto',
                maxHeight: '85vh',
                minHeight: '200px',
                overflowY: 'auto'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground">Nearby Matches</h2>
                  {matches.length > 0 && (
                    <BadgeCounter count={matches.length} variant="default" size="sm" />
                  )}
                  {pokes.length > 0 && (
                    <span className="bg-purple-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                      {pokes.length} poke{pokes.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMatchesDrawer(false)}
                  className="rounded-full"
                >
                  <CloseIcon />
                </Button>
              </div>

              {/* Matches List */}
              {matchesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <CircularProgress />
                </div>
              ) : matches.length > 0 ? (
                <div className="space-y-2">
                  {matches
                    .sort((a, b) => {
                      const aPoked = pokes.includes(a.user.uid);
                      const bPoked = pokes.includes(b.user.uid);
                      if (aPoked && !bPoked) return -1;
                      if (!aPoked && bPoked) return 1;
                      return 0;
                    })
                    .map((match, index) => {
                      const user = match.user;
                      const distanceKm = match.distance / 1000;
                      const isPoked = pokes.includes(user.uid);
                      const userData = nearbyUsers.find((u: any) => u.id === user.uid);

                      return (
                        <motion.div
                          key={user.uid}
                          data-poked={isPoked}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors relative ${
                            isPoked ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300/30' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <button
                              onClick={() => {
                                if (userData) {
                                  setSelectedUser(userData);
                                  setShowProfileView(true);
                                  setShowMatchesDrawer(false);
                                }
                              }}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <Avatar className={`w-12 h-12 border-2 ${isPoked ? 'border-purple-500 ring-2 ring-purple-300' : 'border-primary'}`}>
                                <AvatarImage src={user.photoURL || `https://ui-avatars.com/api/?name=${user.name || 'User'}`} />
                                <AvatarFallback>
                                  {user.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                            </button>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm truncate">
                                  {user.name || "Unknown User"}
                                </h4>
                                {isPoked && (
                                  <Badge className="bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                    POKED YOU!
                                  </Badge>
                                )}
                                <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0">
                                  {formatDistance(distanceKm)}
                                </Badge>
                              </div>

                              {/* Activity & Fitness Level */}
                              <div className="flex items-center gap-2 text-xs mb-2">
                                <div className="flex items-center gap-1">
                                  {user.activity === "running" ? (
                                    <DirectionsRunIcon className="text-success" style={{ fontSize: 14 }} />
                                  ) : user.activity === "cycling" ? (
                                    <DirectionsBikeIcon className="text-primary" style={{ fontSize: 14 }} />
                                  ) : (
                                    <DirectionsWalkIcon className="text-warning" style={{ fontSize: 14 }} />
                                  )}
                                  <span className="capitalize">{user.activity}</span>
                                </div>
                                <span>•</span>
                                <Badge
                                  variant="outline"
                                  className={`${
                                    user.fitnessLevel === "beginner" ? "bg-blue-500" :
                                    user.fitnessLevel === "intermediate" ? "bg-yellow-500" :
                                    "bg-red-500"
                                  } text-white border-0 text-xs px-1.5 py-0`}
                                >
                                  {user.fitnessLevel}
                                </Badge>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 mt-2">
                                {isActive && (
                                  <Button
                                    size="sm"
                                    className="flex-1 h-8 text-xs justify-center bg-purple-500 hover:bg-purple-600 text-white"
                                    onClick={() => handlePoke(user.uid)}
                                  >
                                    <TouchAppIcon style={{ fontSize: 14 }} className="mr-1" />
                                    Poke
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-8 text-xs justify-center"
                                  onClick={() => handleAddFriend(user.uid)}
                                >
                                  <PersonAddIcon style={{ fontSize: 14 }} className="mr-1" />
                                  Add
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-8 text-xs justify-center"
                                  onClick={() => {
                                    if (userData) {
                                      setSelectedUser(userData);
                                      handleSendMessage();
                                      setShowMatchesDrawer(false);
                                    }
                                  }}
                                >
                                  <SendIcon style={{ fontSize: 14 }} className="mr-1" />
                                  Message
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">No nearby matches found</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Filter Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilterModal(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-20 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-elevation-4 p-6 max-h-[70vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Who do you want to find?</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Filter nearby users by fitness level
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilterModal(false)}
                  className="rounded-full"
                >
                  <CloseIcon />
                </Button>
              </div>

              {/* Filter Options */}
              <div className="space-y-3">
                {[
                  { 
                    value: "all" as SearchFilter, 
                    label: "All Levels", 
                    description: "Show everyone nearby",
                    color: "bg-muted text-muted-foreground",
                    selectedColor: "bg-primary text-primary-foreground"
                  },
                  { 
                    value: "beginner" as SearchFilter, 
                    label: "Beginner", 
                    description: "Just starting out",
                    color: "bg-blue-100 text-blue-800 border-blue-300",
                    selectedColor: "bg-blue-600 text-white border-blue-600"
                  },
                  { 
                    value: "intermediate" as SearchFilter, 
                    label: "Intermediate", 
                    description: "Regular fitness routine",
                    color: "bg-green-100 text-green-800 border-green-300",
                    selectedColor: "bg-green-600 text-white border-green-600"
                  },
                  { 
                    value: "pro" as SearchFilter, 
                    label: "Pro", 
                    description: "Advanced athletes",
                    color: "bg-purple-100 text-purple-800 border-purple-300",
                    selectedColor: "bg-purple-600 text-white border-purple-600"
                  }
                ].map((option) => {
                  const isSelected = searchFilter === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUpdateSearchFilter(option.value)}
                      className={`
                        w-full p-4 rounded-xl border-2 transition-all duration-200
                        ${isSelected 
                          ? option.selectedColor + " shadow-elevation-2" 
                          : option.color + " hover:shadow-md"
                        }
                        flex items-center justify-between
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {/* Visual Indicator */}
                        <div className={`
                          w-3 h-3 rounded-full
                          ${isSelected 
                            ? "bg-white/30 ring-2 ring-white/50" 
                            : option.value === "all" 
                            ? "bg-muted-foreground/30"
                            : option.value === "beginner"
                            ? "bg-blue-600"
                            : option.value === "intermediate"
                            ? "bg-green-600"
                            : "bg-purple-600"
                          }
                        `} />
                        <div className="text-left">
                          <div className={`font-semibold text-base ${isSelected ? "text-white" : ""}`}>
                            {option.label}
                          </div>
                          <div className={`text-xs mt-0.5 ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>
                            {option.description}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircleIcon className="text-white" style={{ fontSize: 20 }} />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
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
              className={`fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-elevation-4 p-6 ${
                isActive ? 'pb-6' : 'pb-24'
              } border-t border-border`}
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
                          default:
                            return <NotificationsIcon style={{ fontSize: 20 }} />;
                        }
                      };

                      const getNotificationTitle = () => {
                        switch (notification.type) {
                          case "message":
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
                          default:
                            return notification.userName;
                        }
                      };

                      const getNotificationMessage = () => {
                        switch (notification.type) {
                          case "message":
                            return notification.message || "Sent you a message";
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
                                : notification.type === "friend_request"
                                ? "bg-warning/15"
                                : notification.type === "poke"
                                ? "bg-purple-500/15"
                                : notification.type === "workout_complete"
                                ? "bg-success/15"
                                : notification.type === "achievement"
                                ? "bg-warning/15"
                                : "bg-success/15"
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

      {!isActive && <BottomNavigation />}
    </div>
  );
};
export default MapScreen;
