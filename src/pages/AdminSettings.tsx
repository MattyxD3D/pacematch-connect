// Admin System Settings Page
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { ref, get, set, remove } from "firebase/database";
import { database } from "@/services/firebase";
import { getAdminEmails, addAdminEmail, removeAdminEmail, getAdminLogs, logAdminAction } from "@/services/adminService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import SettingsIcon from "@mui/icons-material/Settings";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";
import HistoryIcon from "@mui/icons-material/History";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingEmail, setAddingEmail] = useState(false);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; email: string | null }>({
    open: false,
    email: null
  });

  // Feature flags
  const [featureFlags, setFeatureFlags] = useState({
    newRegistrations: true,
    workoutTracking: true,
    nearbyUsers: true,
    notifications: true,
    maintenanceMode: false
  });

  useEffect(() => {
    loadSettings();
    loadAdminLogs();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load admin emails
      const emails = await getAdminEmails();
      setAdminEmails(emails);

      // Load feature flags
      const flagsRef = ref(database, "systemSettings/featureFlags");
      const flagsSnapshot = await get(flagsRef);
      if (flagsSnapshot.exists()) {
        setFeatureFlags({
          ...featureFlags,
          ...flagsSnapshot.val()
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const loadAdminLogs = async () => {
    try {
      setLoadingLogs(true);
      const logs = await getAdminLogs(50);
      setAdminLogs(logs);
    } catch (error) {
      console.error("Error loading admin logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleAddAdminEmail = async () => {
    if (!newAdminEmail || !newAdminEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (adminEmails.includes(newAdminEmail)) {
      toast.error("This email is already an admin");
      return;
    }

    try {
      setAddingEmail(true);
      await addAdminEmail(newAdminEmail);
      if (currentAdmin?.email) {
        await logAdminAction(currentAdmin.email, "add_admin_email", {
          addedEmail: newAdminEmail
        });
      }
      toast.success(`Admin email ${newAdminEmail} added successfully`);
      setNewAdminEmail("");
      await loadSettings();
      await loadAdminLogs();
    } catch (error) {
      console.error("Error adding admin email:", error);
      toast.error("Failed to add admin email");
    } finally {
      setAddingEmail(false);
    }
  };

  const handleRemoveAdminEmail = async (email: string) => {
    try {
      await removeAdminEmail(email);
      if (currentAdmin?.email) {
        await logAdminAction(currentAdmin.email, "remove_admin_email", {
          removedEmail: email
        });
      }
      toast.success(`Admin email ${email} removed successfully`);
      await loadSettings();
      await loadAdminLogs();
      setDeleteDialog({ open: false, email: null });
    } catch (error) {
      console.error("Error removing admin email:", error);
      toast.error("Failed to remove admin email");
    }
  };

  const handleToggleFeatureFlag = async (flag: keyof typeof featureFlags) => {
    try {
      const newValue = !featureFlags[flag];
      const flagsRef = ref(database, `systemSettings/featureFlags/${flag}`);
      await set(flagsRef, newValue);
      
      setFeatureFlags({
        ...featureFlags,
        [flag]: newValue
      });
      
      toast.success(`${flag} ${newValue ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error updating feature flag:", error);
      toast.error("Failed to update setting");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatLogDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      promote_admin: "Promoted User to Admin",
      demote_admin: "Demoted Admin",
      suspend_user: "Suspended User",
      ban_user: "Banned User",
      unban_user: "Unbanned User",
      delete_user: "Deleted User",
      resolve_report: "Resolved Report",
      delete_event: "Deleted Event",
      cancel_event: "Cancelled Event",
      add_admin_email: "Added Admin Email",
      remove_admin_email: "Removed Admin Email"
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure app settings and manage admin access
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="admins">Admin List</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">

      {/* Feature Flags */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Feature Flags</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-registrations">New Registrations</Label>
              <p className="text-sm text-muted-foreground">
                Allow new users to sign up
              </p>
            </div>
            <Switch
              id="new-registrations"
              checked={featureFlags.newRegistrations}
              onCheckedChange={() => handleToggleFeatureFlag("newRegistrations")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="workout-tracking">Workout Tracking</Label>
              <p className="text-sm text-muted-foreground">
                Enable workout tracking features
              </p>
            </div>
            <Switch
              id="workout-tracking"
              checked={featureFlags.workoutTracking}
              onCheckedChange={() => handleToggleFeatureFlag("workoutTracking")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="nearby-users">Nearby Users</Label>
              <p className="text-sm text-muted-foreground">
                Show nearby users on map
              </p>
            </div>
            <Switch
              id="nearby-users"
              checked={featureFlags.nearbyUsers}
              onCheckedChange={() => handleToggleFeatureFlag("nearbyUsers")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Enable push notifications
              </p>
            </div>
            <Switch
              id="notifications"
              checked={featureFlags.notifications}
              onCheckedChange={() => handleToggleFeatureFlag("notifications")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Disable app access for maintenance
              </p>
            </div>
            <Switch
              id="maintenance-mode"
              checked={featureFlags.maintenanceMode}
              onCheckedChange={() => handleToggleFeatureFlag("maintenanceMode")}
            />
          </div>
        </div>
      </Card>

        {/* Admin Email Management */}
        <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Admin Email Management</h3>
        
        {/* Add Admin Email */}
        <div className="mb-6">
          <Label htmlFor="new-admin-email" className="mb-2 block">
            Add New Admin Email
          </Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <EmailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
              <Input
                id="new-admin-email"
                type="email"
                placeholder="admin@example.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddAdminEmail();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleAddAdminEmail}
              disabled={addingEmail || !newAdminEmail}
            >
              <AddIcon className="mr-2" style={{ fontSize: 18 }} />
              Add
            </Button>
          </div>
        </div>

        {/* Admin Emails List */}
        <div>
          <Label className="mb-2 block">Current Admin Emails</Label>
          {adminEmails.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No admin emails configured
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminEmails.map((email) => (
                  <TableRow key={email}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EmailIcon style={{ fontSize: 18 }} />
                        <span>{email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, email })}
                      >
                        <DeleteIcon className="mr-1" style={{ fontSize: 16 }} />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

        {/* System Information */}
        <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">App Version</span>
            <span className="text-sm font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Database</span>
            <span className="text-sm font-medium">Firebase Realtime Database</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Last Updated</span>
            <span className="text-sm font-medium">
              {new Date().toLocaleString()}
            </span>
          </div>
        </div>
      </Card>

        {/* Database Management */}
        <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Database Management</h3>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Database management operations should be performed through the Firebase Console.
          </p>
          <Button
            variant="outline"
            onClick={() => window.open("https://console.firebase.google.com", "_blank")}
          >
            Open Firebase Console
          </Button>
        </div>
      </Card>

        </TabsContent>

        <TabsContent value="admins" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Current Admin Emails</h3>
            {adminEmails.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No admin emails configured
              </p>
            ) : (
              <div className="space-y-2">
                {adminEmails.map((email) => (
                  <div key={email} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <EmailIcon style={{ fontSize: 18 }} />
                      <span>{email}</span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, email })}
                    >
                      <DeleteIcon className="mr-1" style={{ fontSize: 16 }} />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Admin Activity Logs</h3>
              <Button variant="outline" size="sm" onClick={loadAdminLogs} disabled={loadingLogs}>
                <HistoryIcon className="mr-2" style={{ fontSize: 16 }} />
                Refresh
              </Button>
            </div>
            {loadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : adminLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No admin logs found
              </p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {adminLogs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{getActionLabel(log.action)}</Badge>
                          <span className="text-sm text-muted-foreground">
                            by {log.adminEmail}
                          </span>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <pre className="bg-muted p-2 rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatLogDate(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Admin Email Dialog */}
      <AlertDialog open={deleteDialog.open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Email</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deleteDialog.email} from admin access? 
              This user will no longer be able to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, email: null })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.email && handleRemoveAdminEmail(deleteDialog.email)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSettings;

