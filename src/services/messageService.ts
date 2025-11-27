// Message service for Firebase - real-time messaging
import { ref, set, push, onValue, off, get, query, orderByChild, remove, DataSnapshot } from "firebase/database";
import { database } from "./firebase";
import { createNotification } from "./notificationService";
import { getUserFriends } from "./friendService";
import { getUserData } from "./authService";
import { isUserBlocked } from "./userService";

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  isRead?: boolean;
  type?: 'text' | 'location';
  location?: { lat: number; lng: number };
  locationSharingId?: string;
  expiresAt?: number;
}

/**
 * Send a message
 */
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string
): Promise<string> => {
  try {
    // Check if sender is blocked by receiver
    const isBlocked = await isUserBlocked(receiverId, senderId);
    if (isBlocked) {
      throw new Error("You cannot send messages to this user. You have been blocked.");
    }

    // Create message in both users' conversation threads
    const conversationId = [senderId, receiverId].sort().join("_");
    const messagesRef = ref(database, `messages/${conversationId}`);
    const newMessageRef = push(messagesRef);
    const messageId = newMessageRef.key!;
    const timestamp = Date.now();

    const messageData: Message = {
      id: messageId,
      senderId,
      receiverId,
      content,
      timestamp,
      isRead: false
    };
    
    // IMPORTANT: Create conversation metadata FIRST so that security rules can verify participants
    // The rules check if conversations/{id}/participants/{userId} exists before allowing writes
    const conversationMetaRef = ref(database, `conversations/${conversationId}`);
    const participantMap: Record<string, boolean> = {
      [senderId]: true,
      [receiverId]: true
    };
    await set(conversationMetaRef, {
      participants: participantMap,
      participantList: Object.keys(participantMap),
      lastMessage: content,
      lastMessageTime: timestamp,
      lastMessageSender: senderId,
      updatedAt: timestamp
    });
    
    // Now write the message (conversation exists, so rules will pass)
    await set(newMessageRef, messageData);
    
    // Maintain lightweight per-user summaries for fast lookups
    await updateUserConversationSummaries(conversationId, senderId, receiverId, messageData);
    
    // Check if this is the first message to a non-friend (message request)
    // Also check if chat is muted before creating notification
    try {
      const senderFriends = await getUserFriends(senderId);
      const isFriends = senderFriends.includes(receiverId);
      
      // Check if conversation existed before (if this is first message)
      const conversationSnapshot = await get(ref(database, `messages/${conversationId}`));
      const isFirstMessage = !conversationSnapshot.exists() || 
        Object.keys(conversationSnapshot.val() || {}).length === 1; // Only the message we just added
      
      // Check if receiver has muted this chat (client-side check would be better, but this works)
      // For now, we'll create the notification and let the client-side handle muting
      
      if (!isFriends && isFirstMessage) {
        // Create message request notification
        const senderData = await getUserData(senderId);
        if (senderData) {
          await createNotification(receiverId, {
            type: "message_request",
            fromUserId: senderId,
            fromUserName: senderData.name || senderData.username || "Someone",
            fromUserAvatar: senderData.photoURL || "",
            message: content.length > 50 ? content.substring(0, 50) + "..." : content,
          });
        }
      }
    } catch (notificationError) {
      // Don't fail message send if notification fails
      console.error("❌ Error creating message request notification:", notificationError);
    }
    
    console.log(`✅ Message sent: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error("❌ Error sending message:", error);
    throw error;
  }
};

/**
 * Listen to messages in a conversation
 */
export const listenToMessages = (
  userId1: string,
  userId2: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const conversationId = [userId1, userId2].sort().join("_");
  const messagesRef = ref(database, `messages/${conversationId}`);
  
  const unsubscribe = onValue(
    query(messagesRef, orderByChild("timestamp")),
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const messages = snapshot.val();
      const messageList = Object.values(messages) as Message[];
      callback(messageList.sort((a, b) => a.timestamp - b.timestamp));
    },
    (error) => {
      console.error("❌ Error listening to messages:", error);
      callback([]);
    }
  );
  
  return () => {
    off(messagesRef);
  };
};

/**
 * Get all conversations for a user
 */
export const getUserConversations = async (userId: string): Promise<Array<{
  conversationId: string;
  otherUserId: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}>> => {
  try {
    const userConversationsRef = ref(database, `userConversations/${userId}`);
    const snapshot = await get(userConversationsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const conversations = snapshot.val();
    const userConversations: Array<{
      conversationId: string;
      otherUserId: string;
      lastMessage: string;
      lastMessageTime: number;
      unreadCount: number;
    }> = [];
    
    Object.entries(conversations).forEach(([conversationId, data]: [string, any]) => {
      const otherUserId = data.otherUserId || "";
      userConversations.push({
        conversationId,
        otherUserId,
        lastMessage: data.lastMessage || "",
        lastMessageTime: data.lastMessageTime || 0,
        unreadCount: data.unreadCount || 0
      });
    });
    
    // Sort by last message time
    return userConversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  } catch (error) {
    console.error("❌ Error getting user conversations:", error);
    return [];
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  userId1: string,
  userId2: string
): Promise<void> => {
  try {
    const conversationId = [userId1, userId2].sort().join("_");
    const messagesRef = ref(database, `messages/${conversationId}`);
    const snapshot = await get(query(messagesRef, orderByChild("timestamp")));
    
    if (!snapshot.exists()) {
      return;
    }
    
    const messages = snapshot.val();
    const unreadMessages = Object.entries(messages).filter(
      ([, message]: [string, any]) => message.receiverId === userId1 && !message.isRead
    );
    
    if (unreadMessages.length > 0) {
      await Promise.all(
        unreadMessages.map(([messageId, message]: [string, any]) => {
          const messageRef = ref(database, `messages/${conversationId}/${messageId}`);
          return set(messageRef, { ...message, isRead: true });
        })
      );
    }
    
    // Reset unread count for the viewer
    const userConversationRef = ref(database, `userConversations/${userId1}/${conversationId}`);
    const userConversationSnapshot = await get(userConversationRef);
    if (userConversationSnapshot.exists()) {
      await set(userConversationRef, {
        ...userConversationSnapshot.val(),
        unreadCount: 0
      });
    }
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
  }
};

/**
 * Update per-user conversation summaries used for fast lookups and rule-friendly reads.
 * Note: We can't read the receiver's current unread count (security rules), so we use
 * a special field that the receiver's client will merge with their local count.
 */
const updateUserConversationSummaries = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  messageData: Message
): Promise<void> => {
  const senderSummaryRef = ref(database, `userConversations/${senderId}/${conversationId}`);
  const receiverSummaryRef = ref(database, `userConversations/${receiverId}/${conversationId}`);
  
  const senderSummary = {
    conversationId,
    otherUserId: receiverId,
    lastMessage: messageData.content,
    lastMessageTime: messageData.timestamp,
    lastMessageSender: messageData.senderId,
    unreadCount: 0
  };
  
  // For receiver, we set hasNewMessage flag and lastMessageTime
  // The receiver's client will handle unread count when they load their conversations
  const receiverSummary = {
    conversationId,
    otherUserId: senderId,
    lastMessage: messageData.content,
    lastMessageTime: messageData.timestamp,
    lastMessageSender: messageData.senderId,
    hasNewMessage: true
  };
  
  await Promise.all([
    set(senderSummaryRef, senderSummary),
    set(receiverSummaryRef, receiverSummary)
  ]);
};

/**
 * Send a location message
 */
export const sendLocationMessage = async (
  senderId: string,
  receiverId: string,
  location: { lat: number; lng: number },
  locationSharingId?: string,
  expiresAt?: number
): Promise<string> => {
  try {
    // Check if sender is blocked by receiver
    const isBlocked = await isUserBlocked(receiverId, senderId);
    if (isBlocked) {
      throw new Error("You cannot share location with this user. You have been blocked.");
    }

    const conversationId = [senderId, receiverId].sort().join("_");
    const messagesRef = ref(database, `messages/${conversationId}`);
    const newMessageRef = push(messagesRef);
    const messageId = newMessageRef.key!;
    const timestamp = Date.now();

    const messageData: Message = {
      id: messageId,
      senderId,
      receiverId,
      content: "📍 Shared location",
      timestamp,
      isRead: false,
      type: 'location',
      location,
      ...(locationSharingId && { locationSharingId }),
      ...(expiresAt && { expiresAt })
    };
    
    // IMPORTANT: Create conversation metadata FIRST so that security rules can verify participants
    const conversationMetaRef = ref(database, `conversations/${conversationId}`);
    const participantMap: Record<string, boolean> = {
      [senderId]: true,
      [receiverId]: true
    };
    await set(conversationMetaRef, {
      participants: participantMap,
      participantList: Object.keys(participantMap),
      lastMessage: "📍 Shared location",
      lastMessageTime: timestamp,
      lastMessageSender: senderId,
      updatedAt: timestamp
    });
    
    // Now write the message (conversation exists, so rules will pass)
    await set(newMessageRef, messageData);
    
    // Maintain lightweight per-user summaries
    await updateUserConversationSummaries(conversationId, senderId, receiverId, messageData);
    
    console.log(`✅ Location message sent: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error("❌ Error sending location message:", error);
    throw error;
  }
};

/**
 * Delete a conversation (all messages between two users)
 * @param requesterId - The user requesting the deletion (must be one of the participants)
 * @param otherUserId - The other participant in the conversation
 */
export const deleteConversation = async (
  requesterId: string,
  otherUserId: string
): Promise<void> => {
  try {
    // Verify requester is a participant
    if (!requesterId || !otherUserId) {
      throw new Error("Both user IDs are required to delete a conversation");
    }

    const conversationId = [requesterId, otherUserId].sort().join("_");
    
    // Verify conversation exists and requester is a participant
    const conversationRef = ref(database, `conversations/${conversationId}`);
    const conversationSnapshot = await get(conversationRef);
    
    if (!conversationSnapshot.exists()) {
      // Conversation doesn't exist, nothing to delete
      console.log(`ℹ️ Conversation ${conversationId} doesn't exist, nothing to delete`);
      return;
    }

    const conversationData = conversationSnapshot.val();
    if (!conversationData.participants || !conversationData.participants[requesterId]) {
      throw new Error("You are not authorized to delete this conversation");
    }

    // Delete all messages in the conversation
    const messagesRef = ref(database, `messages/${conversationId}`);
    await remove(messagesRef);
    
    // Delete conversation metadata
    await remove(conversationRef);
    
    // Delete user conversation summaries for both users
    const user1SummaryRef = ref(database, `userConversations/${requesterId}/${conversationId}`);
    const user2SummaryRef = ref(database, `userConversations/${otherUserId}/${conversationId}`);
    
    await Promise.all([
      remove(user1SummaryRef),
      remove(user2SummaryRef)
    ]);
    
    console.log(`✅ Conversation ${conversationId} deleted by ${requesterId}`);
  } catch (error) {
    console.error("❌ Error deleting conversation:", error);
    throw error;
  }
};

