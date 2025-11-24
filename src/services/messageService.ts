// Message service for Firebase - real-time messaging
import { ref, set, push, onValue, off, get, query, orderByChild, limitToLast, DataSnapshot } from "firebase/database";
import { database } from "./firebase";

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  isRead?: boolean;
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
    
    const messageData: Message = {
      id: messageId,
      senderId,
      receiverId,
      content,
      timestamp: Date.now(),
      isRead: false
    };
    
    await set(newMessageRef, messageData);
    
    // Update conversation metadata
    const conversationMetaRef = ref(database, `conversations/${conversationId}`);
    await set(conversationMetaRef, {
      participants: [senderId, receiverId],
      lastMessage: content,
      lastMessageTime: Date.now(),
      lastMessageSender: senderId,
      updatedAt: Date.now()
    });
    
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
    const conversationsRef = ref(database, "conversations");
    const snapshot = await get(conversationsRef);
    
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
      if (data.participants && data.participants.includes(userId)) {
        const otherUserId = data.participants.find((id: string) => id !== userId);
        userConversations.push({
          conversationId,
          otherUserId,
          lastMessage: data.lastMessage || "",
          lastMessageTime: data.lastMessageTime || 0,
          unreadCount: 0 // TODO: Calculate unread count
        });
      }
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
    const updates: Record<string, any> = {};
    
    Object.entries(messages).forEach(([messageId, message]: [string, any]) => {
      if (message.receiverId === userId1 && !message.isRead) {
        updates[`${messageId}/isRead`] = true;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      // Update all unread messages
      Object.entries(updates).forEach(async ([path, value]) => {
        const messageRef = ref(database, `messages/${conversationId}/${path.split("/")[0]}`);
        await set(messageRef, { ...messages[path.split("/")[0]], isRead: true });
      });
    }
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
  }
};

