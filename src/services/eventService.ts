// Event service for Firebase - manages user-created and sponsored events
import { ref, set, get, onValue, off, push, remove, DataSnapshot } from "firebase/database";
import { database } from "./firebase";

export interface Event {
  id: string;
  title: string;
  description: string;
  type: "running" | "cycling" | "walking";
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

