// Admin Venues Management Page
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import {
  getAllVenues,
  addVenue,
  updateVenue,
  deleteVenue,
  Venue,
  VenueCategory,
} from "@/services/venueService";
import {
  listenToVenueRequests,
  updateVenueRequestStatus,
  VenueRequest,
} from "@/services/venueRequestService";
import { getUserData } from "@/services/authService";

const AdminVenues = () => {
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueRequests, setVenueRequests] = useState<VenueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [userData, setUserData] = useState<Record<string, any>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    lat: "",
    lng: "",
    radius: "",
    category: "park" as VenueCategory,
    city: "",
  });

  useEffect(() => {
    loadVenues();
    loadVenueRequests();
  }, []);

  useEffect(() => {
    filterVenues();
  }, [venues, searchQuery]);

  const loadVenues = async () => {
    try {
      setLoading(true);
      const venuesList = await getAllVenues();
      setVenues(venuesList);
      setFilteredVenues(venuesList);
    } catch (error) {
      console.error("Error loading venues:", error);
      toast.error("Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  const loadVenueRequests = () => {
    const unsubscribe = listenToVenueRequests((requests) => {
      setVenueRequests(requests);
      
      // Load user data for requests
      const userIds = new Set<string>();
      requests.forEach((request) => {
        userIds.add(request.userId);
      });

      Promise.all(
        Array.from(userIds).map(async (userId) => {
          try {
            const data = await getUserData(userId);
            if (data) {
              setUserData((prev) => ({ ...prev, [userId]: data }));
            }
          } catch (error) {
            console.error(`Error loading user ${userId}:`, error);
          }
        })
      );
    });

    return unsubscribe;
  };

  const filterVenues = () => {
    if (!searchQuery.trim()) {
      setFilteredVenues(venues);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = venues.filter(
      (venue) =>
        venue.name.toLowerCase().includes(lowerQuery) ||
        venue.description.toLowerCase().includes(lowerQuery) ||
        venue.city.toLowerCase().includes(lowerQuery)
    );
    setFilteredVenues(filtered);
  };

  const handleAddVenue = async () => {
    if (!formData.name || !formData.city || !formData.lat || !formData.lng) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const lat = parseFloat(formData.lat);
      const lng = parseFloat(formData.lng);
      const radius = parseFloat(formData.radius) || 1000;

      if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
        toast.error("Please enter valid numbers for coordinates and radius");
        return;
      }

      await addVenue(
        {
          name: formData.name,
          description: formData.description,
          lat,
          lng,
          radius,
          category: formData.category,
          city: formData.city,
        },
        currentAdmin?.uid || "admin"
      );

      toast.success("Venue added successfully");
      setAddDialog(false);
      resetForm();
      loadVenues();
    } catch (error: any) {
      toast.error(error.message || "Failed to add venue");
    }
  };

  const handleEditVenue = async () => {
    if (!selectedVenue || !formData.name || !formData.city) {
      return;
    }

    try {
      const lat = parseFloat(formData.lat);
      const lng = parseFloat(formData.lng);
      const radius = parseFloat(formData.radius) || 1000;

      await updateVenue(selectedVenue.id, {
        name: formData.name,
        description: formData.description,
        lat,
        lng,
        radius,
        category: formData.category,
        city: formData.city,
      });

      toast.success("Venue updated successfully");
      setEditDialog(false);
      resetForm();
      setSelectedVenue(null);
      loadVenues();
    } catch (error: any) {
      toast.error(error.message || "Failed to update venue");
    }
  };

  const handleDeleteVenue = async () => {
    if (!selectedVenue) return;

    try {
      await deleteVenue(selectedVenue.id);
      toast.success("Venue deleted successfully");
      setDeleteDialog(false);
      setSelectedVenue(null);
      loadVenues();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete venue");
    }
  };

  const handleApproveRequest = async (request: VenueRequest) => {
    try {
      await updateVenueRequestStatus(request.id, "approved", currentAdmin?.uid || "admin");
      toast.success("Request approved");
    } catch (error: any) {
      toast.error(error.message || "Failed to approve request");
    }
  };

  const handleRejectRequest = async (request: VenueRequest) => {
    try {
      await updateVenueRequestStatus(request.id, "rejected", currentAdmin?.uid || "admin");
      toast.success("Request rejected");
    } catch (error: any) {
      toast.error(error.message || "Failed to reject request");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      lat: "",
      lng: "",
      radius: "",
      category: "park",
      city: "",
    });
  };

  const openEditDialog = (venue: Venue) => {
    setSelectedVenue(venue);
    setFormData({
      name: venue.name,
      description: venue.description,
      lat: venue.lat.toString(),
      lng: venue.lng.toString(),
      radius: venue.radius.toString(),
      category: venue.category,
      city: venue.city,
    });
    setEditDialog(true);
  };

  const getCategoryBadge = (category: VenueCategory) => {
    const colors: Record<string, any> = {
      park: "success",
      university: "info",
      commercial: "default",
      sports: "warning",
      other: "secondary",
    };
    return <Badge variant={colors[category] || "default"}>{category}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, any> = {
      pending: "warning",
      approved: "success",
      rejected: "destructive",
    };
    return <Badge variant={colors[status] || "default"}>{status}</Badge>;
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
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Venues Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage venues and review user requests
        </p>
      </div>

      <Tabs defaultValue="venues" className="space-y-6">
        <TabsList>
          <TabsTrigger value="venues">Venues ({venues.length})</TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({venueRequests.filter((r) => r.status === "pending").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="venues" className="space-y-6">
          {/* Search and Add */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                <Input
                  placeholder="Search venues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setAddDialog(true)}>
                <AddIcon className="mr-2" style={{ fontSize: 20 }} />
                Add Venue
              </Button>
            </div>
          </Card>

          {/* Venues Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Radius</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVenues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No venues found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVenues.map((venue) => (
                    <TableRow key={venue.id}>
                      <TableCell className="font-medium">{venue.name}</TableCell>
                      <TableCell>{venue.city}</TableCell>
                      <TableCell>{getCategoryBadge(venue.category)}</TableCell>
                      <TableCell className="text-sm">
                        {venue.lat.toFixed(4)}, {venue.lng.toFixed(4)}
                      </TableCell>
                      <TableCell>{venue.radius}m</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(venue)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedVenue(venue);
                              setDeleteDialog(true);
                            }}
                          >
                            <DeleteIcon style={{ fontSize: 16 }} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venueRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No venue requests
                    </TableCell>
                  </TableRow>
                ) : (
                  venueRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.venueName}</TableCell>
                      <TableCell>{request.location}</TableCell>
                      <TableCell>
                        {userData[request.userId]?.username || userData[request.userId]?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        {request.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveRequest(request)}
                            >
                              <CheckCircleIcon className="mr-1" style={{ fontSize: 16 }} />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRejectRequest(request)}
                            >
                              <CancelIcon className="mr-1" style={{ fontSize: 16 }} />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Venue Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Venue</DialogTitle>
            <DialogDescription>
              Add a new venue to the list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Rizal Park"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of the venue"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude *</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  placeholder="14.5832"
                />
              </div>
              <div>
                <Label>Longitude *</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  placeholder="120.9794"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Radius (meters)</Label>
                <Input
                  type="number"
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                  placeholder="1000"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as VenueCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="park">Park</SelectItem>
                    <SelectItem value="university">University</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>City *</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Manila"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddVenue}>Add Venue</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Venue Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Venue</DialogTitle>
            <DialogDescription>
              Update venue information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude *</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                />
              </div>
              <div>
                <Label>Longitude *</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Radius (meters)</Label>
                <Input
                  type="number"
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as VenueCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="park">Park</SelectItem>
                    <SelectItem value="university">University</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>City *</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditVenue}>Update Venue</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Venue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedVenue?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVenue} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminVenues;

