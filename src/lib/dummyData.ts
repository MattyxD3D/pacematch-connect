// Centralized dummy data generators for demo/testing purposes
// All dummy data uses "dummy-" prefix in IDs to distinguish from real Firebase data

import { WorkoutPost, Comment } from "@/services/feedService";
import { Event } from "@/services/eventService";
import { Message } from "@/services/messageService";
import { WorkoutHistory } from "@/contexts/UserContext";

// Dummy user profiles for consistency across the app
export const dummyUsers = [
  {
    id: "dummy-user-1",
    name: "Sarah Johnson",
    username: "sarah_runs",
    photoURL: "https://i.pravatar.cc/150?img=47",
    activities: ["running", "walking"] as const,
    fitnessLevel: "intermediate" as const,
    pace: 5.2,
  },
  {
    id: "dummy-user-2",
    name: "Mike Chen",
    username: "mike_cycles",
    photoURL: "https://i.pravatar.cc/150?img=33",
    activities: ["cycling", "running"] as const,
    fitnessLevel: "pro" as const,
    pace: 25.5,
  },
  {
    id: "dummy-user-3",
    name: "Emma Wilson",
    username: "emma_walks",
    photoURL: "https://i.pravatar.cc/150?img=20",
    activities: ["walking", "running"] as const,
    fitnessLevel: "beginner" as const,
    pace: 7.8,
  },
  {
    id: "dummy-user-4",
    name: "James Wilson",
    username: "james_runs",
    photoURL: "https://i.pravatar.cc/150?img=12",
    activities: ["running"] as const,
    fitnessLevel: "intermediate" as const,
    pace: 4.8,
  },
  {
    id: "dummy-user-5",
    name: "Lisa Anderson",
    username: "lisa_cycles",
    photoURL: "https://i.pravatar.cc/150?img=5",
    activities: ["cycling"] as const,
    fitnessLevel: "pro" as const,
    pace: 28.0,
  },
  {
    id: "dummy-user-6",
    name: "Alex Runner",
    username: "alex_runner",
    photoURL: "https://ui-avatars.com/api/?name=Alex+Runner&size=120&background=4CAF50&color=fff",
    activities: ["running", "walking"] as const,
    fitnessLevel: "intermediate" as const,
    pace: 5.5,
  },
  {
    id: "dummy-user-7",
    name: "David Active",
    username: "david_active",
    photoURL: "https://ui-avatars.com/api/?name=David+Active&size=120&background=E91E63&color=fff",
    activities: ["running", "walking"] as const,
    fitnessLevel: "beginner" as const,
    pace: 6.5,
  },
  {
    id: "dummy-user-8",
    name: "Sophie Martinez",
    username: "sophie_fit",
    photoURL: "https://i.pravatar.cc/150?img=68",
    activities: ["cycling", "running"] as const,
    fitnessLevel: "intermediate" as const,
    pace: 6.0,
  },
];

/**
 * Generate dummy workout posts
 */
export const generateDummyWorkoutPosts = (): WorkoutPost[] => {
  const now = Date.now();
  const posts: WorkoutPost[] = [];

  // Post 1: Recent running workout
  posts.push({
    id: "dummy-post-1",
    userId: dummyUsers[0].id,
    workout: {
      id: "dummy-workout-1",
      activity: "running",
      date: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
      duration: 3600, // 1 hour
      distance: 10.5,
      avgSpeed: 10.5,
      calories: 650,
      location: "Central Park, New York",
      nearbyUsers: [
        {
          id: 1,
          name: dummyUsers[1].name,
          avatar: dummyUsers[1].photoURL,
          activity: "cycling",
          distance: "0.5 km",
        },
      ],
    },
    caption: "Great morning run! The weather was perfect today 🌞",
    photos: ["https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400"],
    kudos: [dummyUsers[1].id, dummyUsers[2].id],
    comments: [
      {
        id: "dummy-comment-1",
        userId: dummyUsers[1].id,
        username: dummyUsers[1].username,
        avatar: dummyUsers[1].photoURL,
        text: "Amazing pace! Keep it up! 💪",
        timestamp: now - 1.5 * 60 * 60 * 1000,
      },
    ],
    timestamp: now - 2 * 60 * 60 * 1000,
  });

  // Post 2: Cycling workout
  posts.push({
    id: "dummy-post-2",
    userId: dummyUsers[1].id,
    workout: {
      id: "dummy-workout-2",
      activity: "cycling",
      date: new Date(now - 5 * 60 * 60 * 1000), // 5 hours ago
      duration: 5400, // 1.5 hours
      distance: 35.0,
      avgSpeed: 23.3,
      calories: 850,
      location: "Hudson River Path",
    },
    caption: "Long ride along the river. Feeling strong! 🚴",
    kudos: [dummyUsers[0].id, dummyUsers[3].id, dummyUsers[4].id],
    comments: [
      {
        id: "dummy-comment-2",
        userId: dummyUsers[0].id,
        username: dummyUsers[0].username,
        avatar: dummyUsers[0].photoURL,
        text: "That's an impressive distance!",
        timestamp: now - 4.5 * 60 * 60 * 1000,
      },
      {
        id: "dummy-comment-3",
        userId: dummyUsers[4].id,
        username: dummyUsers[4].username,
        avatar: dummyUsers[4].photoURL,
        text: "Great route! I'll have to try it sometime.",
        timestamp: now - 4 * 60 * 60 * 1000,
      },
    ],
    timestamp: now - 5 * 60 * 60 * 1000,
  });

  // Post 3: Walking workout
  posts.push({
    id: "dummy-post-3",
    userId: dummyUsers[2].id,
    workout: {
      id: "dummy-workout-3",
      activity: "walking",
      date: new Date(now - 24 * 60 * 60 * 1000), // 1 day ago
      duration: 2700, // 45 minutes
      distance: 3.5,
      avgSpeed: 4.7,
      calories: 180,
      location: "Riverside Park",
    },
    caption: "Peaceful evening walk. Perfect way to unwind 🚶",
    photos: ["https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400"],
    kudos: [dummyUsers[0].id],
    comments: [],
    timestamp: now - 24 * 60 * 60 * 1000,
  });

  // Post 4: Running workout (yesterday)
  posts.push({
    id: "dummy-post-4",
    userId: dummyUsers[3].id,
    workout: {
      id: "dummy-workout-4",
      activity: "running",
      date: new Date(now - 30 * 60 * 60 * 1000), // 30 hours ago
      duration: 2400, // 40 minutes
      distance: 8.0,
      avgSpeed: 12.0,
      calories: 520,
      location: "Prospect Park",
    },
    caption: "Morning tempo run. Pushed myself today!",
    kudos: [dummyUsers[0].id, dummyUsers[1].id, dummyUsers[2].id],
    comments: [
      {
        id: "dummy-comment-4",
        userId: dummyUsers[0].id,
        username: dummyUsers[0].username,
        avatar: dummyUsers[0].photoURL,
        text: "Nice work! Your pace is improving!",
        timestamp: now - 29 * 60 * 60 * 1000,
      },
    ],
    timestamp: now - 30 * 60 * 60 * 1000,
  });

  // Post 5: Cycling workout (2 days ago)
  posts.push({
    id: "dummy-post-5",
    userId: dummyUsers[4].id,
    workout: {
      id: "dummy-workout-5",
      activity: "cycling",
      date: new Date(now - 48 * 60 * 60 * 1000), // 2 days ago
      duration: 7200, // 2 hours
      distance: 50.0,
      avgSpeed: 25.0,
      calories: 1200,
      location: "Brooklyn Bridge Loop",
    },
    caption: "Epic ride today! 50km in the books 🎉",
    photos: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"],
    kudos: [dummyUsers[1].id, dummyUsers[3].id],
    comments: [],
    timestamp: now - 48 * 60 * 60 * 1000,
  });

  return posts;
};

/**
 * Generate dummy events
 */
export const generateDummyEvents = (userLocation?: { lat: number; lng: number }): Event[] => {
  const now = Date.now();
  const baseLat = userLocation?.lat || 14.5995;
  const baseLng = userLocation?.lng || 120.9842;
  
  const events: Event[] = [];

  // Event 1: Upcoming running event (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  events.push({
    id: "dummy-event-1",
    title: "Morning Run in Central Park",
    description: "Join us for an early morning run around Central Park. All fitness levels welcome! We'll meet at the main entrance and do a 5K loop.",
    type: "running",
    category: "user",
    date: tomorrow.toISOString().split('T')[0],
    time: "07:00",
    location: "Central Park, New York",
    distance: "1.2 km",
    distanceValue: 1.2,
    lat: baseLat + 0.01,
    lng: baseLng + 0.01,
    hostId: dummyUsers[0].id,
    hostName: dummyUsers[0].name,
    hostAvatar: dummyUsers[0].photoURL,
    participants: [dummyUsers[0].id, dummyUsers[3].id],
    maxParticipants: 20,
    createdAt: now - 2 * 24 * 60 * 60 * 1000,
  });

  // Event 2: Upcoming cycling event (3 days from now)
  const threeDays = new Date();
  threeDays.setDate(threeDays.getDate() + 3);
  events.push({
    id: "dummy-event-2",
    title: "Weekend Cycling Group",
    description: "Long distance cycling group ride. We'll cover 40km at a moderate pace. Bring water and snacks!",
    type: "cycling",
    category: "user",
    date: threeDays.toISOString().split('T')[0],
    time: "08:00",
    location: "Hudson River Path",
    distance: "2.5 km",
    distanceValue: 2.5,
    lat: baseLat - 0.02,
    lng: baseLng + 0.015,
    hostId: dummyUsers[1].id,
    hostName: dummyUsers[1].name,
    hostAvatar: dummyUsers[1].photoURL,
    participants: [dummyUsers[1].id, dummyUsers[4].id, dummyUsers[7].id],
    maxParticipants: 15,
    createdAt: now - 5 * 24 * 60 * 60 * 1000,
  });

  // Event 3: Upcoming walking event (this weekend)
  const weekend = new Date();
  weekend.setDate(weekend.getDate() + (6 - weekend.getDay())); // Next Saturday
  events.push({
    id: "dummy-event-3",
    title: "Nature Walk & Social",
    description: "Relaxing nature walk followed by coffee. Perfect for beginners and those who want to enjoy the outdoors at a leisurely pace.",
    type: "walking",
    category: "user",
    date: weekend.toISOString().split('T')[0],
    time: "10:00",
    location: "Riverside Park",
    distance: "0.8 km",
    distanceValue: 0.8,
    lat: baseLat + 0.008,
    lng: baseLng - 0.012,
    hostId: dummyUsers[2].id,
    hostName: dummyUsers[2].name,
    hostAvatar: dummyUsers[2].photoURL,
    participants: [dummyUsers[2].id, dummyUsers[0].id],
    createdAt: now - 3 * 24 * 60 * 60 * 1000,
  });

  // Event 4: Sponsored event (next week)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  events.push({
    id: "dummy-event-4",
    title: "City Marathon Training Run",
    description: "Official training run for the upcoming city marathon. Sponsored by local running store. Free water and energy gels provided!",
    type: "running",
    category: "sponsored",
    date: nextWeek.toISOString().split('T')[0],
    time: "06:30",
    location: "Prospect Park",
    distance: "3.0 km",
    distanceValue: 3.0,
    lat: baseLat - 0.025,
    lng: baseLng - 0.02,
    sponsorLogo: "https://via.placeholder.com/100x100?text=Sponsor",
    participants: [dummyUsers[3].id, dummyUsers[0].id, dummyUsers[6].id],
    maxParticipants: 50,
    createdAt: now - 7 * 24 * 60 * 60 * 1000,
  });

  // Event 5: Past event (yesterday)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  events.push({
    id: "dummy-event-5",
    title: "Evening Cycling Tour",
    description: "Evening cycling tour through the city. We'll stop at various landmarks and finish with dinner.",
    type: "cycling",
    category: "user",
    date: yesterday.toISOString().split('T')[0],
    time: "18:00",
    location: "Brooklyn Bridge",
    distance: "1.5 km",
    distanceValue: 1.5,
    lat: baseLat + 0.015,
    lng: baseLng - 0.01,
    hostId: dummyUsers[4].id,
    hostName: dummyUsers[4].name,
    hostAvatar: dummyUsers[4].photoURL,
    participants: [dummyUsers[4].id, dummyUsers[1].id],
    createdAt: now - 10 * 24 * 60 * 60 * 1000,
  });

  return events;
};

/**
 * Generate dummy conversations
 */
export const generateDummyConversations = (currentUserId: string) => {
  const now = Date.now();
  
  return [
    {
      conversationId: `${currentUserId}_${dummyUsers[0].id}`.split('_').sort().join('_'),
      otherUserId: dummyUsers[0].id,
      lastMessage: "Thanks for the great run today! Let's do it again soon.",
      lastMessageTime: now - 30 * 60 * 1000, // 30 minutes ago
      unreadCount: 0,
      userName: dummyUsers[0].name,
      avatar: dummyUsers[0].photoURL,
    },
    {
      conversationId: `${currentUserId}_${dummyUsers[1].id}`.split('_').sort().join('_'),
      otherUserId: dummyUsers[1].id,
      lastMessage: "Are you joining the cycling event this weekend?",
      lastMessageTime: now - 2 * 60 * 60 * 1000, // 2 hours ago
      unreadCount: 1,
      userName: dummyUsers[1].name,
      avatar: dummyUsers[1].photoURL,
    },
    {
      conversationId: `${currentUserId}_${dummyUsers[2].id}`.split('_').sort().join('_'),
      otherUserId: dummyUsers[2].id,
      lastMessage: "The nature walk was amazing! Thanks for organizing.",
      lastMessageTime: now - 5 * 60 * 60 * 1000, // 5 hours ago
      unreadCount: 0,
      userName: dummyUsers[2].name,
      avatar: dummyUsers[2].photoURL,
    },
    {
      conversationId: `${currentUserId}_${dummyUsers[3].id}`.split('_').sort().join('_'),
      otherUserId: dummyUsers[3].id,
      lastMessage: "Hey! Want to go for a run together tomorrow?",
      lastMessageTime: now - 24 * 60 * 60 * 1000, // 1 day ago
      unreadCount: 2,
      userName: dummyUsers[3].name,
      avatar: dummyUsers[3].photoURL,
    },
    {
      conversationId: `${currentUserId}_${dummyUsers[4].id}`.split('_').sort().join('_'),
      otherUserId: dummyUsers[4].id,
      lastMessage: "Great ride today! Your pace was impressive.",
      lastMessageTime: now - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      unreadCount: 0,
      userName: dummyUsers[4].name,
      avatar: dummyUsers[4].photoURL,
    },
  ];
};

/**
 * Generate dummy chat messages
 */
export const generateDummyChatMessages = (currentUserId: string, otherUserId: string): Message[] => {
  const now = Date.now();
  const messages: Message[] = [];
  
  // Determine which user is which
  const otherUser = dummyUsers.find(u => u.id === otherUserId);
  if (!otherUser) return [];

  // Add conversation history
  messages.push({
    id: "dummy-msg-1",
    senderId: otherUser.id,
    receiverId: currentUserId,
    content: `Hey! I saw you're into ${otherUser.activities[0]}. Want to meet up for a workout?`,
    timestamp: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    isRead: true,
  });

  messages.push({
    id: "dummy-msg-2",
    senderId: currentUserId,
    receiverId: otherUser.id,
    content: "That sounds great! When are you free?",
    timestamp: now - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    isRead: true,
  });

  messages.push({
    id: "dummy-msg-3",
    senderId: otherUser.id,
    receiverId: currentUserId,
    content: "How about tomorrow morning? Around 7am?",
    timestamp: now - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000,
    isRead: true,
  });

  messages.push({
    id: "dummy-msg-4",
    senderId: currentUserId,
    receiverId: otherUser.id,
    content: "Perfect! Let's meet at Central Park entrance.",
    timestamp: now - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
    isRead: true,
  });

  messages.push({
    id: "dummy-msg-5",
    senderId: otherUser.id,
    receiverId: currentUserId,
    content: "Sounds good! See you there! 🏃",
    timestamp: now - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    isRead: true,
  });

  messages.push({
    id: "dummy-msg-6",
    senderId: currentUserId,
    receiverId: otherUser.id,
    content: "Thanks for the great workout today!",
    timestamp: now - 12 * 60 * 60 * 1000, // 12 hours ago
    isRead: true,
  });

  messages.push({
    id: "dummy-msg-7",
    senderId: otherUser.id,
    receiverId: currentUserId,
    content: "You too! Let's do it again soon!",
    timestamp: now - 30 * 60 * 1000, // 30 minutes ago
    isRead: false,
  });

  return messages.sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Generate dummy workout history
 */
export const generateDummyWorkoutHistory = (): WorkoutHistory[] => {
  const now = Date.now();
  const workouts: WorkoutHistory[] = [];

  // Workout 1: Today
  workouts.push({
    id: "dummy-history-1",
    activity: "running",
    date: new Date(now - 2 * 60 * 60 * 1000),
    duration: 3600, // 1 hour
    distance: 10.5,
    avgSpeed: 10.5,
    calories: 650,
    location: "Central Park, New York",
    nearbyUsers: [
      {
        id: 1,
        name: dummyUsers[1].name,
        avatar: dummyUsers[1].photoURL,
        activity: "cycling",
        distance: "0.5 km",
      },
    ],
  });

  // Workout 2: Yesterday
  workouts.push({
    id: "dummy-history-2",
    activity: "cycling",
    date: new Date(now - 26 * 60 * 60 * 1000),
    duration: 5400, // 1.5 hours
    distance: 35.0,
    avgSpeed: 23.3,
    calories: 850,
    location: "Hudson River Path",
  });

  // Workout 3: 2 days ago
  workouts.push({
    id: "dummy-history-3",
    activity: "walking",
    date: new Date(now - 50 * 60 * 60 * 1000),
    duration: 2700, // 45 minutes
    distance: 3.5,
    avgSpeed: 4.7,
    calories: 180,
    location: "Riverside Park",
  });

  // Workout 4: 3 days ago
  workouts.push({
    id: "dummy-history-4",
    activity: "running",
    date: new Date(now - 74 * 60 * 60 * 1000),
    duration: 2400, // 40 minutes
    distance: 8.0,
    avgSpeed: 12.0,
    calories: 520,
    location: "Prospect Park",
  });

  // Workout 5: 5 days ago
  workouts.push({
    id: "dummy-history-5",
    activity: "cycling",
    date: new Date(now - 122 * 60 * 60 * 1000),
    duration: 7200, // 2 hours
    distance: 50.0,
    avgSpeed: 25.0,
    calories: 1200,
    location: "Brooklyn Bridge Loop",
  });

  // Workout 6: 1 week ago
  workouts.push({
    id: "dummy-history-6",
    activity: "running",
    date: new Date(now - 170 * 60 * 60 * 1000),
    duration: 3000, // 50 minutes
    distance: 9.5,
    avgSpeed: 11.4,
    calories: 600,
    location: "Central Park",
    nearbyUsers: [
      {
        id: 1,
        name: dummyUsers[3].name,
        avatar: dummyUsers[3].photoURL,
        activity: "running",
        distance: "0.3 km",
      },
    ],
  });

  return workouts;
};

/**
 * Global flag to enable/disable dummy data
 */
export const ENABLE_DUMMY_DATA = true; // Set to false in production

