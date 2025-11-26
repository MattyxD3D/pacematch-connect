import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { listenToEvents, Event as FirebaseEvent, joinEvent, listenToEventCheckIns, createEvent } from "@/services/eventService";
import { getUserData } from "@/services/authService";
import { calculateDistance, formatDistance } from "@/utils/distance";
import { GoogleMap, Marker, InfoWindow, OverlayView, useJsApiLoader } from "@react-google-maps/api";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExploreIcon from "@mui/icons-material/Explore";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import AddIcon from "@mui/icons-material/Add";
import ViewListIcon from "@mui/icons-material/ViewList";
import MapIcon from "@mui/icons-material/Map";
import FilterListIcon from "@mui/icons-material/FilterList";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MailIcon from "@mui/icons-material/Mail";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import Avatar from "@mui/material/Avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { EventDetailModal } from "@/components/EventDetailModal";
import { CreateEventModal } from "@/components/CreateEventModal";
import { QuickCheckInModal } from "@/components/QuickCheckInModal";
import BottomNavigation from "@/components/BottomNavigation";
import { generateDummyEvents, ENABLE_DUMMY_DATA } from "@/lib/dummyData";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

const libraries: ("places")[] = ["places"];

type EventType = "running" | "cycling" | "walking" | "others";
type EventCategory = "all" | "user" | "sponsored";

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
  participants: string[]; // Array of user IDs
  maxParticipants?: number;
  hostId?: string;
  hostName?: string;
  hostAvatar?: string;
  sponsorLogo?: string;
  lat: number;
  lng: number;
  isJoined?: boolean;
}

// Custom Event Marker Component
interface EventMarkerProps {
  event: Event;
  checkInCount: number;
  countdown: string;
  onClick: () => void;
}

const EventMarker = ({ event, checkInCount, countdown, onClick }: EventMarkerProps) => {
  const getActivityColor = (type: EventType): string => {
    switch (type) {
      case "running":
        return "#22c55e"; // success/green
      case "cycling":
        return "#3b82f6"; // primary/blue
      case "walking":
        return "#eab308"; // warning/yellow
      case "others":
        return "#a855f7"; // secondary/purple
      default:
        return "#6b7280"; // gray
    }
  };

  const borderColor = getActivityColor(event.type);

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer transform transition-transform hover:scale-110"
      style={{ transform: "translate(-50%, -50%)" }}
    >
      {/* Profile Photo Marker */}
      <div
        className="relative rounded-full border-4 shadow-lg overflow-hidden"
        style={{
          width: "56px",
          height: "56px",
          borderColor: borderColor,
        }}
      >
        <img
          src={event.hostAvatar || `https://ui-avatars.com/api/?name=${event.hostName || 'User'}`}
          alt={event.hostName || "Host"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${event.hostName || 'User'}`;
          }}
        />
        {/* Check-in Count Badge */}
        {checkInCount > 0 && (
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-background shadow-md">
            +{checkInCount}
          </div>
        )}
      </div>
      {/* Countdown Timer Badge */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-full border border-border shadow-md whitespace-nowrap">
        {countdown}
      </div>
    </div>
  );
};

const Events = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { unreadCount, notifications, dismissNotification, markAllAsRead, handleNotificationTap } = useNotificationContext();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [activityFilter, setActivityFilter] = useState<EventType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showQuickCheckIn, setShowQuickCheckIn] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed on mobile
  const [drawerOpen, setDrawerOpen] = useState(false); // Mobile drawer state
  const [checkInCounts, setCheckInCounts] = useState<Record<string, number>>({});
  const [selectedMarkerEvent, setSelectedMarkerEvent] = useState<Event | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 14.5995, lng: 120.9842 });
  const [mapZoom, setMapZoom] = useState(13);
  const [mapRef, setMapRef] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Pin drop state for event creation
  const [pendingEventLocation, setPendingEventLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [tempMarkerPosition, setTempMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  
  // Google Maps API loader
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey || '',
    libraries: libraries
  });

  // Get user location - try to get from browser geolocation once
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  useEffect(() => {
    if (navigator.geolocation && currentUser?.uid) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Could not get user location:", error);
          // Set default location or try to get from user data
        }
      );
    }
  }, [currentUser?.uid]);

  // Countdown timer utility function
  const calculateCountdown = useCallback((date: string, time: string): string => {
    try {
      // Parse date (could be in various formats)
      let eventDate: Date;
      
      // If date is already a full ISO string with time
      if (date.includes('T')) {
        eventDate = new Date(date);
      } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // ISO date format (YYYY-MM-DD) - combine with time
        eventDate = new Date(`${date}T${time}`);
      } else if (date.includes('/')) {
        // Assume format like "12/25/2024" or "MM/DD/YYYY"
        const parts = date.split('/');
        if (parts.length === 3) {
          // Check if it's MM/DD/YYYY or DD/MM/YYYY by checking first part
          const firstPart = parseInt(parts[0]);
          if (firstPart > 12) {
            // DD/MM/YYYY format
            eventDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${time}`);
          } else {
            // MM/DD/YYYY format
            eventDate = new Date(`${parts[2]}-${parts[0]}-${parts[1]}T${time}`);
          }
        } else {
          eventDate = new Date(`${date}T${time}`);
        }
      } else {
        // Try parsing as-is or with time appended
        eventDate = new Date(`${date}T${time}`);
      }
      
      // Validate the date
      if (isNaN(eventDate.getTime())) {
        return "Invalid date";
      }
      
      const now = currentTime;
      const diff = eventDate.getTime() - now.getTime();
      
      if (diff < 0) {
        const pastDiff = Math.abs(diff);
        const pastHours = Math.floor(pastDiff / (1000 * 60 * 60));
        if (pastHours < 24) {
          return "Started";
        }
        return "Expired";
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      } else {
        return "Starting soon";
      }
    } catch (error) {
      return "Invalid date";
    }
  }, [currentTime]);

  // Update current time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Mark all notifications as read when notification drawer opens
  useEffect(() => {
    if (showNotificationDrawer && unreadCount > 0) {
      markAllAsRead();
    }
  }, [showNotificationDrawer, unreadCount, markAllAsRead]);

  // Listen to events from Firebase
  useEffect(() => {
    const unsubscribe = listenToEvents((firebaseEvents: FirebaseEvent[]) => {
      // Transform Firebase events to match local Event interface
      let transformedEvents: Event[] = firebaseEvents.map((event) => {
        // Calculate distance if user location is available
        let distance = "Unknown";
        let distanceValue = Infinity;
        
        if (userLocation && event.lat && event.lng) {
          const dist = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            event.lat,
            event.lng
          );
          if (dist !== null) {
            distanceValue = dist;
            distance = formatDistance(dist);
          }
        }
        
        return {
          ...event,
          isJoined: currentUser?.uid ? event.participants.includes(currentUser.uid) : false,
          distance,
          distanceValue,
        };
      });
      
      // Add dummy events if enabled and no real events exist
      if (ENABLE_DUMMY_DATA && transformedEvents.length === 0 && userLocation) {
        const dummyEvents = generateDummyEvents(userLocation);
        transformedEvents = dummyEvents.map((event) => ({
          ...event,
          isJoined: currentUser?.uid ? event.participants.includes(currentUser.uid) : false,
        }));
      }
      
      setEvents(transformedEvents);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, userLocation]);

  // Center map on user location when available
  useEffect(() => {
    if (userLocation && mapRef) {
      setMapCenter({ lat: userLocation.lat, lng: userLocation.lng });
      mapRef.panTo({ lat: userLocation.lat, lng: userLocation.lng });
    }
  }, [userLocation, mapRef]);

  // Listen to check-ins for each event
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    events.forEach((event) => {
      const unsubscribe = listenToEventCheckIns(event.id, (checkIns) => {
        setCheckInCounts((prev) => ({
          ...prev,
          [event.id]: checkIns.length,
        }));
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [events]);

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesActivity = activityFilter === "all" || event.type === activityFilter;
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    return matchesActivity && matchesCategory;
  });

  // Sort by distance
  const sortedEvents = [...filteredEvents].sort((a, b) => a.distanceValue - b.distanceValue);

  const handleJoinEvent = async (eventId: string) => {
    if (!currentUser?.uid) {
      toast.error("Please log in to join events");
      return;
    }

    try {
      await joinEvent(eventId, currentUser.uid);
      toast.success("You've joined the event!");
      // The real-time listener will update the events automatically
    } catch (error: any) {
      console.error("Error joining event:", error);
      toast.error(error.message || "Failed to join event");
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleCreateEvent = async (eventData: any) => {
    if (!currentUser?.uid) {
      toast.error("Please log in to create events");
      return;
    }

    try {
      // Get user data for host info
      const userData = await getUserData(currentUser.uid);
      
      // Get location - use selected location from form, then userLocation, then user's saved location or default
      let eventLat = eventData.lat || userLocation?.lat || userData?.lat || 14.5995;
      let eventLng = eventData.lng || userLocation?.lng || userData?.lng || 120.9842;
      
      // Format date properly (ISO string)
      const eventDate = new Date(eventData.date);
      const formattedDate = eventDate.toISOString().split('T')[0];
      
      // Prepare event data, only include maxParticipants if it's defined
      const eventPayload: any = {
        title: eventData.title,
        description: eventData.description,
        type: eventData.activityType,
        category: "user",
        date: formattedDate,
        time: eventData.time,
        location: eventData.location,
        distance: "0.0 km", // Will be calculated by listeners
        distanceValue: 0,
        lat: eventLat,
        lng: eventLng,
        hostName: userData?.name || currentUser.displayName || "User",
        hostAvatar: userData?.photoURL || currentUser.photoURL || "",
      };
      
      // Only add maxParticipants if it's defined and greater than 0
      if (eventData.maxParticipants && eventData.maxParticipants > 0) {
        eventPayload.maxParticipants = eventData.maxParticipants;
      }
      
      // Create event in Firebase
      const eventId = await createEvent(currentUser.uid, eventPayload);
      
      toast.success("Event created successfully!");
      setShowCreateEvent(false);
      // Clear temp marker after successful creation
      setTempMarkerPosition(null);
      setPendingEventLocation(null);
      // The real-time listener will update the events automatically
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(error.message || "Failed to create event");
    }
  };

  const getActivityIcon = (type: EventType) => {
    switch (type) {
      case "running":
        return <DirectionsRunIcon className="text-success" style={{ fontSize: 20 }} />;
      case "cycling":
        return <DirectionsBikeIcon className="text-primary" style={{ fontSize: 20 }} />;
      case "walking":
        return <DirectionsWalkIcon className="text-warning" style={{ fontSize: 20 }} />;
      case "others":
        return <FitnessCenterIcon className="text-secondary" style={{ fontSize: 20 }} />;
    }
  };

  const getActivityColor = (type: EventType) => {
    switch (type) {
      case "running":
        return "success";
      case "cycling":
        return "primary";
      case "walking":
        return "warning";
      case "others":
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md shadow-elevation-2 sticky top-0 z-20 border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Events</h1>
              <p className="text-sm text-muted-foreground">
                {sortedEvents.length} event{sortedEvents.length !== 1 ? "s" : ""} near you
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotificationDrawer(true)}
              className={`relative touch-target bg-transparent rounded-full hover:bg-muted transition-all ${
                unreadCount > 0 ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-card' : ''
              }`}
              style={{ width: 40, height: 40 }}
              title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : "Notifications"}
            >
              <NotificationsIcon 
                style={{ fontSize: 24 }} 
                className={unreadCount > 0 ? 'text-red-400' : 'text-foreground'}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center border-2 border-card shadow-lg animate-pulse z-10">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filters - Hidden on mobile, shown on desktop */}
      <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {/* Activity Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <FilterListIcon className="text-muted-foreground flex-shrink-0" style={{ fontSize: 20 }} />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActivityFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activityFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-elevation-2"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              All Activities
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActivityFilter("running")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activityFilter === "running"
                  ? "bg-success text-success-foreground shadow-elevation-2"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <DirectionsRunIcon style={{ fontSize: 18 }} />
              Running
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActivityFilter("cycling")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activityFilter === "cycling"
                  ? "bg-primary text-primary-foreground shadow-elevation-2"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <DirectionsBikeIcon style={{ fontSize: 18 }} />
              Cycling
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActivityFilter("walking")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activityFilter === "walking"
                  ? "bg-warning text-warning-foreground shadow-elevation-2"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <DirectionsWalkIcon style={{ fontSize: 18 }} />
              Walking
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setActivityFilter("others")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activityFilter === "others"
                  ? "bg-secondary text-secondary-foreground shadow-elevation-2"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <FitnessCenterIcon style={{ fontSize: 18 }} />
              Others
            </motion.button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategoryFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                categoryFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-elevation-2"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              All Events
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategoryFilter("user")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                categoryFilter === "user"
                  ? "bg-primary text-primary-foreground shadow-elevation-2"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              Community
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategoryFilter("sponsored")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                categoryFilter === "sponsored"
                  ? "bg-primary text-primary-foreground shadow-elevation-2"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <StarIcon style={{ fontSize: 16 }} />
              Sponsored
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-0 sm:px-4 sm:px-6 pb-20 sm:pb-24">
        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full"
            >
              {/* Map Container */}
              <div className="relative w-full h-[calc(100vh-200px)] sm:h-[600px] rounded-2xl overflow-hidden shadow-elevation-3 border-2 border-border/50">
                {loadError ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <p className="text-destructive font-semibold">Error loading map</p>
                      <p className="text-sm text-muted-foreground">Please check your Google Maps API key</p>
                    </div>
                  </div>
                ) : !isLoaded ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading map...</p>
                    </div>
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={mapCenter}
                    zoom={mapZoom}
                    onLoad={(map) => {
                      setMapRef(map);
                      if (userLocation) {
                        map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
                      }
                    }}
                    onClick={(e) => {
                      // Allow clicking anywhere on the map to drop a pin for event creation
                      // Don't handle clicks if clicking on markers (they have their own handlers)
                      if (e.latLng && !e.placeId) {
                        const lat = e.latLng.lat();
                        const lng = e.latLng.lng();
                        setTempMarkerPosition({ lat, lng });
                        setPendingEventLocation({ lat, lng });
                        // Clear any selected event marker when placing new pin
                        setSelectedMarkerEvent(null);
                      }
                    }}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: false,
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                    }}
                  >
                    {/* User Location Marker */}
                    {userLocation && (
                      <Marker
                        position={{ lat: userLocation.lat, lng: userLocation.lng }}
                        icon={{
                          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                          scaledSize: new window.google.maps.Size(32, 32),
                        }}
                        title="Your location"
                      />
                    )}

                    {/* Temporary Marker for Create Mode */}
                    {tempMarkerPosition && (
                      <Marker
                        position={{ lat: tempMarkerPosition.lat, lng: tempMarkerPosition.lng }}
                        icon={{
                          url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                          scaledSize: new window.google.maps.Size(48, 48),
                        }}
                        title="Event location"
                        onClick={(e) => {
                          // Prevent map click from firing when clicking marker
                          if (e && (e as any).stopPropagation) {
                            (e as any).stopPropagation();
                          }
                        }}
                      />
                    )}

                    {/* Event Markers */}
                    {sortedEvents.map((event) => {
                      const checkInCount = checkInCounts[event.id] || 0;
                      const countdown = calculateCountdown(event.date, event.time);
                      const isSelected = selectedMarkerEvent?.id === event.id;

                      return (
                        <OverlayView
                          key={event.id}
                          position={{ lat: event.lat, lng: event.lng }}
                          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                          <div onClick={(e) => e.stopPropagation()}>
                            <EventMarker
                              event={event}
                              checkInCount={checkInCount}
                              countdown={countdown}
                              onClick={() => {
                                setSelectedMarkerEvent(event);
                                // Clear temp marker if clicking on existing event while in create mode
                                if (tempMarkerPosition) {
                                  setTempMarkerPosition(null);
                                  setPendingEventLocation(null);
                                }
                              }}
                            />
                          </div>
                        </OverlayView>
                      );
                    })}

                    {/* InfoWindow for temporary marker (Create Mode) */}
                    {tempMarkerPosition && !showCreateEvent && (
                      <InfoWindow
                        position={{ lat: tempMarkerPosition.lat, lng: tempMarkerPosition.lng }}
                        onCloseClick={() => {
                          setTempMarkerPosition(null);
                          setPendingEventLocation(null);
                        }}
                      >
                        <div className="p-3 min-w-[200px]">
                          <h3 className="font-bold text-base mb-2">Create Event Here</h3>
                          <div className="space-y-2 text-sm">
                            <div className="text-muted-foreground">
                              <p>Location selected:</p>
                              <p className="font-mono text-xs">
                                {tempMarkerPosition.lat.toFixed(6)}, {tempMarkerPosition.lng.toFixed(6)}
                              </p>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                onClick={() => {
                                  // Remove the pin
                                  setTempMarkerPosition(null);
                                  setPendingEventLocation(null);
                                }}
                                variant="outline"
                                className="flex-1 h-8 text-xs"
                                size="sm"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => {
                                  setShowCreateEvent(true);
                                }}
                                className="flex-1 h-8 text-xs"
                                size="sm"
                              >
                                Create Event Here
                              </Button>
                            </div>
                          </div>
                        </div>
                      </InfoWindow>
                    )}

                    {/* InfoWindow for selected marker */}
                    {selectedMarkerEvent && !tempMarkerPosition && (
                      <InfoWindow
                        position={{ lat: selectedMarkerEvent.lat, lng: selectedMarkerEvent.lng }}
                        onCloseClick={() => setSelectedMarkerEvent(null)}
                      >
                        <div className="p-2 min-w-[200px]">
                          <h3 className="font-bold text-base mb-2">{selectedMarkerEvent.title}</h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              {getActivityIcon(selectedMarkerEvent.type)}
                              <span className="capitalize">{selectedMarkerEvent.type}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <AccessTimeIcon style={{ fontSize: 16 }} />
                              <span>{selectedMarkerEvent.date} at {selectedMarkerEvent.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="font-semibold">Countdown: {calculateCountdown(selectedMarkerEvent.date, selectedMarkerEvent.time)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <PeopleIcon style={{ fontSize: 16 }} />
                              <span>
                                {checkInCounts[selectedMarkerEvent.id] || 0} checked in · {selectedMarkerEvent.participants.length} participants
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <LocationOnIcon style={{ fontSize: 16 }} />
                              <span>{selectedMarkerEvent.distance}</span>
                            </div>
                            <Button
                              onClick={() => {
                                handleEventClick(selectedMarkerEvent);
                                setSelectedMarkerEvent(null);
                              }}
                              className="w-full mt-2 h-8 text-xs"
                              size="sm"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                )}
              </div>

              {/* Top Right Controls - Like MapScreen */}
              <div className="absolute top-4 right-4 flex flex-col gap-3 z-30">
                {/* Create Event Button */}
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateEvent(true)}
                  className="touch-target bg-primary text-primary-foreground rounded-full shadow-elevation-3 border-2 border-primary-foreground/20 hover:shadow-elevation-4 transition-all duration-300 flex items-center justify-center"
                  style={{ width: 56, height: 56 }}
                  title="Create event"
                >
                  <AddIcon style={{ fontSize: 28 }} />
                </motion.button>

                {/* Events Drawer/List Button - Mobile only */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDrawerOpen(true)}
                  className="sm:hidden touch-target rounded-full shadow-elevation-3 border-2 bg-card/90 backdrop-blur-sm text-foreground border-border"
                  style={{ width: 56, height: 56 }}
                  title="Events list"
                >
                  <ViewListIcon style={{ fontSize: 28 }} />
                  {sortedEvents.length > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 bg-success text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full px-1 border-2 border-background"
                    >
                      {sortedEvents.length > 9 ? '9+' : sortedEvents.length}
                    </Badge>
                  )}
                </motion.button>

                {/* Desktop Sidebar Toggle */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden sm:flex touch-target rounded-full shadow-elevation-3 border-2 bg-card/90 backdrop-blur-sm text-foreground border-border hover:border-primary items-center justify-center"
                  style={{ width: 56, height: 56 }}
                  title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                >
                  {sidebarOpen ? <CloseIcon style={{ fontSize: 28 }} /> : <MenuIcon style={{ fontSize: 28 }} />}
                </motion.button>
              </div>

              {/* Desktop Sidebar */}
              <motion.div
                initial={false}
                animate={{
                  x: sidebarOpen ? 0 : 400,
                  opacity: sidebarOpen ? 1 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="hidden sm:block absolute top-0 right-0 w-80 sm:w-96 h-full bg-background/95 backdrop-blur-md shadow-elevation-4 border-l border-border overflow-hidden z-30 pointer-events-none"
                style={{ pointerEvents: sidebarOpen ? 'auto' : 'none' }}
              >
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b border-border">
                    <h2 className="text-lg font-bold">Events</h2>
                    <p className="text-xs text-muted-foreground">{sortedEvents.length} events found</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {sortedEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <EventIcon className="text-muted-foreground/30 mx-auto mb-2" style={{ fontSize: 48 }} />
                        <p className="text-sm text-muted-foreground">No events found</p>
                      </div>
                    ) : (
                      sortedEvents.map((event, index) => {
                        const checkInCount = checkInCounts[event.id] || 0;
                        const countdown = calculateCountdown(event.date, event.time);
                        
                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => {
                              if (mapRef) {
                                mapRef.panTo({ lat: event.lat, lng: event.lng });
                                mapRef.setZoom(15);
                              }
                              setSelectedMarkerEvent(event);
                            }}
                            className="cursor-pointer"
                          >
                            <Card className="p-3 hover:shadow-elevation-2 transition-all border border-border">
                              <div className="flex items-start gap-3">
                                <Avatar
                                  src={event.hostAvatar}
                                  alt={event.hostName}
                                  sx={{ width: 48, height: 48 }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getActivityIcon(event.type)}
                                    <h4 className="font-semibold text-sm truncate">{event.title}</h4>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {event.date} at {event.time}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="secondary" className="text-xs">
                                      {countdown}
                                    </Badge>
                                    {checkInCount > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{checkInCount} checked in
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {event.distance}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {sortedEvents.length === 0 ? (
                <Card className="p-12 text-center shadow-elevation-2">
                  <EventIcon style={{ fontSize: 64 }} className="text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2">No events found</h3>
                  <p className="text-muted-foreground text-sm">
                    Try adjusting your filters to see more events
                  </p>
                </Card>
              ) : (
                sortedEvents.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={index}
                    onJoin={handleJoinEvent}
                    onClick={() => handleEventClick(event)}
                    getActivityIcon={getActivityIcon}
                    getActivityColor={getActivityColor}
                    listView
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Event Button - For list view only */}
      {viewMode === "list" && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateEvent(true)}
          className="fixed bottom-6 right-6 touch-target bg-primary text-primary-foreground rounded-full shadow-elevation-4 hover:shadow-elevation-5 transition-all duration-300 flex items-center justify-center z-30"
          style={{ width: 56, height: 56 }}
          title="Create event"
        >
          <AddIcon style={{ fontSize: 28 }} />
        </motion.button>
      )}

      {/* Event Detail Modal */}
      {showEventDetail && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => {
            setShowEventDetail(false);
            setSelectedEvent(null);
          }}
          onJoin={handleJoinEvent}
        />
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <CreateEventModal
          onClose={() => {
            setShowCreateEvent(false);
            // Clear temp marker when modal closes
            setTempMarkerPosition(null);
            setPendingEventLocation(null);
          }}
          onCreateEvent={handleCreateEvent}
          initialLocation={pendingEventLocation}
        />
      )}

      {/* Quick Check-in Modal */}
      {showQuickCheckIn && (
        <QuickCheckInModal
          onClose={() => setShowQuickCheckIn(false)}
        />
      )}

      {/* Mobile Events Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle>Events</DrawerTitle>
                <DrawerDescription>
                  {sortedEvents.length} event{sortedEvents.length !== 1 ? "s" : ""} found
                </DrawerDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrawerOpen(false)}
                className="h-8 w-8"
              >
                <CloseIcon style={{ fontSize: 20 }} />
              </Button>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto flex-1">
            {/* Filters inside drawer - Only activity filters */}
            <div className="p-4 border-b border-border bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Filter by Activity</p>
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActivityFilter("all")}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    activityFilter === "all"
                      ? "bg-primary text-primary-foreground shadow-elevation-2"
                      : "bg-background text-foreground hover:bg-accent border border-border"
                  }`}
                >
                  <FilterListIcon style={{ fontSize: 18 }} />
                  All Activities
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActivityFilter("running")}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    activityFilter === "running"
                      ? "bg-success text-success-foreground shadow-elevation-2"
                      : "bg-background text-foreground hover:bg-accent border border-border"
                  }`}
                >
                  <DirectionsRunIcon style={{ fontSize: 20 }} />
                  Running
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActivityFilter("cycling")}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    activityFilter === "cycling"
                      ? "bg-primary text-primary-foreground shadow-elevation-2"
                      : "bg-background text-foreground hover:bg-accent border border-border"
                  }`}
                >
                  <DirectionsBikeIcon style={{ fontSize: 20 }} />
                  Cycling
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActivityFilter("walking")}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    activityFilter === "walking"
                      ? "bg-warning text-warning-foreground shadow-elevation-2"
                      : "bg-background text-foreground hover:bg-accent border border-border"
                  }`}
                >
                  <DirectionsWalkIcon style={{ fontSize: 20 }} />
                  Walking
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActivityFilter("others")}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 col-span-2 ${
                    activityFilter === "others"
                      ? "bg-secondary text-secondary-foreground shadow-elevation-2"
                      : "bg-background text-foreground hover:bg-accent border border-border"
                  }`}
                >
                  <FitnessCenterIcon style={{ fontSize: 20 }} />
                  Others
                </motion.button>
              </div>
            </div>

            {/* Event List */}
            <div className="p-4 space-y-3">
              {sortedEvents.length === 0 ? (
                <div className="text-center py-8">
                  <EventIcon className="text-muted-foreground/30 mx-auto mb-2" style={{ fontSize: 48 }} />
                  <p className="text-sm text-muted-foreground">No events found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                sortedEvents.map((event, index) => {
                  const checkInCount = checkInCounts[event.id] || 0;
                  const countdown = calculateCountdown(event.date, event.time);
                  
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        if (mapRef) {
                          mapRef.panTo({ lat: event.lat, lng: event.lng });
                          mapRef.setZoom(15);
                        }
                        setSelectedMarkerEvent(event);
                        setDrawerOpen(false);
                        if (viewMode !== "map") {
                          setViewMode("map");
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <Card className="p-3 hover:shadow-elevation-2 transition-all border border-border">
                        <div className="flex items-start gap-3">
                          <Avatar
                            src={event.hostAvatar}
                            alt={event.hostName}
                            sx={{ width: 48, height: 48 }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getActivityIcon(event.type)}
                              <h4 className="font-semibold text-sm truncate">{event.title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {event.date} at {event.time}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                {countdown}
                              </Badge>
                              {checkInCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  +{checkInCount} checked in
                                </Badge>
                              )}
                              <span className="text-xs">· {event.distance}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      
      {/* Quick Check-in, My Events, and View Toggle - Above Bottom Navigation */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pb-2">
        <div className="bg-card/95 backdrop-blur-md rounded-2xl p-3 shadow-elevation-3 border border-border/50 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            {/* Quick Check-in Button */}
            <Button
              variant="outline"
              onClick={() => setShowQuickCheckIn(true)}
              className="flex-1 h-10 border-border bg-background hover:bg-secondary"
            >
              <LocationOnIcon style={{ fontSize: 18 }} className="mr-2" />
              <span className="text-sm font-semibold">Quick Check-in</span>
            </Button>

            {/* My Events Button */}
            <Button
              variant="outline"
              onClick={() => navigate("/my-events")}
              className="flex-1 h-10 border-border bg-background hover:bg-secondary"
            >
              <div className="flex items-center mr-2">
                <CheckCircleIcon style={{ fontSize: 16 }} />
              </div>
              <span className="text-sm font-semibold">My Events</span>
            </Button>

            {/* View Toggle - Grouped */}
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode("map")}
                className={`px-3 py-2 rounded-lg transition-all ${
                  viewMode === "map"
                    ? "bg-primary text-primary-foreground shadow-elevation-1"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MapIcon style={{ fontSize: 20 }} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground shadow-elevation-1"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ViewListIcon style={{ fontSize: 20 }} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

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
      
      <BottomNavigation />
    </div>
  );
};

// Event Card Component
interface EventCardProps {
  event: Event;
  index: number;
  onJoin: (id: string) => void;
  onClick: () => void;
  getActivityIcon: (type: EventType) => JSX.Element;
  getActivityColor: (type: EventType) => string;
  listView?: boolean;
}

const EventCard = ({ event, index, onJoin, onClick, getActivityIcon, getActivityColor, listView }: EventCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card className="overflow-hidden shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-300 border-2 border-border/50 hover:border-primary/30">
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {getActivityIcon(event.type)}
                <h3 className="font-bold text-lg truncate">{event.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
            </div>
            {event.category === "sponsored" && (
              <Badge variant="secondary" className="flex-shrink-0 bg-warning/10 text-warning border-warning/30">
                <StarIcon style={{ fontSize: 14 }} className="mr-1" />
                Sponsored
              </Badge>
            )}
          </div>

          {/* Event Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <EventIcon style={{ fontSize: 18 }} />
              <span>{event.date} at {event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <LocationOnIcon style={{ fontSize: 18 }} />
              <span>{event.location} · {event.distance} away</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <PeopleIcon style={{ fontSize: 18 }} />
              <span>
                {event.participants.length} {event.maxParticipants ? `/ ${event.maxParticipants}` : ""} participants
              </span>
            </div>
          </div>

          {/* Host/Sponsor */}
          {event.category === "user" && event.hostName ? (
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <Avatar src={event.hostAvatar} alt={event.hostName} sx={{ width: 32, height: 32 }} />
              <div>
                <p className="text-xs text-muted-foreground">Hosted by</p>
                <p className="text-sm font-semibold">{event.hostName}</p>
              </div>
            </div>
          ) : event.sponsorLogo ? (
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <img src={event.sponsorLogo} alt="Sponsor" className="w-8 h-8 rounded" />
              <p className="text-sm font-semibold text-muted-foreground">Official Sponsor Event</p>
            </div>
          ) : null}

          {/* Action Button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onJoin(String(event.id));
            }}
            className={`w-full h-11 font-semibold ${
              event.isJoined
                ? "bg-success/20 text-success hover:bg-success/30 border-2 border-success"
                : ""
            }`}
            variant={event.isJoined ? "outline" : "default"}
          >
            {event.isJoined ? "✓ Joined" : "Join Event"}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default Events;
