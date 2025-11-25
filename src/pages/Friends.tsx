import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@mui/material";
import { mockUsers, getMockUserById } from "@/lib/mockData";
import { ProfileView } from "@/pages/ProfileView";
import { useAuth } from "@/hooks/useAuth";
import { useLocation as useLocationHook } from "@/hooks/useLocation";
import { useMatching } from "@/hooks/useMatching";
import { useUser } from "@/contexts/UserContext";
import { formatDistance } from "@/utils/distance";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import SendIcon from "@mui/icons-material/Send";
import { sendPoke } from "@/services/pokeService";
import {
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  unfriend,
  getLocationSharingSettings,
  setLocationSharing as saveLocationSharing,
  canFriendSeeLocation,
} from "@/lib/socialStorage";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ChatIcon from "@mui/icons-material/Chat";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import LocationOffIcon from "@mui/icons-material/LocationOff";
import { toast } from "sonner";
import BottomNavigation from "@/components/BottomNavigation";
import { Switch } from "@/components/ui/switch";
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

// Dummy friend data for preview
const dummyFriends = [
  {
    id: 1,
    username: "Alex Runner",
    avatar: "https://ui-avatars.com/api/?name=Alex+Runner&size=120&background=4CAF50&color=fff",
    bio: "Marathon enthusiast • Training for my 5th race",
    activities: ["running", "walking"],
    photos: ["https://ui-avatars.com/api/?name=Alex+Runner&size=120&background=4CAF50&color=fff"],
  },
  {
    id: 2,
    username: "Sarah Cyclist",
    avatar: "https://ui-avatars.com/api/?name=Sarah+Cyclist&size=120&background=2196F3&color=fff",
    bio: "Cycling through the city every morning",
    activities: ["cycling", "running"],
    photos: ["https://ui-avatars.com/api/?name=Sarah+Cyclist&size=120&background=2196F3&color=fff"],
  },
  {
    id: 3,
    username: "Mike Walker",
    avatar: "https://ui-avatars.com/api/?name=Mike+Walker&size=120&background=FF9800&color=fff",
    bio: "Love long walks in nature",
    activities: ["walking"],
    photos: ["https://ui-avatars.com/api/?name=Mike+Walker&size=120&background=FF9800&color=fff"],
  },
  {
    id: 4,
    username: "Emma Fitness",
    avatar: "https://ui-avatars.com/api/?name=Emma+Fitness&size=120&background=9C27B0&color=fff",
    bio: "Fitness coach • Always up for a challenge",
    activities: ["running", "cycling", "walking"],
    photos: ["https://ui-avatars.com/api/?name=Emma+Fitness&size=120&background=9C27B0&color=fff"],
  },
  {
    id: 5,
    username: "David Active",
    avatar: "https://ui-avatars.com/api/?name=David+Active&size=120&background=E91E63&color=fff",
    bio: "Weekend warrior • Let's hit the trails!",
    activities: ["running", "walking"],
    photos: ["https://ui-avatars.com/api/?name=David+Active&size=120&background=E91E63&color=fff"],
  },
  {
    id: 6,
    username: "Lisa Speed",
    avatar: "https://ui-avatars.com/api/?name=Lisa+Speed&size=120&background=00BCD4&color=fff",
    bio: "Speed training specialist",
    activities: ["running", "cycling"],
    photos: ["https://ui-avatars.com/api/?name=Lisa+Speed&size=120&background=00BCD4&color=fff"],
  },
];

const Friends = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { userProfile } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState(getPendingRequests());
  const [friends, setFriends] = useState<number[]>([1, 2, 3, 4, 5, 6]); // Mock friend list IDs
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [locationSharing, setLocationSharing] = useState<Record<number, boolean>>(getLocationSharingSettings());
  const [unfriendDialog, setUnfriendDialog] = useState<{ open: boolean; friendId: number | null; friendName: string }>({
    open: false,
    friendId: null,
    friendName: "",
  });
  const [hasPokedUsers, setHasPokedUsers] = useState<Record<string, boolean>>({});
  
  // Get user location for nearby users
  const { location: currentLocation } = useLocationHook(user?.uid || null, false, true);
  
  // Get initial tab from location state, default to "friends"
  const initialTab = (location.state as { tab?: string })?.tab || "friends";
  
  // Get nearby users using matching algorithm
  const { matches, loading: matchesLoading } = useMatching({
    currentUserId: user?.uid || "",
    currentLocation: currentLocation,
    activity: userProfile?.activities?.[0] || "running",
    fitnessLevel: userProfile?.fitnessLevel || "intermediate",
    pace: userProfile?.pace,
    visibility: userProfile?.visibility || {
      visibleToAllLevels: true,
      allowedLevels: ["beginner", "intermediate", "pro"]
    },
    searchFilter: "all",
    radiusPreference: userProfile?.radiusPreference || "normal"
  });
  
  // Format nearby users for display (exclude friends)
  const nearbyUsersForDiscover = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    
    const friendIds = new Set(friends.map(f => String(f)));
    
    return matches
      .filter(match => !friendIds.has(match.user.uid))
      .map(match => ({
        id: match.user.uid,
        name: match.user.name || "User",
        distance: formatDistance(match.distance / 1000),
        distanceValue: match.distance / 1000,
        activity: match.user.activity || "Running",
        avatar: match.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.user.name || 'User')}&size=150`,
        lat: match.user.location.lat,
        lng: match.user.location.lng,
        matchScore: match.score,
        fitnessLevel: match.user.fitnessLevel,
        pace: match.user.pace,
        bio: "",
        photos: []
      }));
  }, [matches, friends]);

  const handleSendRequest = (userId: number | string, username: string) => {
    const userIdNum = typeof userId === 'string' ? parseInt(userId) || 0 : userId;
    sendFriendRequest(userIdNum);
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

  const handleUnfriend = (friendId: number, friendName: string) => {
    setUnfriendDialog({ open: true, friendId, friendName });
  };

  const confirmUnfriend = () => {
    if (unfriendDialog.friendId) {
      unfriend(unfriendDialog.friendId);
      setFriends(prev => prev.filter(id => id !== unfriendDialog.friendId));
      setUnfriendDialog({ open: false, friendId: null, friendName: "" });
      toast.success(`Unfriended ${unfriendDialog.friendName}`);
    }
  };

  const handleLocationSharingToggle = (friendId: number, enabled: boolean) => {
    // Update local state
    setLocationSharing(prev => {
      const updated = { ...prev };
      if (enabled) {
        updated[friendId] = true;
      } else {
        delete updated[friendId];
      }
      return updated;
    });
    // Save to storage
    saveLocationSharing(friendId, enabled);
    toast.success(
      enabled 
        ? "Friend will see your location during workouts" 
        : "Friend will no longer see your location during workouts"
    );
  };

  const handlePoke = async (userId: string) => {
    if (!user?.uid) {
      toast.error("You must be logged in to poke someone");
      return;
    }

    try {
      await sendPoke(user.uid, userId);
      setHasPokedUsers(prev => ({ ...prev, [userId]: true }));
      toast.success("Poke sent! They'll be notified.");
    } catch (error) {
      console.error("Error sending poke:", error);
      toast.error("Failed to send poke. Please try again.");
    }
  };

  const handleSendMessageFromDiscover = (user: any) => {
    navigate("/chat", {
      state: {
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        }
      }
    });
  };

  const getActivityIcon = (activity: string) => {
    switch (activity.toLowerCase()) {
      case "running":
        return <DirectionsRunIcon className="text-success" style={{ fontSize: 18 }} />;
      case "cycling":
        return <DirectionsBikeIcon className="text-primary" style={{ fontSize: 18 }} />;
      case "walking":
        return <DirectionsWalkIcon className="text-warning" style={{ fontSize: 18 }} />;
      default:
        return null;
    }
  };

  const filteredUsers = mockUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const discoverUsers = mockUsers.filter(
    user => !friends.includes(user.id) && !requests.outgoing.includes(user.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/80 backdrop-blur-md shadow-elevation-2 sticky top-0 z-10 border-b border-border/50"
      >
        <div className="max-w-2xl mx-auto px-6 py-5">
          <h1 className="text-3xl font-bold">Friends</h1>
          <p className="text-sm text-muted-foreground">
            {friends.length} Friends • {requests.incoming.length} Requests
          </p>
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
        <Tabs defaultValue={initialTab} className="w-full">
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
                // Use dummy data for preview
                const friend = dummyFriends.find(f => f.id === friendId) || getMockUserById(friendId);
                if (!friend) return null;

                return (
                  <motion.div
                    key={friendId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="p-4 hover:shadow-elevation-2 transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar 
                          src={friend.avatar} 
                          alt={friend.username} 
                          sx={{ width: 56, height: 56 }}
                          className="cursor-pointer"
                          onClick={() => setSelectedUser(friendId)}
                        />
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedUser(friendId)}
                        >
                          <h3 className="font-bold">{friend.username}</h3>
                          <p className="text-sm text-muted-foreground">{friend.bio || "Fitness enthusiast"}</p>
                          <div className="flex gap-1 mt-1">
                            {friend.activities.map(activity => (
                              <span
                                key={activity}
                                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize"
                              >
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/messages");
                          }}
                        >
                          <ChatIcon style={{ fontSize: 18 }} className="mr-1" />
                          Message
                        </Button>
                      </div>
                      
                      {/* Location Sharing Toggle */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2 flex-1">
                          {locationSharing[friendId] ? (
                            <LocationOnIcon className="text-success" style={{ fontSize: 20 }} />
                          ) : (
                            <LocationOffIcon className="text-muted-foreground" style={{ fontSize: 20 }} />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              Share location during workouts
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {locationSharing[friendId] 
                                ? "Friend can see your location when you're active" 
                                : "Location only shared during active workouts"}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={locationSharing[friendId] || false}
                          onCheckedChange={(checked) => handleLocationSharingToggle(friendId, checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
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
                    const user = dummyFriends.find(f => f.id === userId) || getMockUserById(userId);
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
                    const user = dummyFriends.find(f => f.id === userId) || getMockUserById(userId);
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

          {/* Discover Tab - Nearby Users During Workout */}
          <TabsContent value="discover" className="space-y-3">
            {matchesLoading ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Loading nearby users...</p>
              </Card>
            ) : nearbyUsersForDiscover.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No nearby users found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start a workout to discover people nearby!
                </p>
              </Card>
            ) : (
              nearbyUsersForDiscover
                .filter(user => 
                  !searchQuery || 
                  user.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((user, index) => {
                  const isRequestPending = requests.outgoing.some(id => String(id) === String(user.id));
                  const hasPoked = hasPokedUsers[user.id] || false;
                  
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className="p-4 cursor-pointer hover:shadow-elevation-2 transition-shadow"
                        onClick={() => setSelectedUser({
                          id: user.id,
                          name: user.name,
                          distance: user.distance,
                          activity: user.activity,
                          avatar: user.avatar,
                          photos: user.photos,
                          bio: user.bio
                        })}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar src={user.avatar} alt={user.name} sx={{ width: 56, height: 56 }} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold">{user.name}</h3>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {user.distance}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {getActivityIcon(user.activity)}
                              <span className="capitalize">{user.activity}</span>
                              {user.fitnessLevel && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{user.fitnessLevel}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-3 border-t border-border/50">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-9 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePoke(user.id);
                            }}
                            disabled={hasPoked}
                          >
                            <TouchAppIcon style={{ fontSize: 16 }} className="mr-1" />
                            {hasPoked ? "Poked" : "Poke"}
                          </Button>
                          
                          {isRequestPending ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              disabled
                              className="flex-1 h-9 text-xs"
                            >
                              <PersonAddIcon style={{ fontSize: 16 }} className="mr-1" />
                              Pending
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-9 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendRequest(user.id, user.name);
                              }}
                            >
                              <PersonAddIcon style={{ fontSize: 16 }} className="mr-1" />
                              Add
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-9 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendMessageFromDiscover(user);
                            }}
                          >
                            <SendIcon style={{ fontSize: 16 }} className="mr-1" />
                            Message
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNavigation />

      {/* Profile View Modal */}
      <AnimatePresence>
        {selectedUser && (() => {
          // Check if selectedUser is from discover (has id as string) or friends list (number)
          const isDiscoverUser = typeof selectedUser === 'object' && selectedUser.id;
          const isFriendId = typeof selectedUser === 'number';
          
          let userData: any = null;
          let friendStatus: "not_friends" | "request_pending" | "request_received" | "friends" | "denied" = "not_friends";
          
          if (isDiscoverUser) {
            // User from discover tab
            userData = selectedUser;
            if (requests.outgoing.some(id => String(id) === String(userData.id))) {
              friendStatus = "request_pending";
            } else if (friends.some(f => String(f) === String(userData.id))) {
              friendStatus = "friends";
            } else {
              friendStatus = "not_friends";
            }
          } else if (isFriendId) {
            // User from friends list
            const friend = dummyFriends.find(f => f.id === selectedUser) || getMockUserById(selectedUser);
            if (!friend) return null;
            userData = {
              id: friend.id,
              name: friend.username,
              distance: "2.5 km",
              activity: friend.activities && friend.activities.length > 0 
                ? friend.activities[0].charAt(0).toUpperCase() + friend.activities[0].slice(1)
                : "Running",
              avatar: friend.avatar,
              photos: friend.photos,
              bio: friend.bio,
            };
            friendStatus = "friends";
          }
          
          if (!userData) return null;
          
          return (
            <ProfileView
              user={userData}
              friendStatus={friendStatus}
              onClose={() => setSelectedUser(null)}
              onSendMessage={() => {
                if (isDiscoverUser) {
                  handleSendMessageFromDiscover(userData);
                } else {
                  navigate("/messages");
                }
                setSelectedUser(null);
              }}
              onAddFriend={() => {
                if (isDiscoverUser) {
                  handleSendRequest(userData.id, userData.name);
                }
              }}
              onAcceptFriend={() => {}}
              onDeclineFriend={() => {}}
              onUnfriend={() => {
                if (isFriendId) {
                  confirmUnfriend();
                }
              }}
              onPoke={() => {
                if (isDiscoverUser) {
                  handlePoke(userData.id);
                }
              }}
              hasPoked={isDiscoverUser ? (hasPokedUsers[userData.id] || false) : false}
            />
          );
        })()}
      </AnimatePresence>

      {/* Unfriend Confirmation Dialog */}
      <AlertDialog open={unfriendDialog.open} onOpenChange={(open) => 
        setUnfriendDialog(prev => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unfriend {unfriendDialog.friendName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unfriend {unfriendDialog.friendName}? 
              They will be removed from your friends list and won't be able to see your location during workouts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnfriend}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unfriend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Friends;
