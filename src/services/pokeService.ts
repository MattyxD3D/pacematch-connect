// Poke service for Firebase - manages pokes between users
import { ref, set, get, onValue, off, remove, DataSnapshot } from "firebase/database";
import { database } from "./firebase";

/**
 * Check if user has an active workout session
 * This checks if user has recent location updates (within last 5 minutes)
 * which indicates they're actively tracking a workout
 */
const isUserActive = async (userId: string): Promise<boolean> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      return false;
    }
    
    const userData = snapshot.val();
    const timestamp = userData.timestamp;
    
    if (!timestamp) {
      return false;
    }
    
    // Consider user active if location was updated within last 5 minutes
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    return timestamp > fiveMinutesAgo;
  } catch (error) {
    console.error("❌ Error checking user activity:", error);
    // If we can't check, allow the poke (fail open, frontend validation is primary)
    return true;
  }
};

/**
 * Send a poke to another user
 * A poke is a lightweight way to show interest in matching with someone
 * Note: Frontend validation should check workout state, this is defense in depth
 */
export const sendPoke = async (
  fromUserId: string,
  toUserId: string
): Promise<void> => {
  try {
    // Optional backend validation: Check if sender has active workout
    // Frontend validation is primary, this is defense in depth
    const isActive = await isUserActive(fromUserId);
    if (!isActive) {
      throw new Error("You must have an active workout session to poke someone");
    }
    
    const pokeRef = ref(database, `pokes/${toUserId}/${fromUserId}`);
    await set(pokeRef, {
      fromUserId,
      toUserId,
      status: "pending",
      createdAt: Date.now()
    });
    console.log(`✅ Poke sent from ${fromUserId} to ${toUserId}`);
  } catch (error) {
    console.error("❌ Error sending poke:", error);
    throw error;
  }
};

/**
 * Accept a poke (user acknowledges the poke)
 * This could lead to opening a chat or showing interest back
 */
export const acceptPoke = async (
  userId: string,
  fromUserId: string
): Promise<void> => {
  try {
    // Remove the poke
    const pokeRef = ref(database, `pokes/${userId}/${fromUserId}`);
    await remove(pokeRef);
    
    // Optionally, you could create a "mutual interest" record here
    // For now, we just remove the poke and let users interact normally
    
    console.log(`✅ Poke accepted: ${userId} acknowledged poke from ${fromUserId}`);
  } catch (error) {
    console.error("❌ Error accepting poke:", error);
    throw error;
  }
};

/**
 * Dismiss/ignore a poke
 */
export const dismissPoke = async (
  userId: string,
  fromUserId: string
): Promise<void> => {
  try {
    const pokeRef = ref(database, `pokes/${userId}/${fromUserId}`);
    await remove(pokeRef);
    console.log(`✅ Poke dismissed: ${fromUserId} -> ${userId}`);
  } catch (error) {
    console.error("❌ Error dismissing poke:", error);
    throw error;
  }
};

/**
 * Get pending pokes for a user
 */
export const getPendingPokes = async (userId: string): Promise<string[]> => {
  try {
    const pokesRef = ref(database, `pokes/${userId}`);
    const snapshot = await get(pokesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    return Object.keys(snapshot.val());
  } catch (error) {
    console.error("❌ Error getting pending pokes:", error);
    return [];
  }
};

/**
 * Listen to pending pokes in real-time
 */
export const listenToPokes = (
  userId: string,
  callback: (pokeUserIds: string[]) => void
): (() => void) => {
  const pokesRef = ref(database, `pokes/${userId}`);
  
  const unsubscribe = onValue(
    pokesRef,
    (snapshot: DataSnapshot) => {
      const pokeUserIds = snapshot.exists() ? Object.keys(snapshot.val()) : [];
      callback(pokeUserIds);
    },
    (error) => {
      console.error("❌ Error listening to pokes:", error);
      callback([]);
    }
  );
  
  return () => {
    off(pokesRef);
  };
};

/**
 * Check if user has poked another user (for outgoing pokes)
 * This checks if the current user has sent a poke to someone
 */
export const hasPokedUser = async (
  fromUserId: string,
  toUserId: string
): Promise<boolean> => {
  try {
    const pokeRef = ref(database, `pokes/${toUserId}/${fromUserId}`);
    const snapshot = await get(pokeRef);
    return snapshot.exists();
  } catch (error) {
    console.error("❌ Error checking poke status:", error);
    return false;
  }
};

