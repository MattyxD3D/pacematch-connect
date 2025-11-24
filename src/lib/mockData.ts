import { Activity, WorkoutHistory } from "@/contexts/UserContext";

export interface MockUser {
  id: number;
  username: string;
  avatar: string;
  activities: Activity[];
  bio?: string;
  photos?: string[];
}

export interface Comment {
  id: string;
  userId: number;
  username: string;
  avatar: string;
  text: string;
  timestamp: Date;
}

export interface WorkoutPost {
  id: string;
  userId: number;
  workout: WorkoutHistory;
  photos?: string[];
  caption?: string;
  kudos: number[];
  comments: Comment[];
  timestamp: Date;
}

// Mock users database - REMOVED: Now using Firebase users
// Users are fetched from Firebase Realtime Database via locationService
export const mockUsers: MockUser[] = [];

// REMOVED: Workout posts are now fetched from Firebase via feedService
// Use feedService.listenToWorkoutPosts() or feedService.getWorkoutPosts() instead
export const mockWorkoutPosts: WorkoutPost[] = [];

// Helper to get user by ID - REMOVED: Now fetch users from Firebase
// Use locationService or getUserData from authService instead
export const getMockUserById = (id: number): MockUser | undefined => {
  return undefined; // No longer using mock users
};

// Mock conversation data with message request status
export interface MockConversation {
  id: number;
  userId: number;
  userName: string;
  avatar: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  isRequest?: boolean; // true if this is a message request
}

// REMOVED: Conversations are now fetched from Firebase via messageService
// Use messageService.getUserConversations() instead
export const mockConversations: MockConversation[] = [];
