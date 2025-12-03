import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getUserEvents, Event as FirebaseEvent, leaveEvent, updateEvent, deleteEvent } from "@/services/eventService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import StarIcon from "@mui/icons-material/Star";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import UpcomingIcon from "@mui/icons-material/Upcoming";
import HistoryIcon from "@mui/icons-material/History";
import ExploreIcon from "@mui/icons-material/Explore";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { EventDetailModal } from "@/components/EventDetailModal";
import { CreateEventModal, type CreateEventFormData } from "@/components/CreateEventModal";
import { toast } from "sonner";
import { format, isSameDay, parseISO } from "date-fns";
import { generateDummyEvents, ENABLE_DUMMY_DATA } from "@/lib/dummyData";

type EventType = "running" | "cycling" | "walking" | "others";

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
}

const MyEvents = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [eventBeingEdited, setEventBeingEdited] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user events from Firebase
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const loadUserEvents = async () => {
      try {
        const firebaseEvents = await getUserEvents(currentUser.uid);
        
        // Transform and determine if events are past or greyed out (24 hours after event)
        let transformedEvents: Event[] = firebaseEvents
          .filter((event) => event && event.date) // Filter out invalid events
          .map((event) => {
            try {
              // Combine date and time to get full event datetime
              const eventDateTime = new Date(`${event.date}T${event.time || '00:00'}`);
              const now = new Date();
              
              // Check if date is valid
              if (isNaN(eventDateTime.getTime())) {
                console.warn("Invalid event date:", event.date, event);
                return null;
              }
              
              // Calculate 24 hours after event
              const eventEndTime = new Date(eventDateTime);
              eventEndTime.setHours(eventEndTime.getHours() + 24);
              
              // Event is past if it's been more than 24 hours since the event
              const isPast = now > eventEndTime;
              // Event is greyed out if it's been more than 24 hours since the event
              const isGreyedOut = now > eventEndTime;
              
              return {
                ...event,
                participants: Array.isArray(event.participants) ? event.participants : [],
                isJoined: true, // All events from getUserEvents are joined
                isPast,
                isGreyedOut,
              };
            } catch (error) {
              console.error("Error processing event:", error, event);
              return null;
            }
          })
          .filter((event): event is Event => event !== null); // Remove null entries
        
        // Add dummy events if enabled and no real events exist
        if (ENABLE_DUMMY_DATA && transformedEvents.length === 0) {
          const dummyEvents = generateDummyEvents();
          // Add current user to some events and filter to only include events where current user is a participant
          transformedEvents = dummyEvents
            .map((event, index) => {
              // Ensure participants is an array
              const participants = Array.isArray(event.participants) ? event.participants : [];
              // Add current user to first 3 events to ensure they show up
              if (index < 3 && !participants.includes(currentUser.uid)) {
                participants.push(currentUser.uid);
              }
              return {
                ...event,
                participants,
              };
            })
            .filter(event => {
              const participants = Array.isArray(event.participants) ? event.participants : [];
              return participants.includes(currentUser.uid);
            })
            .map((event) => {
              // Combine date and time to get full event datetime
              const eventDateTime = new Date(`${event.date}T${event.time || '00:00'}`);
              const now = new Date();
              
              // Calculate 24 hours after event
              const eventEndTime = new Date(eventDateTime);
              eventEndTime.setHours(eventEndTime.getHours() + 24);
              
              // Event is past if it's been more than 24 hours since the event
              const isPast = now > eventEndTime;
              const isGreyedOut = now > eventEndTime;
              
              return {
                ...event,
                participants: Array.isArray(event.participants) ? event.participants : [],
                isJoined: true,
                isPast,
                isGreyedOut,
              };
            });
        }
        
        setJoinedEvents(transformedEvents);
      } catch (error) {
        console.error("Error loading user events:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserEvents();
  }, [currentUser?.uid]);

  // Filter events by status with null safety
  const upcomingEvents = (joinedEvents || []).filter((event) => event && !event.isPast);
  const pastEvents = (joinedEvents || []).filter((event) => event && event.isPast);

  // Helper function to safely parse event dates for calendar
  const getValidEventDates = (events: Event[]) => {
    return events
      .filter((event) => event && event.date)
      .map((event) => {
        try {
          const date = parseISO(event.date);
          return isNaN(date.getTime()) ? null : date;
        } catch {
          return null;
        }
      })
      .filter((date): date is Date => date !== null);
  };

  // Get valid dates for calendar modifiers
  const upcomingEventsDates = getValidEventDates(upcomingEvents);
  const pastEventsDates = getValidEventDates(pastEvents);
  const allJoinedEventsDates = getValidEventDates(joinedEvents);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleLeaveEvent = async (eventId: string) => {
    if (!currentUser?.uid) {
      toast.error("Please log in to leave events");
      return;
    }

    try {
      await leaveEvent(eventId, currentUser.uid);
      toast.success("You've left the event");
      // Remove from local state
      setJoinedEvents(prev => prev.filter(e => e.id !== eventId));
      // Close modal if open
      if (selectedEvent?.id === eventId) {
        setShowEventDetail(false);
        setSelectedEvent(null);
      }
    } catch (error: any) {
      console.error("Error leaving event:", error);
      toast.error(error.message || "Failed to leave event");
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
      // Remove from local state
      setJoinedEvents(prev => prev.filter(e => e.id !== eventId));
      // Close modal
      setShowEventDetail(false);
      setSelectedEvent(null);
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast.error(error.message || "Failed to delete event");
    }
  };

  const handleEditEvent = (eventId: string) => {
    if (!currentUser?.uid) {
      toast.error("Please log in to edit events");
      return;
    }

    const targetEvent = joinedEvents.find((event) => event.id === eventId);
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

    const existingEvent = joinedEvents.find((event) => event.id === eventId);

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

      setJoinedEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? {
                ...event,
                title: updatedData.title,
                description: updatedData.description,
                type: updatedData.activityType as EventType,
                date: updatedData.date,
                time: updatedData.time,
                location: updatedData.location,
                lat: updatedData.lat ?? event.lat,
                lng: updatedData.lng ?? event.lng,
                maxParticipants: updatedData.maxParticipants,
              }
            : event
        )
      );

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

  const getActivityIcon = (type: EventType | string) => {
    switch (type) {
      case "running":
        return <DirectionsRunIcon className="text-success" style={{ fontSize: 20 }} />;
      case "cycling":
        return <DirectionsBikeIcon className="text-primary" style={{ fontSize: 20 }} />;
      case "walking":
        return <DirectionsWalkIcon className="text-warning" style={{ fontSize: 20 }} />;
      default:
        // Default to running icon if type is unknown
        return <DirectionsRunIcon className="text-success" style={{ fontSize: 20 }} />;
    }
  };

  const getActivityColor = (type: EventType | string) => {
    switch (type) {
      case "running":
        return "bg-success";
      case "cycling":
        return "bg-primary";
      case "walking":
        return "bg-warning";
      default:
        return "bg-success";
    }
  };

  const getEventsForDate = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return [];
    }
    if (!joinedEvents || joinedEvents.length === 0) {
      return [];
    }
    return joinedEvents.filter((event) => {
      if (!event || !event.date) return false;
      try {
        const eventDate = parseISO(event.date);
        if (isNaN(eventDate.getTime())) return false;
        return isSameDay(eventDate, date);
      } catch (error) {
        console.error("Error parsing event date:", error, event);
        return false;
      }
    });
  };

  const eventsForSelectedDate = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md shadow-elevation-2 sticky top-0 z-20 border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/events")}
              className="touch-target p-2 hover:bg-secondary rounded-xl transition-all duration-200"
            >
              <ArrowBackIcon style={{ fontSize: 28 }} />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">My Events</h1>
              <p className="text-sm text-muted-foreground">
                {joinedEvents.length} event{joinedEvents.length !== 1 ? "s" : ""} joined
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/events")}
              className="hidden sm:flex h-10"
            >
              <ExploreIcon className="mr-2" style={{ fontSize: 20 }} />
              Explore Events
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto mb-6">
            <TabsTrigger
              value="upcoming"
              className="py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-[44px]"
            >
              <UpcomingIcon className="sm:mr-2" style={{ fontSize: 20 }} />
              <span className="hidden sm:inline">Upcoming</span>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm">({upcomingEvents.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-[44px]"
            >
              <CalendarMonthIcon className="sm:mr-2" style={{ fontSize: 20 }} />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="py-2 sm:py-3 px-2 sm:px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-[44px]"
            >
              <HistoryIcon className="sm:mr-2" style={{ fontSize: 20 }} />
              <span className="hidden sm:inline">Past</span>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm">({pastEvents.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Events */}
          <TabsContent value="upcoming" className="space-y-4">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-12 text-center shadow-elevation-2">
                    <UpcomingIcon
                      style={{ fontSize: 64 }}
                      className="text-muted-foreground/30 mx-auto mb-4 animate-pulse"
                    />
                    <h3 className="text-lg font-bold mb-2">Loading events...</h3>
                  </Card>
                </motion.div>
              ) : upcomingEvents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-12 text-center shadow-elevation-2">
                    <UpcomingIcon
                      style={{ fontSize: 64 }}
                      className="text-muted-foreground/30 mx-auto mb-4"
                    />
                    <h3 className="text-lg font-bold mb-2">No Upcoming Events</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      Join events to see them here
                    </p>
                    <Button onClick={() => navigate("/events")}>
                      <ExploreIcon className="mr-2" style={{ fontSize: 20 }} />
                      Explore Events
                    </Button>
                  </Card>
                </motion.div>
              ) : (
                upcomingEvents.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={index}
                    onClick={() => handleEventClick(event)}
                    onLeave={() => handleLeaveEvent(event.id)}
                    onEdit={() => handleEditEvent(event.id)}
                    getActivityIcon={getActivityIcon}
                    showLeaveButton
                  />
                ))
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid lg:grid-cols-[1fr_400px] gap-6"
            >
              {/* Calendar */}
              <Card className="p-6 shadow-elevation-2">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">Event Calendar</h3>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span className="text-muted-foreground">Running</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Cycling</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-warning" />
                      <span className="text-muted-foreground">Walking</span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border pointer-events-auto"
                    modifiers={{
                      hasUpcomingEvents: upcomingEventsDates,
                      hasPastEvents: pastEventsDates,
                    }}
                    modifiersClassNames={{
                      hasUpcomingEvents: "has-upcoming-event",
                      hasPastEvents: "has-past-event",
                    }}
                  />
                  <style>{`
                    /* Base styles for dates with events */
                    .rdp-day.has-upcoming-event,
                    .rdp-day.has-past-event {
                      position: relative;
                    }
                    
                    /* Upcoming events - primary/blue dot */
                    .rdp-day.has-upcoming-event .rdp-day_button::after {
                      content: '';
                      position: absolute;
                      bottom: 2px;
                      left: 50%;
                      transform: translateX(-50%);
                      width: 6px;
                      height: 6px;
                      border-radius: 50%;
                      background-color: hsl(var(--primary));
                      box-shadow: 0 0 0 1px hsl(var(--background));
                    }
                    
                    /* Past events - orange/amber dot */
                    .rdp-day.has-past-event .rdp-day_button::after {
                      content: '';
                      position: absolute;
                      bottom: 2px;
                      left: 50%;
                      transform: translateX(-50%);
                      width: 6px;
                      height: 6px;
                      border-radius: 50%;
                      background-color: hsl(var(--warning));
                      box-shadow: 0 0 0 1px hsl(var(--background));
                    }
                    
                    /* Ensure the dot is visible even when date is selected - upcoming */
                    .rdp-day.has-upcoming-event[aria-selected="true"] .rdp-day_button::after {
                      background-color: hsl(var(--primary-foreground));
                      box-shadow: 0 0 0 1px hsl(var(--primary));
                    }
                    
                    /* Ensure the dot is visible even when date is selected - past */
                    .rdp-day.has-past-event[aria-selected="true"] .rdp-day_button::after {
                      background-color: hsl(var(--warning-foreground, hsl(var(--background))));
                      box-shadow: 0 0 0 1px hsl(var(--warning));
                    }
                    
                    /* Make the dot more prominent on hover */
                    .rdp-day.has-upcoming-event:hover .rdp-day_button::after,
                    .rdp-day.has-past-event:hover .rdp-day_button::after {
                      width: 7px;
                      height: 7px;
                    }
                    
                    /* Handle dates with both past and upcoming events (shouldn't happen, but just in case) */
                    .rdp-day.has-upcoming-event.has-past-event .rdp-day_button::after {
                      background-color: hsl(var(--primary));
                    }
                  `}</style>
                </div>
              </Card>

              {/* Selected Date Events */}
              <div className="space-y-4">
                <Card className="p-4 shadow-elevation-2 sticky top-24">
                  <h3 className="font-bold text-lg mb-4">
                    {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                  </h3>
                  {eventsForSelectedDate.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarMonthIcon
                        style={{ fontSize: 48 }}
                        className="text-muted-foreground/30 mx-auto mb-3"
                      />
                      <p className="text-muted-foreground text-sm">
                        No events on this date
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {eventsForSelectedDate.map((event) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => handleEventClick(event)}
                          className="cursor-pointer"
                        >
                          <Card 
                            className={`p-4 hover:shadow-elevation-2 transition-all duration-200 border-2 ${
                              event.isGreyedOut
                                ? "opacity-50 grayscale border-muted bg-muted/20"
                                : event.isPast 
                                ? "border-warning/50 bg-muted/30 opacity-90 hover:border-warning/70" 
                                : "border-border/50 hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {getActivityIcon(event.type || "running")}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-sm truncate">
                                    {event.title || "Untitled Event"}
                                  </h4>
                                  {event.isPast && (
                                    <Badge variant="secondary" className="flex-shrink-0 bg-muted text-xs">
                                      Completed
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                  <EventIcon style={{ fontSize: 14 }} />
                                  <span>{event.time || ""}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <LocationOnIcon style={{ fontSize: 14 }} />
                                  <span className="truncate">{event.location || ""}</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Past Events */}
          <TabsContent value="past" className="space-y-4">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-12 text-center shadow-elevation-2">
                    <HistoryIcon
                      style={{ fontSize: 64 }}
                      className="text-muted-foreground/30 mx-auto mb-4 animate-pulse"
                    />
                    <h3 className="text-lg font-bold mb-2">Loading events...</h3>
                  </Card>
                </motion.div>
              ) : pastEvents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="p-12 text-center shadow-elevation-2">
                    <HistoryIcon
                      style={{ fontSize: 64 }}
                      className="text-muted-foreground/30 mx-auto mb-4"
                    />
                    <h3 className="text-lg font-bold mb-2">No Past Events</h3>
                    <p className="text-muted-foreground text-sm">
                      Your completed events will appear here
                    </p>
                  </Card>
                </motion.div>
              ) : (
                pastEvents.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    index={index}
                    onClick={() => handleEventClick(event)}
                    onLeave={() => handleLeaveEvent(event.id)}
                    onEdit={() => handleEditEvent(event.id)}
                    getActivityIcon={getActivityIcon}
                    isPast
                  />
                ))
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>

      {/* Event Detail Modal */}
      {showEventDetail && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => {
            setShowEventDetail(false);
            setSelectedEvent(null);
          }}
          onJoin={handleLeaveEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {showEditEvent && eventBeingEdited && (
        <CreateEventModal
          mode="edit"
          eventToEdit={eventBeingEdited}
          onClose={handleCloseEditModal}
          onUpdateEvent={handleUpdateEvent}
        />
      )}
    </div>
  );
};

// Event Card Component
interface EventCardProps {
  event: Event;
  index: number;
  onClick: () => void;
  onLeave: () => void;
  onEdit?: () => void;
  getActivityIcon: (type: EventType) => JSX.Element;
  showLeaveButton?: boolean;
  isPast?: boolean;
}

const EventCard = ({
  event,
  index,
  onClick,
  onLeave,
  onEdit,
  getActivityIcon,
  showLeaveButton,
  isPast,
}: EventCardProps) => {
  const { user: currentUser } = useAuth();
  // Check if current user is the event owner
  const isEventOwner = currentUser?.uid && event.hostId === currentUser.uid;
  
  // Add defensive checks for potentially missing data
  const participantsCount = Array.isArray(event.participants) 
    ? event.participants.length 
    : 0;
  const eventType = event.type || "running"; // Default to running if type is missing
  const eventTitle = event.title || "Untitled Event";
  const eventDescription = event.description || "";
  const eventDate = event.date || "";
  const eventTime = event.time || "";
  const eventLocation = event.location || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card
        className={`overflow-hidden shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-300 border-2 ${
          event.isGreyedOut
            ? "opacity-50 grayscale border-muted bg-muted/20"
            : isPast 
            ? "opacity-90 border-warning/50 bg-muted/30 hover:border-warning/70" 
            : "border-border/50 hover:border-primary/30"
        }`}
      >
        {/* Gradient Header - Similar to EventDetailsPanel */}
        <div className={`relative p-4 pb-5 rounded-t-lg ${
          isPast 
            ? "bg-gradient-to-r from-warning/80 via-warning/70 to-warning/80" 
            : "bg-gradient-to-r from-primary via-primary to-success"
        }`}>
          <div className="flex items-start gap-3 pr-16">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 flex-shrink-0">
              {eventType === "running" && <DirectionsRunIcon className="text-white" style={{ fontSize: 20 }} />}
              {eventType === "cycling" && <DirectionsBikeIcon className="text-white" style={{ fontSize: 20 }} />}
              {eventType === "walking" && <DirectionsWalkIcon className="text-white" style={{ fontSize: 20 }} />}
              {eventType === "others" && <FitnessCenterIcon className="text-white" style={{ fontSize: 20 }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1.5">
                <h3 className="font-bold text-lg sm:text-xl text-white truncate drop-shadow-md">{eventTitle}</h3>
                {event.category === "sponsored" && (
                  <Badge className="flex-shrink-0 bg-warning/20 text-warning border-warning/40">
                    <StarIcon style={{ fontSize: 12 }} className="mr-1" />
                    Sponsored
                  </Badge>
                )}
                {isPast && (
                  <Badge className="flex-shrink-0 bg-white/20 text-white border-white/30">
                    Completed
                  </Badge>
                )}
              </div>
              <p className="text-sm text-white/90 line-clamp-2 drop-shadow-sm">
                {eventDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Event Info Section */}
        <div className="p-5 space-y-4">
          {/* Event Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 rounded-lg p-3">
              <EventIcon style={{ fontSize: 18 }} className="text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Date & Time</p>
                <p className="text-sm font-semibold text-foreground">
                  {eventDate} {eventTime && `at ${eventTime}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 rounded-lg p-3">
              <LocationOnIcon style={{ fontSize: 18 }} className="text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                <p className="text-sm font-semibold text-foreground truncate">{eventLocation}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 rounded-lg p-3 sm:col-span-2">
              <PeopleIcon style={{ fontSize: 18 }} className="text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Participants</p>
                <p className="text-sm font-semibold text-foreground">
                  {participantsCount}
                  {event.maxParticipants ? ` / ${event.maxParticipants}` : ""} joined
                </p>
              </div>
            </div>
          </div>

          {/* Status Badge and Action */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <CheckCircleIcon 
                className={isPast ? "text-warning" : "text-success"} 
                style={{ fontSize: 20 }} 
              />
              <span className={`text-sm font-semibold ${isPast ? "text-warning" : "text-success"}`}>
                {isPast ? "Event Completed" : isEventOwner ? "You're Hosting" : "You're Joined"}
              </span>
            </div>
            {!isPast && (
              <>
                {isEventOwner && onEdit ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    variant="outline"
                    size="sm"
                    className="h-9 border-2 hover:bg-primary/10 hover:border-primary/50"
                  >
                    <EditIcon className="mr-1" style={{ fontSize: 16 }} />
                    Edit Event
                  </Button>
                ) : showLeaveButton && !isEventOwner ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLeave();
                    }}
                    variant="outline"
                    size="sm"
                    className="h-9 border-2 hover:bg-destructive/10 hover:border-destructive/50"
                  >
                    Leave Event
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default MyEvents;
