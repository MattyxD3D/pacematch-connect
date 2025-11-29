// Venue request service - manages user venue requests
import { ref, set, push, get, onValue, off, update, DataSnapshot } from "firebase/database";
import { database } from "./firebase";

export type VenueRequestStatus = "pending" | "approved" | "rejected";

export interface VenueRequest {
  id: string;
  userId: string;
  venueName: string;
  location: string;
  status: VenueRequestStatus;
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}

/**
 * Submit a venue request from a user
 */
export const submitVenueRequest = async (
  userId: string,
  venueName: string,
  location: string
): Promise<string> => {
  try {
    const requestsRef = ref(database, `venueRequests`);
    const newRequestRef = push(requestsRef);
    const requestId = newRequestRef.key!;

    const requestData: VenueRequest = {
      id: requestId,
      userId,
      venueName: venueName.trim(),
      location: location.trim(),
      status: "pending",
      createdAt: Date.now(),
    };

    await set(newRequestRef, requestData);
    console.log(`✅ Venue request submitted by user ${userId}: ${venueName}`);
    return requestId;
  } catch (error) {
    console.error("❌ Error submitting venue request:", error);
    throw error;
  }
};

/**
 * Get all venue requests (admin only)
 */
export const getAllVenueRequests = async (): Promise<VenueRequest[]> => {
  try {
    const requestsRef = ref(database, `venueRequests`);
    const snapshot = await get(requestsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const requests = snapshot.val() as Record<string, VenueRequest>;
    return Object.values(requests).sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("❌ Error getting venue requests:", error);
    throw error;
  }
};

/**
 * Listen to venue requests in real-time (admin only)
 */
export const listenToVenueRequests = (
  callback: (requests: VenueRequest[]) => void
): (() => void) => {
  const requestsRef = ref(database, `venueRequests`);

  const handleValue = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      const requests = snapshot.val() as Record<string, VenueRequest>;
      const requestsArray = Object.values(requests).sort((a, b) => b.createdAt - a.createdAt);
      callback(requestsArray);
    } else {
      callback([]);
    }
  };

  const handleError = (error: Error) => {
    console.error("❌ Error listening to venue requests:", error);
    callback([]);
  };

  onValue(requestsRef, handleValue, handleError);

  return () => {
    off(requestsRef, "value", handleValue);
  };
};

/**
 * Update venue request status (admin only)
 */
export const updateVenueRequestStatus = async (
  requestId: string,
  status: VenueRequestStatus,
  reviewedBy: string
): Promise<void> => {
  try {
    const requestRef = ref(database, `venueRequests/${requestId}`);
    await update(requestRef, {
      status,
      reviewedAt: Date.now(),
      reviewedBy,
    });
    console.log(`✅ Venue request ${requestId} updated to ${status}`);
  } catch (error) {
    console.error("❌ Error updating venue request:", error);
    throw error;
  }
};

