// Event service for Firebase - manages user-created and sponsored events
import { ref, set, get, onValue, off, push, remove, DataSnapshot } from "firebase/database";
import { database } from "./firebase";
import { checkInToVenue, checkOutFromVenue, getCheckInsAtVenue, CheckIn, UserCheckInData } from "./checkInService";
import { findVenueForEvent } from "./venueService";
import { isCommentingSuspended } from "./userService";

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
    
    // Filter out undefined values to avoid Firebase errors
    const cleanEventData: any = {};
    Object.entries(eventData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanEventData[key] = value;
      }
    });
    
    const event: Event = {
      ...cleanEventData,
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
    
    // Ensure participants is an array
    const participants = Array.isArray(event.participants) ? event.participants : (event.hostId ? [event.hostId] : []);
    
    // Check if user is already a participant
    if (participants.includes(userId)) {
      return;
    }
    
    // Check if event is full
    if (event.maxParticipants && participants.length >= event.maxParticipants) {
      throw new Error("Event is full");
    }
    
    // Add user to participants
    await set(ref(database, `events/${eventId}/participants`), [
      ...participants,
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
    
    // Ensure participants is an array
    const participants = Array.isArray(event.participants) ? event.participants : (event.hostId ? [event.hostId] : []);
    
    // Remove user from participants
    const updatedParticipants = participants.filter((id: string) => id !== userId);
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
      // Ensure all events have participants as an array
      const normalizedEvents = Object.values(events).map((event: any) => ({
        ...event,
        participants: Array.isArray(event.participants) ? event.participants : (event.hostId ? [event.hostId] : []),
      })) as Event[];
      callback(normalizedEvents);
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
 * Update an event (only if user is the host)
 */
export const updateEvent = async (
  eventId: string,
  userId: string,
  eventData: Partial<Omit<Event, "id" | "hostId" | "participants" | "createdAt">>
): Promise<void> => {
  try {
    const eventRef = ref(database, `events/${eventId}`);
    const snapshot = await get(eventRef);
    
    if (!snapshot.exists()) {
      throw new Error("Event not found");
    }
    
    const event = snapshot.val() as Event;
    
    if (event.hostId !== userId) {
      throw new Error("Only the host can update the event");
    }
    
    // Filter out undefined values to avoid Firebase errors
    const cleanEventData: any = {};
    Object.entries(eventData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanEventData[key] = value;
      }
    });
    
    // Update only the provided fields
    const updates: any = {};
    Object.keys(cleanEventData).forEach((key) => {
      updates[`events/${eventId}/${key}`] = cleanEventData[key];
    });
    
    await set(ref(database, `events/${eventId}`), {
      ...event,
      ...cleanEventData,
    });
    
    console.log(`✅ Event updated: ${eventId}`);
  } catch (error) {
    console.error("❌ Error updating event:", error);
    throw error;
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
// Comment interface
export interface EventComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: number;
}

/**
 * Add a comment to an event
 * Checks if user's commenting privileges are suspended before allowing
 */
export const addComment = async (
  eventId: string,
  userId: string,
  userName: string,
  userAvatar: string,
  text: string
): Promise<string> => {
  try {
    // Check if user's commenting is suspended
    const suspension = await isCommentingSuspended(userId);
    if (suspension) {
      const suspendedUntilText = suspension.suspendedUntil 
        ? ` until ${new Date(suspension.suspendedUntil).toLocaleDateString()}`
        : "";
      throw new Error(`Your commenting privileges are suspended${suspendedUntilText}. Reason: ${suspension.reason}`);
    }
    
    const commentsRef = ref(database, `events/${eventId}/comments`);
    const newCommentRef = push(commentsRef);
    const commentId = newCommentRef.key!;
    
    const comment: EventComment = {
      id: commentId,
      userId,
      userName,
      userAvatar: userAvatar || "",
      text,
      timestamp: Date.now()
    };
    
    await set(newCommentRef, comment);
    console.log(`✅ Comment added to event ${eventId}`);
    return commentId;
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    throw error;
  }
};

/**
 * Listen to comments on an event in real-time
 */
export const listenToComments = (
  eventId: string,
  callback: (comments: EventComment[]) => void
): (() => void) => {
  const commentsRef = ref(database, `events/${eventId}/comments`);
  
  const unsubscribe = onValue(
    commentsRef,
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const comments = snapshot.val();
      const commentsArray = Object.values(comments) as EventComment[];
      // Sort by timestamp (oldest first)
      commentsArray.sort((a, b) => a.timestamp - b.timestamp);
      callback(commentsArray);
    },
    (error) => {
      console.error("❌ Error listening to comments:", error);
      callback([]);
    }
  );
  
  return () => {
    off(commentsRef);
  };
};

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

// ============ ADDITIONAL COMMENT FUNCTIONS ============

/**
 * Delete a comment (only the comment author, event host, or admin can delete)
 * @param isAdmin - If true, skips ownership check (for admin moderation)
 */
export const deleteComment = async (
  eventId: string,
  commentId: string,
  userId: string,
  isAdmin: boolean = false
): Promise<void> => {
  try {
    // Get the comment to check ownership
    const commentRef = ref(database, `events/${eventId}/comments/${commentId}`);
    const commentSnapshot = await get(commentRef);
    
    if (!commentSnapshot.exists()) {
      throw new Error("Comment not found");
    }
    
    const comment = commentSnapshot.val() as EventComment;
    
    // Skip permission check if admin
    if (!isAdmin) {
      // Get the event to check if user is host
      const eventRef = ref(database, `events/${eventId}`);
      const eventSnapshot = await get(eventRef);
      
      if (!eventSnapshot.exists()) {
        throw new Error("Event not found");
      }
      
      const event = eventSnapshot.val() as Event;
      
      // Only allow deletion by comment author or event host
      if (comment.userId !== userId && event.hostId !== userId) {
        throw new Error("You don't have permission to delete this comment");
      }
    }
    
    await remove(commentRef);
    console.log(`✅ Comment ${commentId} deleted from event ${eventId}${isAdmin ? ' (by admin)' : ''}`);
  } catch (error) {
    console.error("❌ Error deleting comment:", error);
    throw error;
  }
};

/**
 * Get all comments for an event (used by admin)
 */
export const getAllEventComments = async (eventId: string): Promise<EventComment[]> => {
  try {
    const commentsRef = ref(database, `events/${eventId}/comments`);
    const snapshot = await get(commentsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const comments = snapshot.val();
    const commentsArray = Object.values(comments) as EventComment[];
    return commentsArray.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("❌ Error getting event comments:", error);
    return [];
  }
};

