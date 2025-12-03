import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { listenToEvents, Event as FirebaseEvent, joinEvent, leaveEvent, listenToEventCheckIns, createEvent, deleteEvent, updateEvent } from "@/services/eventService";
import { getUserData } from "@/services/authService";
import { calculateDistance, formatDistance } from "@/utils/distance";
import { openGoogleMapsNavigation } from "@/utils/navigation";
import { GoogleMap, Marker, InfoWindow, OverlayView, useJsApiLoader, Autocomplete, Polyline } from "@react-google-maps/api";
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
import NavigationIcon from "@mui/icons-material/Navigation";
import StarIcon from "@mui/icons-material/Star";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ViewListIcon from "@mui/icons-material/ViewList";
import MapIcon from "@mui/icons-material/Map";
import FilterListIcon from "@mui/icons-material/FilterList";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import ClearIcon from "@mui/icons-material/Clear";
import LaunchIcon from "@mui/icons-material/Launch";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MailIcon from "@mui/icons-material/Mail";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import Avatar from "@mui/material/Avatar";
import { NotificationBell } from "@/components/NotificationBell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { EventDetailModal } from "@/components/EventDetailModal";
import { CreateEventModal, type CreateEventFormData } from "@/components/CreateEventModal";
import { EventsTopBar } from "@/components/EventsTopBar";
import { EventDetailsPanel } from "@/components/EventDetailsPanel";
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
  isPast?: boolean;
  isGreyedOut?: boolean;
  createdAt?: number; // Timestamp from Firebase
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

  const getActivityIcon = (type: EventType) => {
    switch (type) {
      case "running":
        return <DirectionsRunIcon style={{ fontSize: 16 }} className="text-success" />;
      case "cycling":
        return <DirectionsBikeIcon style={{ fontSize: 16 }} className="text-primary" />;
      case "walking":
        return <DirectionsWalkIcon style={{ fontSize: 16 }} className="text-warning" />;
      case "others":
        return <FitnessCenterIcon style={{ fontSize: 16 }} className="text-secondary" />;
      default:
        return <FitnessCenterIcon style={{ fontSize: 16 }} className="text-muted-foreground" />;
    }
  };

  const borderColor = getActivityColor(event.type);
  const participantsCount = Array.isArray(event.participants) ? event.participants.length : 0;

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
        {/* Check-in Count Badge - Only show if no participants */}
        {checkInCount > 0 && participantsCount === 0 && (
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-background shadow-md">
            +{checkInCount}
          </div>
        )}
      </div>
      {/* Activity Type Icon Badge with Countdown and Participant Count - Outside Top Right */}
      <div className="absolute -top-2 -right-2 flex flex-col items-center gap-1 z-10">
        {/* Countdown Timer - Above Activity Icon */}
        <div className="bg-background/95 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-full border border-border shadow-md whitespace-nowrap">
          {countdown}
        </div>
        <div className="bg-background rounded-full p-1.5 border-2 shadow-lg" style={{ borderColor: borderColor }}>
          {getActivityIcon(event.type)}
        </div>
        {/* Participant Count - Below Activity Icon */}
        {participantsCount > 0 && (
          <div className="bg-success text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 border-2 border-background shadow-lg">
            {participantsCount}
          </div>
        )}
      </div>
    </div>
  );
};

const Events = () => {
  const navigate = useNavigate();
  const { user: currentUser, loading: authLoading } = useAuth();
  const { unreadCount, notifications, dismissNotification, markAllAsRead, handleNotificationTap } = useNotificationContext();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [activityFilter, setActivityFilter] = useState<EventType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [eventBeingEdited, setEventBeingEdited] = useState<Event | null>(null);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false); // Mobile drawer state
  const [checkInCounts, setCheckInCounts] = useState<Record<string, number>>({});
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 14.5995, lng: 120.9842 });
  const [mapZoom, setMapZoom] = useState(13);
  const [mapRef, setMapRef] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Pin mode state for inline event creation
  const [isPinMode, setIsPinMode] = useState(false);
  const [selectedEventLocation, setSelectedEventLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [pinModeAddress, setPinModeAddress] = useState<string>("");
  
  // Inline event form state
  const [inlineEventForm, setInlineEventForm] = useState({
    title: "",
    description: "",
    activityType: "running" as "running" | "cycling" | "walking" | "others",
    date: "",
    time: "",
    maxParticipants: undefined as number | undefined,
  });
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  
  // Autocomplete for location search in pin mode
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [searchValue, setSearchValue] = useState("");
  
  // Pending location for center-pin mode (tracks map center as user drags)
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  // Flag to prevent handleMapIdle from overwriting search-selected location (using ref for sync update)
  const isSearchLocationSetRef = useRef(false);
  
  // Route state for showing directions
  const [routePath, setRoutePath] = useState<google.maps.LatLng[]>([]);
  const [showRoute, setShowRoute] = useState(false);
  const [routeDestination, setRouteDestination] = useState<{ lat: number; lng: number } | null>(null);
  
  // Google Maps API loader
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const hasApiKey = googleMapsApiKey && googleMapsApiKey.trim().length > 0;
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: hasApiKey ? googleMapsApiKey : '',
    libraries: libraries,
    version: 'weekly', // Use weekly version for latest features and fixes
  });

  // Track if we've already logged an error to prevent spam
  const errorLoggedRef = useRef(false);

  // Log error details for debugging (with debouncing to prevent spam)
  useEffect(() => {
    if (loadError && !errorLoggedRef.current) {
      // Only log once to prevent console spam from rapid retries
      errorLoggedRef.current = true;
      
      console.error('🗺️ Google Maps Load Error:', loadError);
      if (!hasApiKey) {
        console.error('❌ VITE_GOOGLE_MAPS_API_KEY is missing or empty in .env file');
        console.error('💡 Solution: Create a .env file in the project root with:');
        console.error('   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here');
        console.error('');
        console.error('📖 To get an API key:');
        console.error('   1. Go to https://console.cloud.google.com/');
        console.error('   2. Enable "Maps JavaScript API"');
        console.error('   3. Create an API key in "Credentials"');
        console.error('   4. Add it to your .env file');
      } else {
        console.error('❌ API Key exists but Google Maps failed to load');
        console.error('💡 Troubleshooting steps:');
        console.error('   1. Verify API key is valid in Google Cloud Console');
        console.error('   2. Ensure "Maps JavaScript API" is enabled');
        console.error('   3. Check API key restrictions (HTTP referrers, IP addresses)');
        console.error('   4. Verify your domain is allowed in API key restrictions');
        console.error('   5. Check browser console network tab for detailed error');
        console.error('   6. Restart your dev server after adding/changing .env file');
      }
    }
    
    // Reset error flag if load succeeds
    if (isLoaded) {
      errorLoggedRef.current = false;
    }
  }, [loadError, hasApiKey, isLoaded]);

  // User location state - loaded lazily when needed
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Lazy load user location with better error handling
  const requestUserLocation = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      // If location already exists, return it immediately
      if (userLocation) {
        resolve(userLocation);
        return;
      }

      // If already requesting, wait for it
      if (isGettingLocation) {
        // Wait for location to be set
        const checkInterval = setInterval(() => {
          if (userLocation) {
            clearInterval(checkInterval);
            resolve(userLocation);
          }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 5000); // Timeout after 5 seconds
        return;
      }

      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser");
        resolve(null);
        return;
      }

      setIsGettingLocation(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setIsGettingLocation(false);
          resolve(location);
          // Note: Nearest event navigation is handled by useEffect that watches userLocation
        },
        (error) => {
          setIsGettingLocation(false);
          let errorMessage = "Could not get your location";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please enable location permissions in your browser settings to use this feature.";
              toast.error(errorMessage, { duration: 5000 });
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Please check your GPS connection.";
              toast.error(errorMessage, { duration: 4000 });
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              toast.error(errorMessage, { duration: 3000 });
              break;
            default:
              errorMessage = "An unknown error occurred while getting your location.";
              toast.error(errorMessage, { duration: 3000 });
              break;
          }
          
          console.warn("Could not get user location:", error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 second timeout
          maximumAge: 60000 // Accept cached location up to 1 minute old
        }
      );
    });
  }, [userLocation, isGettingLocation]);

  // Calculate estimated travel time based on distance
  const calculateTravelTime = useCallback((distanceKm: number, mode: 'walking' | 'driving' | 'cycling' = 'driving'): string => {
    if (!distanceKm || distanceKm === Infinity) return "Unknown";
    
    let speedKmh: number;
    switch (mode) {
      case 'walking':
        speedKmh = 5; // Average walking speed
        break;
      case 'cycling':
        speedKmh = 15; // Average cycling speed
        break;
      case 'driving':
      default:
        speedKmh = 50; // Average city driving speed
        break;
    }
    
    const hours = distanceKm / speedKmh;
    const minutes = Math.round(hours * 60);
    
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${minutes} min`;
    
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }, []);

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

  // Function to get directions from user location to event location
  const showDirectionsToEvent = useCallback((destinationLat: number, destinationLng: number) => {
    if (!userLocation || !isLoaded || !window.google) {
      toast.error("Location services are not available");
      return;
    }

    if (!window.google.maps.DirectionsService || !window.google.maps.DirectionsRenderer) {
      toast.error("Directions service is not available");
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    const origin = new window.google.maps.LatLng(userLocation.lat, userLocation.lng);
    const destination = new window.google.maps.LatLng(destinationLat, destinationLng);

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          // Extract the route path from the result
          const path: google.maps.LatLng[] = [];
          result.routes[0].legs[0].steps.forEach((step) => {
            step.path.forEach((point) => {
              path.push(point);
            });
          });
          
          setRoutePath(path);
          setRouteDestination({ lat: destinationLat, lng: destinationLng });
          setShowRoute(true);
          
          // Adjust map view to fit both origin and destination
          if (mapRef) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(origin);
            bounds.extend(destination);
            mapRef.fitBounds(bounds);
            
            // Add some padding
            mapRef.setOptions({
              padding: { top: 100, right: 100, bottom: 100, left: 100 }
            });
          }
          
          toast.success("Route displayed on map");
        } else {
          toast.error("Could not calculate route. Please try again.");
        }
      }
    );
  }, [userLocation, isLoaded, mapRef]);

  // Function to clear the route
  const clearRoute = useCallback(() => {
    setShowRoute(false);
    setRoutePath([]);
    setRouteDestination(null);
  }, []);

  // Function to open route in Google Maps for navigation
  const openRouteInGoogleMaps = useCallback(() => {
    if (routeDestination) {
      openGoogleMapsNavigation(routeDestination.lat, routeDestination.lng);
    }
  }, [routeDestination]);

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

  // Listen to events from Firebase (only when authenticated)
  useEffect(() => {
    // Don't set up listener if auth is still loading or user is not authenticated
    if (authLoading || !currentUser?.uid) {
      setLoading(false);
      return;
    }

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
        
        // Calculate if event is past or greyed out (24 hours after event)
        let isPast = false;
        let isGreyedOut = false;
        
        try {
          const eventDateTime = new Date(`${event.date}T${event.time || '00:00'}`);
          if (!isNaN(eventDateTime.getTime())) {
            const now = new Date();
            const eventEndTime = new Date(eventDateTime);
            eventEndTime.setHours(eventEndTime.getHours() + 24);
            isPast = now > eventEndTime;
            isGreyedOut = now > eventEndTime;
          }
        } catch (error) {
          console.error("Error calculating event time:", error);
        }
        
        return {
          ...event,
          isJoined: currentUser?.uid && event.participants && Array.isArray(event.participants) 
            ? event.participants.includes(currentUser.uid) 
            : false,
          distance,
          distanceValue,
          isPast,
          isGreyedOut,
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
  }, [currentUser?.uid, userLocation, authLoading]);

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
    
    // Search filtering - case-insensitive search in title, description, and location
    const matchesSearch = searchQuery.trim() === "" || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesActivity && matchesCategory && matchesSearch;
  });

  // Sort by distance
  const sortedEvents = [...filteredEvents].sort((a, b) => a.distanceValue - b.distanceValue);

  // State for search results dropdown
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle selecting a search result
  const handleSearchResultClick = (event: Event) => {
    // Pan map to event location
    if (mapRef) {
      mapRef.panTo({ lat: event.lat, lng: event.lng });
      mapRef.setZoom(15);
    }
    setMapCenter({ lat: event.lat, lng: event.lng });
    
    // Show event details
    setSelectedEvent(event);
    setShowEventDetail(true);
    
    // Close search dropdown and clear search
    setShowSearchResults(false);
    setSearchQuery("");
    
    // Switch to map view if in list view
    if (viewMode !== "map") {
      setViewMode("map");
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!currentUser?.uid) {
      toast.error("Please log in to join events");
      return;
    }

    try {
      await joinEvent(eventId, currentUser.uid);
      toast.success("You've joined the event!");
      
      // Update the selectedEvent to reflect the join immediately
      setSelectedEvent((prev) => {
        if (!prev || prev.id !== eventId) return prev;
        const currentParticipants = Array.isArray(prev.participants) ? prev.participants : [];
        if (!currentParticipants.includes(currentUser.uid)) {
          return {
            ...prev,
            participants: [...currentParticipants, currentUser.uid],
            isJoined: true
          };
        }
        return prev;
      });
    } catch (error: any) {
      console.error("Error joining event:", error);
      toast.error(error.message || "Failed to join event");
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    if (!currentUser?.uid) {
      toast.error("Please log in to leave events");
      return;
    }

    try {
      await leaveEvent(eventId, currentUser.uid);
      toast.success("You've left the event");
      
      // Update the selectedEvent to reflect the leave immediately
      setSelectedEvent((prev) => {
        if (!prev || prev.id !== eventId) return prev;
        const currentParticipants = Array.isArray(prev.participants) ? prev.participants : [];
        return {
          ...prev,
          participants: currentParticipants.filter(id => id !== currentUser.uid),
          isJoined: false
        };
      });
    } catch (error: any) {
      console.error("Error leaving event:", error);
      toast.error(error.message || "Failed to leave event");
    }
  };

  const handleEventClick = (event: Event) => {
    // Clear any existing route when selecting a new event
    setShowRoute(false);
    setRoutePath([]);
    setRouteDestination(null);
    
    // Zoom to event location if map is available and in map view
    if (mapRef && viewMode === "map") {
      mapRef.panTo({ lat: event.lat, lng: event.lng });
      mapRef.setZoom(15);
    }
    
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleEditEvent = (eventId: string) => {
    if (!currentUser?.uid) {
      toast.error("Please log in to edit events");
      return;
    }

    const targetEvent = events.find((event) => event.id === eventId);
    if (!targetEvent) {
      toast.error("Event not found");
      return;
    }

    if (targetEvent.hostId !== currentUser.uid) {
      toast.error("Only the event creator can edit this event");
      return;
    }

    setEventBeingEdited(targetEvent);
    setShowEditEvent(true);
    setShowEventDetail(false);
  };

  const handleCloseEditModal = () => {
    setShowEditEvent(false);
    setEventBeingEdited(null);
  };

  const handleUpdateEvent = async (eventId: string, updatedData: CreateEventFormData) => {
    if (!currentUser?.uid) {
      toast.error("Please log in to edit events");
      return;
    }

    const existingEvent = events.find((event) => event.id === eventId);

    try {
      await updateEvent(eventId, currentUser.uid, {
        title: updatedData.title,
        description: updatedData.description,
        type: updatedData.activityType,
        date: updatedData.date,
        time: updatedData.time,
        location: updatedData.location,
        lat: updatedData.lat ?? existingEvent?.lat,
        lng: updatedData.lng ?? existingEvent?.lng,
        maxParticipants: updatedData.maxParticipants,
      });

      toast.success("Event updated successfully");

      setSelectedEvent((prev) =>
        prev && prev.id === eventId
          ? {
              ...prev,
              title: updatedData.title,
              description: updatedData.description,
              type: updatedData.activityType as EventType,
              date: updatedData.date,
              time: updatedData.time,
              location: updatedData.location,
              lat: updatedData.lat ?? prev.lat,
              lng: updatedData.lng ?? prev.lng,
              maxParticipants: updatedData.maxParticipants,
            }
          : prev
      );

      handleCloseEditModal();
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast.error(error.message || "Failed to update event");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!currentUser?.uid) {
      toast.error("Please log in to delete events");
      return;
    }

    try {
      await deleteEvent(eventId, currentUser.uid);
      toast.success("Event deleted successfully");
      setShowEventDetail(false);
      setSelectedEvent(null);
      // The real-time listener will update the events automatically
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast.error(error.message || "Failed to delete event");
    }
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
      // The real-time listener will update the events automatically
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(error.message || "Failed to create event");
    }
  };

  // Handle inline event form submission
  const handleInlineEventSubmit = async () => {
    if (!currentUser?.uid) {
      toast.error("Please log in to create events");
      return;
    }
    
    if (!selectedEventLocation) {
      toast.error("Please select a location on the map");
      return;
    }
    
    // Validate form
    if (!inlineEventForm.title.trim()) {
      toast.error("Please enter an event title");
      return;
    }
    if (!inlineEventForm.description.trim()) {
      toast.error("Please enter an event description");
      return;
    }
    if (!inlineEventForm.date) {
      toast.error("Please select a date");
      return;
    }
    if (!inlineEventForm.time) {
      toast.error("Please select a time");
      return;
    }

    setIsSubmittingEvent(true);
    
    try {
      // Get user data for host info
      const userData = await getUserData(currentUser.uid);
      
      // Format date properly (ISO string)
      const eventDate = new Date(inlineEventForm.date);
      const formattedDate = eventDate.toISOString().split('T')[0];
      
      // Prepare event data
      const eventPayload: any = {
        title: inlineEventForm.title,
        description: inlineEventForm.description,
        type: inlineEventForm.activityType,
        category: "user",
        date: formattedDate,
        time: inlineEventForm.time,
        location: pinModeAddress || `${selectedEventLocation.lat.toFixed(6)}, ${selectedEventLocation.lng.toFixed(6)}`,
        distance: "0.0 km",
        distanceValue: 0,
        lat: selectedEventLocation.lat,
        lng: selectedEventLocation.lng,
        hostName: userData?.name || currentUser.displayName || "User",
        hostAvatar: userData?.photoURL || currentUser.photoURL || "",
      };
      
      if (inlineEventForm.maxParticipants && inlineEventForm.maxParticipants > 0) {
        eventPayload.maxParticipants = inlineEventForm.maxParticipants;
      }
      
      // Create event in Firebase
      await createEvent(currentUser.uid, eventPayload);
      
      toast.success("Event created successfully!");
      
      // Reset form and close
      setShowEventForm(false);
      setSelectedEventLocation(null);
      setPinModeAddress("");
      setInlineEventForm({
        title: "",
        description: "",
        activityType: "running",
        date: "",
        time: "",
        maxParticipants: undefined,
      });
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(error.message || "Failed to create event");
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // Cancel inline event creation
  const handleCancelInlineEvent = () => {
    setShowEventForm(false);
    setSelectedEventLocation(null);
    setPinModeAddress("");
    setSearchValue("");
    setInlineEventForm({
      title: "",
      description: "",
      activityType: "running",
      date: "",
      time: "",
      maxParticipants: undefined,
    });
  };

  // Handle place selection from autocomplete - only pan map, don't confirm location yet
  const handlePlaceSelect = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        // Set flag to prevent handleMapIdle from overwriting this location (sync via ref)
        isSearchLocationSetRef.current = true;
        
        // Update map center state to prevent snapping back
        setMapCenter({ lat, lng });
        setMapZoom(16);
        
        // Pan map to the selected location (pin stays in center)
        if (mapRef) {
          mapRef.panTo({ lat, lng });
          mapRef.setZoom(16);
        }
        
        // Update the pending location and address - this is the exact search result location
        setPendingLocation({ lat, lng });
        setPinModeAddress(place.formatted_address || place.name || "");
        setSearchValue(place.formatted_address || place.name || "");
      }
    }
  };

  // Reset search location flag when user manually drags the map
  const handleMapDragStart = useCallback(() => {
    isSearchLocationSetRef.current = false;
  }, []);

  // Reverse geocode map center when user stops dragging
  const handleMapIdle = useCallback(() => {
    if (!isPinMode || !mapRef) return;
    
    // Skip if location was just set from search result (prevent overwriting)
    if (isSearchLocationSetRef.current) {
      return;
    }
    
    const center = mapRef.getCenter();
    if (!center) return;
    
    const lat = center.lat();
    const lng = center.lng();
    
    setPendingLocation({ lat, lng });
    setIsReverseGeocoding(true);
    
    // Reverse geocode to get address
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      setIsReverseGeocoding(false);
      if (status === "OK" && results && results[0]) {
        setPinModeAddress(results[0].formatted_address);
      } else {
        setPinModeAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    });
  }, [isPinMode, mapRef]);

  // Confirm the current map center as the event location
  const handleConfirmLocation = () => {
    if (pendingLocation) {
      setSelectedEventLocation(pendingLocation);
      setShowEventForm(true);
      setIsPinMode(false);
    }
  };

  // Center map on user's GPS location
  const handleCenterOnMe = async () => {
    // Request location if not available
    const location = await requestUserLocation();
    
    if (location && mapRef) {
      setMapCenter({ lat: location.lat, lng: location.lng });
      mapRef.panTo({ lat: location.lat, lng: location.lng });
      mapRef.setZoom(15);
    }
  };

  // Fit all events on the map
  const handleFitAllEvents = () => {
    if (!mapRef || !isLoaded || sortedEvents.length === 0) {
      toast.info("No events to display");
      return;
    }

    try {
      const bounds = new window.google.maps.LatLngBounds();
      
      // Add all event locations to bounds
      sortedEvents.forEach((event) => {
        if (event.lat && event.lng) {
          bounds.extend(new window.google.maps.LatLng(event.lat, event.lng));
        }
      });

      // If user location is available, include it in bounds
      if (userLocation) {
        bounds.extend(new window.google.maps.LatLng(userLocation.lat, userLocation.lng));
      }

      // Fit bounds with padding
      mapRef.fitBounds(bounds);
      mapRef.setOptions({
        padding: { top: 100, right: 100, bottom: 200, left: 100 } // Extra bottom padding for action bar
      });

      toast.success(`Showing ${sortedEvents.length} event${sortedEvents.length !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error("Error fitting events to bounds:", error);
      toast.error("Could not fit all events on map");
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
        className="bg-card/80 backdrop-blur-md shadow-elevation-2 sticky top-0 z-10 border-b border-border/50"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="max-w-2xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Events</h1>
            {/* Notification Bell - Always Visible */}
            <NotificationBell 
              unreadCount={unreadCount}
              onClick={() => setShowNotificationDrawer(true)}
              variant="light"
            />
          </div>
        </div>
      </motion.div>

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
                {/* Pin Mode Banner with Search */}
                {isPinMode && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-4 left-4 right-4 z-50"
                  >
                    <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
                      {/* Search Input */}
                      <div className="p-3 border-b border-border">
                        <Autocomplete
                          onLoad={(auto) => setAutocomplete(auto)}
                          onPlaceChanged={handlePlaceSelect}
                        >
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search for a location..."
                              value={searchValue}
                              onChange={(e) => setSearchValue(e.target.value)}
                              className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <LocationOnIcon 
                              style={{ fontSize: 20 }} 
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
                            />
                          </div>
                        </Autocomplete>
                      </div>
                      
                      {/* Current Address Display */}
                      <div className="px-3 py-2.5 bg-muted/30 border-b border-border">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            {isReverseGeocoding ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm">Getting address...</span>
                              </div>
                            ) : pinModeAddress ? (
                              <p className="text-sm text-foreground truncate">{pinModeAddress}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground">Drag map to select location</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Instructions */}
                      <div className="px-3 py-2 bg-primary/5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapIcon style={{ fontSize: 16 }} />
                          <span className="text-xs">Drag the map to move the pin</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsPinMode(false);
                            setSelectedEventLocation(null);
                            setPendingLocation(null);
                            setPinModeAddress("");
                            setSearchValue("");
                          }}
                          className="text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Center-fixed pin overlay when in pin mode (Uber-style) */}
                {isPinMode && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-40">
                    <div className="relative flex flex-col items-center">
                      {/* Pin icon - positioned so tip is at center */}
                      <div className="transform -translate-y-1/2">
                        <LocationOnIcon 
                          style={{ fontSize: 56, color: '#ef4444' }} 
                          className="drop-shadow-lg"
                        />
                      </div>
                      {/* Shadow dot at the exact center */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black/30 rounded-full blur-sm" />
                    </div>
                  </div>
                )}

                {/* Center on Me Button - Floating button in pin mode */}
                {isPinMode && userLocation && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCenterOnMe}
                    className="absolute bottom-24 right-4 z-50 w-12 h-12 bg-card rounded-full shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                    title="Center on my location"
                  >
                    <MyLocationIcon style={{ fontSize: 24 }} className="text-primary" />
                  </motion.button>
                )}

                {/* Confirm Location Button - Bottom of map in pin mode */}
                {isPinMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 left-4 right-4 z-50"
                  >
                    <Button
                      onClick={handleConfirmLocation}
                      disabled={!pendingLocation || isReverseGeocoding}
                      className="w-full py-6 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg"
                    >
                      {isReverseGeocoding ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Getting location...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CheckCircleIcon style={{ fontSize: 22 }} />
                          Confirm Location
                        </span>
                      )}
                    </Button>
                  </motion.div>
                )}

                {loadError ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted p-4">
                    <div className="text-center max-w-md">
                      <p className="text-destructive font-semibold mb-2 text-lg">⚠️ Error loading Google Maps</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {!hasApiKey 
                          ? "Google Maps API key is missing. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file and restart the dev server."
                          : loadError.message || "Unable to load Google Maps. Please check the troubleshooting steps below:"}
                      </p>
                      {hasApiKey && (
                        <ul className="text-xs text-muted-foreground text-left list-disc list-inside space-y-1 mt-3">
                          <li>API key is valid in Google Cloud Console</li>
                          <li>Maps JavaScript API is enabled</li>
                          <li>API key restrictions allow this domain/localhost</li>
                          <li>Internet connection is active</li>
                          <li>Check browser console for detailed error messages</li>
                        </ul>
                      )}
                      {!hasApiKey && (
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg text-left">
                          <p className="text-xs font-semibold mb-2">Quick Fix:</p>
                          <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                            <li>Create a <code className="bg-background px-1 py-0.5 rounded">.env</code> file in the project root</li>
                            <li>Add: <code className="bg-background px-1 py-0.5 rounded">VITE_GOOGLE_MAPS_API_KEY=your_key_here</code></li>
                            <li>Restart your dev server</li>
                          </ol>
                        </div>
                      )}
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
                    onClick={() => {
                      // In center-pin mode, clicking doesn't place markers - user drags map
                      // Just close event details panel when clicking on empty map space
                      if (showEventDetail) {
                        setShowEventDetail(false);
                        setSelectedEvent(null);
                        setShowRoute(false);
                        setRoutePath([]);
                        setRouteDestination(null);
                      }
                    }}
                    onIdle={handleMapIdle}
                    onDragStart={handleMapDragStart}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: false,
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                      clickableIcons: false, // Disable clicking on places/landmarks to prevent clutter
                      styles: [
                        // Hide/mute small POIs to reduce clutter
                        {
                          featureType: "poi",
                          elementType: "all",
                          stylers: [{ visibility: "off" }]
                        },
                        {
                          featureType: "poi.business",
                          elementType: "all",
                          stylers: [{ visibility: "off" }]
                        }
                      ]
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

                    {/* Selected Event Location Marker (shown after location is confirmed) */}
                    {selectedEventLocation && showEventForm && (
                      <Marker
                        position={{ lat: selectedEventLocation.lat, lng: selectedEventLocation.lng }}
                        icon={{
                          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                          scaledSize: new window.google.maps.Size(48, 48),
                        }}
                        title="New event location"
                        animation={window.google.maps.Animation.DROP}
                      />
                    )}

                    {/* Event Markers */}
                    {sortedEvents.map((event) => {
                      const checkInCount = checkInCounts[event.id] || 0;
                      const countdown = calculateCountdown(event.date, event.time);

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
                                handleEventClick(event);
                              }}
                            />
                          </div>
                        </OverlayView>
                      );
                    })}

                    {/* Route Polyline - Show route from user location to event */}
                    {showRoute && routePath.length > 0 && isLoaded && window.google && (
                      <Polyline
                        path={routePath}
                        options={{
                          strokeColor: "#3b82f6",
                          strokeOpacity: 0.8,
                          strokeWeight: 5,
                          geodesic: true,
                          icons: window.google.maps ? [
                            {
                              icon: {
                                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                scale: 4,
                                strokeColor: "#3b82f6",
                              },
                              offset: "50%",
                              repeat: "100px",
                            },
                          ] : undefined,
                        }}
                      />
                    )}

                  </GoogleMap>
                )}
              </div>

              {/* Route Controls - Floating panel when route is shown */}
              <AnimatePresence>
                {showRoute && routeDestination && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute bottom-20 left-0 right-0 z-40 px-4"
                    style={{
                      bottom: `calc(5rem + env(safe-area-inset-bottom, 48px))`,
                    }}
                  >
                    <Card className="bg-card/95 backdrop-blur-md border-border shadow-elevation-4 p-4 max-w-md mx-auto">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {/* Clear Route Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearRoute}
                            className="flex-1 gap-2"
                          >
                            <ClearIcon style={{ fontSize: 18 }} />
                            <span>Clear Route</span>
                          </Button>
                          
                          {/* Open in Google Maps Button */}
                          <Button
                            onClick={openRouteInGoogleMaps}
                            className="flex-1 gap-2 bg-gradient-to-r from-primary via-primary to-success hover:from-primary/90 hover:via-primary/90 hover:to-success/90 text-white"
                          >
                            <LaunchIcon style={{ fontSize: 18 }} />
                            <span>Open in Google Maps</span>
                          </Button>
                        </div>
                        
                        {/* Helper text */}
                        <p className="text-xs text-muted-foreground text-center">
                          Opens Google Maps app or browser for turn-by-turn navigation
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Middle Right Controls - Events List and Create Event FAB */}
              <div className="fixed top-1/2 -translate-y-1/2 right-4 flex flex-col gap-3 z-50">
                {/* Events Drawer/List Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDrawerOpen(true)}
                  className="touch-target rounded-full shadow-elevation-3 border-2 bg-card/90 backdrop-blur-sm text-foreground border-border"
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

                {/* Fit All Events Button */}
                {viewMode === "map" && sortedEvents.length > 0 && !isPinMode && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFitAllEvents}
                    className="touch-target rounded-full shadow-elevation-3 border-2 bg-card/90 backdrop-blur-sm text-foreground border-border w-14 h-14 flex items-center justify-center"
                    title="Fit all events on map"
                  >
                    <FitScreenIcon style={{ fontSize: 28 }} />
                  </motion.button>
                )}

                {/* Create Event FAB / Cancel Button */}
                <AnimatePresence mode="wait">
                  {!isPinMode && !showEventForm && !showRoute && !showEventDetail && (
                    <motion.button
                      key="create-event"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: 0.3, duration: 0.2, type: "spring", stiffness: 200 }}
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        setIsPinMode(true);
                        setSelectedEventLocation(null);
                        setPinModeAddress("");
                        // Initialize pending location to current map center
                        if (mapRef) {
                          const center = mapRef.getCenter();
                          if (center) {
                            setPendingLocation({ lat: center.lat(), lng: center.lng() });
                          }
                        } else {
                          setPendingLocation(mapCenter);
                        }
                      }}
                      className="w-14 h-14 rounded-full bg-gradient-to-r from-primary via-primary to-success shadow-elevation-4 hover:shadow-elevation-5 transition-all duration-300 flex items-center justify-center touch-target"
                      title="Create event"
                    >
                      {/* Plus icon */}
                      <AddIcon style={{ fontSize: 28, color: "white" }} />
                    </motion.button>
                  )}
                  {isPinMode && !showEventForm && (
                    <motion.button
                      key="cancel-event"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2, type: "spring", stiffness: 200 }}
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        handleCancelInlineEvent();
                        setIsPinMode(false);
                      }}
                      className="w-14 h-14 rounded-full bg-destructive hover:bg-destructive/90 shadow-elevation-4 hover:shadow-elevation-5 transition-all duration-300 flex items-center justify-center touch-target"
                      title="Cancel"
                    >
                      {/* X icon */}
                      <CloseIcon style={{ fontSize: 28, color: "white" }} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
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
                    onClick={() => {
                      // Switch to map view first (we're in list view)
                      setViewMode("map");
                      // Wait a bit for map to render, then zoom and show details
                      setTimeout(() => {
                        handleEventClick(event);
                      }, 100);
                    }}
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


      {/* Event Details Panel - Bottom Sliding Panel */}
      <EventDetailsPanel
        event={selectedEvent}
        onClose={() => {
          setShowEventDetail(false);
          setSelectedEvent(null);
          // Only clear route if user manually closes (not when showing directions)
          // Route will be cleared when a new event is selected or map is clicked
        }}
        onJoin={handleJoinEvent}
        onLeave={handleLeaveEvent}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onShowRoute={(lat, lng) => {
          // Show the route on the map
          showDirectionsToEvent(lat, lng);
          // Close the event details panel so user can see the route
          setShowEventDetail(false);
          setSelectedEvent(null);
          // Switch to map view if not already there
          if (viewMode !== "map") {
            setViewMode("map");
          }
        }}
      />

      {/* Inline Event Creation Form - Bottom Sheet */}
      <AnimatePresence>
        {showEventForm && selectedEventLocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 z-50 bg-card rounded-t-3xl shadow-elevation-4 border-t border-border"
            style={{
              bottom: `calc(4.5rem + env(safe-area-inset-bottom, 0px))`,
              maxHeight: "calc(100vh - 6rem - env(safe-area-inset-bottom, 0px))",
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 pb-3 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Create Event</h2>
                <p className="text-sm text-muted-foreground truncate max-w-[280px]">
                  <LocationOnIcon style={{ fontSize: 14 }} className="mr-1" />
                  {pinModeAddress || "Selected location"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancelInlineEvent}
                className="h-9 w-9 rounded-full"
              >
                <CloseIcon style={{ fontSize: 20 }} />
              </Button>
            </div>

            {/* Form Content */}
            <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 16rem)" }}>
              {/* Activity Type Selection */}
              <div className="mb-4">
                <Label className="text-sm font-medium text-foreground mb-2 block">Activity Type</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(["running", "cycling", "walking", "others"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInlineEventForm(prev => ({ ...prev, activityType: type }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        inlineEventForm.activityType === type
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30 hover:border-primary/50"
                      }`}
                    >
                      {type === "running" && <DirectionsRunIcon style={{ fontSize: 24 }} className={inlineEventForm.activityType === type ? "text-primary" : "text-muted-foreground"} />}
                      {type === "cycling" && <DirectionsBikeIcon style={{ fontSize: 24 }} className={inlineEventForm.activityType === type ? "text-primary" : "text-muted-foreground"} />}
                      {type === "walking" && <DirectionsWalkIcon style={{ fontSize: 24 }} className={inlineEventForm.activityType === type ? "text-primary" : "text-muted-foreground"} />}
                      {type === "others" && <FitnessCenterIcon style={{ fontSize: 24 }} className={inlineEventForm.activityType === type ? "text-primary" : "text-muted-foreground"} />}
                      <span className={`text-xs capitalize ${inlineEventForm.activityType === type ? "text-primary font-medium" : "text-muted-foreground"}`}>
                        {type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Title */}
              <div className="mb-4">
                <Label htmlFor="event-title" className="text-sm font-medium text-foreground mb-2 block">
                  Event Title
                </Label>
                <Input
                  id="event-title"
                  placeholder="e.g., Morning Run at the Park"
                  value={inlineEventForm.title}
                  onChange={(e) => setInlineEventForm(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-muted/50"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label htmlFor="event-date" className="text-sm font-medium text-foreground mb-2 block">
                    Date
                  </Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={inlineEventForm.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setInlineEventForm(prev => ({ ...prev, date: e.target.value }))}
                    className="bg-muted/50"
                  />
                </div>
                <div>
                  <Label htmlFor="event-time" className="text-sm font-medium text-foreground mb-2 block">
                    Time
                  </Label>
                  <Input
                    id="event-time"
                    type="time"
                    value={inlineEventForm.time}
                    onChange={(e) => setInlineEventForm(prev => ({ ...prev, time: e.target.value }))}
                    className="bg-muted/50"
                  />
                </div>
              </div>

              {/* Max Participants */}
              <div className="mb-4">
                <Label htmlFor="max-participants" className="text-sm font-medium text-foreground mb-2 block">
                  Max Participants (Optional)
                </Label>
                <Input
                  id="max-participants"
                  type="number"
                  min={2}
                  max={1000}
                  placeholder="Leave empty for unlimited"
                  value={inlineEventForm.maxParticipants || ""}
                  onChange={(e) => setInlineEventForm(prev => ({ 
                    ...prev, 
                    maxParticipants: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty for unlimited participants
                </p>
              </div>

              {/* Description */}
              <div className="mb-4">
                <Label htmlFor="event-description" className="text-sm font-medium text-foreground mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="event-description"
                  placeholder="Tell people what to expect..."
                  value={inlineEventForm.description}
                  onChange={(e) => setInlineEventForm(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-muted/50 min-h-[80px]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-5 pt-3 pb-5 border-t border-border flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancelInlineEvent}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleInlineEventSubmit}
                disabled={isSubmittingEvent}
              >
                {isSubmittingEvent ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Event"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keep Event Detail Modal as fallback for desktop if needed */}
      {showEventDetail && false && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => {
            setShowEventDetail(false);
            setSelectedEvent(null);
          }}
          onJoin={handleJoinEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Create Event Modal */}
      {showCreateEvent && (
        <CreateEventModal
          onClose={() => {
            setShowCreateEvent(false);
          }}
          onCreateEvent={handleCreateEvent}
        />
      )}

      {/* Edit Event Modal */}
      {showEditEvent && eventBeingEdited && (
        <CreateEventModal
          mode="edit"
          eventToEdit={eventBeingEdited as FirebaseEvent}
          onClose={handleCloseEditModal}
          onUpdateEvent={handleUpdateEvent}
        />
      )}

      {/* Quick Check-in Modal */}
      {/* Mobile Events Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                  <EventIcon className="text-primary" style={{ fontSize: 24 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <DrawerTitle className="text-xl font-bold">Events</DrawerTitle>
                  <DrawerDescription className="text-xs mt-0.5">
                    {sortedEvents.length} event{sortedEvents.length !== 1 ? "s" : ""} found
                  </DrawerDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrawerOpen(false)}
                className="h-8 w-8 flex-shrink-0"
                aria-label="Close events drawer"
              >
                <CloseIcon style={{ fontSize: 20 }} />
              </Button>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto flex-1">
            {/* Filters inside drawer - Only activity filters */}
            <div className="p-4 border-b border-border bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Filter by Activity
              </p>
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
                <div className="text-center py-12">
                  <EventIcon className="text-muted-foreground/30 mx-auto mb-3" style={{ fontSize: 48 }} />
                  <p className="text-sm font-medium text-muted-foreground">No events found</p>
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
                        // Close drawer immediately first
                        setDrawerOpen(false);
                        
                        // Then handle event click after a brief delay to allow drawer to close
                        setTimeout(() => {
                          if (mapRef) {
                            mapRef.panTo({ lat: event.lat, lng: event.lng });
                            mapRef.setZoom(15);
                          }
                          handleEventClick(event);
                          if (viewMode !== "map") {
                            setViewMode("map");
                          }
                        }, 100);
                      }}
                      className="cursor-pointer"
                    >
                      <Card className="p-4 hover:shadow-elevation-2 transition-all border border-border">
                        <div className="flex items-start gap-3">
                          <Avatar
                            src={event.hostAvatar}
                            alt={event.hostName}
                            sx={{ width: 48, height: 48 }}
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="flex-shrink-0">
                                {getActivityIcon(event.type)}
                              </div>
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
      <AnimatePresence>
        {!showEventDetail && !selectedEvent && !isPinMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 right-0 z-40 px-4 pb-2"
            style={{
              bottom: `calc(5rem + env(safe-area-inset-bottom, 48px))`, // 80px + safe area
            }}
          >
            <div className="bg-card/95 backdrop-blur-md rounded-2xl p-3 shadow-elevation-3 border border-border/50 max-w-2xl mx-auto">
              <div className="flex items-center gap-2">
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

                {/* Center User on Map Button */}
                {viewMode === "map" && (
                  <Button
                    variant="outline"
                    onClick={handleCenterOnMe}
                    className="h-10 border-border bg-background hover:bg-secondary"
                    disabled={isGettingLocation}
                  >
                    <MyLocationIcon style={{ fontSize: 16 }} className="mr-2" />
                    <span className="text-sm font-semibold">Center</span>
                  </Button>
                )}
          </div>
        </div>
      </motion.div>
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
                  <h2 className="text-2xl font-bold text-foreground">Notification History</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notifications.length > 0 
                      ? `${notifications.length} total notification${notifications.length !== 1 ? 's' : ''}${unreadCount > 0 ? ` • ${unreadCount} unread` : ''}`
                      : 'No notifications yet'}
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
      <Card className={`overflow-hidden shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-300 border-2 ${
        event.isGreyedOut
          ? "opacity-50 grayscale border-muted bg-muted/20"
          : "border-border/50 hover:border-primary/30"
      }`}>
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
