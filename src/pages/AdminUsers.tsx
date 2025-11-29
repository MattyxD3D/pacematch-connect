// Admin Users Management Page
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UserDetailDrawer from "@/components/UserDetailDrawer";
import { getAllUsers, suspendUser, banUser, unbanUser, unsuspendUser, deleteUser, getUserReports, promoteUserToAdmin, demoteAdmin, isUserAdmin, logAdminAction } from "@/services/adminService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from "@mui/icons-material/Person";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";

interface User {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  status?: "active" | "suspended" | "banned";
  suspendedUntil?: number;
  suspendedReason?: string;
  bannedAt?: number;
  bannedReason?: string;
  createdAt?: number;
  timestamp?: number;
  isAdmin?: boolean;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "banned">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "suspend" | "ban" | "unban" | "unsuspend" | "delete" | "promote" | "demote" | null;
  }>({ open: false, type: null });
  const [adminStatuses, setAdminStatuses] = useState<Record<string, boolean>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      
      // Check admin status for each user
      const adminMap: Record<string, boolean> = {};
      for (const user of allUsers) {
        if (user.email) {
          adminMap[user.uid] = await isUserAdmin(user.email);
        }
      }
      setAdminStatuses(adminMap);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => {
        const status = user.status || "active";
        return status === statusFilter;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.uid.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleSuspend = async (user: User) => {
    try {
      await suspendUser(user.uid, 7, "Suspended by admin");
      if (currentAdmin?.email) {
        await logAdminAction(currentAdmin.email, "suspend_user", {
          userId: user.uid,
          userName: user.name,
          userEmail: user.email
        });
      }
      toast.success(`User ${user.name || user.email} has been suspended`);
      await loadUsers();
      setActionDialog({ open: false, type: null });
    } catch (error) {
      console.error("Error suspending user:", error);
      toast.error("Failed to suspend user");
    }
  };

  const handleBan = async (user: User) => {
    try {
      await banUser(user.uid, "Banned by admin");
      if (currentAdmin?.email) {
        await logAdminAction(currentAdmin.email, "ban_user", {
          userId: user.uid,
          userName: user.name,
          userEmail: user.email
        });
      }
      toast.success(`User ${user.name || user.email} has been banned`);
      await loadUsers();
      setActionDialog({ open: false, type: null });
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Failed to ban user");
    }
  };

  const handleUnban = async (user: User) => {
    try {
      await unbanUser(user.uid);
      toast.success(`User ${user.name || user.email} has been unbanned`);
      await loadUsers();
      setActionDialog({ open: false, type: null });
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error("Failed to unban user");
    }
  };

  const handleUnsuspend = async (user: User) => {
    try {
      await unsuspendUser(user.uid);
      toast.success(`User ${user.name || user.email} has been unsuspended`);
      await loadUsers();
      setActionDialog({ open: false, type: null });
    } catch (error) {
      console.error("Error unsuspending user:", error);
      toast.error("Failed to unsuspend user");
    }
  };

  const handleDelete = async (user: User) => {
    try {
      await deleteUser(user.uid);
      if (currentAdmin?.email) {
        await logAdminAction(currentAdmin.email, "delete_user", {
          userId: user.uid,
          userName: user.name,
          userEmail: user.email
        });
      }
      toast.success(`User ${user.name || user.email} has been deleted`);
      await loadUsers();
      setActionDialog({ open: false, type: null });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleViewReports = async (user: User) => {
    try {
      const reports = await getUserReports(user.uid);
      if (reports.length === 0) {
        toast.info("No reports found for this user");
      } else {
        navigate(`/admin/moderation?userId=${user.uid}`);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Failed to load reports");
    }
  };

  const handlePromoteToAdmin = async (user: User) => {
    if (!user.email) {
      toast.error("User email is required to promote to admin");
      return;
    }
    try {
      await promoteUserToAdmin(user.email);
      if (currentAdmin?.email) {
        await logAdminAction(currentAdmin.email, "promote_admin", {
          promotedEmail: user.email,
          promotedUserId: user.uid,
          promotedUserName: user.name
        });
      }
      toast.success(`${user.name || user.email} has been promoted to admin`);
      await loadUsers();
      setActionDialog({ open: false, type: null });
    } catch (error) {
      console.error("Error promoting user:", error);
      toast.error("Failed to promote user to admin");
    }
  };

  const handleDemoteAdmin = async (user: User) => {
    if (!user.email) {
      toast.error("User email is required to demote admin");
      return;
    }
    try {
      await demoteAdmin(user.email);
      if (currentAdmin?.email) {
        await logAdminAction(currentAdmin.email, "demote_admin", {
          demotedEmail: user.email,
          demotedUserId: user.uid,
          demotedUserName: user.name
        });
      }
      toast.success(`${user.name || user.email} has been demoted from admin`);
      await loadUsers();
      setActionDialog({ open: false, type: null });
    } catch (error) {
      console.error("Error demoting admin:", error);
      toast.error("Failed to demote admin");
    }
  };

  const getStatusBadge = (user: User) => {
    const status = user.status || "active";
    
    if (status === "banned") {
      return <Badge variant="destructive">Banned</Badge>;
    }
    if (status === "suspended") {
      const isExpired = user.suspendedUntil && user.suspendedUntil < Date.now();
      return (
        <Badge variant={isExpired ? "secondary" : "warning"}>
          {isExpired ? "Suspension Expired" : "Suspended"}
        </Badge>
      );
    }
    return <Badge variant="success">Active</Badge>;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
              ← Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all users, view profiles, and moderate accounts
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {filteredUsers.length} users
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
            <Input
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => setStatusFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "suspended" ? "default" : "outline"}
              onClick={() => setStatusFilter("suspended")}
            >
              Suspended
            </Button>
            <Button
              variant={statusFilter === "banned" ? "default" : "outline"}
              onClick={() => setStatusFilter("banned")}
            >
              Banned
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback>
                            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <button
                            onClick={() => {
                              setSelectedUserId(user.uid);
                              setUserDetailOpen(true);
                            }}
                            className="font-medium hover:underline text-left"
                          >
                            {user.name || "No name"}
                          </button>
                          <p className="text-xs text-muted-foreground">{user.uid}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.email || "N/A"}
                        {adminStatuses[user.uid] && (
                          <Badge variant="default" className="ml-2">
                            <AdminPanelSettingsIcon className="mr-1" style={{ fontSize: 12 }} />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>{formatDate(user.timestamp)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertIcon style={{ fontSize: 20 }} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewReports(user)}>
                            <ReportProblemIcon className="mr-2" style={{ fontSize: 18 }} />
                            View Reports
                          </DropdownMenuItem>
                          {!adminStatuses[user.uid] && user.email && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setActionDialog({ open: true, type: "promote" });
                              }}
                              className="text-primary"
                            >
                              <AdminPanelSettingsIcon className="mr-2" style={{ fontSize: 18 }} />
                              Promote to Admin
                            </DropdownMenuItem>
                          )}
                          {adminStatuses[user.uid] && user.email && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setActionDialog({ open: true, type: "demote" });
                              }}
                              className="text-warning"
                            >
                              <PersonRemoveIcon className="mr-2" style={{ fontSize: 18 }} />
                              Demote from Admin
                            </DropdownMenuItem>
                          )}
                          {user.status === "active" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionDialog({ open: true, type: "suspend" });
                                }}
                              >
                                <BlockIcon className="mr-2" style={{ fontSize: 18 }} />
                                Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionDialog({ open: true, type: "ban" });
                                }}
                                className="text-destructive"
                              >
                                <BlockIcon className="mr-2" style={{ fontSize: 18 }} />
                                Ban
                              </DropdownMenuItem>
                            </>
                          )}
                          {user.status === "suspended" && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setActionDialog({ open: true, type: "unsuspend" });
                              }}
                            >
                              <CheckCircleIcon className="mr-2" style={{ fontSize: 18 }} />
                              Unsuspend
                            </DropdownMenuItem>
                          )}
                          {user.status === "banned" && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setActionDialog({ open: true, type: "unban" });
                              }}
                            >
                              <CheckCircleIcon className="mr-2" style={{ fontSize: 18 }} />
                              Unban
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setActionDialog({ open: true, type: "delete" });
                            }}
                            className="text-destructive"
                          >
                            <DeleteIcon className="mr-2" style={{ fontSize: 18 }} />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Action Dialogs */}
      <AlertDialog open={actionDialog.open && actionDialog.type === "suspend"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend {selectedUser?.name || selectedUser?.email}? 
              The user will be unable to access the app for 7 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionDialog({ open: false, type: null })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedUser && handleSuspend(selectedUser)}>
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog.open && actionDialog.type === "ban"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently ban {selectedUser?.name || selectedUser?.email}? 
              This action cannot be undone easily.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionDialog({ open: false, type: null })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedUser && handleBan(selectedUser)}>
              Ban
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog.open && actionDialog.type === "unban"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unban {selectedUser?.name || selectedUser?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionDialog({ open: false, type: null })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedUser && handleUnban(selectedUser)}>
              Unban
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog.open && actionDialog.type === "unsuspend"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsuspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unsuspend {selectedUser?.name || selectedUser?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionDialog({ open: false, type: null })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedUser && handleUnsuspend(selectedUser)}>
              Unsuspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog.open && actionDialog.type === "delete"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {selectedUser?.name || selectedUser?.email}? 
              This will remove all user data including workouts, friends, and messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionDialog({ open: false, type: null })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && handleDelete(selectedUser)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog.open && actionDialog.type === "promote"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to promote {selectedUser?.name || selectedUser?.email} to admin? 
              They will have full access to the admin dashboard and all administrative functions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionDialog({ open: false, type: null })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedUser && handlePromoteToAdmin(selectedUser)}>
              Promote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog.open && actionDialog.type === "demote"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Demote from Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin privileges from {selectedUser?.name || selectedUser?.email}? 
              They will no longer have access to the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionDialog({ open: false, type: null })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedUser && handleDemoteAdmin(selectedUser)}>
              Demote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Detail Drawer */}
      <UserDetailDrawer
        userId={selectedUserId}
        open={userDetailOpen}
        onOpenChange={setUserDetailOpen}
      />
    </div>
  );
};

export default AdminUsers;

