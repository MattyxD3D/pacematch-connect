// Venue service - manages predefined venues for check-ins
import { ref, set, get, onValue, off, remove, DataSnapshot, push } from "firebase/database";
import { database } from "./firebase";

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
    description: "2.2km Academic Oval loop with shaded tree-lined roads, popular for running, cycling, and campus-based fitness meetups",
    lat: 14.6532,
    lng: 121.0689,
    radius: 2200, // 2.2km loop
    category: "university",
    city: "Quezon City"
  },
  {
    id: "bgc",
    name: "Bonifacio Global City (BGC)",
    description: "Mixed-use district with clean, well-lit sidewalks, bike lanes, and pocket parks, a major hub for running clubs and cycling groups",
    lat: 14.5547,
    lng: 121.0244,
    radius: 2000, // Large district
    category: "commercial",
    city: "Taguig"
  },
  {
    id: "ayala-triangle",
    name: "Ayala Triangle Gardens",
    description: "Small but scenic triangular park in Makati with ~1.3km runnable loop, safe and busy even at night, ideal for short runs and post-work jogs",
    lat: 14.5564,
    lng: 121.0236,
    radius: 700, // ~1.3km loop
    category: "park",
    city: "Makati"
  },
  {
    id: "rizal-park",
    name: "Rizal Park / Luneta Park",
    description: "Historic urban park with ~2km loop and wide flat walkways, great for light runs, walking, and casual cycling; routes can extend toward Manila Baywalk for longer distances",
    lat: 14.5832,
    lng: 120.9794,
    radius: 1000, // ~2km loop
    category: "park",
    city: "Manila"
  },
  {
    id: "moa-complex",
    name: "MOA Complex / SM Mall of Asia By the Bay",
    description: "~2km seaside boulevard running and cycling route with Manila Bay views, flat and bike-friendly roads that can extend to CCP Complex for 5–10km workouts",
    lat: 14.5355,
    lng: 120.9820,
    radius: 2000, // ~2km route, can extend
    category: "commercial",
    city: "Pasay"
  },
  {
    id: "ccp-complex",
    name: "CCP Complex / Baywalk",
    description: "Part of the Manila Bay corridor with a dedicated Green Lane for runners and cyclists, popular for sunrise/sunset workouts and group sessions",
    lat: 14.5600,
    lng: 120.9800,
    radius: 1500, // Part of Manila Bay corridor
    category: "other",
    city: "Pasay"
  },
  {
    id: "quezon-memorial",
    name: "Quezon Memorial Circle",
    description: "~2km perimeter path with lanes for joggers and cyclists, open green spaces, fitness stations, and frequent Zumba/fitness events, central hub in Quezon City",
    lat: 14.6506,
    lng: 121.0497,
    radius: 1000, // ~2km perimeter
    category: "park",
    city: "Quezon City"
  },
  {
    id: "ninoy-aquino-parks",
    name: "Ninoy Aquino Parks and Wildlife Center",
    description: "Nature-focused park in QC with shaded paths and quiet areas, suited for easy runs, walks, and casual cycling away from traffic",
    lat: 14.6500,
    lng: 121.0500,
    radius: 1000, // Large nature park
    category: "park",
    city: "Quezon City"
  },
  {
    id: "marikina-river-park",
    name: "Marikina River Park",
    description: "Long riverside corridor with jogging and bike lanes, flat and peaceful, good for long easy runs, cycling, and group training",
    lat: 14.6500,
    lng: 121.1000,
    radius: 2000, // Long corridor
    category: "park",
    city: "Marikina"
  },
  {
    id: "filinvest-city",
    name: "Filinvest City / Spectrum Linear Park (Alabang)",
    description: "Tree-lined business district with wide roads and designated paths, used by both runners and cyclists for loops with cleaner air in the south",
    lat: 14.4200,
    lng: 121.0400,
    radius: 1500, // Business district
    category: "commercial",
    city: "Muntinlupa"
  },
  {
    id: "commonwealth-avenue",
    name: "Commonwealth Avenue Bike Lane Network",
    description: "Major QC corridor with extensive protected bike lanes, used by cycling groups for distance rides while runners use adjacent paths and side roads",
    lat: 14.7000,
    lng: 121.0800,
    radius: 3000, // Long corridor network
    category: "other",
    city: "Quezon City"
  },
  {
    id: "bgc-greenway-park",
    name: "BGC Greenway Park",
    description: "1.6km linear park with separate running and cycling lanes, the longest urban linear park in Metro Manila, car-free and ideal for tempo runs and steady bike laps",
    lat: 14.5550,
    lng: 121.0250,
    radius: 800, // 1.6km linear park
    category: "park",
    city: "Taguig"
  },
  {
    id: "track-30th",
    name: "Track 30th (BGC)",
    description: "~310m soft-surface jogging loop with exercise lawns and meditation areas, perfect for intervals, running drills, and small group workouts",
    lat: 14.5550,
    lng: 121.0250,
    radius: 200, // Small track
    category: "park",
    city: "Taguig"
  },
  {
    id: "terra-28th",
    name: "Terra 28th (BGC)",
    description: "Park with running paths, play areas, and outdoor bodyweight exercise stations, ideal for runners who mix jogging with calisthenics",
    lat: 14.5550,
    lng: 121.0250,
    radius: 300, // Small park
    category: "park",
    city: "Taguig"
  },
  {
    id: "legaspi-active-park",
    name: "Legaspi Active Park (Makati)",
    description: "Pocket park with a short jogging loop and open green area, popular for morning runs, yoga, and bodyweight workouts for nearby residents and workers",
    lat: 14.5550,
    lng: 121.0200,
    radius: 300, // Pocket park
    category: "park",
    city: "Makati"
  },
  {
    id: "salcedo-park",
    name: "Salcedo Park / Jaime C. Velasquez Park (Makati)",
    description: "7,000sqm neighborhood park with walking/jogging paths and some exercise-friendly space, good for easy laps and short routines",
    lat: 14.5550,
    lng: 121.0200,
    radius: 150, // 7,000sqm park
    category: "park",
    city: "Makati"
  },
  {
    id: "greenbelt-park",
    name: "Greenbelt Park",
    description: "Garden oasis inside Greenbelt mall complex, better for light walks, steps, and casual movement between shops, a relaxing cool-down or low-intensity activity spot",
    lat: 14.5544,
    lng: 121.0244,
    radius: 300, // Small garden oasis
    category: "park",
    city: "Makati"
  },
  {
    id: "arca-south",
    name: "Arca South (Taguig)",
    description: "Emerging mixed-use district with planned jogging paths, bike lanes, and open spaces, used by runners and cyclists looking for less crowded roads",
    lat: 14.5200,
    lng: 121.0500,
    radius: 1500, // Emerging district
    category: "commercial",
    city: "Taguig"
  },
  {
    id: "bridgetowne",
    name: "Bridgetowne (QC–Pasig)",
    description: "New destination estate with wide streets, riverfront areas, and an obstacle park, used for fun runs and casual running/cycling loops with city and bridge views",
    lat: 14.6000,
    lng: 121.0700,
    radius: 1000, // Destination estate
    category: "commercial",
    city: "Quezon City"
  },
  {
    id: "philsports-arena",
    name: "PhilSports Arena (ULTRA)",
    description: "Professional 400m track in Pasig open at designated hours, best for structured speedwork, intervals, and track-based group training",
    lat: 14.5700,
    lng: 121.0700,
    radius: 500, // Sports complex
    category: "sports",
    city: "Pasig"
  },
  {
    id: "rizal-memorial-sports",
    name: "Rizal Memorial Sports Complex",
    description: "Historic sports complex in Malate with an oval track and facilities, suited for runners who prefer a contained track environment for workouts",
    lat: 14.5800,
    lng: 120.9800,
    radius: 800, // Sports complex
    category: "sports",
    city: "Manila"
  },
  {
    id: "fort-santiago",
    name: "Fort Santiago / Intramuros",
    description: "Historic walled city area with walkable/runnable cobblestone streets and ramparts, good for short running loops with heritage vibe; Pasig River Esplanade nearby with dedicated bike paths and pedestrian walkways",
    lat: 14.5900,
    lng: 120.9700,
    radius: 1000, // Historic area
    category: "other",
    city: "Manila"
  },
  {
    id: "pasig-river-esplanade",
    name: "Pasig River Esplanade",
    description: "Newly developed ~500m walkable and bikeable corridor along Pasig River (expanding to 26km total), scenic route for runners and cyclists with bridges connecting to Binondo, Intramuros, and heritage areas",
    lat: 14.5800,
    lng: 121.0000,
    radius: 500, // Currently ~500m, expanding
    category: "other",
    city: "Manila"
  },
  {
    id: "eastwood-city",
    name: "Eastwood City (Libis, QC)",
    description: "Emerging commercial area in QC with dedicated jogging spots and cycling paths, good for casual runs and group fitness activities, nearby convenience stores and food options",
    lat: 14.6100,
    lng: 121.0800,
    radius: 1000, // Commercial area
    category: "commercial",
    city: "Quezon City"
  }
];

// Cache for venues from Firebase
let cachedVenues: Venue[] | null = null;
let venuesListener: (() => void) | null = null;

/**
 * Get all venues from Firebase, fallback to hardcoded list
 */
export const getAllVenues = async (): Promise<Venue[]> => {
  try {
    const venuesRef = ref(database, `venues`);
    const snapshot = await get(venuesRef);

    if (snapshot.exists()) {
      const venues = snapshot.val() as Record<string, Venue>;
      const venuesArray = Object.values(venues);
      cachedVenues = venuesArray;
      return venuesArray;
    }
  } catch (error) {
    console.error("❌ Error fetching venues from Firebase:", error);
  }

  // Fallback to hardcoded venues
  return PREDEFINED_VENUES;
};

/**
 * Get all venues synchronously (uses cache or hardcoded)
 * For components that need immediate access
 */
export const getAllVenuesSync = (): Venue[] => {
  return cachedVenues || PREDEFINED_VENUES;
};

/**
 * Listen to venues in real-time
 */
export const listenToVenues = (
  callback: (venues: Venue[]) => void
): (() => void) => {
  const venuesRef = ref(database, `venues`);

  const handleValue = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const venues = snapshot.val() as Record<string, Venue>;
      const venuesArray = Object.values(venues);
      cachedVenues = venuesArray;
      callback(venuesArray);
    } else {
      // Fallback to hardcoded venues
      cachedVenues = PREDEFINED_VENUES;
      callback(PREDEFINED_VENUES);
    }
  };

  const handleError = (error: Error) => {
    console.error("❌ Error listening to venues:", error);
    cachedVenues = PREDEFINED_VENUES;
    callback(PREDEFINED_VENUES);
  };

  onValue(venuesRef, handleValue, handleError);

  const unsubscribe = () => {
    off(venuesRef, "value", handleValue);
  };

  venuesListener = unsubscribe;
  return unsubscribe;
};

/**
 * Get a venue by ID (uses cache or hardcoded)
 */
export const getVenueById = (id: string): Venue | undefined => {
  const venues = cachedVenues || PREDEFINED_VENUES;
  return venues.find(venue => venue.id === id);
};

/**
 * Search venues by name (case-insensitive)
 */
export const searchVenues = (query: string): Venue[] => {
  const venues = cachedVenues || PREDEFINED_VENUES;
  
  if (!query.trim()) {
    return venues;
  }
  
  const lowerQuery = query.toLowerCase();
  return venues.filter(venue =>
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
  const venues = cachedVenues || PREDEFINED_VENUES;
  return venues
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
  const venues = cachedVenues || PREDEFINED_VENUES;
  for (const venue of venues) {
    const distance = calculateDistance(eventLat, eventLng, venue.lat, venue.lng);
    const distanceMeters = distance * 1000; // Convert to meters
    
    // Check if event is within venue radius
    if (distanceMeters <= venue.radius) {
      return venue;
    }
  }
  
  return null;
};

/**
 * Admin functions for managing venues
 */

/**
 * Add a new venue (admin only)
 */
export const addVenue = async (
  venue: Omit<Venue, "id">,
  createdBy: string
): Promise<string> => {
  try {
    const venuesRef = ref(database, `venues`);
    const newVenueRef = push(venuesRef);
    const venueId = newVenueRef.key!;

    const venueData: Venue = {
      ...venue,
      id: venueId,
    };

    await set(newVenueRef, venueData);
    console.log(`✅ Venue added: ${venue.name}`);
    return venueId;
  } catch (error) {
    console.error("❌ Error adding venue:", error);
    throw error;
  }
};

/**
 * Update an existing venue (admin only)
 */
export const updateVenue = async (
  venueId: string,
  updates: Partial<Venue>
): Promise<void> => {
  try {
    const venueRef = ref(database, `venues/${venueId}`);
    await set(venueRef, { ...updates, id: venueId }, { merge: true });
    console.log(`✅ Venue updated: ${venueId}`);
  } catch (error) {
    console.error("❌ Error updating venue:", error);
    throw error;
  }
};

/**
 * Delete a venue (admin only)
 */
export const deleteVenue = async (venueId: string): Promise<void> => {
  try {
    const venueRef = ref(database, `venues/${venueId}`);
    await remove(venueRef);
    console.log(`✅ Venue deleted: ${venueId}`);
  } catch (error) {
    console.error("❌ Error deleting venue:", error);
    throw error;
  }
};

