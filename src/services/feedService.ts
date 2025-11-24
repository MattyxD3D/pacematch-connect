// Feed service for Firebase - manages workout posts and social feed
import { ref, set, push, get, onValue, off, DataSnapshot } from "firebase/database";
import { database } from "./firebase";
import { WorkoutHistory } from "@/contexts/UserContext";

export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: number;
}

export interface WorkoutPost {
  id: string;
  userId: string;
  workout: WorkoutHistory;
  photos?: string[];
  caption?: string;
  kudos: string[]; // Array of user IDs who gave kudos
  comments: Comment[];
  timestamp: number;
}

/**
 * Create a workout post
 */
export const createWorkoutPost = async (
  userId: string,
  workout: WorkoutHistory,
  caption?: string,
  photos?: string[]
): Promise<string> => {
  try {
    const postsRef = ref(database, "workoutPosts");
    const newPostRef = push(postsRef);
    const postId = newPostRef.key!;
    
    const post: WorkoutPost = {
      id: postId,
      userId,
      workout: {
        ...workout,
        date: workout.date.getTime() // Convert Date to timestamp
      } as any,
      caption,
      photos,
      kudos: [],
      comments: [],
      timestamp: Date.now()
    };
    
    await set(newPostRef, post);
    console.log(`✅ Workout post created: ${postId}`);
    return postId;
  } catch (error) {
    console.error("❌ Error creating workout post:", error);
    throw error;
  }
};

/**
 * Get all workout posts (feed)
 */
export const getWorkoutPosts = async (): Promise<WorkoutPost[]> => {
  try {
    const postsRef = ref(database, "workoutPosts");
    const snapshot = await get(postsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const posts = snapshot.val();
    return Object.values(posts).map((post: any) => ({
      ...post,
      workout: {
        ...post.workout,
        date: new Date(post.workout.date) // Convert timestamp back to Date
      }
    })) as WorkoutPost[];
  } catch (error) {
    console.error("❌ Error getting workout posts:", error);
    return [];
  }
};

/**
 * Listen to workout posts in real-time
 */
export const listenToWorkoutPosts = (
  callback: (posts: WorkoutPost[]) => void
): (() => void) => {
  const postsRef = ref(database, "workoutPosts");
  
  const unsubscribe = onValue(
    postsRef,
    (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }
      
      const posts = snapshot.val();
      const postList = Object.values(posts).map((post: any) => ({
        ...post,
        workout: {
          ...post.workout,
          date: new Date(post.workout.date)
        }
      })) as WorkoutPost[];
      
      // Sort by timestamp (newest first)
      callback(postList.sort((a, b) => b.timestamp - a.timestamp));
    },
    (error) => {
      console.error("❌ Error listening to workout posts:", error);
      callback([]);
    }
  );
  
  return () => {
    off(postsRef);
  };
};

/**
 * Toggle kudos on a post
 */
export const toggleKudos = async (
  postId: string,
  userId: string
): Promise<boolean> => {
  try {
    const postRef = ref(database, `workoutPosts/${postId}`);
    const snapshot = await get(postRef);
    
    if (!snapshot.exists()) {
      throw new Error("Post not found");
    }
    
    const post = snapshot.val() as WorkoutPost;
    const hasKudos = post.kudos.includes(userId);
    
    let updatedKudos: string[];
    if (hasKudos) {
      updatedKudos = post.kudos.filter(id => id !== userId);
    } else {
      updatedKudos = [...post.kudos, userId];
    }
    
    await set(ref(database, `workoutPosts/${postId}/kudos`), updatedKudos);
    
    return !hasKudos;
  } catch (error) {
    console.error("❌ Error toggling kudos:", error);
    throw error;
  }
};

/**
 * Add a comment to a post
 */
export const addComment = async (
  postId: string,
  comment: Omit<Comment, "id" | "timestamp">
): Promise<string> => {
  try {
    const commentsRef = ref(database, `workoutPosts/${postId}/comments`);
    const newCommentRef = push(commentsRef);
    const commentId = newCommentRef.key!;
    
    const commentData: Comment = {
      ...comment,
      id: commentId,
      timestamp: Date.now()
    };
    
    await set(newCommentRef, commentData);
    console.log(`✅ Comment added: ${commentId}`);
    return commentId;
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    throw error;
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (
  postId: string,
  commentId: string,
  userId: string
): Promise<void> => {
  try {
    const commentRef = ref(database, `workoutPosts/${postId}/comments/${commentId}`);
    const snapshot = await get(commentRef);
    
    if (!snapshot.exists()) {
      throw new Error("Comment not found");
    }
    
    const comment = snapshot.val() as Comment;
    
    // Only allow deletion if user is the comment author
    if (comment.userId !== userId) {
      throw new Error("You can only delete your own comments");
    }
    
    await set(commentRef, null);
    console.log(`✅ Comment deleted: ${commentId}`);
  } catch (error) {
    console.error("❌ Error deleting comment:", error);
    throw error;
  }
};

