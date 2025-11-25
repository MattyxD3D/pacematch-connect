// Main map screen with Waze-like proximity matching
import { useState, useCallback, useEffect, useRef } from "react";
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
  Avatar,
  Drawer,
  IconButton,
  Divider,
  Slider
} from "@mui/material";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useLocation } from "@/hooks/useLocation";
import { useNearbyUsers } from "@/hooks/useNearbyUsers";
import { useMatching } from "@/hooks/useMatching";
import { useAuth } from "@/hooks/useAuth";
import { formatDistance } from "@/utils/distance";
import { SearchFilter } from "@/services/matchingService";
import { MatchActionsModal } from "@/components/MatchActionsModal";
import { updateUserProfile } from "@/services/authService";
import FilterListIcon from "@mui/icons-material/FilterList";
import { NearbyUsersAccordion } from "@/components/NearbyUsersAccordion";
import { updateUserVisibility } from "@/services/locationService";
import { saveWorkout } from "@/services/workoutService";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import PauseIcon from "@mui/icons-material/Pause";
import ExploreIcon from "@mui/icons-material/Explore";
import PeopleIcon from "@mui/icons-material/People";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import SettingsIcon from "@mui/icons-material/Settings";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import MailIcon from "@mui/icons-material/Mail";
import GroupIcon from "@mui/icons-material/Group";
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
  ZoomIn
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
  const { user } = useAuth();
  const { userProfile, hasActivity, useMetric, addWorkout } = useUser();
  const { addNotification, unreadMessageCount, unreadFriendRequestCount } = useNotificationContext();
  
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
  
  // Workout tracking state
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPeopleDrawer, setShowPeopleDrawer] = useState(false);
  const [pointsTracked, setPointsTracked] = useState(0);
  const [distance, setDistance] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [avgSpeed, setAvgSpeed] = useState(0); // km/h
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showSpeedNotPace, setShowSpeedNotPace] = useState(true);
  const lastDistanceRef = useRef(0);
  const lastTimeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get user's enabled activities from profile
  const userActivities = userProfile?.activities || ["running", "cycling", "walking"];
  const [selectedActivity, setSelectedActivity] = useState<"running" | "cycling" | "walking">(
    userActivities[0] as "running" | "cycling" | "walking"
  );
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);
  const [showMatchActionsModal, setShowMatchActionsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const [declinedUsers, setDeclinedUsers] = useState<Record<string, number>>({}); // userId -> cooldownUntil timestamp
  const [visibleToFriendsOnly, setVisibleToFriendsOnly] = useState(false);
  const [showNearbyList, setShowNearbyList] = useState(false);
  
  // Activity filter for People Drawer
  const [activityFilter, setActivityFilter] = useState<"all" | "running" | "cycling" | "walking">("all");
  
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
    return friendStatuses[id]?.status || "not_friends";
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
  const availableActivities = activities.filter(act => 
    userActivities.includes(act.id as "running" | "cycling" | "walking")
  );

  // Use matched users if available, otherwise fallback to nearby users
  // Filter out declined users (within cooldown period)
  const now = Date.now();
  const matchedUsersForDisplay = matches
    .filter((match) => {
      const userId = match.user.uid;
      const cooldownUntil = declinedUsers[userId];
      return !cooldownUntil || cooldownUntil <= now;
    })
    .map((match) => ({
      id: match.user.uid,
      name: match.user.name || "User",
      distance: formatDistance(match.distance / 1000),
      distanceValue: match.distance / 1000,
      activity: match.user.activity || "Running",
      avatar: match.user.photoURL || "https://via.placeholder.com/150",
      lat: match.user.location.lat,
      lng: match.user.location.lng,
      matchScore: match.score,
      fitnessLevel: match.user.fitnessLevel,
      pace: match.user.pace
    }));

  // Use nearby users from hook, or fallback to mock data for UI features
  const nearbyUsers = matchedUsersForDisplay.length > 0 
    ? matchedUsersForDisplay
    : (nearbyUsersFromHook.length > 0 
        ? nearbyUsersFromHook.map((userData: any) => ({
            id: userData.id,
            name: userData.name || "User",
            distance: formatDistance(userData.distance),
            distanceValue: userData.distance,
            activity: userData.activity || "Running",
            avatar: userData.photoURL || "https://via.placeholder.com/150",
            lat: userData.lat,
            lng: userData.lng,
            photos: [],
            bio: ""
          }))
        : []);

  // Filter users by activity
  const filteredUsers = activityFilter === "all" 
    ? nearbyUsers 
    : nearbyUsers.filter(user => user.activity.toLowerCase() === activityFilter);

  // Sort by distance
  const sortedUsers = [...filteredUsers].sort((a, b) => a.distanceValue - b.distanceValue);

  // Track location history for trail when activity is active
  useEffect(() => {
    if (isActive && location) {
      setLocationHistory((prev) => {
        const newHistory = [...prev, { lat: location.lat, lng: location.lng }];
        
        if (prev.length > 0) {
          const lastPoint = prev[prev.length - 1];
          const heading = calculateBearing(
            lastPoint.lat,
            lastPoint.lng,
            location.lat,
            location.lng
          );
          setUserHeading(heading);
          
          if (isWazeMode && mapRef && isLoaded && window.google) {
            mapRef.setHeading(heading);
            setMapHeading(heading);
          }
        }
        
        return newHistory.slice(-100);
      });
    } else if (!isActive) {
      setLocationHistory([]);
      setUserHeading(null);
    }
  }, [location, isActive, isWazeMode, mapRef, isLoaded]);

  // Enhanced tracking interval for workout stats
  useEffect(() => {
    if (isActive && !isPaused && location) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
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
  }, [isActive, isPaused, selectedActivity, location, locationHistory]);
  
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
      lastDistanceRef.current = 0;
      lastTimeRef.current = 0;
      setShowNotification(false);
    } else {
      // Stop activity - show summary
      setIsActive(false);
      setIsPaused(false);
      if (distance > 0) {
        setShowSummary(true);
      }
    }
  };
  
  const handlePause = () => {
    setIsPaused(!isPaused);
    toast(isPaused ? "Activity resumed" : "Activity paused");
  };
  
  const handleSaveWorkout = async () => {
    if (!user?.uid) {
      toast.error("You must be logged in to save workouts");
      return;
    }

    // Filter nearby users who were active during the workout
    const activeNearbyUsers = nearbyUsers
      .filter(user => user.distanceValue <= 2.0) // Within 2km radius
      .slice(0, 5) // Limit to 5 users
      .map(user => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        activity: user.activity,
        distance: user.distance,
      }));

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
      // Save to Firebase
      await saveWorkout(user.uid, workoutData);
      
      // Also save to localStorage via context (for offline/fallback)
      addWorkout(workoutData);
      
      toast.success(`Workout saved! ${distance.toFixed(2)} km tracked.`);
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

  const handleNotificationTap = () => {
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
    nearbyUsers.forEach((userData: any) => {
      if (userData.lat && userData.lng) {
        setUserTrails((prev) => {
          const userId = userData.id;
          const currentTrail = prev[userId] || [];
          const lastPoint = currentTrail[currentTrail.length - 1];
          
          if (!lastPoint || 
              (Math.abs(lastPoint.lat - userData.lat) > 0.0001 || 
               Math.abs(lastPoint.lng - userData.lng) > 0.0001)) {
            const newTrail = [...currentTrail, { lat: userData.lat, lng: userData.lng }];
            return { ...prev, [userId]: newTrail.slice(-50) };
          }
          return prev;
        });
      }
    });
  }, [nearbyUsers]);

  // Update map center when location changes
  // When activity is selected, always keep map centered on user (locked perspective)
  useEffect(() => {
    if (location && location.lat && location.lng) {
      if (!isNavigationStyle) {
        setMapCenter({ lat: location.lat, lng: location.lng });
        // Center map on user when location is first obtained or when activity is selected
        if (mapRef && isLoaded && window.google) {
          // Force center when activity is selected (locked perspective)
          if (selectedActivity) {
            mapRef.panTo({ lat: location.lat, lng: location.lng });
            // Also set center directly to prevent any drift
            mapRef.setCenter({ lat: location.lat, lng: location.lng });
          } else {
            mapRef.panTo({ lat: location.lat, lng: location.lng });
          }
        }
      } else if (isNavigationStyle && mapRef && isLoaded && window.google) {
        const cameraCenter = calculateCameraOffset(location.lat, location.lng, userHeading || 0);
        setMapCenter(cameraCenter);
        mapRef.panTo(cameraCenter);
        // Force center when activity is selected
        if (selectedActivity) {
          mapRef.setCenter(cameraCenter);
        }
      }
    }
  }, [location, isNavigationStyle, userHeading, mapRef, isLoaded, selectedActivity]);

  // Get fixed radius for selected activity
  const getFixedRadiusForActivity = (activity: "running" | "cycling" | "walking"): number => {
    switch (activity) {
      case "cycling":
        return 10000; // 10km
      case "running":
        return 2000;  // 2km
      case "walking":
        return 1000;  // 1km
      default:
        return 2000;  // Default to running radius
    }
  };

  // Update zoom level based on fixed radius for selected activity
  useEffect(() => {
    if (location && mapRef && isLoaded && window.google && selectedActivity) {
      const fixedRadius = getFixedRadiusForActivity(selectedActivity);
      const zoomLevel = calculateZoomFromMeters(fixedRadius);
      setMapZoom(zoomLevel);
      mapRef.setZoom(zoomLevel);
      if (!isNavigationStyle) {
        mapRef.panTo({ lat: location.lat, lng: location.lng });
      }
    }
  }, [selectedActivity, location, mapRef, isLoaded, isNavigationStyle]);

  // Lock/unlock map when activity selection changes
  useEffect(() => {
    if (mapRef && isLoaded && window.google) {
      // Lock map when activity is selected (running, cycling, or walking)
      // But allow zoom controls so user can zoom in/out on their location
      mapRef.setOptions({
        draggable: !selectedActivity, // Disable dragging/panning
        scrollwheel: true, // Allow scroll zoom
        disableDoubleClickZoom: !!selectedActivity, // Disable double-click zoom
        gestureHandling: selectedActivity ? "cooperative" : "auto" // Allow zoom but not pan when activity is selected
      });
      
      // Force center on user when activity is selected
      if (selectedActivity && location) {
        mapRef.setCenter({ lat: location.lat, lng: location.lng });
      }
    }
  }, [selectedActivity, mapRef, isLoaded, location]);

  const onMapLoad = useCallback((map: any) => {
    setMapRef(map);
    if (window.google && window.google.maps) {
      map.setOptions({
        mapTypeId: window.google.maps.MapTypeId.ROADMAP
      });
      
      // Lock map when activity is selected (disable dragging but allow zoom)
      if (selectedActivity) {
        map.setOptions({
          draggable: false, // Disable dragging/panning
          scrollwheel: true, // Allow scroll zoom
          disableDoubleClickZoom: true, // Disable double-click zoom
          gestureHandling: "cooperative" // Allow zoom gestures but not pan
        });
      }
    }
  }, [selectedActivity]);

  const onMarkerClick = (userData: any) => {
    setSelectedUser(userData);
    setShowMatchActionsModal(true);
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
    setShowMatchActionsModal(false);
    setSelectedUser(null);
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

  const handleCenterOnMyLocation = () => {
    if (mapRef && location) {
      const newCenter = { lat: location.lat, lng: location.lng };
      mapRef.panTo(newCenter);
      mapRef.setZoom(15);
      setTimeout(() => {
        setMapCenter(newCenter);
        setMapZoom(15);
      }, 100);
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
      {/* Google Maps */}
      <div className="absolute inset-0">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={mapZoom}
          tilt={(is3DMode || isWazeMode) ? mapTilt : 0}
          heading={(is3DMode || isWazeMode) ? mapHeading : 0}
          onLoad={onMapLoad}
          options={{
            disableDefaultUI: false,
            zoomControl: true, // Always show zoom controls
            zoomControlOptions: isLoaded && window.google?.maps ? {
              position: window.google.maps.ControlPosition.RIGHT_CENTER
            } : undefined,
            streetViewControl: false,
            mapTypeControl: true,
            mapTypeControlOptions: isLoaded && window.google?.maps ? {
              style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: window.google.maps.ControlPosition.TOP_CENTER,
              mapTypeIds: [
                window.google.maps.MapTypeId.ROADMAP,
                window.google.maps.MapTypeId.SATELLITE,
                window.google.maps.MapTypeId.TERRAIN
              ]
            } : undefined,
            fullscreenControl: true,
            mapTypeId: isLoaded && window.google?.maps ? window.google.maps.MapTypeId.ROADMAP : undefined,
            // Lock map when activity is selected (running, cycling, or walking)
            draggable: !selectedActivity, // Disable dragging when activity is selected
            scrollwheel: true, // Allow scroll zoom even when activity is selected
            disableDoubleClickZoom: !!selectedActivity, // Disable double-click zoom when activity is selected
            gestureHandling: (selectedActivity ? "cooperative" : "auto") as "cooperative" | "auto" | "greedy" | "none" // Allow zoom gestures but not pan when activity is selected
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
                    ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                    : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
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
                    url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
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
      </div>

      {/* Notification Banner */}
      <NotificationBanner
        show={showNotification}
        onDismiss={() => setShowNotification(false)}
        onTap={handleNotificationTap}
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
      />

      {/* Top Bar - Right Side Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-10">
        {/* People List */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPeopleDrawer(true)}
          className="relative touch-target bg-primary text-primary-foreground rounded-full shadow-elevation-3"
          style={{ width: 56, height: 56 }}
        >
          <PeopleIcon style={{ fontSize: 28 }} />
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {sortedUsers.length}
          </span>
        </motion.button>

        {/* Show/Hide Nearby People List */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNearbyList(!showNearbyList)}
          className={`relative touch-target rounded-full shadow-elevation-3 border-2 transition-all ${
            showNearbyList
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-foreground border-border hover:border-primary"
          }`}
          style={{ width: 56, height: 56 }}
          title={showNearbyList ? "Hide nearby people" : "Show nearby people"}
        >
          <GroupIcon style={{ fontSize: 28 }} />
          {sortedUsers.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {sortedUsers.length}
            </span>
          )}
        </motion.button>

        {/* Messages */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/messages")}
          className="relative touch-target bg-card text-foreground rounded-full shadow-elevation-3 border border-border"
          style={{ width: 56, height: 56 }}
        >
          <MailIcon style={{ fontSize: 28 }} />
          {unreadMessageCount > 0 && (
            <div className="absolute -top-1 -right-1">
              <BadgeCounter count={unreadMessageCount} variant="default" size="md" />
            </div>
          )}
        </motion.button>

        {/* Filter Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilterModal(true)}
          className={`touch-target rounded-full shadow-elevation-3 border-2 ${
            searchFilter !== "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-foreground border-border"
          }`}
          style={{ width: 56, height: 56 }}
          title={`Filter: ${searchFilter === "all" ? "All Levels" : searchFilter}`}
        >
          <FilterListIcon style={{ fontSize: 28 }} />
        </motion.button>

        {/* My Location */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleCenterOnMyLocation}
          className="touch-target bg-card text-primary rounded-full shadow-elevation-3 border-2 border-primary"
          style={{ width: 56, height: 56 }}
        >
          <MyLocationIcon style={{ fontSize: 28 }} />
        </motion.button>

        {/* Settings */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/settings")}
          className="touch-target bg-card text-foreground rounded-full shadow-elevation-3"
          style={{ width: 56, height: 56 }}
        >
          <SettingsIcon style={{ fontSize: 28 }} />
        </motion.button>
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
      {/* Enhanced Stats Display */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute top-4 left-4 right-4 z-10"
          >
            <div
              className={`
              bg-card/90 backdrop-blur-sm rounded-lg shadow-elevation-2 border border-border/30 overflow-hidden
              ${
                selectedActivity === "running"
                  ? "border-success/30"
                  : selectedActivity === "cycling"
                  ? "border-primary/30"
                  : "border-warning/30"
              }
            `}
            >
              {/* Minimal Stats Card */}
              <div className="px-2.5 py-1.5">
                {/* Compact Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {selectedActivity === "running" && (
                      <DirectionsRunIcon className="text-success" style={{ fontSize: 14 }} />
                    )}
                    {selectedActivity === "cycling" && (
                      <DirectionsBikeIcon className="text-primary" style={{ fontSize: 14 }} />
                    )}
                    {selectedActivity === "walking" && (
                      <DirectionsWalkIcon className="text-warning" style={{ fontSize: 14 }} />
                    )}
                    <span className="text-[10px] font-medium text-foreground capitalize">
                      {selectedActivity}
                    </span>
                    <span className={`text-[9px] px-1 py-0.5 rounded ${
                      isPaused ? "bg-muted/50 text-muted-foreground" : "bg-success/15 text-success"
                    }`}>
                      {isPaused ? "Paused" : "Active"}
                    </span>
                  </div>
                </div>

                {/* Minimal Stats - Distance, Time, Avg Speed */}
                <div className="grid grid-cols-3 gap-1.5">
                  {/* Time */}
                  <div className="text-center">
                    <TimerIcon className="text-muted-foreground mx-auto mb-0.5" style={{ fontSize: 12 }} />
                    <div className="text-sm font-semibold text-foreground tabular-nums leading-tight">
                      {formatTime(elapsedTime)}
                    </div>
                    <div className="text-[9px] text-muted-foreground">Time</div>
                  </div>

                  {/* Distance */}
                  <div className="text-center">
                    <div className="text-xs mb-0.5">📍</div>
                    <div className="text-sm font-semibold text-foreground tabular-nums leading-tight">
                      {convertDistance(distance).value}
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      {convertDistance(distance).unit}
                    </div>
                  </div>

                  {/* Average Speed */}
                  <div className="text-center">
                    <SpeedIcon className="text-muted-foreground mx-auto mb-0.5" style={{ fontSize: 12 }} />
                    <div className="text-sm font-semibold text-foreground tabular-nums leading-tight">
                      {convertSpeed(avgSpeed).value}
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      {convertSpeed(avgSpeed).unit}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="absolute bottom-20 left-0 right-0 p-6 z-10">
        {/* Activity Selector (when not active) */}
        <AnimatePresence>
          {!isActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 bg-card/95 backdrop-blur-md rounded-2xl p-5 shadow-elevation-4 border border-border/50"
            >
              <p className="text-sm font-bold mb-3 text-center">Select Activity Type</p>
              <div className={`grid gap-3 ${
                availableActivities.length === 1 ? 'grid-cols-1' : 
                availableActivities.length === 2 ? 'grid-cols-2' : 
                'grid-cols-3'
              }`}>
                {availableActivities.map((act) => {
                  const Icon = act.icon;
                  const isSelected = selectedActivity === act.id;
                  return (
                    <motion.button
                      key={act.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedActivity(act.id as typeof selectedActivity)}
                      className={`
                        flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300
                        ${isSelected 
                          ? act.color === 'success'
                            ? 'border-success bg-success/15 shadow-elevation-2'
                            : act.color === 'primary'
                            ? 'border-primary bg-primary/15 shadow-elevation-2'
                            : 'border-warning bg-warning/15 shadow-elevation-2'
                          : 'border-border bg-card/50 hover:bg-secondary'
                        }
                      `}
                    >
                      <Icon
                        className={
                          isSelected
                            ? act.color === 'success'
                              ? 'text-success'
                              : act.color === 'primary'
                              ? 'text-primary'
                              : 'text-warning'
                            : 'text-muted-foreground'
                        }
                        style={{ fontSize: 32 }}
                      />
                      <span className={`text-xs mt-2 font-semibold ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {act.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Controls removed */}

        {/* Start/Stop/Pause Activity Buttons */}
        {isActive ? (
          <div className="flex gap-3">
            <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
              <Button
                onClick={handlePause}
                className={`
                  w-full h-16 text-lg font-extrabold shadow-elevation-4 transition-all duration-300 rounded-2xl
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
                    <PlayArrowIcon className="mr-2" style={{ fontSize: 28 }} />
                    Resume
                  </>
                ) : (
                  <>
                    <PauseIcon className="mr-2" style={{ fontSize: 28 }} />
                    Pause
                  </>
                )}
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.97 }} className="flex-1">
              <Button
                onClick={handleStartStop}
                className="w-full h-16 text-lg font-extrabold shadow-elevation-4 transition-all duration-300 rounded-2xl bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground hover:from-destructive/90 hover:to-destructive"
              >
                <StopIcon className="mr-2" style={{ fontSize: 28 }} />
                Stop
              </Button>
            </motion.div>
          </div>
        ) : (
          <motion.div
            whileTap={{ scale: 0.97 }}
            animate={{ scale: [1, 1.01, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Button
              onClick={handleStartStop}
              className={`
                w-full h-16 text-lg font-extrabold shadow-elevation-4 transition-all duration-300 rounded-2xl
                ${
                  selectedActivity === "running"
                    ? "bg-gradient-to-r from-success to-success/90 text-success-foreground hover:from-success/90 hover:to-success"
                    : selectedActivity === "cycling"
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary"
                    : "bg-gradient-to-r from-warning to-warning/90 text-warning-foreground hover:from-warning/90 hover:to-warning"
                }
              `}
            >
              <PlayArrowIcon className="mr-3" style={{ fontSize: 32 }} />
              Start {availableActivities.find((a) => a.id === selectedActivity)?.label}
            </Button>
          </motion.div>
        )}
      </div>

      {/* People Drawer with Matching Accordion */}
      <Drawer
        anchor="bottom"
        open={showPeopleDrawer}
        onClose={() => setShowPeopleDrawer(false)}
        PaperProps={{
          style: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "80vh",
          },
        }}
      >
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Nearby Matches</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {matches.length} {matches.length === 1 ? "match" : "matches"} found
              </p>
            </div>
            <button
              onClick={() => setShowPeopleDrawer(false)}
              className="p-2 hover:bg-accent rounded-full transition-colors touch-target"
            >
              <CloseIcon style={{ fontSize: 24 }} className="text-muted-foreground" />
            </button>
          </div>

          {/* Matching Accordion */}
          <NearbyUsersAccordion
            matches={matches}
            loading={matchesLoading}
            onViewProfile={(userId) => {
              const user = nearbyUsers.find((u: any) => u.id === userId);
              if (user) {
                setSelectedUser(user);
                setShowProfileView(true);
                setShowPeopleDrawer(false);
              }
            }}
            onAddFriend={(userId) => {
              handleAddFriend(userId);
            }}
            onSendMessage={(userId) => {
              const user = nearbyUsers.find((u: any) => u.id === userId);
              if (user) {
                setSelectedUser(user);
                handleSendMessage();
                setShowPeopleDrawer(false);
              }
            }}
          />
        </div>
      </Drawer>

      {/* Match Actions Modal */}
      {selectedUser && (
        <MatchActionsModal
          isOpen={showMatchActionsModal}
          onClose={() => {
            setShowMatchActionsModal(false);
            setSelectedUser(null);
          }}
          user={{
            id: selectedUser.id,
            name: selectedUser.name,
            avatar: selectedUser.avatar,
            activity: selectedUser.activity,
            distance: selectedUser.distance,
            fitnessLevel: selectedUser.fitnessLevel
          }}
          friendStatus={getFriendStatus(selectedUser.id)}
          cooldownDays={getCooldownDays(selectedUser.id) || getCooldownDaysForFriend(selectedUser.id)}
          onAddFriend={() => {
            handleAddFriend(selectedUser.id);
            setShowMatchActionsModal(false);
          }}
          onDecline={() => handleDeclineMatch(selectedUser.id)}
          onChat={() => {
            handleSendMessage();
            setShowMatchActionsModal(false);
          }}
          onViewProfile={() => {
            setShowProfileView(true);
            setShowMatchActionsModal(false);
          }}
        />
      )}

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
              className="fixed bottom-20 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-elevation-4 p-6 space-y-4 max-h-[70vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Who do you want to find?</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilterModal(false)}
                >
                  <CloseIcon />
                </Button>
              </div>
              <div className="space-y-2">
                {[
                  { value: "all" as SearchFilter, label: "All Levels" },
                  { value: "beginner" as SearchFilter, label: "Beginner" },
                  { value: "intermediate" as SearchFilter, label: "Intermediate" },
                  { value: "pro" as SearchFilter, label: "Pro" }
                ].map((option) => (
                  <Button
                    key={option.value}
                    onClick={() => handleUpdateSearchFilter(option.value)}
                    variant={searchFilter === option.value ? "default" : "outline"}
                    className="w-full h-14 text-base font-semibold"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNavigation />
    </div>
  );
};
export default MapScreen;
