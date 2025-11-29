// Admin Dashboard - Main admin interface
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { signOut } from "@/services/authService";
import { getSystemStats } from "@/services/adminService";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import EventIcon from "@mui/icons-material/Event";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/admin/login", { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { getSystemStats } = await import("@/services/adminService");
        const statsData = await getSystemStats();
        setStats(statsData);
      } catch (error) {
        console.error("Error loading stats:", error);
        toast.error("Failed to load statistics");
      } finally {
        setLoadingStats(false);
      }
    };

    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/admin/login", { replace: true });
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Overview", icon: DashboardIcon, path: "/admin/dashboard" },
    { id: "users", label: "User Management", icon: PeopleIcon, path: "/admin/users" },
    { id: "analytics", label: "Analytics", icon: BarChartIcon, path: "/admin/analytics" },
    { id: "moderation", label: "Content Moderation", icon: ReportProblemIcon, path: "/admin/moderation" },
    { id: "comments", label: "Comment Moderation", icon: ChatBubbleOutlineIcon, path: "/admin/comments" },
    { id: "events", label: "Events", icon: EventIcon, path: "/admin/events" },
    { id: "venues", label: "Venues", icon: LocationOnIcon, path: "/admin/venues" },
    { id: "settings", label: "System Settings", icon: SettingsIcon, path: "/admin/settings" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ duration: 0.3 }}
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AdminPanelSettingsIcon className="text-destructive" style={{ fontSize: 24 }} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Admin Portal</h1>
              <p className="text-xs text-muted-foreground">PaceMatch</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== "/admin/dashboard" && currentPath.startsWith(item.path));
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => navigate(item.path)}
              >
                <Icon className="mr-3" style={{ fontSize: 20 }} />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback>
                {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.displayName || "Admin"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogoutIcon className="mr-2" style={{ fontSize: 18 }} />
            Logout
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </Button>
              <h2 className="text-2xl font-bold">
                {menuItems.find(item => currentPath === item.path || (item.path !== "/admin/dashboard" && currentPath.startsWith(item.path)))?.label || "Dashboard"}
              </h2>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentPath === "/admin/dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p className="text-3xl font-bold mt-2">
                        {loadingStats ? (
                          <span className="text-muted-foreground">...</span>
                        ) : (
                          stats?.totalUsers || 0
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <PeopleIcon className="text-primary" style={{ fontSize: 28 }} />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Users (30d)</p>
                      <p className="text-3xl font-bold mt-2">
                        {loadingStats ? (
                          <span className="text-muted-foreground">...</span>
                        ) : (
                          stats?.activeUsers || 0
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-success/10 rounded-lg">
                      <PeopleIcon className="text-success" style={{ fontSize: 28 }} />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Workouts</p>
                      <p className="text-3xl font-bold mt-2">
                        {loadingStats ? (
                          <span className="text-muted-foreground">...</span>
                        ) : (
                          stats?.totalWorkouts || 0
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-warning/10 rounded-lg">
                      <BarChartIcon className="text-warning" style={{ fontSize: 28 }} />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Reports</p>
                      <p className="text-3xl font-bold mt-2">
                        {loadingStats ? (
                          <span className="text-muted-foreground">...</span>
                        ) : (
                          stats?.pendingReports || 0
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-destructive/10 rounded-lg">
                      <ReportProblemIcon className="text-destructive" style={{ fontSize: 28 }} />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => navigate("/admin/users")}
                  >
                    <PeopleIcon className="mb-2" style={{ fontSize: 24 }} />
                    <span className="font-medium">Manage Users</span>
                    <span className="text-xs text-muted-foreground mt-1">View and manage all users</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => navigate("/admin/moderation")}
                  >
                    <ReportProblemIcon className="mb-2" style={{ fontSize: 24 }} />
                    <span className="font-medium">Review Reports</span>
                    <span className="text-xs text-muted-foreground mt-1">Moderate content and reports</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => navigate("/admin/settings")}
                  >
                    <SettingsIcon className="mb-2" style={{ fontSize: 24 }} />
                    <span className="font-medium">System Settings</span>
                    <span className="text-xs text-muted-foreground mt-1">Configure app settings</span>
                  </Button>
                </div>
              </Card>

              {/* Recent Activity Placeholder */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">Activity feed coming soon...</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

