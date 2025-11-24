import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

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
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/" element={<Index />} />
        <Route path="/map" element={<MapScreen />} />
        <Route path="/events" element={<Events />} />
        <Route path="/my-events" element={<MyEvents />} />
        <Route path="/workout-history" element={<WorkoutHistory />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/settings" element={<Settings />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
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

export default App;
