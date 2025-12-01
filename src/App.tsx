import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { UserProvider } from "@/contexts/UserContext";
import { NotificationSystem } from "@/components/NotificationSystem";
import { useNotificationContext } from "@/contexts/NotificationContext";
import LoginScreen from "./pages/LoginScreen";
import ProfileSetup from "./pages/ProfileSetup";
import MapScreen from "./pages/MapScreen";
import Events from "./pages/Events";
import MyEvents from "./pages/MyEvents";
import WorkoutHistory from "./pages/WorkoutHistory";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Friends from "./pages/Friends";
import EditProfile from "./pages/EditProfile";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminModeration from "./pages/AdminModeration";
import AdminEvents from "./pages/AdminEvents";
import AdminComments from "./pages/AdminComments";
import AdminSettings from "./pages/AdminSettings";
import AdminVenues from "./pages/AdminVenues";
import AdminSetup from "./pages/AdminSetup";
import PasswordReset from "./pages/PasswordReset";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import { auth } from "./services/firebase";
import { checkAdminStatus } from "./services/adminService";
import { handleRedirectResult } from "./services/authService";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [userStatus, setUserStatus] = useState<"active" | "suspended" | "banned" | null>(null);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (loading || !user) {
        setCheckingStatus(false);
        return;
      }

      try {
        setCheckingStatus(true);
        const { getUserData } = await import("./services/authService");
        const userData = await getUserData(user.uid);
        
        if (userData) {
          const status = userData.status || "active";
          setUserStatus(status);

          // Check if suspension has expired
          if (status === "suspended" && userData.suspendedUntil) {
            if (userData.suspendedUntil < Date.now()) {
              // Suspension expired, but we'll let the user through
              // Admin can unsuspend them
              setUserStatus("active");
            }
          }
        } else {
          setUserStatus("active");
        }
      } catch (error) {
        console.error("Error checking user status:", error);
        setUserStatus("active"); // Default to active on error
      } finally {
        setCheckingStatus(false);
      }
    };

    checkUserStatus();
  }, [user, loading]);

  // Show loading spinner while checking auth state or user status
  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check both hook state and Firebase auth directly as fallback
  // This prevents race conditions where hook hasn't updated yet but user is authenticated
  const isAuthenticated = user || auth.currentUser;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Block banned users
  if (userStatus === "banned") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-destructive">Account Banned</h1>
          <p className="text-muted-foreground">
            Your account has been permanently banned. If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Block suspended users (unless suspension expired)
  if (userStatus === "suspended") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-warning">Account Suspended</h1>
          <p className="text-muted-foreground">
            Your account has been temporarily suspended. Please contact support for more information.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Admin route handler - redirects to login or dashboard
const AdminRoute = () => {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (loading) return;
      
      if (!user || !user.email) {
        setChecking(false);
        return;
      }

      try {
        const isAdmin = await checkAdminStatus(user.email);
        if (isAdmin) {
          window.location.href = "/admin/dashboard";
        } else {
          window.location.href = "/admin/login";
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        window.location.href = "/admin/login";
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
  }, [user, loading]);

  if (checking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <Navigate to="/admin/login" replace />;
};

const AppContent = () => {
  const { notifications, dismissNotification, handleNotificationTap } = useNotificationContext();
  const { user } = useAuth();

  // Handle Google sign-in redirect result (prevents redirect loop)
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await handleRedirectResult();
        if (result) {
          console.log("✅ Google sign-in redirect handled successfully");
          // User will be automatically redirected by ProtectedRoute or LoginScreen
        }
      } catch (error) {
        console.error("Error handling redirect result:", error);
        // Don't show error to user - they can try again
      }
    };

    // Only check redirect result once on mount
    checkRedirectResult();
  }, []); // Empty dependency array - only run once on mount

  return (
    <>
      <NotificationSystem
        notifications={notifications}
        onDismiss={dismissNotification}
        onTap={handleNotificationTap}
      />
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/admin/setup" element={<AdminSetup />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminProtectedRoute>
              <AdminUsers />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminProtectedRoute>
              <AdminAnalytics />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/moderation"
          element={
            <AdminProtectedRoute>
              <AdminModeration />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <AdminProtectedRoute>
              <AdminEvents />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/comments"
          element={
            <AdminProtectedRoute>
              <AdminComments />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminProtectedRoute>
              <AdminSettings />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/venues"
          element={
            <AdminProtectedRoute>
              <AdminVenues />
            </AdminProtectedRoute>
          }
        />
        <Route 
          path="/profile-setup" 
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/map" 
          element={
            <ProtectedRoute>
              <MapScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/events" 
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-events" 
          element={
            <ProtectedRoute>
              <MyEvents />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/workout-history" 
          element={
            <ProtectedRoute>
              <WorkoutHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/friends" 
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edit-profile" 
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <UserProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </UserProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
