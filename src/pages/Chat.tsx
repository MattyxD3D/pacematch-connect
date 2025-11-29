import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NavigationIcon from "@mui/icons-material/Navigation";
import StopIcon from "@mui/icons-material/Stop";
import PersonIcon from "@mui/icons-material/Person";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import NotificationsIcon from "@mui/icons-material/Notifications";
import BlockIcon from "@mui/icons-material/Block";
import ReportIcon from "@mui/icons-material/Report";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Avatar from "@mui/material/Avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ProfileView } from "./ProfileView";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/hooks/useAuth";
import { useLocation as useLocationHook } from "@/hooks/useLocation";
import {
  listenToUserFriends,
  listenToFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
} from "@/services/friendService";
import { listenToMessages, sendMessage, sendLocationMessage, markMessagesAsRead, deleteConversation, Message as FirebaseMessage } from "@/services/messageService";
import { blockUser, reportUser, isUserBlocked } from "@/services/userService";
import { ReportUserModal } from "@/components/ReportUserModal";
import { generateDummyChatMessages, ENABLE_DUMMY_DATA } from "@/lib/dummyData";
import LocationSharingModal from "@/components/LocationSharingModalSimple";
import { openGoogleMapsNavigation } from "@/utils/navigation";
import { getUserData } from "@/services/authService";
import { getDisplayName } from "@/utils/anonymousName";

interface ChatUser {
  id: string; // Firebase UID
  name: string;
  avatar: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { userProfile, setUserProfile } = useUser();
  const { user: currentUser } = useAuth();
  
  // Get user from navigation state - required, no default
  const chatUser: ChatUser | null = location.state?.user || null;

  // Redirect if no user provided
  useEffect(() => {
    if (!chatUser) {
      navigate("/messages");
    }
  }, [chatUser, navigate]);

  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [friendRequests, setFriendRequests] = useState<{ incoming: string[]; outgoing: string[] }>({ incoming: [], outgoing: [] });
  
  // Location sharing modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Menu state
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMessageRequest, setIsMessageRequest] = useState(false);
  const [chatUserData, setChatUserData] = useState<{ username: string | null; activity: string | null } | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  
  // Fetch chat user data to get username and activity for display name
  useEffect(() => {
    if (!chatUser?.id) {
      setChatUserData(null);
      setDisplayName("");
      return;
    }

    const fetchChatUserData = async () => {
      try {
        const userData = await getUserData(chatUser.id);
        const username = userData?.name || null; // name field contains username after profile setup
        const activity = userData?.activity || null;
        setChatUserData({ username, activity });
        setDisplayName(getDisplayName(username, chatUser.id, activity));
      } catch (error) {
        console.error("Error fetching chat user data:", error);
        // Fallback to anonymous name if fetch fails
        setDisplayName(getDisplayName(null, chatUser.id, null));
      }
    };

    fetchChatUserData();
  }, [chatUser?.id]);
  
  // Get current user location when modal is open
  const { location: currentLocation, isGettingLocation } = useLocationHook(
    currentUser?.uid || null,
    showLocationModal, // Only track when modal is open
    true
  );

  // Listen to real-time messages from Firebase
  useEffect(() => {
    if (!currentUser?.uid || !chatUser?.id) return;

    const unsubscribe = listenToMessages(
      currentUser.uid,
      chatUser.id,
      (firebaseMessages) => {
        // Add dummy messages if enabled and no real messages exist
        if (ENABLE_DUMMY_DATA && firebaseMessages.length === 0) {
          const dummyMessages = generateDummyChatMessages(currentUser.uid, chatUser.id);
          setMessages(dummyMessages);
        } else {
          setMessages(firebaseMessages);
        }
        // Mark messages as read when viewing chat
        markMessagesAsRead(currentUser.uid, chatUser.id).catch(console.error);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, chatUser?.id]);

  // Listen to friends list from Firebase
  useEffect(() => {
    if (!currentUser?.uid) {
      setFriends([]);
      return;
    }

    const unsubscribe = listenToUserFriends(currentUser.uid, (friendIds) => {
      setFriends(friendIds);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Listen to friend requests from Firebase
  useEffect(() => {
    if (!currentUser?.uid) {
      setFriendRequests({ incoming: [], outgoing: [] });
      return;
    }

    const unsubscribe = listenToFriendRequests(currentUser.uid, (requests) => {
      setFriendRequests(requests);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Check if chat is muted (localStorage)
  useEffect(() => {
    if (!currentUser?.uid || !chatUser?.id) return;
    
    const mutedChats = JSON.parse(localStorage.getItem("mutedChats") || "[]");
    const conversationId = [currentUser.uid, chatUser.id].sort().join("_");
    setIsMuted(mutedChats.includes(conversationId));
  }, [currentUser?.uid, chatUser?.id]);

  // Check if user is blocked
  useEffect(() => {
    const checkBlocked = async () => {
      if (!currentUser?.uid || !chatUser?.id) return;
      const blocked = await isUserBlocked(currentUser.uid, chatUser.id);
      setIsBlocked(blocked);
    };
    checkBlocked();
  }, [currentUser?.uid, chatUser?.id]);

  // Determine friend status and check if this is a message request
  useEffect(() => {
    if (!chatUser || !currentUser?.uid) {
      setIsMessageRequest(false);
      return;
    }
    
    // It's a message request if:
    // 1. Not friends
    // 2. Has messages (conversation exists)
    // When they accept, messages are marked as read, but it's still a request until they become friends
    const isNotFriend = !friends.includes(chatUser.id);
    const hasMessages = messages.length > 0;
    setIsMessageRequest(isNotFriend && hasMessages);
  }, [chatUser, friends, messages.length, currentUser?.uid]);

  const getFriendStatus = () => {
    if (!chatUser) return "not_friends";
    
    if (friends.includes(chatUser.id)) return "friends";
    if (friendRequests.incoming.includes(chatUser.id)) return "request_received";
    if (friendRequests.outgoing.includes(chatUser.id)) return "request_pending";
    return "not_friends";
  };

  // Handle accepting message request
  const handleAcceptMessageRequest = async () => {
    if (!currentUser?.uid || !chatUser?.id) return;
    
    // Mark messages as read to "accept" the request
    try {
      await markMessagesAsRead(currentUser.uid, chatUser.id);
      setIsMessageRequest(false);
      toast.success(`Accepted message from ${displayName || chatUser.name}`);
    } catch (error) {
      console.error("Error accepting message request:", error);
      toast.error("Failed to accept message request");
    }
  };

  // Handle declining message request (delete conversation)
  const handleDeclineMessageRequest = async () => {
    if (!currentUser?.uid || !chatUser?.id) return;
    
    try {
      await deleteConversation(currentUser.uid, chatUser.id);
      setIsMessageRequest(false);
      toast.success(`Declined message from ${displayName || chatUser.name}`);
      navigate("/messages");
    } catch (error) {
      console.error("Error declining message request:", error);
      toast.error("Failed to decline message request");
    }
  };

  const maxCharacters = 500;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentUser?.uid || !chatUser?.id) return;

    // Check if blocked before attempting to send
    if (isBlocked) {
      toast.error("You cannot send messages. You have been blocked.");
      return;
    }

    try {
      await sendMessage(currentUser.uid, chatUser.id, messageInput.trim());
      setMessageInput("");
      toast.success("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send message. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Profile view handlers
  const handleAddFriend = async () => {
    if (!chatUser || !currentUser?.uid) return;
    
    try {
      await sendFriendRequest(currentUser.uid, chatUser.id);
      toast.success(`Friend request sent to ${displayName || chatUser.name}`);
      setShowProfile(false);
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const handleAcceptFriend = async () => {
    if (!chatUser || !currentUser?.uid) return;
    
    try {
      await acceptFriendRequest(currentUser.uid, chatUser.id);
      toast.success(`You are now friends with ${displayName || chatUser.name}`);
      setShowProfile(false);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleDeclineFriend = async () => {
    if (!chatUser || !currentUser?.uid) return;
    
    try {
      await declineFriendRequest(currentUser.uid, chatUser.id);
      toast.success("Friend request declined");
      setShowProfile(false);
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast.error("Failed to decline friend request");
    }
  };

  const handleSendMessageFromProfile = () => {
    setShowProfile(false);
    // Already in chat, just close the profile
  };

  // Location sharing handlers
  const handleShareLocation = () => {
    if (!currentUser?.uid) {
      toast.error("You must be logged in to share location");
      return;
    }
    
    if (!chatUser?.id) {
      toast.error("No chat user found");
      return;
    }

    // Check if blocked before attempting to share location
    if (isBlocked) {
      toast.error("You cannot share location. You have been blocked.");
      return;
    }
    
    if (!currentLocation) {
      toast.error("Unable to get your location. Please check your location permissions.");
      return;
    }

    // Show confirmation modal
    setPendingLocation(currentLocation);
    setShowLocationModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmShare = async () => {
    if (!currentUser?.uid || !chatUser?.id || !pendingLocation) return;

    try {
      // Send location message
      await sendLocationMessage(
        currentUser.uid,
        chatUser.id,
        pendingLocation
      );
      
      // Send text message with coordinates
      await sendMessage(
        currentUser.uid,
        chatUser.id,
        `📍 My current location:\n${pendingLocation.lat.toFixed(6)}, ${pendingLocation.lng.toFixed(6)}`
      );

      toast.success(`Location sent to ${displayName || chatUser.name}`);
      setShowConfirmModal(false);
      setPendingLocation(null);
    } catch (error) {
      console.error("❌ Error sending location:", error);
      toast.error("Failed to send location");
    }
  };

  // Menu handlers
  const handleToggleMute = () => {
    if (!currentUser?.uid || !chatUser?.id) return;
    
    const conversationId = [currentUser.uid, chatUser.id].sort().join("_");
    const mutedChats = JSON.parse(localStorage.getItem("mutedChats") || "[]");
    
    if (isMuted) {
      const updated = mutedChats.filter((id: string) => id !== conversationId);
      localStorage.setItem("mutedChats", JSON.stringify(updated));
      setIsMuted(false);
      toast.success(`Notifications enabled for ${displayName || chatUser.name}`);
    } else {
      mutedChats.push(conversationId);
      localStorage.setItem("mutedChats", JSON.stringify(mutedChats));
      setIsMuted(true);
      toast.success(`Notifications muted for ${displayName || chatUser.name}`);
    }
  };

  const handleBlockUser = async () => {
    if (!currentUser?.uid || !chatUser?.id) return;
    
    try {
      await blockUser(currentUser.uid, chatUser.id);
      setIsBlocked(true);
      toast.success(`${displayName || chatUser.name} has been blocked`);
      setShowBlockDialog(false);
      // Navigate back to messages after blocking
      setTimeout(() => navigate("/messages"), 1000);
    } catch (error) {
      console.error("❌ Error blocking user:", error);
      toast.error("Failed to block user");
    }
  };

  const handleReportUser = async (reason: string, details?: string) => {
    if (!currentUser?.uid || !chatUser?.id) return;
    
    try {
      await reportUser(currentUser.uid, chatUser.id, reason, details);
      toast.success("Thank you for your report. We'll review it soon.");
      setShowReportModal(false);
    } catch (error) {
      console.error("❌ Error reporting user:", error);
      toast.error("Failed to submit report");
      throw error;
    }
  };

  const handleDeleteConversation = async () => {
    if (!currentUser?.uid || !chatUser?.id) return;
    
    try {
      await deleteConversation(currentUser.uid, chatUser.id);
      toast.success("Conversation deleted");
      setShowDeleteDialog(false);
      // Navigate back to messages after deletion
      navigate("/messages");
    } catch (error) {
      console.error("❌ Error deleting conversation:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete conversation";
      toast.error(errorMessage);
    }
  };


  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div 
        className="sticky top-0 z-10 bg-background border-b border-border"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/messages")}
              className="touch-target p-2 -ml-2 rounded-full hover:bg-accent transition-colors flex-shrink-0"
            >
              <ArrowBackIcon style={{ fontSize: 24 }} />
            </motion.button>
            {chatUser && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProfile(true)}
                className="flex items-center gap-3 flex-1 min-w-0 rounded-lg hover:bg-accent/50 transition-colors p-2 -ml-2 cursor-pointer"
              >
                <Avatar
                  src={chatUser.avatar}
                  alt={displayName || chatUser.name}
                  sx={{ width: 40, height: 40 }}
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <h1 className="text-lg font-bold text-foreground truncate">
                    {displayName || chatUser.name}
                  </h1>
                </div>
              </motion.button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="touch-target p-2 rounded-full hover:bg-accent transition-colors flex-shrink-0"
              >
                <MoreVertIcon style={{ fontSize: 24 }} className="text-muted-foreground" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setShowProfile(true)}>
                <PersonIcon style={{ fontSize: 18 }} className="mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleMute}>
                {isMuted ? (
                  <>
                    <NotificationsIcon style={{ fontSize: 18 }} className="mr-2" />
                    Unmute Notifications
                  </>
                ) : (
                  <>
                    <NotificationsOffIcon style={{ fontSize: 18 }} className="mr-2" />
                    Mute Notifications
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowReportModal(true)}
                className="text-orange-600 focus:text-orange-600"
              >
                <ReportIcon style={{ fontSize: 18 }} className="mr-2" />
                Report User
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowBlockDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <BlockIcon style={{ fontSize: 18 }} className="mr-2" />
                Block User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <DeleteIcon style={{ fontSize: 18 }} className="mr-2" />
                Delete Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!chatUser ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No user selected</p>
          </div>
        ) : isBlocked ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <BlockIcon className="mx-auto text-red-500" style={{ fontSize: 48 }} />
              <p className="text-lg font-semibold">You have been blocked</p>
              <p className="text-sm text-muted-foreground">You cannot send messages to this user.</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isMe = message.senderId === currentUser?.uid;
            const showAvatar = !isMe && (
              index === 0 || messages[index - 1].senderId === currentUser?.uid || messages[index - 1].senderId !== message.senderId
            );

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}
              >
                {/* Avatar for received messages */}
                {!isMe && (
                  <div className="flex-shrink-0 w-8">
                    {showAvatar && (
                      <Avatar
                        src={chatUser.avatar}
                        alt={displayName || chatUser.name}
                        sx={{ width: 32, height: 32 }}
                      />
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[75%] ${isMe ? "order-last" : ""}`}
                >
                  {message.type === 'location' && message.location ? (
                    // Location message
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <LocationOnIcon style={{ fontSize: 20 }} />
                        <p className="text-sm font-medium">Shared location</p>
                      </div>
                      <p className="text-xs opacity-90 mb-3">
                        {message.location.lat.toFixed(6)}, {message.location.lng.toFixed(6)}
                      </p>
                      {message.expiresAt && Date.now() < message.expiresAt && (
                        <p className="text-xs opacity-75 mb-3">
                          Expires in {formatTime(Math.floor((message.expiresAt - Date.now()) / 1000))}
                        </p>
                      )}
                      <Button
                        size="sm"
                        variant={isMe ? "secondary" : "default"}
                        onClick={() => openGoogleMapsNavigation(message.location!.lat, message.location!.lng)}
                        className="w-full"
                      >
                        <NavigationIcon style={{ fontSize: 16 }} className="mr-2" />
                        Start navigation using Google Maps
                      </Button>
                    </div>
                  ) : (
                    // Text message
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                  )}
                  <p className={`text-xs text-muted-foreground mt-1 px-1 ${
                    isMe ? "text-right" : "text-left"
                  }`}>
                    {getRelativeTime(message.timestamp)}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Typing Indicator */}
        {isTyping && chatUser && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 justify-start"
          >
            <Avatar
              src={chatUser.avatar}
              alt={displayName || chatUser.name}
              sx={{ width: 32, height: 32 }}
            />
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-muted-foreground rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-muted-foreground rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-muted-foreground rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Request Banner */}
      {isMessageRequest && chatUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border p-4 bg-muted/50"
        >
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold">
                {displayName || chatUser.name} wants to message you
              </p>
              <p className="text-xs text-muted-foreground">
                Accept to continue the conversation
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleDeclineMessageRequest}
                variant="outline"
                className="flex-1"
              >
                <CloseIcon style={{ fontSize: 16 }} className="mr-2" />
                Decline
              </Button>
              <Button
                onClick={handleAcceptMessageRequest}
                className="flex-1"
              >
                <CheckCircleIcon style={{ fontSize: 16 }} className="mr-2" />
                Accept
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      {chatUser && (
        <div className="border-t border-border p-4 bg-background">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={(e) => {
                if (e.target.value.length <= maxCharacters) {
                  setMessageInput(e.target.value);
                }
              }}
              onKeyPress={handleKeyPress}
              placeholder={isBlocked ? "You have been blocked" : isMessageRequest ? "Accept request to send messages" : "Type message..."}
              rows={1}
              disabled={isBlocked || isMessageRequest}
              className="w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-h-32"
              style={{
                minHeight: "44px",
                maxHeight: "128px",
              }}
            />
            <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
              {messageInput.length}/{maxCharacters}
            </div>
          </div>
          <Button
            onClick={() => setShowLocationModal(true)}
            size="icon"
            variant="outline"
            disabled={isBlocked || isMessageRequest}
            className="rounded-full h-11 w-11 flex-shrink-0"
          >
            <LocationOnIcon style={{ fontSize: 20 }} />
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isBlocked || isMessageRequest}
            size="icon"
            className="rounded-full h-11 w-11 flex-shrink-0 bg-primary hover:bg-primary/90"
          >
            <SendIcon style={{ fontSize: 20 }} />
          </Button>
        </div>
      </div>
      )}

      {/* Location Sharing Modal */}
      <LocationSharingModal
        open={showLocationModal}
        onOpenChange={setShowLocationModal}
        onShareLocation={handleShareLocation}
        currentLocation={currentLocation}
        isGettingLocation={isGettingLocation}
      />

      {/* Confirmation Modal */}
      {showConfirmModal && pendingLocation && chatUser && (
        <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Your Location?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                You're about to share your current location with <span className="font-semibold">{displayName || chatUser.name}</span>
              </p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs font-mono">
                  📍 {pendingLocation.lat.toFixed(6)}, {pendingLocation.lng.toFixed(6)}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingLocation(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirmShare}
                >
                  <LocationOnIcon className="mr-2" style={{ fontSize: 18 }} />
                  Send Location
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Profile View Modal */}
      {showProfile && chatUser && (
        <ProfileView
          user={{
            id: chatUser.id,
            name: displayName || chatUser.name,
            avatar: chatUser.avatar,
            distance: "In your chat",
            activity: "Active",
            photos: [chatUser.avatar],
          }}
          friendStatus={getFriendStatus()}
          onClose={() => setShowProfile(false)}
          onSendMessage={handleSendMessageFromProfile}
          onAddFriend={handleAddFriend}
          onAcceptFriend={handleAcceptFriend}
          onDeclineFriend={handleDeclineFriend}
        />
      )}

      {/* Report User Modal */}
      {chatUser && (
        <ReportUserModal
          open={showReportModal}
          onOpenChange={setShowReportModal}
          userName={displayName || chatUser.name}
          onReport={handleReportUser}
        />
      )}

      {/* Block User Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {chatUser?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will prevent {chatUser?.name} from sending you messages and you won't see them on the map. You can unblock them later from settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Conversation Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages with {chatUser?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Chat;
