// Friend service for Firebase - manages friend requests and friendships
import { ref, set, get, onValue, off, push, remove, DataSnapshot } from "firebase/database";
import { database } from "./firebase";

/**
 * Send a friend request
 */
export const sendFriendRequest = async (
  fromUserId: string,
  toUserId: string
): Promise<void> => {
  try {
    const requestRef = ref(database, `friendRequests/${toUserId}/${fromUserId}`);
    await set(requestRef, {
      fromUserId,
      toUserId,
      status: "pending",
      createdAt: Date.now()
    });
    console.log(`✅ Friend request sent from ${fromUserId} to ${toUserId}`);
  } catch (error) {
    console.error("❌ Error sending friend request:", error);
    throw error;
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (
  userId: string,
  fromUserId: string
): Promise<void> => {
  try {
    // Remove the request
    const requestRef = ref(database, `friendRequests/${userId}/${fromUserId}`);
    await remove(requestRef);
    
    // Add to both users' friends lists
    const userFriendsRef = ref(database, `friends/${userId}/${fromUserId}`);
    const fromUserFriendsRef = ref(database, `friends/${fromUserId}/${userId}`);
    
    await set(userFriendsRef, {
      friendId: fromUserId,
      createdAt: Date.now()
    });
    
    await set(fromUserFriendsRef, {
      friendId: userId,
      createdAt: Date.now()
    });
    
    console.log(`✅ Friend request accepted: ${userId} and ${fromUserId} are now friends`);
  } catch (error) {
    console.error("❌ Error accepting friend request:", error);
    throw error;
  }
};

/**
 * Decline a friend request
 */
export const declineFriendRequest = async (
  userId: string,
  fromUserId: string
): Promise<void> => {
  try {
    const requestRef = ref(database, `friendRequests/${userId}/${fromUserId}`);
    await remove(requestRef);
    console.log(`✅ Friend request declined: ${fromUserId} -> ${userId}`);
  } catch (error) {
    console.error("❌ Error declining friend request:", error);
    throw error;
  }
};

/**
 * Cancel a sent friend request
 */
export const cancelFriendRequest = async (
  fromUserId: string,
  toUserId: string
): Promise<void> => {
  try {
    const requestRef = ref(database, `friendRequests/${toUserId}/${fromUserId}`);
    await remove(requestRef);
    console.log(`✅ Friend request cancelled: ${fromUserId} -> ${toUserId}`);
  } catch (error) {
    console.error("❌ Error cancelling friend request:", error);
    throw error;
  }
};

/**
 * Get pending friend requests for a user
 */
export const getPendingRequests = async (userId: string): Promise<{
  incoming: string[];
  outgoing: string[];
}> => {
  try {
    // Get incoming requests
    const incomingRef = ref(database, `friendRequests/${userId}`);
    const incomingSnapshot = await get(incomingRef);
    const incoming = incomingSnapshot.exists() ? Object.keys(incomingSnapshot.val()) : [];
    
    // Get outgoing requests (check all users' friendRequests for this userId)
    // This is less efficient but necessary for outgoing requests
    const outgoing: string[] = [];
    const allRequestsRef = ref(database, "friendRequests");
    const allRequestsSnapshot = await get(allRequestsRef);
    
    if (allRequestsSnapshot.exists()) {
      const allRequests = allRequestsSnapshot.val();
      Object.keys(allRequests).forEach((toUserId) => {
        if (toUserId !== userId && allRequests[toUserId][userId]) {
          outgoing.push(toUserId);
        }
      });
    }
    
    return { incoming, outgoing };
  } catch (error) {
    console.error("❌ Error getting pending requests:", error);
    return { incoming: [], outgoing: [] };
  }
};

/**
 * Listen to pending friend requests in real-time
 */
export const listenToFriendRequests = (
  userId: string,
  callback: (requests: { incoming: string[]; outgoing: string[] }) => void
): (() => void) => {
  const requestsRef = ref(database, `friendRequests/${userId}`);
  
  const unsubscribe = onValue(
    requestsRef,
    async (snapshot: DataSnapshot) => {
      const incoming = snapshot.exists() ? Object.keys(snapshot.val()) : [];
      
      // Get outgoing requests
      const allRequestsRef = ref(database, "friendRequests");
      const allRequestsSnapshot = await get(allRequestsRef);
      const outgoing: string[] = [];
      
      if (allRequestsSnapshot.exists()) {
        const allRequests = allRequestsSnapshot.val();
        Object.keys(allRequests).forEach((toUserId) => {
          if (toUserId !== userId && allRequests[toUserId][userId]) {
            outgoing.push(toUserId);
          }
        });
      }
      
      callback({ incoming, outgoing });
    },
    (error) => {
      console.error("❌ Error listening to friend requests:", error);
      callback({ incoming: [], outgoing: [] });
    }
  );
  
  return () => {
    off(requestsRef);
  };
};

/**
 * Get user's friends list
 */
export const getUserFriends = async (userId: string): Promise<string[]> => {
  try {
    const friendsRef = ref(database, `friends/${userId}`);
    const snapshot = await get(friendsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    return Object.keys(snapshot.val());
  } catch (error) {
    console.error("❌ Error getting user friends:", error);
    return [];
  }
};

/**
 * Listen to user's friends list in real-time
 */
export const listenToUserFriends = (
  userId: string,
  callback: (friends: string[]) => void
): (() => void) => {
  const friendsRef = ref(database, `friends/${userId}`);
  
  const unsubscribe = onValue(
    friendsRef,
    (snapshot: DataSnapshot) => {
      const friends = snapshot.exists() ? Object.keys(snapshot.val()) : [];
      callback(friends);
    },
    (error) => {
      console.error("❌ Error listening to friends:", error);
      callback([]);
    }
  );
  
  return () => {
    off(friendsRef);
  };
};

/**
 * Remove a friend (unfriend)
 */
export const removeFriend = async (
  userId: string,
  friendId: string
): Promise<void> => {
  try {
    const userFriendsRef = ref(database, `friends/${userId}/${friendId}`);
    const friendFriendsRef = ref(database, `friends/${friendId}/${userId}`);
    
    await remove(userFriendsRef);
    await remove(friendFriendsRef);
    
    console.log(`✅ Friend removed: ${userId} and ${friendId} are no longer friends`);
  } catch (error) {
    console.error("❌ Error removing friend:", error);
    throw error;
  }
};

