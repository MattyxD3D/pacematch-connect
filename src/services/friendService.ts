// Friend service for Firebase - manages friend requests and friendships
import { ref, set, get, onValue, off, remove, DataSnapshot } from "firebase/database";
import { database } from "./firebase";
import { createNotification } from "./notificationService";
import { getUserData } from "./authService";

/**
 * Send a friend request
 */
export const sendFriendRequest = async (
  fromUserId: string,
  toUserId: string
): Promise<void> => {
  try {
    const requestRef = ref(database, `friendRequests/${toUserId}/${fromUserId}`);
    const outgoingRef = ref(database, `friendRequestsOutgoing/${fromUserId}/${toUserId}`);
    await set(requestRef, {
      fromUserId,
      toUserId,
      status: "pending",
      createdAt: Date.now()
    });
    await set(outgoingRef, {
      fromUserId,
      toUserId,
      status: "pending",
      createdAt: Date.now()
    });
    console.log(`✅ Friend request sent from ${fromUserId} to ${toUserId}`);
    
    // Create notification for recipient
    try {
      const fromUserData = await getUserData(fromUserId);
      if (fromUserData) {
        await createNotification(toUserId, {
          type: "friend_request",
          fromUserId,
          fromUserName: fromUserData.name || fromUserData.username || "Someone",
          fromUserAvatar: fromUserData.photoURL || "",
        });
      }
    } catch (notificationError) {
      // Don't fail the friend request if notification fails
      console.error("❌ Error creating friend request notification:", notificationError);
    }
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
    
    // Remove outgoing record for sender
    const outgoingRef = ref(database, `friendRequestsOutgoing/${fromUserId}/${userId}`);
    await remove(outgoingRef);
    
    console.log(`✅ Friend request accepted: ${userId} and ${fromUserId} are now friends`);
    
    // Create notification for requester (the person who sent the request)
    try {
      const accepterData = await getUserData(userId);
      if (accepterData) {
        await createNotification(fromUserId, {
          type: "friend_accepted",
          fromUserId: userId,
          fromUserName: accepterData.name || accepterData.username || "Someone",
          fromUserAvatar: accepterData.photoURL || "",
        });
      }
    } catch (notificationError) {
      // Don't fail the accept if notification fails
      console.error("❌ Error creating friend accepted notification:", notificationError);
    }
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
    
    // Remove outgoing record for sender
    const outgoingRef = ref(database, `friendRequestsOutgoing/${fromUserId}/${userId}`);
    await remove(outgoingRef);
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
    const outgoingRef = ref(database, `friendRequestsOutgoing/${fromUserId}/${toUserId}`);
    await remove(outgoingRef);
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
    
    // Get outgoing requests from dedicated node
    const outgoingRef = ref(database, `friendRequestsOutgoing/${userId}`);
    const outgoingSnapshot = await get(outgoingRef);
    const outgoing = outgoingSnapshot.exists() ? Object.keys(outgoingSnapshot.val()) : [];
    
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
  const incomingRef = ref(database, `friendRequests/${userId}`);
  const outgoingRef = ref(database, `friendRequestsOutgoing/${userId}`);
  let currentIncoming: string[] = [];
  let currentOutgoing: string[] = [];

  const emit = () => callback({ incoming: currentIncoming, outgoing: currentOutgoing });
  const handleError = (error: Error) => {
    console.error("❌ Error listening to friend requests:", error);
    currentIncoming = [];
    currentOutgoing = [];
    callback({ incoming: [], outgoing: [] });
  };

  const unsubscribeIncoming = onValue(
    incomingRef,
    (snapshot: DataSnapshot) => {
      currentIncoming = snapshot.exists() ? Object.keys(snapshot.val()) : [];
      emit();
    },
    handleError
  );

  const unsubscribeOutgoing = onValue(
    outgoingRef,
    (snapshot: DataSnapshot) => {
      currentOutgoing = snapshot.exists() ? Object.keys(snapshot.val()) : [];
      emit();
    },
    handleError
  );
  
  return () => {
    unsubscribeIncoming();
    unsubscribeOutgoing();
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

