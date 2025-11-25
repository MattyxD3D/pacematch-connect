// Event service for Firebase - manages user-created and sponsored events
import { ref, set, get, onValue, off, push, remove, DataSnapshot } from "firebase/database";
import { database } from "./firebase";
import { checkInToVenue, checkOutFromVenue, getCheckInsAtVenue, CheckIn, UserCheckInData } from "./checkInService";
import { findVenueForEvent } from "./venueService";

export interface Event {
  id: string;
  title: string;
  description: string;
  type: "running" | "cycling" | "walking" | "others";
  category: "user" | "sponsored";
  date: string; // ISO date string
  time: string;
  location: string;
  distance: string;
  distanceValue: number;
  lat: number;
  lng: number;
  hostId?: string; // For user-created events
  hostName?: string;
  hostAvatar?: string;
  sponsorLogo?: string; // For sponsored events
  participants: string[]; // Array of user IDs
  maxParticipants?: number;
  createdAt: number;
}

/**
 * Create a new event
 */
export const createEvent = async (
  hostId: string,
  eventData: Omit<Event, "id" | "hostId" | "participants" | "createdAt">
): Promise<string> => {
  try {
    const eventsRef = ref(database, "events");
    const newEventRef = push(eventsRef);
    const eventId = newEventRef.key!;
    
    const event: Event = {
      ...eventData,
      id: eventId,
      hostId,
      participants: [hostId], // Host is automatically a participant
      createdAt: Date.now()
    };
    
    await set(newEventRef, event);
    console.log(`✅ Event created: ${eventId}`);
    return eventId;
  } catch (error) {
    console.error("❌ Error creating event:", error);
    throw error;
  }
};

/**
 * Join an event
 */
export const joinEvent = async (
  eventId: string,
  userId: string
): Promise<void> => {
  try {
    const eventRef = ref(database, `events/${eventId}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      throw new Error("Event not found");
    }
    
    const event = snapshot.val() as Event;
    
    // Check if user is already a participant
    if (event.participants.includes(userId)) {
      return;
    }
    
    // Check if event is full
    if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
      throw new Error("Event is full");
    }
    
    // Add user to participants
    await set(ref(database, `events/${eventId}/participants`), [
      ...event.participants,
      userId
    ]);
    
    console.log(`✅ User ${userId} joined event ${eventId}`);
  } catch (error) {
    console.error("❌ Error joining event:", error);
    throw error;
  }
};

/**
 * Leave an event
 */
export const leaveEvent = async (
  eventId: string,
  userId: string
): Promise<void> => {
  try {
    const eventRef = ref(database, `events/${eventId}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      throw new Error("Event not found");
    }
    
    const event = snapshot.val() as Event;
    
    // Remove user from participants
    const updatedParticipants = event.participants.filter((id: string) => id !== userId);
    await set(ref(database, `events/${eventId}/participants`), updatedParticipants);
    
    console.log(`✅ User ${userId} left event ${eventId}`);
  } catch (error) {
    console.error("❌ Error leaving event:", error);
    throw error;
  }
};

/**
 * Get all events
 */
export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const eventsRef = ref(database, "events");
    const snapshot = await get(eventsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const events = snapshot.val();
    return Object.values(events) as Event[];
  } catch (error) {
    console.error("❌ Error getting events:", error);
    return [];
  }
};

/**
 * Listen to all events in real-time
 */
export const listenToEvents = (
  callback: (events: Event[]) => void
): (() => void) => {
  const eventsRef = ref(database, "events");
  
  const unsubscribe = onValue(
    eventsRef,
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const events = snapshot.val();
      callback(Object.values(events) as Event[]);
    },
    (error) => {
      console.error("❌ Error listening to events:", error);
      callback([]);
    }
  );
  
  return () => {
    off(eventsRef);
  };
};

/**
 * Get events for a specific user (events they created or joined)
 */
export const getUserEvents = async (userId: string): Promise<Event[]> => {
  try {
    const eventsRef = ref(database, "events");
    const snapshot = await get(eventsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const events = snapshot.val();
    const userEvents = Object.values(events).filter((event: any) => 
      event.hostId === userId || event.participants?.includes(userId)
    ) as Event[];
    
    return userEvents;
  } catch (error) {
    console.error("❌ Error getting user events:", error);
    return [];
  }
};

/**
 * Delete an event (only if user is the host)
 */
export const deleteEvent = async (
  eventId: string,
  userId: string
): Promise<void> => {
  try {
    const eventRef = ref(database, `events/${eventId}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      throw new Error("Event not found");
    }
    
    const event = snapshot.val() as Event;
    
    if (event.hostId !== userId) {
      throw new Error("Only the host can delete the event");
    }
    
    await remove(eventRef);
    console.log(`✅ Event deleted: ${eventId}`);
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    throw error;
  }
};

/**
 * Check in to an event's location
 * This will check in to the venue if the event location matches a predefined venue,
 * otherwise it will create a check-in record for the event location itself
 */
export const checkInToEventLocation = async (
  eventId: string,
  userId: string,
  userData: UserCheckInData
): Promise<void> => {
  try {
    const eventRef = ref(database, `events/${eventId}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      throw new Error("Event not found");
    }
    
    const event = snapshot.val() as Event;
    
    // Try to find a matching venue
    const venue = findVenueForEvent(event.lat, event.lng);
    
    if (venue) {
      // Check in to the venue
      await checkInToVenue(userId, venue.id, { id: venue.id, name: venue.name }, userData);
    } else {
      // Create event-specific check-in
      const eventCheckInRef = ref(database, `eventCheckIns/${eventId}/${userId}`);
      const checkIn: CheckIn = {
        userId,
        venueId: `event-${eventId}`,
        venueName: event.location,
        activity: userData.activity,
        userName: userData.userName,
        userAvatar: userData.userAvatar || "",
        timestamp: Date.now()
      };
      
      await set(eventCheckInRef, checkIn);
      console.log(`✅ User ${userId} checked in to event location ${eventId}`);
    }
  } catch (error) {
    console.error("❌ Error checking in to event location:", error);
    throw error;
  }
};

/**
 * Get all check-ins at an event's location
 */
export const getCheckInsAtEventLocation = async (eventId: string): Promise<CheckIn[]> => {
  try {
    const eventRef = ref(database, `events/${eventId}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const event = snapshot.val() as Event;
    
    // Try to find a matching venue
    const venue = findVenueForEvent(event.lat, event.lng);
    
    if (venue) {
      // Get check-ins from the venue
      return await getCheckInsAtVenue(venue.id);
    } else {
      // Get event-specific check-ins
      const eventCheckInsRef = ref(database, `eventCheckIns/${eventId}`);
      const checkInsSnapshot = await get(eventCheckInsRef);
      
      if (!checkInsSnapshot.exists()) {
        return [];
      }
      
      const checkIns = checkInsSnapshot.val();
      return Object.values(checkIns) as CheckIn[];
    }
  } catch (error) {
    console.error("❌ Error getting check-ins at event location:", error);
    return [];
  }
};

/**
 * Listen to check-ins at an event's location in real-time
 */
export const listenToEventCheckIns = (
  eventId: string,
  callback: (checkIns: CheckIn[]) => void
): (() => void) => {
  let venueUnsubscribe: (() => void) | null = null;
  let eventCheckInsUnsubscribe: (() => void) | null = null;
  
  const eventRef = ref(database, `events/${eventId}`);
  
  const eventUnsubscribe = onValue(
    eventRef,
    async (snapshot: DataSnapshot) => {
      // Clean up previous listeners
      if (venueUnsubscribe) {
        venueUnsubscribe();
        venueUnsubscribe = null;
      }
      if (eventCheckInsUnsubscribe) {
        eventCheckInsUnsubscribe();
        eventCheckInsUnsubscribe = null;
      }
      
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const event = snapshot.val() as Event;
      
      // Try to find a matching venue
      const venue = findVenueForEvent(event.lat, event.lng);
      
      if (venue) {
        // Listen to venue check-ins
        venueUnsubscribe = onValue(
          ref(database, `checkIns/${venue.id}`),
          (checkInsSnapshot: DataSnapshot) => {
            if (!checkInsSnapshot.exists()) {
              callback([]);
              return;
            }
            const checkIns = checkInsSnapshot.val();
            callback(Object.values(checkIns) as CheckIn[]);
          },
          (error) => {
            console.error("❌ Error listening to venue check-ins:", error);
            callback([]);
          }
        );
      } else {
        // Listen to event-specific check-ins
        const eventCheckInsRef = ref(database, `eventCheckIns/${eventId}`);
        eventCheckInsUnsubscribe = onValue(
          eventCheckInsRef,
          (checkInsSnapshot: DataSnapshot) => {
            if (!checkInsSnapshot.exists()) {
              callback([]);
              return;
            }
            const checkIns = checkInsSnapshot.val();
            callback(Object.values(checkIns) as CheckIn[]);
          },
          (error) => {
            console.error("❌ Error listening to event check-ins:", error);
            callback([]);
          }
        );
      }
    },
    (error) => {
      console.error("❌ Error listening to event:", error);
      callback([]);
    }
  );
  
  return () => {
    if (venueUnsubscribe) venueUnsubscribe();
    if (eventCheckInsUnsubscribe) eventCheckInsUnsubscribe();
    off(eventRef);
  };
};

