import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import DescriptionIcon from "@mui/icons-material/Description";
import MapIcon from "@mui/icons-material/Map";
import SearchIcon from "@mui/icons-material/Search";
import { toast } from "sonner";
import { z } from "zod";

const libraries: ("places")[] = ["places"];

// Validation schema
const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(100, { message: "Title must be less than 100 characters" }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(500, { message: "Description must be less than 500 characters" }),
  activityType: z.enum(["running", "cycling", "walking", "others"], {
    required_error: "Please select an activity type",
  }),
  date: z
    .string()
    .min(1, { message: "Date is required" })
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Date must be today or in the future",
    }),
  time: z.string().min(1, { message: "Time is required" }),
  location: z
    .string()
    .trim()
    .min(3, { message: "Location must be at least 3 characters" })
    .max(200, { message: "Location must be less than 200 characters" }),
  lat: z.number().optional(),
  lng: z.number().optional(),
  maxParticipants: z
    .number()
    .int()
    .min(2, { message: "Must allow at least 2 participants" })
    .max(1000, { message: "Cannot exceed 1000 participants" })
    .optional(),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

interface CreateEventModalProps {
  onClose: () => void;
  onCreateEvent: (eventData: CreateEventFormData) => void;
  initialLocation?: { lat: number; lng: number } | null;
}

export const CreateEventModal = ({ onClose, onCreateEvent, initialLocation }: CreateEventModalProps) => {
  const [formData, setFormData] = useState<Partial<CreateEventFormData>>({
    activityType: "running",
    maxParticipants: undefined,
    lat: initialLocation?.lat,
    lng: initialLocation?.lng,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateEventFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Map picker state
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [mapPickerCenter, setMapPickerCenter] = useState<{ lat: number; lng: number }>({ lat: 14.5995, lng: 120.9842 });
  const [mapPickerZoom, setMapPickerZoom] = useState(13);
  const [mapPickerRef, setMapPickerRef] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Google Maps API loader - Use same ID as Events page to avoid loader conflict
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
    id: 'google-map-script', // Same ID as Events.tsx to share the loader instance
    googleMapsApiKey: googleMapsApiKey || '',
    libraries: libraries
  });
  
  // Get user location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          if (showMapPicker) {
            setMapPickerCenter(loc);
          }
        },
        (error) => {
          console.warn("Could not get user location:", error);
        }
      );
    }
  }, [showMapPicker]);
  
  // Detect mobile viewport - use initial check only, avoid re-renders during typing
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const activities = [
    { id: "running", label: "Running", icon: DirectionsRunIcon, color: "success" },
    { id: "cycling", label: "Cycling", icon: DirectionsBikeIcon, color: "primary" },
    { id: "walking", label: "Walking", icon: DirectionsWalkIcon, color: "warning" },
    { id: "others", label: "Others", icon: FitnessCenterIcon, color: "secondary" },
  ] as const;

  const handleInputChange = useCallback((field: keyof CreateEventFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field only if it exists
      setErrors((prev) => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev; // Return same object reference if no change
      });
  }, []);

  // Handle opening map picker
  const handleOpenMapPicker = useCallback(() => {
    setShowMapPicker(true);
    setSelectedLocation(null);
    // Center map on user location if available, otherwise use initialLocation or default
    if (userLocation) {
      setMapPickerCenter(userLocation);
    } else if (initialLocation) {
      setMapPickerCenter(initialLocation);
    } else if (formData.lat && formData.lng) {
      setMapPickerCenter({ lat: formData.lat, lng: formData.lng });
    }
  }, [userLocation, initialLocation, formData.lat, formData.lng]);

  // Handle closing map picker
  const handleCloseMapPicker = useCallback(() => {
    setShowMapPicker(false);
    setSelectedLocation(null);
  }, []);

  // Handle map click to select location
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelectedLocation({ lat, lng });
    }
  }, []);

  // Handle place selection from Autocomplete
  const handlePlaceSelect = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name || '';
        
        setSelectedLocation({ lat, lng, address });
        
        // Center map on selected place
        if (mapPickerRef) {
          mapPickerRef.panTo({ lat, lng });
          mapPickerRef.setZoom(15);
        } else {
          setMapPickerCenter({ lat, lng });
          setMapPickerZoom(15);
        }
      }
    }
  }, [mapPickerRef]);

  // Handle confirming selected location
  const handleConfirmLocation = useCallback(() => {
    if (selectedLocation) {
      handleInputChange("lat", selectedLocation.lat);
      handleInputChange("lng", selectedLocation.lng);
      // Update location field with address if available, otherwise coordinates
      if (selectedLocation.address) {
        handleInputChange("location", selectedLocation.address);
      } else {
        handleInputChange("location", `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`);
      }
      handleCloseMapPicker();
      toast.success("Location selected");
    }
  }, [selectedLocation, handleInputChange, handleCloseMapPicker]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // If initialLocation is provided, use coordinates as location string
      // Otherwise, use formData.location (which may be from map picker or manual entry)
      const locationValue = initialLocation 
        ? `${initialLocation.lat.toFixed(6)}, ${initialLocation.lng.toFixed(6)}`
        : formData.location || "";
      
      // Validate form data
      const validatedData = createEventSchema.parse({
        ...formData,
        location: locationValue || "",
        maxParticipants: formData.maxParticipants
          ? Number(formData.maxParticipants)
          : undefined,
      });

      // Include selected location coordinates (prioritize initialLocation, then formData lat/lng)
      const eventDataWithLocation = {
        ...validatedData,
        lat: initialLocation?.lat || formData.lat,
        lng: initialLocation?.lng || formData.lng,
      };
      
      // Call the create event handler
      onCreateEvent(eventDataWithLocation);
      
      toast.success("Event created successfully!");
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof CreateEventFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof CreateEventFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please fix the form errors");
      } else {
        toast.error("Failed to create event");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Map Picker Component
  const renderMapPicker = () => {
    if (!showMapPicker) return null;

    return (
      <AnimatePresence>
        {isMobile ? (
          // Mobile: Full-screen Drawer
          <Drawer open={showMapPicker} onOpenChange={(open) => !open && handleCloseMapPicker()}>
            <DrawerContent className="max-h-[100vh] h-[100vh] p-0">
              <DrawerHeader className="border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <DrawerTitle className="text-lg">Select Location</DrawerTitle>
                    <DrawerDescription className="text-xs">
                      Search or tap on the map to select a location
                    </DrawerDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseMapPicker}
                    className="h-8 w-8"
                  >
                    <CloseIcon style={{ fontSize: 20 }} />
                  </Button>
                </div>
                
                {/* Search Bar */}
                {isMapLoaded && (
                  <div className="mt-3">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                      <Autocomplete
                        onLoad={(autocomplete) => {
                          autocompleteRef.current = autocomplete;
                        }}
                        onPlaceChanged={handlePlaceSelect}
                        options={{
                          fields: ["geometry", "formatted_address", "name"],
                        }}
                      >
                        <Input
                          placeholder="Search for a place..."
                          className="pl-10 h-11"
                        />
                      </Autocomplete>
                    </div>
                  </div>
                )}
              </DrawerHeader>

              <div className="flex-1 relative">
                {mapLoadError ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center p-4">
                      <p className="text-destructive font-semibold">Error loading map</p>
                      <p className="text-sm text-muted-foreground">Please check your Google Maps API key</p>
                    </div>
                  </div>
                ) : !isMapLoaded ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading map...</p>
                    </div>
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={mapPickerCenter}
                    zoom={mapPickerZoom}
                    onLoad={(map) => {
                      setMapPickerRef(map);
                      if (userLocation) {
                        map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
                      }
                    }}
                    onClick={handleMapClick}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
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
                          scaledSize: isMapLoaded && window.google ? new window.google.maps.Size(32, 32) : undefined,
                        }}
                        title="Your location"
                      />
                    )}

                    {/* Selected Location Marker */}
                    {selectedLocation && (
                      <Marker
                        position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                        icon={{
                          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                          scaledSize: isMapLoaded && window.google ? new window.google.maps.Size(48, 48) : undefined,
                        }}
                        title="Selected location"
                      />
                    )}
                  </GoogleMap>
                )}

                {/* Selected Location Info and Actions */}
                <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4">
                  {selectedLocation ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold">Selected Location</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleCloseMapPicker}
                          className="flex-1 h-11"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleConfirmLocation}
                          className="flex-1 h-11"
                        >
                          Use This Location
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Tap on the map or search to select a location
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          // Desktop: Modal Overlay
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseMapPicker}
            className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-card rounded-2xl shadow-elevation-4 border-2 border-border overflow-hidden"
              style={{ height: "80vh" }}
            >
              {/* Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold">Select Location</h3>
                    <p className="text-sm text-muted-foreground">
                      Search or click on the map to select a location
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseMapPicker}
                    className="h-8 w-8"
                  >
                    <CloseIcon style={{ fontSize: 20 }} />
                  </Button>
                </div>

                {/* Search Bar */}
                {isMapLoaded && (
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                    <Autocomplete
                      onLoad={(autocomplete) => {
                        autocompleteRef.current = autocomplete;
                      }}
                      onPlaceChanged={handlePlaceSelect}
                      options={{
                        fields: ["geometry", "formatted_address", "name"],
                      }}
                    >
                      <Input
                        placeholder="Search for a place..."
                        className="pl-10 h-11"
                      />
                    </Autocomplete>
                  </div>
                )}
              </div>

              {/* Map */}
              <div className="relative" style={{ height: "calc(80vh - 180px)" }}>
                {mapLoadError ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center p-4">
                      <p className="text-destructive font-semibold">Error loading map</p>
                      <p className="text-sm text-muted-foreground">Please check your Google Maps API key</p>
                    </div>
                  </div>
                ) : !isMapLoaded ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading map...</p>
                    </div>
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={mapPickerCenter}
                    zoom={mapPickerZoom}
                    onLoad={(map) => {
                      setMapPickerRef(map);
                      if (userLocation) {
                        map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
                      }
                    }}
                    onClick={handleMapClick}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
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
                          scaledSize: isMapLoaded && window.google ? new window.google.maps.Size(32, 32) : undefined,
                        }}
                        title="Your location"
                      />
                    )}

                    {/* Selected Location Marker */}
                    {selectedLocation && (
                      <Marker
                        position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
                        icon={{
                          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                          scaledSize: isMapLoaded && window.google ? new window.google.maps.Size(48, 48) : undefined,
                        }}
                        title="Selected location"
                      />
                    )}
                  </GoogleMap>
                )}
              </div>

              {/* Footer with Selected Location Info and Actions */}
              <div className="p-4 border-t border-border bg-card">
                {selectedLocation ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold">Selected Location</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={handleCloseMapPicker}
                        className="flex-1 h-11"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmLocation}
                        className="flex-1 h-11"
                      >
                        Use This Location
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Click on the map or search to select a location
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Shared form content - extracted to reduce re-renders
  const renderFormContent = () => (
    <>
      {/* Event Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <EventIcon style={{ fontSize: 18 }} />
          Event Title *
        </Label>
        <Input
          id="title"
          placeholder="e.g., Morning Run in Central Park"
          value={formData.title || ""}
          onChange={(e) => handleInputChange("title", e.target.value)}
          className={`h-11 sm:h-12 ${errors.title ? "border-destructive" : ""}`}
          maxLength={100}
        />
        {errors.title && (
          <p className="text-xs sm:text-sm text-destructive">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <DescriptionIcon style={{ fontSize: 18 }} />
          Description *
        </Label>
        <Textarea
          id="description"
          placeholder="Describe your event, what to expect, any special requirements..."
          value={formData.description || ""}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className={`min-h-[80px] sm:min-h-[100px] resize-none ${errors.description ? "border-destructive" : ""}`}
          maxLength={500}
        />
        <div className="flex justify-between items-center">
          {errors.description ? (
            <p className="text-xs sm:text-sm text-destructive">{errors.description}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {formData.description?.length || 0} / 500 characters
            </p>
          )}
        </div>
      </div>

      {/* Activity Type */}
      <div className="space-y-3">
        <Label className="text-sm sm:text-base font-semibold">Activity Type *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {activities.map((activity) => {
            const Icon = activity.icon;
            const isSelected = formData.activityType === activity.id;
            return (
              <motion.button
                key={activity.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => handleInputChange("activityType", activity.id)}
                className={`
                  flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition-all duration-300
                  ${
                    isSelected
                      ? activity.color === "success"
                        ? "border-success bg-success/10 shadow-elevation-2"
                        : activity.color === "primary"
                        ? "border-primary bg-primary/10 shadow-elevation-2"
                        : activity.color === "warning"
                        ? "border-warning bg-warning/10 shadow-elevation-2"
                        : "border-secondary bg-secondary/10 shadow-elevation-2"
                      : "border-border bg-card hover:bg-secondary"
                  }
                `}
              >
                <Icon
                  className={
                    isSelected
                      ? activity.color === "success"
                        ? "text-success"
                        : activity.color === "primary"
                        ? "text-primary"
                        : activity.color === "warning"
                        ? "text-warning"
                        : "text-secondary"
                      : "text-muted-foreground"
                  }
                  style={{ fontSize: isMobile ? 24 : 32 }}
                />
                <span
                  className={`text-xs sm:text-sm mt-1 sm:mt-2 font-semibold ${
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {activity.label}
                </span>
              </motion.button>
            );
          })}
        </div>
        {errors.activityType && (
          <p className="text-xs sm:text-sm text-destructive">{errors.activityType}</p>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <EventIcon style={{ fontSize: 18 }} />
            Date *
          </Label>
          <Input
            id="date"
            type="date"
            min={getTodayDate()}
            value={formData.date || ""}
            onChange={(e) => handleInputChange("date", e.target.value)}
            className={`h-11 sm:h-12 ${errors.date ? "border-destructive" : ""}`}
          />
          {errors.date && (
            <p className="text-xs sm:text-sm text-destructive">{errors.date}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="time" className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <EventIcon style={{ fontSize: 18 }} />
            Time *
          </Label>
          <Input
            id="time"
            type="time"
            value={formData.time || ""}
            onChange={(e) => handleInputChange("time", e.target.value)}
            className={`h-11 sm:h-12 ${errors.time ? "border-destructive" : ""}`}
          />
          {errors.time && (
            <p className="text-xs sm:text-sm text-destructive">{errors.time}</p>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <LocationOnIcon style={{ fontSize: 18 }} />
          Location {initialLocation ? "" : "*"}
        </Label>
        <div className="flex gap-2">
          <Input
            id="location"
            placeholder={initialLocation ? `Location: ${initialLocation.lat.toFixed(6)}, ${initialLocation.lng.toFixed(6)}` : "e.g., Central Park, New York"}
            value={formData.location || (initialLocation ? `Lat: ${initialLocation.lat.toFixed(6)}, Lng: ${initialLocation.lng.toFixed(6)}` : "")}
            onChange={(e) => {
              if (!initialLocation) {
                handleInputChange("location", e.target.value);
              }
            }}
            readOnly={!!initialLocation}
            disabled={!!initialLocation}
            className={`flex-1 h-11 sm:h-12 ${errors.location ? "border-destructive" : ""} ${initialLocation ? "bg-muted cursor-not-allowed" : ""}`}
            maxLength={200}
          />
          {!initialLocation && (
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenMapPicker}
              className="h-11 sm:h-12 px-3 sm:px-4"
              title="Pin location on map"
            >
              <MapIcon style={{ fontSize: 20 }} />
              <span className="hidden sm:inline ml-2">Pin on Map</span>
            </Button>
          )}
        </div>
        {initialLocation && (
          <p className="text-xs text-muted-foreground">
            📍 Location selected from map: {initialLocation.lat.toFixed(6)}, {initialLocation.lng.toFixed(6)}
          </p>
        )}
        {!initialLocation && formData.lat && formData.lng && (
          <p className="text-xs text-muted-foreground">
            📍 Location coordinates: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
          </p>
        )}
        {!initialLocation && !formData.lat && (
          <p className="text-xs text-muted-foreground">
            Click "Pin on Map" to select a location, or enter a location name
          </p>
        )}
        {errors.location && (
          <p className="text-xs sm:text-sm text-destructive">{errors.location}</p>
        )}
      </div>

      {/* Max Participants */}
      <div className="space-y-2">
        <Label htmlFor="maxParticipants" className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <PeopleIcon style={{ fontSize: 18 }} />
          Maximum Participants (Optional)
        </Label>
        <Input
          id="maxParticipants"
          type="number"
          placeholder="Leave empty for unlimited"
          min="2"
          max="1000"
          value={formData.maxParticipants || ""}
          onChange={(e) =>
            handleInputChange(
              "maxParticipants",
              e.target.value ? parseInt(e.target.value) : ""
            )
          }
          className={`h-11 sm:h-12 ${errors.maxParticipants ? "border-destructive" : ""}`}
        />
        {errors.maxParticipants && (
          <p className="text-xs sm:text-sm text-destructive">{errors.maxParticipants}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Set a limit on how many people can join this event
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="w-full sm:flex-1 h-11 sm:h-12"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="w-full sm:flex-1 h-11 sm:h-12 font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Event"}
        </Button>
      </div>
    </>
  );

  // Mobile: Use Drawer (Bottom Sheet)
  if (isMobile) {
    return (
      <>
        {renderMapPicker()}
        {!showMapPicker && (
          <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
            <DrawerContent className="max-h-[90vh]">
              <DrawerHeader className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <EventIcon className="text-primary" style={{ fontSize: 24 }} />
                    </div>
                    <div>
                      <DrawerTitle className="text-xl">Create New Event</DrawerTitle>
                      <DrawerDescription className="text-xs">
                        Share your activity with the community
                      </DrawerDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8"
                  >
                    <CloseIcon style={{ fontSize: 20 }} />
                  </Button>
                </div>
              </DrawerHeader>
              <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
                {renderFormContent()}
              </form>
            </DrawerContent>
          </Drawer>
        )}
      </>
    );
  }

  // Desktop: Use Modal
  return (
    <>
      {renderMapPicker()}
      <AnimatePresence>
        {!showMapPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl my-8"
            >
              <Card className="overflow-hidden shadow-elevation-4 border-2 border-border/50">
                {/* Header */}
                <div className="relative bg-gradient-to-br from-primary/10 via-success/5 to-warning/10 p-6 border-b border-border">
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-sm hover:bg-secondary rounded-full transition-colors z-10"
                  >
                    <CloseIcon fontSize="small" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-background/80 backdrop-blur-sm rounded-xl">
                      <EventIcon className="text-primary" style={{ fontSize: 28 }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Create New Event</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Share your activity with the community
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {renderFormContent()}
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
