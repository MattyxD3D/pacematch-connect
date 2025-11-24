import { Comment } from "./mockData";

// Kudos management
export const getKudosForPost = (postId: string): number[] => {
  const stored = localStorage.getItem(`kudos-${postId}`);
  return stored ? JSON.parse(stored) : [];
};

export const toggleKudos = (postId: string, userId: number): boolean => {
  const kudos = getKudosForPost(postId);
  const hasKudos = kudos.includes(userId);
  
  if (hasKudos) {
    const updated = kudos.filter(id => id !== userId);
    localStorage.setItem(`kudos-${postId}`, JSON.stringify(updated));
    return false;
  } else {
    const updated = [...kudos, userId];
    localStorage.setItem(`kudos-${postId}`, JSON.stringify(updated));
    return true;
  }
};

// Comments management
export const getCommentsForPost = (postId: string): Comment[] => {
  const stored = localStorage.getItem(`comments-${postId}`);
  if (!stored) return [];
  
  const parsed = JSON.parse(stored);
  return parsed.map((c: any) => ({
    ...c,
    timestamp: new Date(c.timestamp),
  }));
};

export const addComment = (postId: string, comment: Comment): void => {
  const comments = getCommentsForPost(postId);
  comments.push(comment);
  localStorage.setItem(`comments-${postId}`, JSON.stringify(comments));
};

export const deleteComment = (postId: string, commentId: string): void => {
  const comments = getCommentsForPost(postId);
  const updated = comments.filter(c => c.id !== commentId);
  localStorage.setItem(`comments-${postId}`, JSON.stringify(updated));
};

// Friend requests
export const getPendingRequests = (): { incoming: number[]; outgoing: number[] } => {
  const stored = localStorage.getItem("friendRequests");
  return stored ? JSON.parse(stored) : { incoming: [2, 7], outgoing: [9] };
};

export const sendFriendRequest = (toUserId: number): void => {
  const requests = getPendingRequests();
  if (!requests.outgoing.includes(toUserId)) {
    requests.outgoing.push(toUserId);
    localStorage.setItem("friendRequests", JSON.stringify(requests));
  }
};

export const acceptFriendRequest = (fromUserId: number): void => {
  const requests = getPendingRequests();
  requests.incoming = requests.incoming.filter(id => id !== fromUserId);
  localStorage.setItem("friendRequests", JSON.stringify(requests));
  
  // Add to friends list in UserContext
  const userProfile = localStorage.getItem("userProfile");
  if (userProfile) {
    const profile = JSON.parse(userProfile);
    profile.friends = profile.friends || [];
    if (!profile.friends.includes(fromUserId)) {
      profile.friends.push(fromUserId);
      localStorage.setItem("userProfile", JSON.stringify(profile));
    }
  }
};

export const declineFriendRequest = (fromUserId: number): void => {
  const requests = getPendingRequests();
  requests.incoming = requests.incoming.filter(id => id !== fromUserId);
  localStorage.setItem("friendRequests", JSON.stringify(requests));
};

export const cancelFriendRequest = (toUserId: number): void => {
  const requests = getPendingRequests();
  requests.outgoing = requests.outgoing.filter(id => id !== toUserId);
  localStorage.setItem("friendRequests", JSON.stringify(requests));
};
