// Admin Events Management Page
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ref, get, remove, set } from "firebase/database";
import { database } from "@/services/firebase";
import { Event } from "@/services/eventService";
import { getUserData } from "@/services/authService";
import { logAdminAction } from "@/services/adminService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import EventIcon from "@mui/icons-material/Event";
import PeopleIcon from "@mui/icons-material/People";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const AdminEvents = () => {
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "running" | "cycling" | "walking" | "others">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "user" | "sponsored">("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [participantsDialog, setParticipantsDialog] = useState(false);
  const [userData, setUserData] = useState<Record<string, any>>({});
  const [participantsData, setParticipantsData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, typeFilter, categoryFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsRef = ref(database, "events");
      const snapshot = await get(eventsRef);

      if (!snapshot.exists()) {
        setEvents([]);
        return;
      }

      const eventsList: Event[] = [];
      snapshot.forEach((child) => {
        eventsList.push({
          id: child.key!,
          ...child.val()
        });
        return false;
      });

      // Sort by creation date (newest first)
      eventsList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setEvents(eventsList);

      // Load user data for hosts
      const userIds = new Set<string>();
      eventsList.forEach((event) => {
        if (event.hostId) {
          userIds.add(event.hostId);
        }
      });

      const userDataMap: Record<string, any> = {};
      for (const userId of userIds) {
        try {
          const data = await getUserData(userId);
          if (data) {
            userDataMap[userId] = data;
          }
        } catch (error) {
          console.error(`Error loading user ${userId}:`, error);
        }
      }
      setUserData(userDataMap);
    } catch (error) {
      console.error("Error loading events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter(event => event.type === typeFilter);
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.hostName?.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(filtered);
  };

  const handleDelete = async (event: Event) => {
    try {
      const eventRef = ref(database, `events/${event.id}`);
      await remove(eventRef);
      if (currentAdmin?.email) {
        await logAdminAction(currentAdmin.email, "delete_event", {
          eventId: event.id,
          eventTitle: event.title,
          hostId: event.hostId,
          participantsCount: event.participants?.length || 0
        });
      }
      toast.success(`Event "${event.title}" has been deleted`);
      await loadEvents();
      setDeleteDialog(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const handleCancel = async (event: Event) => {
    try {
      const eventRef = ref(database, `events/${event.id}`);
      const eventData = await get(eventRef);
      if (eventData.exists()) {
        await set(eventRef, {
          ...eventData.val(),
          cancelled: true,
          cancelledAt: Date.now()
        });
        if (currentAdmin?.email) {
          await logAdminAction(currentAdmin.email, "cancel_event", {
            eventId: event.id,
            eventTitle: event.title,
            hostId: event.hostId,
            participantsCount: event.participants?.length || 0
          });
        }
        toast.success(`Event "${event.title}" has been cancelled`);
        await loadEvents();
        setCancelDialog(false);
        setSelectedEvent(null);
      }
    } catch (error) {
      console.error("Error cancelling event:", error);
      toast.error("Failed to cancel event");
    }
  };

  const handleViewParticipants = async (event: Event) => {
    setSelectedEvent(event);
    try {
      // Load participant data
      const participantIds = event.participants || [];
      const participantDataMap: Record<string, any> = {};
      
      for (const userId of participantIds) {
        try {
          const data = await getUserData(userId);
          if (data) {
            participantDataMap[userId] = data;
          }
        } catch (error) {
          console.error(`Error loading participant ${userId}:`, error);
        }
      }
      
      setParticipantsData(participantDataMap);
      setParticipantsDialog(true);
    } catch (error) {
      console.error("Error loading participants:", error);
      toast.error("Failed to load participants");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    try {
      const date = new Date(`${dateString}T${timeString}`);
      return date.toLocaleString();
    } catch {
      return `${dateString} ${timeString}`;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, any> = {
      running: "success",
      cycling: "info",
      walking: "warning",
      others: "default"
    };
    return <Badge variant={colors[type] || "default"}>{type}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
              ← Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all events
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredEvents.length} events
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground self-center mr-2">Type:</span>
              <Button
                variant={typeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("all")}
              >
                All
              </Button>
              <Button
                variant={typeFilter === "running" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("running")}
              >
                Running
              </Button>
              <Button
                variant={typeFilter === "cycling" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("cycling")}
              >
                Cycling
              </Button>
              <Button
                variant={typeFilter === "walking" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("walking")}
              >
                Walking
              </Button>
              <Button
                variant={typeFilter === "others" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("others")}
              >
                Others
              </Button>
            </div>
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground self-center mr-2">Category:</span>
              <Button
                variant={categoryFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("all")}
              >
                All
              </Button>
              <Button
                variant={categoryFilter === "user" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("user")}
              >
                User Created
              </Button>
              <Button
                variant={categoryFilter === "sponsored" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("sponsored")}
              >
                Sponsored
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Events Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No events found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                        <Badge variant={event.category === "sponsored" ? "default" : "secondary"} className="mt-1">
                          {event.category}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(event.type)}</TableCell>
                    <TableCell>
                      {event.hostName || (event.hostId && userData[event.hostId]?.name) || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(event.date)}</div>
                        <div className="text-xs text-muted-foreground">{event.time}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <LocationOnIcon style={{ fontSize: 16 }} />
                        <span className="max-w-xs truncate">{event.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <PeopleIcon style={{ fontSize: 16 }} />
                        <span>
                          {event.participants?.length || 0}
                          {event.maxParticipants && ` / ${event.maxParticipants}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewParticipants(event)}
                        >
                          <VisibilityIcon className="mr-1" style={{ fontSize: 16 }} />
                          Participants
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/comments?eventId=${event.id}`)}
                        >
                          <ChatBubbleOutlineIcon className="mr-1" style={{ fontSize: 16 }} />
                          Comments
                          {event.comments && Object.keys(event.comments).length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                              {Object.keys(event.comments).length}
                            </Badge>
                          )}
                        </Button>
                        {!event.cancelled && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedEvent(event);
                              setCancelDialog(true);
                            }}
                          >
                            <CancelIcon className="mr-1" style={{ fontSize: 16 }} />
                            Cancel
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(event);
                            setDeleteDialog(true);
                          }}
                        >
                          <DeleteIcon className="mr-1" style={{ fontSize: 16 }} />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedEvent?.title}"? 
              This action cannot be undone and will remove the event for all participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialog(false);
              setSelectedEvent(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedEvent && handleDelete(selectedEvent)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel "{selectedEvent?.title}"? 
              The event will be marked as cancelled but will remain in the database. Participants will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCancelDialog(false);
              setSelectedEvent(null);
            }}>
              No, Keep Active
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedEvent && handleCancel(selectedEvent)}
            >
              Cancel Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Participants Dialog */}
      <Dialog open={participantsDialog} onOpenChange={setParticipantsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Participants - {selectedEvent?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.participants?.length || 0} participant(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {selectedEvent?.participants && selectedEvent.participants.length > 0 ? (
              selectedEvent.participants.map((userId) => {
                const participant = participantsData[userId];
                return (
                  <div key={userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {participant?.name?.[0]?.toUpperCase() || userId[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{participant?.name || "Unknown User"}</p>
                        <p className="text-xs text-muted-foreground">{userId}</p>
                        {participant?.email && (
                          <p className="text-xs text-muted-foreground">{participant.email}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/users?search=${userId}`)}
                    >
                      View User
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-center py-4">No participants</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEvents;

