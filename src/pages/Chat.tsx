import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Avatar from "@mui/material/Avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ProfileView } from "./ProfileView";
import { useUser } from "@/contexts/UserContext";
import { 
  getPendingRequests, 
  sendFriendRequest, 
  acceptFriendRequest, 
  declineFriendRequest 
} from "@/lib/socialStorage";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: number;
  isMe: boolean;
}

interface ChatUser {
  id: number;
  name: string;
  avatar: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { userProfile, setUserProfile } = useUser();
  
  // Get user from navigation state or use default
  const chatUser: ChatUser = location.state?.user || {
    id: 1,
    name: "Sarah Johnson",
    avatar: "https://i.pravatar.cc/150?img=1",
  };

  const [messageInput, setMessageInput] = useState("");
  const [hideLocation, setHideLocation] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Determine friend status
  const getFriendStatus = () => {
    const friends = userProfile?.friends || [];
    const { incoming, outgoing } = getPendingRequests();
    
    if (friends.includes(chatUser.id)) return "friends";
    if (incoming.includes(chatUser.id)) return "request_received";
    if (outgoing.includes(chatUser.id)) return "request_pending";
    return "not_friends";
  };
  
  // Mock messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      senderId: chatUser.id,
      receiverId: 999, // Current user ID
      content: "Hi! Want to workout together?",
      timestamp: Date.now() - 10 * 60 * 1000,
      isMe: false,
    },
    {
      id: 2,
      senderId: 999,
      receiverId: chatUser.id,
      content: "Sure! When were you thinking?",
      timestamp: Date.now() - 8 * 60 * 1000,
      isMe: true,
    },
    {
      id: 3,
      senderId: chatUser.id,
      receiverId: 999,
      content: "How about tomorrow morning? I usually run around 7 AM.",
      timestamp: Date.now() - 5 * 60 * 1000,
      isMe: false,
    },
    {
      id: 4,
      senderId: 999,
      receiverId: chatUser.id,
      content: "That works perfectly for me! Where do you usually start?",
      timestamp: Date.now() - 2 * 60 * 1000,
      isMe: true,
    },
  ]);

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

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      senderId: 999,
      receiverId: chatUser.id,
      content: messageInput.trim(),
      timestamp: Date.now(),
      isMe: true,
    };

    setMessages([...messages, newMessage]);
    setMessageInput("");
    
    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);

    toast.success("Message sent!");
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
    sendFriendRequest(chatUser.id);
    toast.success(`Friend request sent to ${chatUser.name}`);
    setShowProfile(false);
  };

  const handleAcceptFriend = () => {
    acceptFriendRequest(chatUser.id);
    toast.success(`You are now friends with ${chatUser.name}`);
    setShowProfile(false);
  };

  const handleDeclineFriend = () => {
    declineFriendRequest(chatUser.id);
    toast.success("Friend request declined");
    setShowProfile(false);
  };

  const handleSendMessageFromProfile = () => {
    setShowProfile(false);
    // Already in chat, just close the profile
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
        {messages.map((message, index) => {
          const showAvatar = !message.isMe && (
            index === 0 || messages[index - 1].isMe || messages[index - 1].senderId !== message.senderId
          );

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex gap-2 ${message.isMe ? "justify-end" : "justify-start"}`}
            >
              {/* Avatar for received messages */}
              {!message.isMe && (
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
                className={`max-w-[75%] ${message.isMe ? "order-last" : ""}`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    message.isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
                <p className={`text-xs text-muted-foreground mt-1 px-1 ${
                  message.isMe ? "text-right" : "text-left"
                }`}>
                  {getRelativeTime(message.timestamp)}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* Typing Indicator */}
        {isTyping && (
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

      {/* Input Area */}
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
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            size="icon"
            className="rounded-full h-11 w-11 flex-shrink-0 bg-primary hover:bg-primary/90"
          >
            <SendIcon style={{ fontSize: 20 }} />
          </Button>
        </div>
      </div>

      {/* Profile View Modal */}
      {showProfile && (
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
