import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import { useAuth } from "./hooks/useAuth";
import { handleRedirectResult } from "./services/authService";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const { notifications, dismissNotification, handleNotificationTap } = useNotificationContext();

  return (
    <>
      <NotificationSystem
        notifications={notifications}
        onDismiss={dismissNotification}
        onTap={handleNotificationTap}
      />
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
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
  // Check for redirect result on mount (handles Google Sign-In redirects)
  useEffect(() => {
    handleRedirectResult().catch((err) => {
      console.error("Error handling redirect result:", err);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
