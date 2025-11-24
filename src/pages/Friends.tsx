import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@mui/material";
import { mockUsers, getMockUserById } from "@/lib/mockData";
import {
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
} from "@/lib/socialStorage";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ChatIcon from "@mui/icons-material/Chat";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "sonner";

const Friends = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState(getPendingRequests());
  const [friends] = useState<number[]>([1, 2, 4, 5, 6, 8]); // Mock friend list

  const handleSendRequest = (userId: number, username: string) => {
    sendFriendRequest(userId);
    setRequests(getPendingRequests());
    toast.success(`Friend request sent to ${username}!`);
  };

  const handleAcceptRequest = (userId: number) => {
    const user = getMockUserById(userId);
    acceptFriendRequest(userId);
    setRequests(getPendingRequests());
    toast.success(`You are now friends with ${user?.username}!`);
  };

  const handleDeclineRequest = (userId: number) => {
    declineFriendRequest(userId);
    setRequests(getPendingRequests());
    toast.success("Request declined");
  };

  const handleCancelRequest = (userId: number) => {
    cancelFriendRequest(userId);
    setRequests(getPendingRequests());
    toast.success("Request cancelled");
  };

  const filteredUsers = mockUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const discoverUsers = mockUsers.filter(
    user => !friends.includes(user.id) && !requests.outgoing.includes(user.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md shadow-elevation-2 sticky top-0 z-10 border-b border-border/50"
      >
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="touch-target p-2 hover:bg-secondary rounded-xl transition-all duration-200"
          >
            <ArrowBackIcon style={{ fontSize: 28 }} />
          </motion.button>
          <div>
            <h1 className="text-3xl font-bold">Friends</h1>
            <p className="text-sm text-muted-foreground">
              {friends.length} Friends • {requests.incoming.length} Requests
            </p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-2xl mx-auto px-6 py-6">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative mb-6">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends..."
              className="pl-12 h-12"
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {requests.incoming.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {requests.incoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>

          {/* Friends Tab */}
          <TabsContent value="friends" className="space-y-3">
            {friends.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No friends yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start adding friends to see them here!
                </p>
              </Card>
            ) : (
              friends.map((friendId, index) => {
                const friend = getMockUserById(friendId);
                if (!friend) return null;

                return (
                  <motion.div
                    key={friendId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={friend.avatar} alt={friend.username} sx={{ width: 56, height: 56 }} />
                        <div className="flex-1">
                          <h3 className="font-bold">{friend.username}</h3>
                          <p className="text-sm text-muted-foreground">{friend.bio || "Fitness enthusiast"}</p>
                          <div className="flex gap-1 mt-1">
                            {friend.activities.map(activity => (
                              <span
                                key={activity}
                                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                              >
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate("/messages")}
                        >
                          <ChatIcon style={{ fontSize: 18 }} className="mr-1" />
                          Message
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {/* Incoming Requests */}
            <div>
              <h3 className="font-bold mb-3">Incoming Requests</h3>
              {requests.incoming.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No incoming requests</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {requests.incoming.map(userId => {
                    const user = getMockUserById(userId);
                    if (!user) return null;

                    return (
                      <Card key={userId} className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={user.avatar} alt={user.username} sx={{ width: 56, height: 56 }} />
                          <div className="flex-1">
                            <h3 className="font-bold">{user.username}</h3>
                            <p className="text-sm text-muted-foreground">{user.bio}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptRequest(userId)}
                            >
                              <CheckIcon style={{ fontSize: 18 }} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclineRequest(userId)}
                            >
                              <CloseIcon style={{ fontSize: 18 }} />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Outgoing Requests */}
            <div>
              <h3 className="font-bold mb-3">Outgoing Requests</h3>
              {requests.outgoing.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No outgoing requests</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {requests.outgoing.map(userId => {
                    const user = getMockUserById(userId);
                    if (!user) return null;

                    return (
                      <Card key={userId} className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={user.avatar} alt={user.username} sx={{ width: 56, height: 56 }} />
                          <div className="flex-1">
                            <h3 className="font-bold">{user.username}</h3>
                            <p className="text-sm text-muted-foreground">Request pending</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelRequest(userId)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-3">
            {discoverUsers.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No users to discover</p>
              </Card>
            ) : (
              (searchQuery ? filteredUsers : discoverUsers).map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} alt={user.username} sx={{ width: 56, height: 56 }} />
                      <div className="flex-1">
                        <h3 className="font-bold">{user.username}</h3>
                        <p className="text-sm text-muted-foreground">{user.bio || "Fitness enthusiast"}</p>
                        <div className="flex gap-1 mt-1">
                          {user.activities.map(activity => (
                            <span
                              key={activity}
                              className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                            >
                              {activity}
                            </span>
                          ))}
                        </div>
                      </div>
                      {requests.outgoing.includes(user.id) ? (
                        <Button size="sm" variant="outline" disabled>
                          Pending
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSendRequest(user.id, user.username)}
                        >
                          <PersonAddIcon style={{ fontSize: 18 }} className="mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Friends;
