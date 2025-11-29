// Admin Comments Moderation Page
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ref, get } from "firebase/database";
import { database } from "@/services/firebase";
import { Event, EventComment, deleteComment, getAllEventComments } from "@/services/eventService";
import { getUserData } from "@/services/authService";
import { logAdminAction, sendAdminNotification, warnUser } from "@/services/adminService";
import { suspendCommenting, restoreCommenting, isCommentingSuspended, CommentingSuspension } from "@/services/userService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/Warning";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import RefreshIcon from "@mui/icons-material/Refresh";

interface CommentWithContext extends EventComment {
  eventId: string;
  eventTitle: string;
}

interface UserSuspensionStatus {
  [userId: string]: CommentingSuspension | null;
}

const AdminComments = () => {
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();
  const [comments, setComments] = useState<CommentWithContext[]>([]);
  const [filteredComments, setFilteredComments] = useState<CommentWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComment, setSelectedComment] = useState<CommentWithContext | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [warnDialog, setWarnDialog] = useState(false);
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [warnReason, setWarnReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState<number>(7); // days
  const [userData, setUserData] = useState<Record<string, any>>({});
  const [userSuspensions, setUserSuspensions] = useState<UserSuspensionStatus>({});

  useEffect(() => {
    loadComments();
  }, []);

  useEffect(() => {
    filterComments();
  }, [comments, searchQuery]);

  const loadComments = async () => {
    try {
      setLoading(true);
      
      // First get all events
      const eventsRef = ref(database, "events");
      const eventsSnapshot = await get(eventsRef);

      if (!eventsSnapshot.exists()) {
        setComments([]);
        return;
      }

      const allComments: CommentWithContext[] = [];
      const userIds = new Set<string>();

      // Get comments from each event
      eventsSnapshot.forEach((eventChild) => {
        const eventData = eventChild.val() as Event;
        const eventId = eventChild.key!;
        const eventTitle = eventData.title || "Untitled Event";

        if (eventData.comments) {
          Object.entries(eventData.comments).forEach(([commentId, commentData]: [string, any]) => {
            allComments.push({
              ...commentData,
              id: commentId,
              eventId,
              eventTitle
            });
            userIds.add(commentData.userId);
          });
        }
        return false;
      });

      // Sort by timestamp (newest first)
      allComments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setComments(allComments);

      // Load user data and suspension status
      const userDataMap: Record<string, any> = {};
      const suspensionMap: UserSuspensionStatus = {};
      
      for (const userId of userIds) {
        try {
          const data = await getUserData(userId);
          if (data) {
            userDataMap[userId] = data;
          }
          const suspension = await isCommentingSuspended(userId);
          suspensionMap[userId] = suspension;
        } catch (error) {
          console.error(`Error loading user ${userId}:`, error);
        }
      }
      
      setUserData(userDataMap);
      setUserSuspensions(suspensionMap);
    } catch (error) {
      console.error("Error loading comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const filterComments = () => {
    let filtered = [...comments];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((comment) =>
        comment.text.toLowerCase().includes(query) ||
        comment.userName.toLowerCase().includes(query) ||
        comment.eventTitle.toLowerCase().includes(query)
      );
    }

    setFilteredComments(filtered);
  };

  const handleDeleteComment = async () => {
    if (!selectedComment || !currentAdmin?.uid) return;

    try {
      await deleteComment(selectedComment.eventId, selectedComment.id, currentAdmin.uid, true);
      
      // Log admin action
      await logAdminAction(currentAdmin.email || "admin", "delete_comment", {
        commentId: selectedComment.id,
        eventId: selectedComment.eventId,
        userId: selectedComment.userId,
        reason: deleteReason
      });

      // Send notification to user
      await sendAdminNotification({
        userId: selectedComment.userId,
        adminId: currentAdmin.uid,
        adminName: currentAdmin.displayName || "Admin",
        actionType: "comment_deleted",
        reason: deleteReason || "Violation of community guidelines",
        eventId: selectedComment.eventId,
        eventTitle: selectedComment.eventTitle
      });

      toast.success("Comment deleted successfully");
      setDeleteDialog(false);
      setSelectedComment(null);
      setDeleteReason("");
      loadComments();
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast.error(error.message || "Failed to delete comment");
    }
  };

  const handleWarnUser = async () => {
    if (!selectedComment || !currentAdmin?.uid) return;

    try {
      await warnUser(
        selectedComment.userId,
        currentAdmin.uid,
        currentAdmin.displayName || "Admin",
        warnReason || "Inappropriate comment"
      );

      toast.success("Warning sent to user");
      setWarnDialog(false);
      setSelectedComment(null);
      setWarnReason("");
    } catch (error: any) {
      console.error("Error warning user:", error);
      toast.error(error.message || "Failed to send warning");
    }
  };

  const handleSuspendCommenting = async () => {
    if (!selectedComment || !currentAdmin?.uid) return;

    try {
      const suspendedUntil = Date.now() + (suspendDuration * 24 * 60 * 60 * 1000);
      
      await suspendCommenting(
        selectedComment.userId,
        currentAdmin.uid,
        suspendReason || "Repeated violations",
        suspendedUntil
      );

      // Log admin action
      await logAdminAction(currentAdmin.email || "admin", "suspend_commenting", {
        userId: selectedComment.userId,
        reason: suspendReason,
        duration: suspendDuration
      });

      // Send notification to user
      await sendAdminNotification({
        userId: selectedComment.userId,
        adminId: currentAdmin.uid,
        adminName: currentAdmin.displayName || "Admin",
        actionType: "comment_suspended",
        reason: suspendReason || "Repeated violations"
      });

      toast.success(`User commenting suspended for ${suspendDuration} days`);
      setSuspendDialog(false);
      setSelectedComment(null);
      setSuspendReason("");
      setSuspendDuration(7);
      
      // Update suspension status
      setUserSuspensions((prev) => ({
        ...prev,
        [selectedComment.userId]: {
          suspended: true,
          suspendedAt: Date.now(),
          suspendedUntil,
          reason: suspendReason,
          adminId: currentAdmin.uid
        }
      }));
    } catch (error: any) {
      console.error("Error suspending commenting:", error);
      toast.error(error.message || "Failed to suspend commenting");
    }
  };

  const handleRestoreCommenting = async (userId: string) => {
    if (!currentAdmin?.uid) return;

    try {
      await restoreCommenting(userId);

      // Log admin action
      await logAdminAction(currentAdmin.email || "admin", "restore_commenting", {
        userId
      });

      // Send notification to user
      await sendAdminNotification({
        userId,
        adminId: currentAdmin.uid,
        adminName: currentAdmin.displayName || "Admin",
        actionType: "comment_restored",
        reason: "Privileges restored"
      });

      toast.success("User commenting privileges restored");
      
      // Update suspension status
      setUserSuspensions((prev) => ({
        ...prev,
        [userId]: null
      }));
    } catch (error: any) {
      console.error("Error restoring commenting:", error);
      toast.error(error.message || "Failed to restore commenting");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Comment Moderation</h1>
          <p className="text-muted-foreground">
            Review and moderate user comments across all events
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadComments} disabled={loading}>
            <RefreshIcon className="mr-2" style={{ fontSize: 18 }} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ChatBubbleOutlineIcon className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{comments.length}</p>
              <p className="text-sm text-muted-foreground">Total Comments</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <BlockIcon className="text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.values(userSuspensions).filter(s => s !== null).length}
              </p>
              <p className="text-sm text-muted-foreground">Suspended Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <EventIcon className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {new Set(comments.map(c => c.eventId)).size}
              </p>
              <p className="text-sm text-muted-foreground">Events with Comments</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
          <Input
            placeholder="Search by comment text, user, or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Comments Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading comments...
                </TableCell>
              </TableRow>
            ) : filteredComments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No comments found
                </TableCell>
              </TableRow>
            ) : (
              filteredComments.map((comment) => (
                <TableRow key={`${comment.eventId}-${comment.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={comment.userAvatar}
                        alt={comment.userName}
                        sx={{ width: 32, height: 32 }}
                      />
                      <div>
                        <p className="font-medium">{comment.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {userData[comment.userId]?.email || comment.userId.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-xs truncate">{comment.text}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{comment.eventTitle}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(comment.timestamp)}
                    </p>
                  </TableCell>
                  <TableCell>
                    {userSuspensions[comment.userId] ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedComment(comment);
                          setWarnDialog(true);
                        }}
                        title="Warn User"
                      >
                        <WarningIcon style={{ fontSize: 18 }} className="text-yellow-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedComment(comment);
                          setDeleteDialog(true);
                        }}
                        title="Delete Comment"
                      >
                        <DeleteIcon style={{ fontSize: 18 }} className="text-destructive" />
                      </Button>
                      {userSuspensions[comment.userId] ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestoreCommenting(comment.userId)}
                          title="Restore Commenting"
                        >
                          <CheckCircleIcon style={{ fontSize: 18 }} className="text-green-500" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedComment(comment);
                            setSuspendDialog(true);
                          }}
                          title="Suspend Commenting"
                        >
                          <BlockIcon style={{ fontSize: 18 }} className="text-orange-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Comment Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? The user will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium mb-2">Comment:</p>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              "{selectedComment?.text}"
            </p>
            <div className="mt-4">
              <label className="text-sm font-medium">Reason for deletion:</label>
              <Textarea
                placeholder="Enter reason for deletion..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteReason("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive text-destructive-foreground">
              Delete Comment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Warn User Dialog */}
      <Dialog open={warnDialog} onOpenChange={setWarnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warn User</DialogTitle>
            <DialogDescription>
              Send a warning to {selectedComment?.userName} about their comment.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium mb-2">Comment:</p>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              "{selectedComment?.text}"
            </p>
            <div className="mt-4">
              <label className="text-sm font-medium">Warning message:</label>
              <Textarea
                placeholder="Enter warning message..."
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setWarnDialog(false);
              setWarnReason("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleWarnUser} className="bg-yellow-500 hover:bg-yellow-600">
              <WarningIcon className="mr-2" style={{ fontSize: 18 }} />
              Send Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Commenting Dialog */}
      <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Commenting Privileges</DialogTitle>
            <DialogDescription>
              Suspend {selectedComment?.userName}'s ability to comment on events.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Suspension duration (days):</label>
              <Input
                type="number"
                min={1}
                max={365}
                value={suspendDuration}
                onChange={(e) => setSuspendDuration(Number(e.target.value))}
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Reason for suspension:</label>
              <Textarea
                placeholder="Enter reason for suspension..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSuspendDialog(false);
              setSuspendReason("");
              setSuspendDuration(7);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSuspendCommenting} className="bg-orange-500 hover:bg-orange-600">
              <BlockIcon className="mr-2" style={{ fontSize: 18 }} />
              Suspend Commenting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminComments;

