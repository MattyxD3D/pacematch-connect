// Venue service - manages predefined venues for check-ins
export type VenueCategory = "park" | "university" | "commercial" | "sports" | "other";

export interface Venue {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  category: VenueCategory;
  city: string;
}

/**
 * Predefined venues in the Philippines
 * These are popular locations for fitness activities
 */
const PREDEFINED_VENUES: Venue[] = [
  {
    id: "up-diliman",
    name: "UP Diliman",
    description: "University of the Philippines Diliman campus - popular for running and cycling",
    lat: 14.6532,
    lng: 121.0689,
    radius: 2000, // 2km radius for large campus
    category: "university",
    city: "Quezon City"
  },
  {
    id: "bgc",
    name: "Bonifacio Global City",
    description: "BGC - Modern business district with parks and running paths",
    lat: 14.5547,
    lng: 121.0244,
    radius: 1500, // 1.5km radius
    category: "commercial",
    city: "Taguig"
  },
  {
    id: "rizal-park",
    name: "Rizal Park",
    description: "Luneta Park - Historic park in Manila, great for walking and running",
    lat: 14.5832,
    lng: 120.9794,
    radius: 1000, // 1km radius
    category: "park",
    city: "Manila"
  },
  {
    id: "ayala-triangle",
    name: "Ayala Triangle Gardens",
    description: "Urban park in Makati with jogging paths",
    lat: 14.5564,
    lng: 121.0236,
    radius: 500, // 500m radius
    category: "park",
    city: "Makati"
  },
  {
    id: "quezon-memorial",
    name: "Quezon Memorial Circle",
    description: "Large circular park in Quezon City, popular for outdoor activities",
    lat: 14.6506,
    lng: 121.0497,
    radius: 800, // 800m radius
    category: "park",
    city: "Quezon City"
  },
  {
    id: "luneta-park",
    name: "Luneta Park",
    description: "Rizal Park - National park in Manila",
    lat: 14.5832,
    lng: 120.9794,
    radius: 1000, // 1km radius
    category: "park",
    city: "Manila"
  },
  {
    id: "moa-complex",
    name: "MOA Complex",
    description: "Mall of Asia Complex - Large area with seaside promenade",
    lat: 14.5355,
    lng: 120.9820,
    radius: 1500, // 1.5km radius
    category: "commercial",
    city: "Pasay"
  },
  {
    id: "greenbelt-park",
    name: "Greenbelt Park",
    description: "Greenbelt Park in Makati - Urban oasis for fitness activities",
    lat: 14.5544,
    lng: 121.0244,
    radius: 600, // 600m radius
    category: "park",
    city: "Makati"
  }
];

/**
 * Get all predefined venues
 */
export const getAllVenues = (): Venue[] => {
  return PREDEFINED_VENUES;
};

/**
 * Get a venue by ID
 */
export const getVenueById = (id: string): Venue | undefined => {
  return PREDEFINED_VENUES.find(venue => venue.id === id);
};

/**
 * Search venues by name (case-insensitive)
 */
export const searchVenues = (query: string): Venue[] => {
  if (!query.trim()) {
    return PREDEFINED_VENUES;
  }
  
  const lowerQuery = query.toLowerCase();
  return PREDEFINED_VENUES.filter(venue =>
    venue.name.toLowerCase().includes(lowerQuery) ||
    venue.description.toLowerCase().includes(lowerQuery) ||
    venue.city.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Calculate distance between two points in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get venues near a location within a specified radius (in kilometers)
 */
export const getVenuesNearby = (
  lat: number,
  lng: number,
  radiusKm: number = 10
): Venue[] => {
  return PREDEFINED_VENUES
    .map(venue => ({
      venue,
      distance: calculateDistance(lat, lng, venue.lat, venue.lng)
    }))
    .filter(({ distance }) => distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
    .map(({ venue }) => venue);
};

/**
 * Find venue that matches an event location (by coordinates)
 * Returns venue if event is within venue radius
 */
export const findVenueForEvent = (
  eventLat: number,
  eventLng: number
): Venue | null => {
  for (const venue of PREDEFINED_VENUES) {
    const distance = calculateDistance(eventLat, eventLng, venue.lat, venue.lng);
    const distanceMeters = distance * 1000; // Convert to meters
    
    // Check if event is within venue radius
    if (distanceMeters <= venue.radius) {
      return venue;
    }
  }
  
  return null;
};

