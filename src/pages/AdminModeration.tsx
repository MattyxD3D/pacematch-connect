// Admin Content Moderation Page
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Avatar from "@mui/material/Avatar";
import { getAllReports, resolveReport, logAdminAction } from "@/services/adminService";
import { getUserData } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PersonIcon from "@mui/icons-material/Person";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";

interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  description?: string;
  reportedAt: number;
  status?: "pending" | "resolved";
  resolvedAt?: number;
  resolvedAction?: string;
}

const AdminModeration = () => {
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved">("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "resolve" | "dismiss" | null;
  }>({ open: false, action: null });
  const [userData, setUserData] = useState<Record<string, any>>({});
  const [showProfileView, setShowProfileView] = useState(false);
  const [profileViewType, setProfileViewType] = useState<"reporter" | "reported">("reported");

  const userIdFilter = searchParams.get("userId");

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, statusFilter, userIdFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const allReports = await getAllReports();
      setReports(allReports);

      // Load user data for all unique user IDs
      const userIds = new Set<string>();
      allReports.forEach((report: Report) => {
        userIds.add(report.reporterId);
        userIds.add(report.reportedUserId);
      });

      const userDataMap: Record<string, any> = {};
      for (const userId of userIds) {
        try {
          const data = await getUserData(userId);
          if (data) {
            userDataMap[userId] = data;
          }
        } catch (error) {
          console.error(`Error loading user ${userId}:`, error);
        }
      }
      setUserData(userDataMap);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    // Filter by user ID if specified
    if (userIdFilter) {
      filtered = filtered.filter(
        report => report.reportedUserId === userIdFilter
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(report => {
        const status = report.status || "pending";
        return status === statusFilter;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report => {
        const reporterName = userData[report.reporterId]?.name || "";
        const reportedName = userData[report.reportedUserId]?.name || "";
        return (
          report.reason?.toLowerCase().includes(query) ||
          report.description?.toLowerCase().includes(query) ||
          reporterName.toLowerCase().includes(query) ||
          reportedName.toLowerCase().includes(query)
        );
      });
    }

    setFilteredReports(filtered);
  };

  const handleResolve = async (report: Report, action: string = "resolved") => {
    try {
      await resolveReport(report.id, action);
      if (currentAdmin?.email) {
        await logAdminAction(currentAdmin.email, "resolve_report", {
          reportId: report.id,
          reportedUserId: report.reportedUserId,
          reporterId: report.reporterId,
          reason: report.reason,
          action
        });
      }
      toast.success("Report resolved");
      await loadReports();
      setActionDialog({ open: false, action: null });
    } catch (error) {
      console.error("Error resolving report:", error);
      toast.error("Failed to resolve report");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      harassment: "destructive",
      spam: "warning",
      inappropriate: "destructive",
      fake: "secondary",
      other: "default"
    };
    return <Badge variant={colors[reason.toLowerCase()] as any || "default"}>{reason}</Badge>;
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
          <h1 className="text-3xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage user reports
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredReports.length} reports
          {userIdFilter && ` (filtered by user)`}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
            <Input
              placeholder="Search reports..."
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
              variant={statusFilter === "pending" ? "default" : "outline"}
              onClick={() => setStatusFilter("pending")}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === "resolved" ? "default" : "outline"}
              onClick={() => setStatusFilter("resolved")}
            >
              Resolved
            </Button>
          </div>
          {userIdFilter && (
            <Button
              variant="outline"
              onClick={() => navigate("/admin/moderation")}
            >
              Clear Filter
            </Button>
          )}
        </div>
      </Card>

      {/* Reports Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reported User</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => {
                  const reportedUser = userData[report.reportedUserId];
                  const reporter = userData[report.reporterId];
                  const status = report.status || "pending";

                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PersonIcon style={{ fontSize: 18 }} />
                          <div>
                            <p className="font-medium">
                              {reportedUser?.name || "Unknown User"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {report.reportedUserId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PersonIcon style={{ fontSize: 18 }} />
                          <div>
                            <p className="text-sm font-medium">
                              {reporter?.name || "Unknown User"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {report.reporterId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getReasonBadge(report.reason)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {report.description || "No description"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(report.reportedAt)}
                      </TableCell>
                      <TableCell>
                        {status === "resolved" ? (
                          <Badge variant="success">Resolved</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          {status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setActionDialog({ open: true, action: "resolve" });
                                }}
                              >
                                <CheckCircleIcon className="mr-1" style={{ fontSize: 16 }} />
                                Resolve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setActionDialog({ open: true, action: "dismiss" });
                                }}
                              >
                                <CancelIcon className="mr-1" style={{ fontSize: 16 }} />
                                Dismiss
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setProfileViewType("reported");
                              setShowProfileView(true);
                            }}
                            title="View reported user profile"
                          >
                            <PersonIcon className="mr-1" style={{ fontSize: 16 }} />
                            View Reported
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedReport(report);
                              setProfileViewType("reporter");
                              setShowProfileView(true);
                            }}
                            title="View reporter profile"
                          >
                            <PersonIcon className="mr-1" style={{ fontSize: 16 }} />
                            View Reporter
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Action Dialogs */}
      <AlertDialog open={actionDialog.open && actionDialog.action === "resolve"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this report as resolved? 
              You can take action on the reported user from the User Management page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionDialog({ open: false, action: null })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedReport && handleResolve(selectedReport, "resolved")}>
              Resolve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={actionDialog.open && actionDialog.action === "dismiss"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dismiss Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to dismiss this report? This will mark it as resolved without taking action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionDialog({ open: false, action: null })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedReport && handleResolve(selectedReport, "dismissed")}>
              Dismiss
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detailed Profile View Dialog */}
      <Dialog open={showProfileView} onOpenChange={setShowProfileView}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              View profiles of both users involved in this report
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6 mt-4">
              {/* Report Information */}
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Reason:</span>
                    {getReasonBadge(selectedReport.reason)}
                  </div>
                  {selectedReport.description && (
                    <div>
                      <span className="text-sm font-medium">Description:</span>
                      <p className="text-sm text-muted-foreground mt-1">{selectedReport.description}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Reported At:</span>
                    <span className="text-sm text-muted-foreground">{formatDate(selectedReport.reportedAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    {selectedReport.status === "resolved" ? (
                      <Badge variant="success">Resolved</Badge>
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>
                </div>
              </Card>

              {/* User Profiles */}
              <Tabs defaultValue={profileViewType} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="reported">Reported User</TabsTrigger>
                  <TabsTrigger value="reporter">Reporter</TabsTrigger>
                </TabsList>
                
                <TabsContent value="reported" className="space-y-4 mt-4">
                  {userData[selectedReport.reportedUserId] ? (
                    <Card className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={userData[selectedReport.reportedUserId]?.photoURL || `https://ui-avatars.com/api/?name=${userData[selectedReport.reportedUserId]?.name || 'User'}`}
                          alt={userData[selectedReport.reportedUserId]?.name || "User"}
                          sx={{ width: 80, height: 80 }}
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <h3 className="text-xl font-bold">
                              {userData[selectedReport.reportedUserId]?.name || "Unknown User"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {userData[selectedReport.reportedUserId]?.username || ""}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {userData[selectedReport.reportedUserId]?.email || ""}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              User ID: {selectedReport.reportedUserId}
                            </p>
                          </div>
                          {userData[selectedReport.reportedUserId]?.bio && (
                            <div className="pt-2 border-t border-border">
                              <p className="text-sm text-muted-foreground">
                                {userData[selectedReport.reportedUserId].bio}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/users?search=${selectedReport.reportedUserId}`)}
                            >
                              View Full Profile
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowProfileView(false);
                                navigate(`/admin/users?search=${selectedReport.reportedUserId}`);
                              }}
                            >
                              Manage User
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-6">
                      <p className="text-muted-foreground">Loading user data...</p>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="reporter" className="space-y-4 mt-4">
                  {userData[selectedReport.reporterId] ? (
                    <Card className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={userData[selectedReport.reporterId]?.photoURL || `https://ui-avatars.com/api/?name=${userData[selectedReport.reporterId]?.name || 'User'}`}
                          alt={userData[selectedReport.reporterId]?.name || "User"}
                          sx={{ width: 80, height: 80 }}
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <h3 className="text-xl font-bold">
                              {userData[selectedReport.reporterId]?.name || "Unknown User"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {userData[selectedReport.reporterId]?.username || ""}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {userData[selectedReport.reporterId]?.email || ""}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              User ID: {selectedReport.reporterId}
                            </p>
                          </div>
                          {userData[selectedReport.reporterId]?.bio && (
                            <div className="pt-2 border-t border-border">
                              <p className="text-sm text-muted-foreground">
                                {userData[selectedReport.reporterId].bio}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/users?search=${selectedReport.reporterId}`)}
                            >
                              View Full Profile
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowProfileView(false);
                                navigate(`/admin/users?search=${selectedReport.reporterId}`);
                              }}
                            >
                              Manage User
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-6">
                      <p className="text-muted-foreground">Loading user data...</p>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModeration;

