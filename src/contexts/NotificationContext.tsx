import { createContext, useContext, ReactNode } from "react";
import { useNotifications, Notification } from "@/components/NotificationSystem";
import { useAuth } from "@/hooks/useAuth";

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  dismissNotification: (id: string) => void;
  markAllAsRead: () => void;
  handleNotificationTap: (notification: Notification) => void;
  unreadCount: number;
  unreadMessageCount: number;
  unreadFriendRequestCount: number;
  unreadPokeCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const notificationState = useNotifications(user?.uid || null);

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
};
