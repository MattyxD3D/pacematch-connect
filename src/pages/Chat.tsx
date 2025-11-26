import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import NavigationIcon from "@mui/icons-material/Navigation";
import Avatar from "@mui/material/Avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ProfileView } from "./ProfileView";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/hooks/useAuth";
import { useLocation as useLocationHook } from "@/hooks/useLocation";
import { 
  getPendingRequests, 
  sendFriendRequest, 
  acceptFriendRequest, 
  declineFriendRequest 
} from "@/lib/socialStorage";
import { listenToMessages, sendMessage, sendLocationMessage, markMessagesAsRead, Message as FirebaseMessage } from "@/services/messageService";
import { generateDummyChatMessages, ENABLE_DUMMY_DATA } from "@/lib/dummyData";
import LocationSharingModal from "@/components/LocationSharingModal";
import {
  startLocationSharing,
  stopLocationSharing,
  updateSharedLocation,
  listenToSharedLocation,
  SharedLocation,
} from "@/services/locationSharingService";
import { openGoogleMapsNavigation } from "@/utils/navigation";

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
  const [hideLocation, setHideLocation] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  
  // Location sharing state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<15 | 30 | 60 | null>(null);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [sharingTimer, setSharingTimer] = useState(0);
  const [sharedLocation, setSharedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get current user location
  const { location: currentLocation } = useLocationHook(
    currentUser?.uid || null,
    isSharingLocation, // Only track when sharing
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

  // Determine friend status
  const getFriendStatus = () => {
    if (!chatUser) return "not_friends";
    const friends = userProfile?.friends || [];
    const { incoming, outgoing } = getPendingRequests();
    
    if (friends.includes(chatUser.id)) return "friends";
    if (incoming.includes(chatUser.id)) return "request_received";
    if (outgoing.includes(chatUser.id)) return "request_pending";
    return "not_friends";
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

    try {
      await sendMessage(currentUser.uid, chatUser.id, messageInput.trim());
      setMessageInput("");
      toast.success("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLocationToggle = (checked: boolean) => {
    setHideLocation(checked);
    toast.success(
      checked
        ? `Hidden your location from ${chatUser.name}`
        : `Now visible to ${chatUser.name}`
    );
  };

  // Profile view handlers
  const handleAddFriend = () => {
    if (!chatUser || !currentUser?.uid) return;
    sendFriendRequest(chatUser.id);
    toast.success(`Friend request sent to ${chatUser.name}`);
    setShowProfile(false);
  };

  const handleAcceptFriend = () => {
    if (!chatUser || !currentUser?.uid) return;
    acceptFriendRequest(chatUser.id);
    toast.success(`You are now friends with ${chatUser.name}`);
    setShowProfile(false);
  };

  const handleDeclineFriend = () => {
    if (!chatUser || !currentUser?.uid) return;
    declineFriendRequest(chatUser.id);
    toast.success("Friend request declined");
    setShowProfile(false);
  };

  const handleSendMessageFromProfile = () => {
    setShowProfile(false);
    // Already in chat, just close the profile
  };

  // Location sharing handlers
  const handleStartSharing = async () => {
    if (!currentUser?.uid || !chatUser?.id || !selectedDuration || !currentLocation) {
      toast.error("Unable to start sharing. Please check your location permissions.");
      return;
    }

    try {
      await startLocationSharing(
        currentUser.uid,
        chatUser.id,
        selectedDuration,
        currentLocation
      );

      // Send location message
      await sendLocationMessage(
        currentUser.uid,
        chatUser.id,
        currentLocation,
        `${currentUser.uid}_${chatUser.id}`,
        Date.now() + (selectedDuration * 60 * 1000)
      );

      setIsSharingLocation(true);
      setSharingTimer(selectedDuration * 60);
      setSharedLocation(currentLocation);
      toast.success(`Sharing location for ${selectedDuration} minutes`);

      // Start timer countdown
      timerIntervalRef.current = setInterval(() => {
        setSharingTimer((prev) => {
          if (prev <= 1) {
            handleStopSharing();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting location sharing:", error);
      toast.error("Failed to start sharing location");
    }
  };

  const handleStopSharing = async () => {
    if (!currentUser?.uid || !chatUser?.id) return;

    try {
      await stopLocationSharing(currentUser.uid, chatUser.id);
      setIsSharingLocation(false);
      setSharingTimer(0);
      setSharedLocation(null);
      setSelectedDuration(null);
      setShowLocationModal(false); // Close modal when stopping
      toast.success("Location sharing stopped");

      // Clear interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    } catch (error) {
      console.error("Error stopping location sharing:", error);
      toast.error("Failed to stop sharing location");
    }
  };

  // Update shared location when current location changes (while sharing)
  useEffect(() => {
    if (isSharingLocation && currentLocation && currentUser?.uid && chatUser?.id) {
      updateSharedLocation(currentUser.uid, chatUser.id, currentLocation).catch(console.error);
      setSharedLocation(currentLocation);
    }
  }, [currentLocation?.lat, currentLocation?.lng, isSharingLocation, currentUser?.uid, chatUser?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Listen to shared location from friend
  useEffect(() => {
    if (!currentUser?.uid || !chatUser?.id) return;

    const unsubscribe = listenToSharedLocation(
      chatUser.id,
      currentUser.uid,
      (location: SharedLocation | null) => {
        if (location) {
          // Friend is sharing location with us
          // This will be displayed in the message bubble
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, chatUser?.id]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
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
                  alt={chatUser.name}
                  sx={{ width: 40, height: 40 }}
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <h1 className="text-lg font-bold text-foreground truncate">
                    {chatUser.name}
                  </h1>
                </div>
              </motion.button>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="touch-target p-2 rounded-full hover:bg-accent transition-colors flex-shrink-0"
          >
            <MoreVertIcon style={{ fontSize: 24 }} className="text-muted-foreground" />
          </motion.button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!chatUser ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No user selected</p>
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
                        alt={chatUser.name}
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
              alt={chatUser.name}
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

      {/* Privacy Toggle */}
      {chatUser && (
        <div className="border-t border-border px-4 py-3 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                🔒 Hide my location from {chatUser.name}
              </span>
            </div>
            <Switch
              checked={hideLocation}
              onCheckedChange={handleLocationToggle}
            />
          </div>
        </div>
      )}

      {/* Location Display on Screen */}
      {isSharingLocation && sharedLocation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-4 right-4 z-20 sm:left-auto sm:right-4 sm:w-80"
        >
          <Card className="p-4 bg-card border-2 border-primary shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <LocationOnIcon className="text-success" style={{ fontSize: 24 }} />
                <p className="font-semibold">I'm here</p>
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatTime(sharingTimer)}
              </div>
              <p className="text-xs text-muted-foreground">
                {sharedLocation.lat.toFixed(6)}, {sharedLocation.lng.toFixed(6)}
              </p>
              <Button
                onClick={() => openGoogleMapsNavigation(sharedLocation.lat, sharedLocation.lng)}
                className="w-full"
                size="sm"
              >
                <NavigationIcon style={{ fontSize: 16 }} className="mr-2" />
                Start navigation using Google Maps
              </Button>
            </div>
          </Card>
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
              placeholder="Type message..."
              rows={1}
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
            className="rounded-full h-11 w-11 flex-shrink-0"
          >
            <LocationOnIcon style={{ fontSize: 20 }} />
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
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
        selectedDuration={selectedDuration}
        onDurationSelect={setSelectedDuration}
        onStartSharing={handleStartSharing}
        onStopSharing={handleStopSharing}
        isSharing={isSharingLocation}
        remainingSeconds={sharingTimer}
        currentLocation={currentLocation}
      />

      {/* Profile View Modal */}
      {showProfile && chatUser && (
        <ProfileView
          user={{
            id: chatUser.id,
            name: chatUser.name,
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
    </div>
  );
};

export default Chat;
