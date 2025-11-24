import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import Avatar from "@mui/material/Avatar";
import { Badge } from "@/components/ui/badge";
import MailOutlineIcon from "@mui/icons-material/MailOutline";

interface Conversation {
  id: number;
  userId: number;
  userName: string;
  avatar: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
}

const Messages = () => {
  const navigate = useNavigate();
  
  // Mock conversation data
  const [conversations] = useState<Conversation[]>([
    {
      id: 1,
      userId: 1,
      userName: "Sarah Johnson",
      avatar: "https://i.pravatar.cc/150?img=1",
      lastMessage: "Hi! Want to workout together?",
      timestamp: Date.now() - 2 * 60 * 1000, // 2 minutes ago
      unreadCount: 1,
    },
    {
      id: 2,
      userId: 2,
      userName: "Mike Chen",
      avatar: "https://i.pravatar.cc/150?img=2",
      lastMessage: "Great to see another runner nearby!",
      timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
      unreadCount: 0,
    },
    {
      id: 3,
      userId: 3,
      userName: "Emma Davis",
      avatar: "https://i.pravatar.cc/150?img=3",
      lastMessage: "Would you like to join me for a run?",
      timestamp: Date.now() - 60 * 60 * 1000, // 1 hour ago
      unreadCount: 2,
    },
    {
      id: 4,
      userId: 4,
      userName: "James Wilson",
      avatar: "https://i.pravatar.cc/150?img=4",
      lastMessage: "That sounds great! What time works for you?",
      timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      unreadCount: 0,
    },
    {
      id: 5,
      userId: 5,
      userName: "Lisa Anderson",
      avatar: "https://i.pravatar.cc/150?img=5",
      lastMessage: "Thanks for the run today! Let's do it again soon.",
      timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
      unreadCount: 0,
    },
  ]);

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
    // In real implementation, navigate to chat view
    console.log("Open chat with:", conversation.userName);
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/map")}
              className="touch-target p-2 -ml-2 rounded-full hover:bg-accent transition-colors"
            >
              <ArrowBackIcon style={{ fontSize: 24 }} />
            </motion.button>
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
            className="touch-target p-2 rounded-full hover:bg-accent transition-colors"
          >
            <SearchIcon style={{ fontSize: 24 }} className="text-muted-foreground" />
          </motion.button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          // Empty State
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
                No messages yet
              </h2>
              <p className="text-muted-foreground max-w-xs">
                Start a conversation by sending a message to someone nearby!
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conversation, index) => (
              <motion.button
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleConversationClick(conversation)}
                className="w-full text-left hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3 p-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={conversation.avatar}
                      alt={conversation.userName}
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
                        {conversation.userName}
                      </h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {getRelativeTime(conversation.timestamp)}
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
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
