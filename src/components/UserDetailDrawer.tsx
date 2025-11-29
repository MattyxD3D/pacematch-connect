// User Detail Drawer for Admin - Shows comprehensive user data
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { getUserData } from "@/services/authService";
import { getUserWorkouts } from "@/services/workoutService";
import { getUserFriends } from "@/services/friendService";
import { getUserConversations } from "@/services/messageService";
import { removeUserPhoto, removeUserPhotoURL, logAdminAction } from "@/services/adminService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import PeopleIcon from "@mui/icons-material/People";
import ChatIcon from "@mui/icons-material/Chat";
import CodeIcon from "@mui/icons-material/Code";
import DownloadIcon from "@mui/icons-material/Download";
import PhotoIcon from "@mui/icons-material/Photo";
import DeleteIcon from "@mui/icons-material/Delete";
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

interface UserDetailDrawerProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailDrawer = ({ userId, open, onOpenChange }: UserDetailDrawerProps) => {
  const { user: currentAdmin } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [deletePhotoDialog, setDeletePhotoDialog] = useState<{
    open: boolean;
    type: "photoURL" | "photo";
    index?: number;
  }>({ open: false, type: "photo" });

  useEffect(() => {
    if (open && userId) {
      loadUserData();
    } else {
      // Reset when closed
      setUserData(null);
      setWorkouts([]);
      setFriends([]);
      setConversations([]);
      setActiveTab("profile");
    }
  }, [open, userId]);

  const loadUserData = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Load user profile
      const profile = await getUserData(userId);
      setUserData(profile);

      // Load workouts
      try {
        const userWorkouts = await getUserWorkouts(userId);
        setWorkouts(userWorkouts || []);
      } catch (error) {
        console.error("Error loading workouts:", error);
      }

      // Load friends
      try {
        const userFriends = await getUserFriends(userId);
        setFriends(userFriends || []);
      } catch (error) {
        console.error("Error loading friends:", error);
      }

      // Load conversations
      try {
        const userConvs = await getUserConversations(userId);
        setConversations(userConvs || []);
      } catch (error) {
        console.error("Error loading conversations:", error);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!userData) return;

    const exportData = {
      profile: userData,
      workouts,
      friends,
      conversations,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-${userId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("User data exported");
  };

  const handleRemovePhoto = async () => {
    if (!userId) return;

    try {
      if (deletePhotoDialog.type === "photoURL") {
        await removeUserPhotoURL(userId);
        if (currentAdmin?.email) {
          await logAdminAction(currentAdmin.email, "remove_user_photo", {
            userId,
            userName: userData?.name,
            photoType: "photoURL"
          });
        }
        toast.success("Profile photo removed");
      } else if (deletePhotoDialog.type === "photo" && deletePhotoDialog.index !== undefined) {
        await removeUserPhoto(userId, deletePhotoDialog.index);
        if (currentAdmin?.email) {
          await logAdminAction(currentAdmin.email, "remove_user_photo", {
            userId,
            userName: userData?.name,
            photoType: "uploaded_photo",
            photoIndex: deletePhotoDialog.index
          });
        }
        toast.success("Photo removed");
      }
      
      // Reload user data to reflect changes
      await loadUserData();
      setDeletePhotoDialog({ open: false, type: "photo" });
    } catch (error) {
      console.error("Error removing photo:", error);
      toast.error("Failed to remove photo");
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  if (!userId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : userData ? (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={userData.photoURL} />
                    <AvatarFallback>
                      {userData.name?.[0]?.toUpperCase() || userData.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>{userData.name || "No name"}</SheetTitle>
                    <SheetDescription>{userId}</SheetDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportJSON}>
                  <DownloadIcon className="mr-2" style={{ fontSize: 16 }} />
                  Export JSON
                </Button>
              </div>
            </SheetHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="workouts">Workouts ({workouts.length})</TabsTrigger>
                <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
                <TabsTrigger value="messages">Messages ({conversations.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4 mt-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <EmailIcon style={{ fontSize: 18 }} />
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="text-sm">{userData.email || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PersonIcon style={{ fontSize: 18 }} />
                      <span className="text-sm text-muted-foreground">Activity:</span>
                      <Badge>{userData.activity || "N/A"}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarTodayIcon style={{ fontSize: 18 }} />
                      <span className="text-sm text-muted-foreground">Joined:</span>
                      <span className="text-sm">{formatDate(userData.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarTodayIcon style={{ fontSize: 18 }} />
                      <span className="text-sm text-muted-foreground">Last Activity:</span>
                      <span className="text-sm">{formatDate(userData.timestamp)}</span>
                    </div>
                    {userData.status && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge variant={userData.status === "banned" ? "destructive" : userData.status === "suspended" ? "warning" : "success"}>
                          {userData.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Location Data</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Latitude:</span> {userData.lat || "N/A"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Longitude:</span> {userData.lng || "N/A"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Visible:</span> {userData.visible ? "Yes" : "No"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">General Location:</span> {userData.generalLocation || "N/A"}
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Preferences</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Fitness Level:</span> {userData.fitnessLevel || "N/A"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Search Filter:</span> {userData.searchFilter || "N/A"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Radius Preference:</span> {userData.radiusPreference || "N/A"}
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Raw JSON Data</h3>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                    {JSON.stringify(userData, null, 2)}
                  </pre>
                </Card>
              </TabsContent>

              <TabsContent value="photos" className="space-y-4 mt-4">
                {/* Profile Photo (photoURL) */}
                {userData.photoURL && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Profile Photo (Auth)</h3>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletePhotoDialog({ open: true, type: "photoURL" })}
                      >
                        <DeleteIcon className="mr-1" style={{ fontSize: 16 }} />
                        Remove
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <img
                        src={userData.photoURL}
                        alt="Profile"
                        className="max-w-full h-auto max-h-64 rounded-lg border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </Card>
                )}

                {/* Uploaded Photos */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">
                      Uploaded Photos ({userData.photos?.length || 0})
                    </h3>
                  </div>
                  {!userData.photos || userData.photos.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No uploaded photos</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {userData.photos.map((photo: string, index: number) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-auto rounded-lg border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setDeletePhotoDialog({ open: true, type: "photo", index })}
                          >
                            <DeleteIcon style={{ fontSize: 16 }} />
                          </Button>
                          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            Photo {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="workouts" className="space-y-2 mt-4">
                {workouts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No workouts found</p>
                ) : (
                  workouts.map((workout, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <DirectionsRunIcon style={{ fontSize: 18 }} />
                            <span className="font-medium">{workout.activityType || workout.activity}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatDate(workout.date || workout.createdAt)}
                          </p>
                          {workout.distance && (
                            <p className="text-sm">Distance: {workout.distance} km</p>
                          )}
                          {workout.duration && (
                            <p className="text-sm">Duration: {Math.floor(workout.duration / 60)} min</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="friends" className="space-y-2 mt-4">
                {friends.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No friends found</p>
                ) : (
                  friends.map((friendId, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PeopleIcon style={{ fontSize: 18 }} />
                          <div>
                            <p className="font-medium">Friend ID: {friendId}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onOpenChange(false);
                            window.location.href = `/admin/users?search=${friendId}`;
                          }}
                        >
                          View User
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="messages" className="space-y-2 mt-4">
                {conversations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No conversations found</p>
                ) : (
                  conversations.map((conv, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ChatIcon style={{ fontSize: 18 }} />
                          <div>
                            <p className="font-medium">Conversation: {conv.conversationId || conv.id}</p>
                            {conv.lastMessage && (
                              <p className="text-sm text-muted-foreground truncate max-w-md">
                                {conv.lastMessage}
                              </p>
                            )}
                            {conv.lastMessageTime && (
                              <p className="text-xs text-muted-foreground">
                                {formatDate(conv.lastMessageTime)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>

            {/* Delete Photo Dialog */}
            <AlertDialog open={deletePhotoDialog.open}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Photo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove this photo from the user's profile? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeletePhotoDialog({ open: false, type: "photo" })}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemovePhoto}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            User not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default UserDetailDrawer;

