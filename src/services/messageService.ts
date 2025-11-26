// Message service for Firebase - real-time messaging
import { ref, set, push, onValue, off, get, query, orderByChild, DataSnapshot } from "firebase/database";
import { database } from "./firebase";

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
    
    await set(newMessageRef, messageData);
    
    // Update conversation metadata
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
    
    // Maintain lightweight per-user summaries for fast lookups
    await updateUserConversationSummaries(conversationId, senderId, receiverId, messageData);
    
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
  
  const receiverSnapshot = await get(receiverSummaryRef);
  const receiverUnreadCount = receiverSnapshot.exists()
    ? (receiverSnapshot.val().unreadCount || 0) + 1
    : 1;
  
  const receiverSummary = {
    conversationId,
    otherUserId: senderId,
    lastMessage: messageData.content,
    lastMessageTime: messageData.timestamp,
    lastMessageSender: messageData.senderId,
    unreadCount: receiverUnreadCount
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
      locationSharingId,
      expiresAt
    };
    
    await set(newMessageRef, messageData);
    
    // Update conversation metadata
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
    
    // Maintain lightweight per-user summaries
    await updateUserConversationSummaries(conversationId, senderId, receiverId, messageData);
    
    console.log(`✅ Location message sent: ${messageId}`);
    return messageId;
  } catch (error) {
    console.error("❌ Error sending location message:", error);
    throw error;
  }
};

