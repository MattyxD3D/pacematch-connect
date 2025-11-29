import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/hooks/useAuth";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import Avatar from "@mui/material/Avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import BottomNavigation from "@/components/BottomNavigation";
import { getUserConversations } from "@/services/messageService";
import { get, ref } from "firebase/database";
import { database } from "@/services/firebase";
import { 
  isUserBlocked,
} from "@/lib/messageStorage";
import { markMessagesAsRead, deleteConversation } from "@/services/messageService";
import { toast } from "sonner";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { getDisplayName } from "@/utils/anonymousName";
import { getProfilePictureUrl } from "@/utils/profilePicture";

interface Conversation {
  conversationId: string;
  otherUserId: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  userName?: string;
  avatar?: string;
  activity?: string | null;
}

const Messages = () => {
  const navigate = useNavigate();
  const { unreadMessageCount } = useNotificationContext();
  const { userProfile } = useUser();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"chats" | "requests">("chats");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  // Fetch conversations from Firebase
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const loadConversations = async () => {
      try {
        const firebaseConversations = await getUserConversations(currentUser.uid);
        
        // Fetch user data for each conversation
        let conversationsWithUserData = await Promise.all(
          firebaseConversations.map(async (conv) => {
            try {
              const userRef = ref(database, `users/${conv.otherUserId}`);
              const userSnapshot = await get(userRef);
              const userData = userSnapshot.exists() ? userSnapshot.val() : null;
              
              const username = userData?.name || null;
              const activity = userData?.activity || null;
              const displayName = getDisplayName(username, conv.otherUserId, activity);
              return {
                ...conv,
                userName: displayName,
                avatar: getProfilePictureUrl(userData?.photoURL, userData?.avatar, displayName),
                activity: activity,
              };
            } catch (error) {
              console.error(`Error fetching user ${conv.otherUserId}:`, error);
              const fallbackName = getDisplayName(null, conv.otherUserId, null);
              return {
                ...conv,
                userName: fallbackName,
                avatar: getProfilePictureUrl(null, null, fallbackName),
                activity: null,
              };
            }
          })
        );
        
        setConversations(conversationsWithUserData);
      } catch (error) {
        console.error("Error loading conversations:", error);
        toast.error("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [currentUser?.uid]);
  
  // Filter conversations based on friend status and blocked users
  const friends = userProfile?.friends || [];
  const blockedUsers = conversations
    .filter(conv => isUserBlocked(parseInt(conv.otherUserId)))
    .map(conv => conv.otherUserId);
  
  // Split conversations into chats and requests
  // Message requests are conversations with non-friends that have messages
  const allConversations = conversations
    .filter(conv => !blockedUsers.includes(conv.otherUserId)); // Hide blocked users
  
  // Separate into chats (with friends) and requests (from non-friends)
  // Message requests are ALL conversations from people who aren't your friends
  const chatConversationsFiltered = allConversations.filter(conv => 
    friends.includes(conv.otherUserId)
  );
  
  const requestConversationsFiltered = allConversations.filter(conv => 
    !friends.includes(conv.otherUserId)
  );
  
  // Filter conversations by search query
  const filterConversations = (convs: Conversation[]) => {
    if (!searchQuery.trim()) return convs;
    
    const query = searchQuery.toLowerCase().trim();
    return convs.filter(conv => {
      const userName = (conv.userName || "").toLowerCase();
      const lastMessage = (conv.lastMessage || "").toLowerCase();
      return userName.includes(query) || lastMessage.includes(query);
    });
  };
  
  const chatConversations = filterConversations(chatConversationsFiltered);
  const requestConversations = filterConversations(requestConversationsFiltered);

  const handleAcceptRequest = async (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.uid) return;
    
    try {
      // Mark messages as read to "accept" the request
      await markMessagesAsRead(currentUser.uid, conversation.otherUserId);
      
      // Refresh conversations to remove the accepted request from the list
      const firebaseConversations = await getUserConversations(currentUser.uid);
      const conversationsWithUserData = await Promise.all(
        firebaseConversations.map(async (conv) => {
          try {
            const userRef = ref(database, `users/${conv.otherUserId}`);
            const userSnapshot = await get(userRef);
            const userData = userSnapshot.exists() ? userSnapshot.val() : null;
            
            const username = userData?.name || null;
            const activity = userData?.activity || null;
            return {
              ...conv,
              userName: getDisplayName(username, conv.otherUserId, activity),
              avatar: getProfilePictureUrl(userData?.photoURL, userData?.avatar, getDisplayName(username, conv.otherUserId, activity)),
              activity: activity,
            };
          } catch (error) {
            const fallbackName = getDisplayName(null, conv.otherUserId, null);
            return {
              ...conv,
              userName: fallbackName,
              avatar: getProfilePictureUrl(null, null, fallbackName),
              activity: null,
            };
          }
        })
      );
      setConversations(conversationsWithUserData);
      
      toast.success(`Accepted message from ${conversation.userName}`);
      
      // Navigate to the chat screen after accepting
      navigate("/chat", {
        state: {
          user: {
            id: conversation.otherUserId,
            name: conversation.userName || "Unknown User",
            avatar: conversation.avatar || "",
          },
        },
      });
    } catch (error) {
      console.error("Error accepting message request:", error);
      toast.error("Failed to accept message request");
    }
  };

  const handleDeclineRequest = async (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser?.uid) return;
    
    try {
      // Delete the conversation
      await deleteConversation(currentUser.uid, conversation.otherUserId);
      toast.success(`Declined message from ${conversation.userName}`);
      // Refresh conversations to update the list
      const firebaseConversations = await getUserConversations(currentUser.uid);
      const conversationsWithUserData = await Promise.all(
        firebaseConversations.map(async (conv) => {
          try {
            const userRef = ref(database, `users/${conv.otherUserId}`);
            const userSnapshot = await get(userRef);
            const userData = userSnapshot.exists() ? userSnapshot.val() : null;
            
            const username = userData?.name || null;
            const activity = userData?.activity || null;
            return {
              ...conv,
              userName: getDisplayName(username, conv.otherUserId, activity),
              avatar: userData?.photoURL || "",
              activity: activity,
            };
          } catch (error) {
            return {
              ...conv,
              userName: getDisplayName(null, conv.otherUserId, null),
              avatar: "",
              activity: null,
            };
          }
        })
      );
      setConversations(conversationsWithUserData);
    } catch (error) {
      console.error("Error declining message request:", error);
      toast.error("Failed to decline message request");
    }
  };

  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    // Format as date if > 7 days
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateMessage = (message: string, maxLength: number = 50): string => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  const handleConversationClick = (conversation: Conversation) => {
    navigate("/chat", {
      state: {
        user: {
          id: conversation.otherUserId,
          name: conversation.userName || "Unknown User",
          avatar: conversation.avatar || "",
        },
      },
    });
  };

  // Calculate unread counts from filtered conversations
  const totalUnread = chatConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  const requestsCount = requestConversations.length;

  const renderConversationList = (conversations: Conversation[], showActions = false) => {
    if (conversations.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <MailOutlineIcon
              style={{ fontSize: 80 }}
              className="text-muted-foreground/50 mb-4"
            />
            <h2 className="text-xl font-bold text-foreground mb-2">
              {showActions ? "No message requests" : "No messages yet"}
            </h2>
            <p className="text-muted-foreground max-w-xs">
              {showActions 
                ? "When someone who isn't your friend messages you, you'll see it here." 
                : "Start a conversation by sending a message to someone nearby!"}
            </p>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="divide-y divide-border">
        {conversations.map((conversation, index) => (
          <motion.div
            key={conversation.conversationId || conversation.otherUserId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative"
          >
            <button
              onClick={() => handleConversationClick(conversation)}
              className="w-full text-left hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3 p-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={conversation.avatar}
                    alt={conversation.userName || "User"}
                    sx={{ width: 56, height: 56 }}
                  />
                  {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center border-2 border-background">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className={`font-semibold text-base truncate ${
                      conversation.unreadCount > 0 ? "text-foreground" : "text-foreground"
                    }`}>
                      {conversation.userName || "Unknown User"}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {getRelativeTime(conversation.lastMessageTime)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${
                    conversation.unreadCount > 0
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}>
                    {truncateMessage(conversation.lastMessage)}
                  </p>
                </div>
              </div>
            </button>

            {/* Action buttons for requests */}
            {showActions && (
              <div className="flex gap-2 px-4 pb-4">
                <Button
                  onClick={(e) => handleAcceptRequest(conversation, e)}
                  className="flex-1 h-9 bg-primary hover:bg-primary/90"
                  size="sm"
                >
                  <CheckIcon style={{ fontSize: 18 }} className="mr-1" />
                  Accept
                </Button>
                <Button
                  onClick={(e) => handleDeclineRequest(conversation, e)}
                  variant="outline"
                  className="flex-1 h-9"
                  size="sm"
                >
                  <CloseIcon style={{ fontSize: 18 }} className="mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <div 
        className="sticky top-0 z-10 bg-background border-b border-border"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="flex items-center justify-between p-4">
          {!showSearch ? (
            <>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Messages</h1>
                  {totalUnread > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {totalUnread} unread {totalUnread === 1 ? "message" : "messages"}
                    </p>
                  )}
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSearch(true)}
                className="touch-target p-2 rounded-full hover:bg-accent transition-colors"
              >
                <SearchIcon style={{ fontSize: 24 }} className="text-muted-foreground" />
              </motion.button>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                className="touch-target p-2 rounded-full hover:bg-accent transition-colors"
              >
                <CloseIcon style={{ fontSize: 24 }} className="text-muted-foreground" />
              </motion.button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "chats" | "requests")} className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-12 bg-muted/30">
            <TabsTrigger value="chats" className="relative data-[state=active]:bg-background">
              Chats
              {totalUnread > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full min-w-[20px]">
                  {totalUnread}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="relative data-[state=active]:bg-background">
              Requests
              {requestsCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-full min-w-[20px]">
                  {requestsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs value={activeTab} className="w-full h-full">
            <TabsContent value="chats" className="mt-0 h-full">
              {renderConversationList(chatConversations, false)}
            </TabsContent>
            <TabsContent value="requests" className="mt-0 h-full">
              {renderConversationList(requestConversations, true)}
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      <BottomNavigation />
    </div>
  );
};

export default Messages;
