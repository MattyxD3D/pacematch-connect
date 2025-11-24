import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExploreIcon from "@mui/icons-material/Explore";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StarIcon from "@mui/icons-material/Star";
import AddIcon from "@mui/icons-material/Add";
import ViewListIcon from "@mui/icons-material/ViewList";
import MapIcon from "@mui/icons-material/Map";
import FilterListIcon from "@mui/icons-material/FilterList";
import Avatar from "@mui/material/Avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EventDetailModal } from "@/components/EventDetailModal";

type EventType = "running" | "cycling" | "walking";
type EventCategory = "all" | "user" | "sponsored";

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

const Events = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [activityFilter, setActivityFilter] = useState<EventType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory>("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);

  // Mock events data
  const events: Event[] = [
    {
      id: 1,
      title: "Morning Run in Central Park",
      description: "Join us for a refreshing morning run! All levels welcome.",
      type: "running",
      category: "user",
      date: "2024-03-25",
      time: "07:00 AM",
      location: "Central Park, NY",
      distance: "0.5 km",
      distanceValue: 0.5,
      participants: 12,
      maxParticipants: 20,
      hostName: "Sarah Johnson",
      hostAvatar: "https://i.pravatar.cc/150?img=1",
      lat: 40.7829,
      lng: -73.9654,
      isJoined: false,
    },
    {
      id: 2,
      title: "Nike City Marathon 2024",
      description: "Annual city marathon sponsored by Nike. Register now!",
      type: "running",
      category: "sponsored",
      date: "2024-04-15",
      time: "06:00 AM",
      location: "City Center",
      distance: "1.2 km",
      distanceValue: 1.2,
      participants: 450,
      maxParticipants: 500,
      sponsorLogo: "https://via.placeholder.com/100x100?text=Nike",
      lat: 40.7580,
      lng: -73.9855,
      isJoined: true,
    },
    {
      id: 3,
      title: "Weekend Cycling Tour",
      description: "Explore the city on two wheels with fellow cyclists!",
      type: "cycling",
      category: "user",
      date: "2024-03-23",
      time: "09:00 AM",
      location: "Brooklyn Bridge",
      distance: "2.3 km",
      distanceValue: 2.3,
      participants: 8,
      maxParticipants: 15,
      hostName: "Mike Chen",
      hostAvatar: "https://i.pravatar.cc/150?img=2",
      lat: 40.7061,
      lng: -73.9969,
      isJoined: false,
    },
    {
      id: 4,
      title: "Wellness Walking Group",
      description: "A relaxing walk through scenic paths. Bring your friends!",
      type: "walking",
      category: "user",
      date: "2024-03-22",
      time: "05:00 PM",
      location: "Riverside Park",
      distance: "0.8 km",
      distanceValue: 0.8,
      participants: 15,
      hostName: "Emma Davis",
      hostAvatar: "https://i.pravatar.cc/150?img=3",
      lat: 40.8018,
      lng: -73.9713,
      isJoined: false,
    },
    {
      id: 5,
      title: "Adidas Urban Challenge",
      description: "Test your limits in this urban fitness challenge!",
      type: "running",
      category: "sponsored",
      date: "2024-04-01",
      time: "08:00 AM",
      location: "Times Square",
      distance: "1.5 km",
      distanceValue: 1.5,
      participants: 280,
      maxParticipants: 300,
      sponsorLogo: "https://via.placeholder.com/100x100?text=Adidas",
      lat: 40.7580,
      lng: -73.9855,
      isJoined: false,
    },
  ];

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesActivity = activityFilter === "all" || event.type === activityFilter;
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;
    return matchesActivity && matchesCategory;
  });

  // Sort by distance
  const sortedEvents = [...filteredEvents].sort((a, b) => a.distanceValue - b.distanceValue);

  const handleJoinEvent = (eventId: number) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      event.isJoined = !event.isJoined;
      toast.success(event.isJoined ? `You've joined "${event.title}"!` : `You've left "${event.title}"`);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const getActivityIcon = (type: EventType) => {
    switch (type) {
      case "running":
        return <DirectionsRunIcon className="text-success" style={{ fontSize: 20 }} />;
      case "cycling":
        return <DirectionsBikeIcon className="text-primary" style={{ fontSize: 20 }} />;
      case "walking":
        return <DirectionsWalkIcon className="text-warning" style={{ fontSize: 20 }} />;
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md shadow-elevation-2 sticky top-0 z-20 border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/map")}
                className="touch-target p-2 hover:bg-secondary rounded-xl transition-all duration-200"
              >
                <ArrowBackIcon style={{ fontSize: 28 }} />
              </motion.button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Events</h1>
                <p className="text-sm text-muted-foreground">
                  {sortedEvents.length} event{sortedEvents.length !== 1 ? "s" : ""} near you
                </p>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 bg-muted rounded-xl p-1">
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
      </motion.div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Map Placeholder */}
              <Card className="p-8 shadow-elevation-3 border-2 border-border/50">
                <div className="relative w-full h-[400px] bg-gradient-to-br from-primary/10 via-success/5 to-warning/10 rounded-2xl flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <ExploreIcon className="text-primary mx-auto" style={{ fontSize: 72 }} />
                    </motion.div>
                    <h3 className="text-xl font-bold">Interactive Event Map</h3>
                    <p className="text-muted-foreground max-w-sm text-sm">
                      Map integration will display event locations, allowing you to see all nearby events at a glance.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Events near map */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedEvents.slice(0, 6).map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={index}
                    onJoin={handleJoinEvent}
                    onClick={() => handleEventClick(event)}
                    getActivityIcon={getActivityIcon}
                    getActivityColor={getActivityColor}
                  />
                ))}
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

      {/* Create Event FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => toast.success("Create event feature coming soon!")}
        className="fixed bottom-6 right-6 w-16 h-16 bg-primary text-primary-foreground rounded-full shadow-elevation-4 hover:shadow-elevation-5 transition-all duration-300 flex items-center justify-center z-30"
      >
        <AddIcon style={{ fontSize: 32 }} />
      </motion.button>

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
    </div>
  );
};

// Event Card Component
interface EventCardProps {
  event: Event;
  index: number;
  onJoin: (id: number) => void;
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
                {event.participants} {event.maxParticipants ? `/ ${event.maxParticipants}` : ""} participants
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
              onJoin(event.id);
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
