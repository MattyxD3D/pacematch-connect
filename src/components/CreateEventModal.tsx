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
import { Geolocation } from "@capacitor/geolocation";
import { isNativePlatform } from "@/utils/platform";
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
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { toast } from "sonner";
import { z } from "zod";
import type { Event as FirebaseEvent } from "@/services/eventService";

const libraries: ("places")[] = ["places"];
const defaultMapCenter = { lat: 14.5995, lng: 120.9842 };

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

export type CreateEventFormData = z.infer<typeof createEventSchema>;

interface CreateEventModalProps {
  mode?: "create" | "edit";
  eventToEdit?: FirebaseEvent | null;
  onClose: () => void;
  onCreateEvent?: (eventData: CreateEventFormData) => Promise<void> | void;
  onUpdateEvent?: (eventId: string, eventData: CreateEventFormData) => Promise<void> | void;
  initialLocation?: { lat: number; lng: number } | null;
}

export const CreateEventModal = ({
  mode = "create",
  eventToEdit,
  onClose,
  onCreateEvent,
  onUpdateEvent,
  initialLocation,
}: CreateEventModalProps) => {
  const isEditMode = mode === "edit" && !!eventToEdit;
  const determineInitialMapCenter = () => ({
    lat: eventToEdit?.lat || initialLocation?.lat || defaultMapCenter.lat,
    lng: eventToEdit?.lng || initialLocation?.lng || defaultMapCenter.lng,
  });
  const [formData, setFormData] = useState<Partial<CreateEventFormData>>(() => {
    if (isEditMode && eventToEdit) {
      return {
        title: eventToEdit.title,
        description: eventToEdit.description,
        activityType: (eventToEdit.type as CreateEventFormData["activityType"]) || "running",
        date: eventToEdit.date,
        time: eventToEdit.time,
        location: eventToEdit.location,
        maxParticipants: eventToEdit.maxParticipants,
        lat: eventToEdit.lat,
        lng: eventToEdit.lng,
      };
    }

    return {
      activityType: "running",
      maxParticipants: undefined,
      lat: initialLocation?.lat,
      lng: initialLocation?.lng,
    };
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateEventFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Map picker state
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [mapPickerCenter, setMapPickerCenter] = useState<{ lat: number; lng: number }>(determineInitialMapCenter);
  const [liveMapCenter, setLiveMapCenter] = useState<{ lat: number; lng: number } | null>(determineInitialMapCenter);
  const [mapPickerZoom, setMapPickerZoom] = useState(13);
  const [mapPickerRef, setMapPickerRef] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingUserLocation, setIsLoadingUserLocation] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  
  useEffect(() => {
    if (isEditMode && eventToEdit) {
      setFormData({
        title: eventToEdit.title,
        description: eventToEdit.description,
        activityType: (eventToEdit.type as CreateEventFormData["activityType"]) || "running",
        date: eventToEdit.date,
        time: eventToEdit.time,
        location: eventToEdit.location,
        maxParticipants: eventToEdit.maxParticipants,
        lat: eventToEdit.lat,
        lng: eventToEdit.lng,
      });
      setSelectedLocation(null);
      const updatedCenter = {
        lat: eventToEdit.lat || initialLocation?.lat || defaultMapCenter.lat,
        lng: eventToEdit.lng || initialLocation?.lng || defaultMapCenter.lng,
      };
      setMapPickerCenter(updatedCenter);
      setLiveMapCenter(updatedCenter);
    }
  }, [isEditMode, eventToEdit, initialLocation]);
  
  // Google Maps API loader - Use same ID as Events page to avoid loader conflict
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
    id: 'google-map-script', // Same ID as Events.tsx to share the loader instance
    googleMapsApiKey: googleMapsApiKey || '',
    libraries: libraries
  });
  
  // Get user location when component mounts or map picker opens
  useEffect(() => {
    const getUserLocation = async () => {
      setIsLoadingUserLocation(true);
      
      try {
        let loc: { lat: number; lng: number } | null = null;
        
        if (isNativePlatform()) {
          // Use Capacitor Geolocation for native apps (iOS/Android)
          try {
            // Request permissions first
            const permissionStatus = await Geolocation.requestPermissions();
            
            if (permissionStatus.location === 'granted') {
              const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000
              });
              
              loc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
            } else {
              console.warn("Location permission denied on native platform");
            }
          } catch (error) {
            console.warn("Could not get user location (native):", error);
          }
        } else {
          // Use browser geolocation for web
          if (navigator.geolocation) {
            await new Promise<void>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  loc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  };
                  resolve();
                },
                (error) => {
                  console.warn("Could not get user location (web):", error);
                  reject(error);
                }
              );
            });
          }
        }
        
        if (loc) {
          setUserLocation(loc);
          
          // If map picker is open, center on user location
          if (showMapPicker) {
            setMapPickerCenter(loc);
            setLiveMapCenter(loc);
            setMapPickerZoom(15);
            
            // Also pan the map if ref exists
            if (mapPickerRef) {
              mapPickerRef.panTo(loc);
              mapPickerRef.setZoom(15);
            }
          }
        }
      } catch (error) {
        console.warn("Error getting user location:", error);
      } finally {
        setIsLoadingUserLocation(false);
      }
    };
    
    getUserLocation();
  }, [showMapPicker, mapPickerRef]);

  useEffect(() => {
    if (
      isMapLoaded &&
      !geocoderRef.current &&
      typeof window !== "undefined" &&
      window.google?.maps?.Geocoder
    ) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [isMapLoaded]);

  useEffect(() => {
    setLiveMapCenter(mapPickerCenter);
  }, [mapPickerCenter]);

  // Center map on user location when it becomes available (handles async loading)
  useEffect(() => {
    if (showMapPicker && userLocation && mapPickerRef && !selectedLocation) {
      // Only auto-center if no location is selected yet
      mapPickerRef.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      mapPickerRef.setZoom(15);
      setMapPickerCenter(userLocation);
      setLiveMapCenter(userLocation);
      setMapPickerZoom(15);
    }
  }, [userLocation, showMapPicker, mapPickerRef, selectedLocation]);
  
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

    if (formData.lat && formData.lng) {
      const existingSelection = {
        lat: formData.lat,
        lng: formData.lng,
        address: formData.location,
      };
      setSelectedLocation(existingSelection);
      const coords = { lat: formData.lat, lng: formData.lng };
      setMapPickerCenter(coords);
      setLiveMapCenter(coords);
      setMapPickerZoom(15);
      return;
    }

    setSelectedLocation(null);
    // Center map on user location if available, otherwise use initialLocation or default
    if (userLocation) {
      setMapPickerCenter(userLocation);
      setLiveMapCenter(userLocation);
      setMapPickerZoom(14);
    } else if (initialLocation) {
      setMapPickerCenter(initialLocation);
      setLiveMapCenter(initialLocation);
      setMapPickerZoom(14);
    }
  }, [userLocation, initialLocation, formData.lat, formData.lng, formData.location]);

  // Handle closing map picker
  const handleCloseMapPicker = useCallback(() => {
    setShowMapPicker(false);
    setSelectedLocation(null);
  }, []);

  /**
   * Reverse geocodes coordinates to provide a friendlier address label.
   */
  const resolveAddressFromCoords = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) =>
      new Promise<string | undefined>((resolve) => {
        if (!geocoderRef.current) {
          resolve(undefined);
          return;
        }

        geocoderRef.current.geocode(
          { location: { lat, lng } },
          (results, status) => {
            if (status === "OK" && results && results.length > 0) {
              resolve(results[0].formatted_address);
            } else {
              console.warn("Reverse geocoding failed:", status);
              resolve(undefined);
            }
          }
        );
      }),
    []
  );

  /**
   * Updates local state with the provided coordinates and enriches them
   * with a resolved address when the Maps API returns one.
   */
  const updateLocationFromCoordinates = useCallback(
    ({ lat, lng, address }: { lat: number; lng: number; address?: string }) => {
      setSelectedLocation(address ? { lat, lng, address } : { lat, lng });

      if (!address) {
        resolveAddressFromCoords({ lat, lng }).then((resolvedAddress) => {
          if (!resolvedAddress) return;
          setSelectedLocation((prev) => {
            if (!prev || prev.lat !== lat || prev.lng !== lng) {
              return prev;
            }
            return { lat, lng, address: resolvedAddress };
          });
        });
      }

      // Always update React state to ensure sync even if component re-renders
      setMapPickerCenter({ lat, lng });
      setLiveMapCenter({ lat, lng });
      setMapPickerZoom(15);
      
      // Also pan the map if ref exists (for immediate visual feedback)
      if (mapPickerRef) {
        mapPickerRef.panTo({ lat, lng });
        mapPickerRef.setZoom(15);
      }
    },
    [resolveAddressFromCoords, mapPickerRef]
  );

  // Handle map click to select location
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateLocationFromCoordinates({ lat, lng });
    },
    [updateLocationFromCoordinates]
  );

  /**
   * Snapshot the current visible center so the user can drop a pin there.
   */
  const handleMapIdle = useCallback(() => {
    if (!mapPickerRef) return;
    const center = mapPickerRef.getCenter();
    if (!center) return;
    setLiveMapCenter({
      lat: center.lat(),
      lng: center.lng(),
    });
  }, [mapPickerRef]);

  const handleCenterPinDrop = useCallback(() => {
    if (!liveMapCenter) return;
    updateLocationFromCoordinates(liveMapCenter);
  }, [liveMapCenter, updateLocationFromCoordinates]);

  // Handle place selection from Autocomplete
  const handlePlaceSelect = useCallback(() => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (!place.geometry?.location) return;

    updateLocationFromCoordinates({
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      address: place.formatted_address || place.name || "",
    });
  }, [updateLocationFromCoordinates]);

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
      // Decide which location string to validate with
      const locationValue = !isEditMode && initialLocation
        ? `${initialLocation.lat.toFixed(6)}, ${initialLocation.lng.toFixed(6)}`
        : formData.location || eventToEdit?.location || "";
      
      // Validate form data
      const validatedData = createEventSchema.parse({
        ...formData,
        location: locationValue || "",
        maxParticipants: formData.maxParticipants
          ? Number(formData.maxParticipants)
          : undefined,
      });

      const resolvedLat = isEditMode
        ? formData.lat ?? eventToEdit?.lat
        : initialLocation?.lat ?? formData.lat;
      const resolvedLng = isEditMode
        ? formData.lng ?? eventToEdit?.lng
        : initialLocation?.lng ?? formData.lng;

      // Include selected location coordinates (prioritize context-specific fallbacks)
      const eventDataWithLocation = {
        ...validatedData,
        lat: resolvedLat,
        lng: resolvedLng,
      };
      
      if (isEditMode) {
        if (!eventToEdit?.id) {
          throw new Error("Missing event identifier");
        }
        if (!onUpdateEvent) {
          toast.error("Update handler not available");
          return;
        }
        await Promise.resolve(onUpdateEvent(eventToEdit.id, eventDataWithLocation));
        toast.success("Event updated successfully!");
      } else {
        if (!onCreateEvent) {
          toast.error("Create handler not available");
          return;
        }
        await Promise.resolve(onCreateEvent(eventDataWithLocation));
        toast.success("Event created successfully!");
      }

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
        toast.error(isEditMode ? "Failed to update event" : "Failed to create event");
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
                      Search, click, or use the center crosshair to drop a pin
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
                      if (
                        typeof window !== "undefined" &&
                        window.google?.maps?.Geocoder &&
                        !geocoderRef.current
                      ) {
                        geocoderRef.current = new window.google.maps.Geocoder();
                      }
                      const currentCenter = map.getCenter();
                      if (currentCenter) {
                        setLiveMapCenter({
                          lat: currentCenter.lat(),
                          lng: currentCenter.lng(),
                        });
                      }
                      if (userLocation) {
                        map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
                        map.setZoom(15);
                      }
                    }}
                    onClick={handleMapClick}
                    onIdle={handleMapIdle}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                      gestureHandling: "greedy",
                      draggableCursor: "crosshair",
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

                {isMapLoaded && !mapLoadError && (
                  <>
                    {/* Center crosshair */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
                      <div className="relative h-14 w-14 flex items-center justify-center">
                        <span className="absolute left-1/2 top-0 h-14 w-[2px] -translate-x-1/2 bg-primary/70"></span>
                        <span className="absolute top-1/2 left-0 w-14 h-[2px] -translate-y-1/2 bg-primary/70"></span>
                        <div className="w-6 h-6 rounded-full border-2 border-primary/80 bg-background/60 backdrop-blur-sm shadow-md"></div>
                      </div>
                    </div>
                    
                    {/* Loading user location indicator */}
                    {isLoadingUserLocation && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-border">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <p className="text-sm text-muted-foreground">Getting your location...</p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Selected Location Info and Actions */}
                <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 z-20">
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
                    <div className="space-y-3 text-center">
                      <p className="text-sm text-muted-foreground">
                        Click anywhere on the map or align the crosshair, then drop the pin.
                      </p>
                      <Button
                        variant="secondary"
                        onClick={handleCenterPinDrop}
                        className="w-full h-10"
                        disabled={!isMapLoaded}
                      >
                        Drop Pin Here
                      </Button>
                      {liveMapCenter && (
                        <p className="text-xs text-muted-foreground">
                          Map center: {liveMapCenter.lat.toFixed(5)}, {liveMapCenter.lng.toFixed(5)}
                        </p>
                      )}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
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
                      Search, click, or use the center crosshair to drop a pin
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
                      if (
                        typeof window !== "undefined" &&
                        window.google?.maps?.Geocoder &&
                        !geocoderRef.current
                      ) {
                        geocoderRef.current = new window.google.maps.Geocoder();
                      }
                      const currentCenter = map.getCenter();
                      if (currentCenter) {
                        setLiveMapCenter({
                          lat: currentCenter.lat(),
                          lng: currentCenter.lng(),
                        });
                      }
                      if (userLocation) {
                        map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
                        map.setZoom(15);
                      }
                    }}
                    onClick={handleMapClick}
                    onIdle={handleMapIdle}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                      gestureHandling: "greedy",
                      draggableCursor: "crosshair",
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
                {isMapLoaded && !mapLoadError && (
                  <>
                    {/* Center crosshair */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
                      <div className="relative h-14 w-14 flex items-center justify-center">
                        <span className="absolute left-1/2 top-0 h-14 w-[2px] -translate-x-1/2 bg-primary/70"></span>
                        <span className="absolute top-1/2 left-0 w-14 h-[2px] -translate-y-1/2 bg-primary/70"></span>
                        <div className="w-6 h-6 rounded-full border-2 border-primary/80 bg-background/60 backdrop-blur-sm shadow-md"></div>
                      </div>
                    </div>
                    
                    {/* Loading user location indicator */}
                    {isLoadingUserLocation && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-border">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <p className="text-sm text-muted-foreground">Getting your location...</p>
                        </div>
                      </div>
                    )}
                  </>
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
                  <div className="space-y-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      Click anywhere on the map or align the crosshair, then drop the pin.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={handleCenterPinDrop}
                      className="w-full sm:w-auto h-10"
                      disabled={!isMapLoaded}
                    >
                      Drop Pin Here
                    </Button>
                    {liveMapCenter && (
                      <p className="text-xs text-muted-foreground">
                        Map center: {liveMapCenter.lat.toFixed(5)}, {liveMapCenter.lng.toFixed(5)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const submitButtonLabel = isEditMode
    ? isSubmitting
      ? "Saving..."
      : "Save Changes"
    : isSubmitting
    ? "Creating..."
    : "Create Event";

  const modalTitle = isEditMode ? "Edit Event" : "Create New Event";
  const modalDescription = isEditMode
    ? "Adjust the details for your existing event"
    : "Share your activity with the community";

  // Shared form content - extracted to reduce re-renders
  const renderFormContent = () => (
    <>
      {/* Event Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <EventIcon style={{ fontSize: 18 }} className="text-primary" />
          </div>
          Event Title *
        </Label>
        <Input
          id="title"
          placeholder="e.g., Morning Run in Central Park"
          value={formData.title || ""}
          onChange={(e) => handleInputChange("title", e.target.value)}
          className={`h-12 sm:h-14 bg-gradient-to-br from-background to-muted/20 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
            errors.title ? "border-destructive" : "border-border/50"
          }`}
          maxLength={100}
        />
        {errors.title && (
          <p className="text-xs sm:text-sm text-destructive">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <div className="p-1.5 bg-success/10 rounded-lg">
            <DescriptionIcon style={{ fontSize: 18 }} className="text-success" />
          </div>
          Description *
        </Label>
        <Textarea
          id="description"
          placeholder="Describe your event, what to expect, any special requirements..."
          value={formData.description || ""}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className={`min-h-[100px] sm:min-h-[120px] resize-none bg-gradient-to-br from-background to-muted/20 border-2 focus:border-success focus:ring-2 focus:ring-success/20 transition-all ${
            errors.description ? "border-destructive" : "border-border/50"
          }`}
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
        <Label className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <FitnessCenterIcon style={{ fontSize: 18 }} className="text-primary" />
          Activity Type *
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            const isSelected = formData.activityType === activity.id;
            return (
              <motion.button
                key={activity.id}
                type="button"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleInputChange("activityType", activity.id)}
                className={`
                  relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 overflow-hidden
                  ${
                    isSelected
                      ? activity.color === "success"
                        ? "border-success bg-gradient-to-br from-success/20 to-success/5 shadow-lg shadow-success/20"
                        : activity.color === "primary"
                        ? "border-primary bg-gradient-to-br from-primary/20 to-primary/5 shadow-lg shadow-primary/20"
                        : activity.color === "warning"
                        ? "border-warning bg-gradient-to-br from-warning/20 to-warning/5 shadow-lg shadow-warning/20"
                        : "border-secondary bg-gradient-to-br from-secondary/20 to-secondary/5 shadow-lg shadow-secondary/20"
                      : "border-border/50 bg-gradient-to-br from-card to-muted/30 hover:border-primary/50 hover:shadow-md"
                  }
                `}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"
                  />
                )}
                <div className="relative">
                  <Icon
                    className={
                      isSelected
                        ? activity.color === "success"
                          ? "text-success drop-shadow-sm"
                          : activity.color === "primary"
                          ? "text-primary drop-shadow-sm"
                          : activity.color === "warning"
                          ? "text-warning drop-shadow-sm"
                          : "text-secondary drop-shadow-sm"
                        : "text-muted-foreground"
                    }
                    style={{ fontSize: isMobile ? 28 : 36 }}
                  />
                </div>
                <span
                  className={`text-xs sm:text-sm mt-2 sm:mt-3 font-bold relative ${
                    isSelected 
                      ? activity.color === "success"
                        ? "text-success"
                        : activity.color === "primary"
                        ? "text-primary"
                        : activity.color === "warning"
                        ? "text-warning"
                        : "text-secondary"
                      : "text-muted-foreground"
                  }`}
                >
                  {activity.label}
                </span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                  >
                    <span className="text-white text-xs">✓</span>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
        {errors.activityType && (
          <p className="text-xs sm:text-sm text-destructive">{errors.activityType}</p>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <EventIcon style={{ fontSize: 18 }} className="text-primary" />
            </div>
            Date *
          </Label>
          <Input
            id="date"
            type="date"
            min={getTodayDate()}
            value={formData.date || ""}
            onChange={(e) => handleInputChange("date", e.target.value)}
            className={`h-12 sm:h-14 bg-gradient-to-br from-background to-muted/20 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
              errors.date ? "border-destructive" : "border-border/50"
            }`}
          />
          {errors.date && (
            <p className="text-xs sm:text-sm text-destructive">{errors.date}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="time" className="text-sm sm:text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 bg-success/10 rounded-lg">
              <AccessTimeIcon style={{ fontSize: 18 }} className="text-success" />
            </div>
            Time *
          </Label>
          <Input
            id="time"
            type="time"
            value={formData.time || ""}
            onChange={(e) => handleInputChange("time", e.target.value)}
            className={`h-12 sm:h-14 bg-gradient-to-br from-background to-muted/20 border-2 focus:border-success focus:ring-2 focus:ring-success/20 transition-all ${
              errors.time ? "border-destructive" : "border-border/50"
            }`}
          />
          {errors.time && (
            <p className="text-xs sm:text-sm text-destructive">{errors.time}</p>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <div className="p-1.5 bg-warning/10 rounded-lg">
            <LocationOnIcon style={{ fontSize: 18 }} className="text-warning" />
          </div>
          Location {initialLocation ? "" : "*"}
        </Label>
        <div className="flex gap-3">
          <Input
            id="location"
            placeholder={initialLocation ? `Location: ${initialLocation.lat.toFixed(6)}, ${initialLocation.lng.toFixed(6)}` : "e.g., Central Park, New York"}
            value={
              formData.location ||
              (initialLocation
                ? `Lat: ${initialLocation.lat.toFixed(6)}, Lng: ${initialLocation.lng.toFixed(6)}`
                : formData.lat && formData.lng
                ? `Lat: ${formData.lat.toFixed(6)}, Lng: ${formData.lng.toFixed(6)}`
                : "")
            }
            readOnly
            disabled
            className={`flex-1 h-12 sm:h-14 bg-gradient-to-br from-muted/30 to-muted/10 cursor-not-allowed border-2 ${
              errors.location ? "border-destructive" : "border-border/50"
            }`}
            title="Use the pin button to pick a location"
            maxLength={200}
          />
          {!initialLocation && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenMapPicker}
                className="h-12 sm:h-14 px-4 sm:px-6 border-2 border-warning text-warning bg-warning/10 hover:bg-warning/20 shadow-lg shadow-warning/20 hover:shadow-xl hover:shadow-warning/30 transition-all font-semibold"
                title="Pin location on map"
              >
                <MapIcon style={{ fontSize: 22 }} />
                <span className="hidden sm:inline ml-2">Pin on Map</span>
              </Button>
            </motion.div>
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
          <div className="p-1.5 bg-secondary/10 rounded-lg">
            <PeopleIcon style={{ fontSize: 18 }} className="text-secondary" />
          </div>
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
          className={`h-12 sm:h-14 bg-gradient-to-br from-background to-muted/20 border-2 focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all ${
            errors.maxParticipants ? "border-destructive" : "border-border/50"
          }`}
        />
        {errors.maxParticipants && (
          <p className="text-xs sm:text-sm text-destructive">{errors.maxParticipants}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Set a limit on how many people can join this event
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border/50">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="w-full sm:flex-1 h-12 sm:h-14 border-2 hover:bg-destructive/10 hover:border-destructive/50 transition-all font-semibold"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:flex-1"
        >
          <Button
            type="submit"
            className="w-full h-12 sm:h-14 font-bold text-base bg-gradient-to-r from-primary via-primary to-success hover:from-primary/90 hover:via-primary/90 hover:to-success/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <EventIcon style={{ fontSize: 20 }} />
                {isEditMode ? "Update Event" : "Create Event"}
              </span>
            )}
          </Button>
        </motion.div>
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
                      <DrawerTitle className="text-xl">{modalTitle}</DrawerTitle>
                      <DrawerDescription className="text-xs">
                        {modalDescription}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl my-8"
            >
              <Card className="overflow-hidden shadow-elevation-4 border-2 border-border/50 bg-gradient-to-br from-background via-background to-primary/5">
                {/* Header with Enhanced Design */}
                <div className="relative bg-gradient-to-br from-primary via-primary/90 to-success/80 p-8 border-b border-primary/20 overflow-hidden">
                  {/* Decorative background elements */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-success rounded-full blur-2xl" />
                  </div>
                  
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full transition-all z-10 shadow-lg hover:scale-110"
                  >
                    <CloseIcon className="text-white" fontSize="small" />
                  </button>

                  <div className="relative flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl" />
                      <div className="relative p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
                        <EventIcon className="text-white" style={{ fontSize: 32 }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-white drop-shadow-lg">{modalTitle}</h2>
                      <p className="text-sm text-white/90 mt-1.5 drop-shadow-md">
                        {modalDescription}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form with Enhanced Styling */}
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 bg-gradient-to-b from-background to-background/95">
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
