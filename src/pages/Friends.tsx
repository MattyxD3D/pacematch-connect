import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@mui/material";
import { ProfileView } from "@/pages/ProfileView";
import { useAuth } from "@/hooks/useAuth";
import { useLocation as useLocationHook } from "@/hooks/useLocation";
import { useMatching } from "@/hooks/useMatching";
import { useUser } from "@/contexts/UserContext";
import { formatDistance, calculateDistance } from "@/utils/distance";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import SendIcon from "@mui/icons-material/Send";
import { sendPoke } from "@/services/pokeService";
import { isWorkoutActive } from "@/utils/workoutState";
import {
  listenToUserFriends,
  listenToFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
} from "@/services/friendService";
import { getUserData } from "@/services/authService";
import {
  getLocationSharingSettings,
  setLocationSharing as saveLocationSharing,
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

const Friends = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { userProfile } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState<{ incoming: string[]; outgoing: string[] }>({ incoming: [], outgoing: [] });
  const [friends, setFriends] = useState<string[]>([]);
  const [friendsData, setFriendsData] = useState<Record<string, any>>({});
  const [requestsData, setRequestsData] = useState<Record<string, any>>({});
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [locationSharing, setLocationSharing] = useState<Record<string, boolean>>(getLocationSharingSettings());
  const [unfriendDialog, setUnfriendDialog] = useState<{ open: boolean; friendId: string | null; friendName: string }>({
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
  
  // Listen to friends list from Firebase
  useEffect(() => {
    if (!user?.uid) {
      setFriends([]);
      setFriendsData({});
      return;
    }

    const unsubscribeFriends = listenToUserFriends(user.uid, async (friendIds) => {
      setFriends(friendIds);
      
      // Fetch friend data for each friend
      const friendsDataMap: Record<string, any> = {};
      for (const friendId of friendIds) {
        try {
          const friendData = await getUserData(friendId);
          if (friendData) {
            friendsDataMap[friendId] = friendData;
          }
        } catch (error) {
          console.error(`Error fetching friend data for ${friendId}:`, error);
        }
      }
      setFriendsData(friendsDataMap);
    });

    return () => unsubscribeFriends();
  }, [user?.uid]);

  // Listen to friend requests from Firebase
  useEffect(() => {
    if (!user?.uid) {
      setRequests({ incoming: [], outgoing: [] });
      setRequestsData({});
      return;
    }

    const unsubscribe = listenToFriendRequests(user.uid, async (requestData) => {
      setRequests(requestData);
      
      // Fetch user data for incoming and outgoing requests
      const requestsDataMap: Record<string, any> = {};
      const allRequestIds = [...requestData.incoming, ...requestData.outgoing];
      
      for (const requestId of allRequestIds) {
        if (!requestsDataMap[requestId]) {
          try {
            const userData = await getUserData(requestId);
            if (userData) {
              requestsDataMap[requestId] = userData;
            }
          } catch (error) {
            console.error(`Error fetching request user data for ${requestId}:`, error);
          }
        }
      }
      setRequestsData(requestsDataMap);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Format nearby users for display (exclude friends)
  const nearbyUsersForDiscover = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    
    const friendIds = new Set(friends);
    
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
        bio: match.user.bio || "",
        photos: match.user.photos || []
      }));
  }, [matches, friends]);

  const handleSendRequest = async (userId: string, username: string) => {
    if (!user?.uid) return;
    
    try {
      await sendFriendRequest(user.uid, userId);
      toast.success(`Friend request sent to ${username}!`);
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    if (!user?.uid) return;
    
    try {
      await acceptFriendRequest(user.uid, userId);
      const userData = requestsData[userId];
      toast.success(`You are now friends with ${userData?.name || userData?.username || "user"}!`);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleDeclineRequest = async (userId: string) => {
    if (!user?.uid) return;
    
    try {
      await declineFriendRequest(user.uid, userId);
      toast.success("Request declined");
    } catch (error) {
      console.error("Error declining friend request:", error);
      toast.error("Failed to decline friend request");
    }
  };

  const handleCancelRequest = async (userId: string) => {
    if (!user?.uid) return;
    
    try {
      await cancelFriendRequest(user.uid, userId);
      toast.success("Request cancelled");
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      toast.error("Failed to cancel friend request");
    }
  };

  const handleUnfriend = (friendId: string, friendName: string) => {
    setUnfriendDialog({ open: true, friendId, friendName });
  };

  const confirmUnfriend = async () => {
    if (!unfriendDialog.friendId || !user?.uid) return;
    
    try {
      await removeFriend(user.uid, unfriendDialog.friendId);
      setUnfriendDialog({ open: false, friendId: null, friendName: "" });
      toast.success(`Unfriended ${unfriendDialog.friendName}`);
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error("Failed to unfriend user");
    }
  };

  const handleLocationSharingToggle = (friendId: string, enabled: boolean) => {
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
    // Save to storage (using friendId as string, but socialStorage expects number - we'll keep this for now)
    // TODO: Migrate location sharing to Firebase in future
    const friendIdNum = parseInt(friendId);
    if (!isNaN(friendIdNum)) {
      saveLocationSharing(friendIdNum, enabled);
    }
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

    // Check if user has active workout session
    if (!isWorkoutActive()) {
      toast.error("You must have an active workout session to poke someone");
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
              friends
                .filter(friendId => {
                  const friend = friendsData[friendId];
                  if (!friend) return false;
                  const friendName = friend.name || friend.username || "";
                  return !searchQuery || friendName.toLowerCase().includes(searchQuery.toLowerCase());
                })
                .map((friendId, index) => {
                  const friend = friendsData[friendId];
                  if (!friend) return null;

                  const friendName = friend.name || friend.username || "User";
                  const friendAvatar = friend.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(friendName)}&size=150`;
                  const friendBio = friend.bio || "Fitness enthusiast";
                  const friendActivities = friend.activities || (friend.activity ? [friend.activity] : []);

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
                            src={friendAvatar} 
                            alt={friendName} 
                            sx={{ width: 56, height: 56 }}
                            className="cursor-pointer"
                            onClick={() => setSelectedUser(friendId)}
                          />
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => setSelectedUser(friendId)}
                          >
                            <h3 className="font-bold">{friendName}</h3>
                            <p className="text-sm text-muted-foreground">{friendBio}</p>
                            {friendActivities.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {friendActivities.map((activity: string) => (
                                  <span
                                    key={activity}
                                    className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize"
                                  >
                                    {activity}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/chat", {
                                state: {
                                  user: {
                                    id: friendId,
                                    name: friendName,
                                    avatar: friendAvatar
                                  }
                                }
                              });
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
                    const user = requestsData[userId];
                    if (!user) return null;

                    const userName = user.name || user.username || "User";
                    const userAvatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&size=150`;
                    const userBio = user.bio || "Fitness enthusiast";

                    return (
                      <Card key={userId} className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={userAvatar} alt={userName} sx={{ width: 56, height: 56 }} />
                          <div className="flex-1">
                            <h3 className="font-bold">{userName}</h3>
                            <p className="text-sm text-muted-foreground">{userBio}</p>
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
                    const user = requestsData[userId];
                    if (!user) return null;

                    const userName = user.name || user.username || "User";
                    const userAvatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&size=150`;

                    return (
                      <Card key={userId} className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={userAvatar} alt={userName} sx={{ width: 56, height: 56 }} />
                          <div className="flex-1">
                            <h3 className="font-bold">{userName}</h3>
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
                  const isRequestPending = requests.outgoing.includes(user.id);
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
                          {isWorkoutActive() && (
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
                          )}
                          
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
          // Check if selectedUser is from discover (has id as string) or friends list (string)
          const isDiscoverUser = typeof selectedUser === 'object' && selectedUser.id;
          const isFriendId = typeof selectedUser === 'string';
          
          let userData: any = null;
          let friendStatus: "not_friends" | "request_pending" | "request_received" | "friends" | "denied" = "not_friends";
          
          if (isDiscoverUser) {
            // User from discover tab
            userData = selectedUser;
            if (requests.outgoing.includes(userData.id)) {
              friendStatus = "request_pending";
            } else if (friends.includes(userData.id)) {
              friendStatus = "friends";
            } else if (requests.incoming.includes(userData.id)) {
              friendStatus = "request_received";
            } else {
              friendStatus = "not_friends";
            }
          } else if (isFriendId) {
            // User from friends list
            const friend = friendsData[selectedUser];
            if (!friend) return null;
            
            const friendName = friend.name || friend.username || "User";
            const friendAvatar = friend.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(friendName)}&size=150`;
            const friendActivities = friend.activities || (friend.activity ? [friend.activity] : []);
            
            userData = {
              id: selectedUser,
              name: friendName,
              distance: friend.lat && friend.lng && currentLocation?.lat && currentLocation?.lng
                ? formatDistance(calculateDistance(
                    currentLocation.lat,
                    currentLocation.lng,
                    friend.lat,
                    friend.lng
                  ))
                : "Unknown",
              activity: friendActivities.length > 0 
                ? friendActivities[0].charAt(0).toUpperCase() + friendActivities[0].slice(1)
                : (friend.activity ? friend.activity.charAt(0).toUpperCase() + friend.activity.slice(1) : "Running"),
              avatar: friendAvatar,
              photos: friend.photos || [friendAvatar],
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
                  navigate("/chat", {
                    state: {
                      user: {
                        id: userData.id,
                        name: userData.name,
                        avatar: userData.avatar
                      }
                    }
                  });
                }
                setSelectedUser(null);
              }}
              onAddFriend={() => {
                if (isDiscoverUser) {
                  handleSendRequest(userData.id, userData.name);
                }
              }}
              onAcceptFriend={() => {
                if (isDiscoverUser && requests.incoming.includes(userData.id)) {
                  handleAcceptRequest(userData.id);
                }
              }}
              onDeclineFriend={() => {
                if (isDiscoverUser && requests.incoming.includes(userData.id)) {
                  handleDeclineRequest(userData.id);
                }
              }}
              onUnfriend={() => {
                if (isFriendId) {
                  const friend = friendsData[selectedUser];
                  const friendName = friend?.name || friend?.username || "User";
                  handleUnfriend(selectedUser, friendName);
                }
              }}
              onPoke={isWorkoutActive() ? () => {
                if (isDiscoverUser) {
                  handlePoke(userData.id);
                }
              } : undefined}
              hasPoked={isDiscoverUser ? (hasPokedUsers[userData.id] || false) : false}
              isWorkoutActive={isWorkoutActive()}
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
