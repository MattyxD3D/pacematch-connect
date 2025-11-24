import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@mui/material";
import { WorkoutPost, getMockUserById, Comment } from "@/lib/mockData";
import { getCommentsForPost, addComment, deleteComment } from "@/lib/socialStorage";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface CommentDrawerProps {
  isOpen: boolean;
  post: WorkoutPost | null;
  onClose: () => void;
  currentUserId: number;
  currentUsername: string;
  currentAvatar: string;
}

export const CommentDrawer = ({
  isOpen,
  post,
  onClose,
  currentUserId,
  currentUsername,
  currentAvatar,
}: CommentDrawerProps) => {
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);

  const loadComments = () => {
    if (post) {
      setComments(getCommentsForPost(post.id));
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim() || !post) return;

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: currentUserId,
      username: currentUsername,
      avatar: currentAvatar,
      text: commentText.trim(),
      timestamp: new Date(),
    };

    addComment(post.id, newComment);
    setComments([...comments, newComment]);
    setCommentText("");
    toast.success("Comment added!");
  };

  const handleDeleteComment = (commentId: string) => {
    if (!post) return;
    deleteComment(post.id, commentId);
    setComments(comments.filter(c => c.id !== commentId));
    toast.success("Comment deleted");
  };

  const user = post ? getMockUserById(post.userId) : null;

  if (!isOpen || !post || !user) return null;

  // Load comments when drawer opens
  if (isOpen && comments.length === 0) {
    loadComments();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-card rounded-t-3xl shadow-elevation-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-border rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border">
            <h2 className="text-lg font-bold">Comments</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Comments list */}
          <div className="overflow-y-auto max-h-[50vh] px-6 py-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No comments yet</p>
                <p className="text-xs mt-1">Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <Avatar src={comment.avatar} alt={comment.username} sx={{ width: 36, height: 36 }} />
                  <div className="flex-1">
                    <div className="bg-muted/50 rounded-2xl px-4 py-2">
                      <p className="font-semibold text-sm">{comment.username}</p>
                      <p className="text-sm mt-1">{comment.text}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 px-2">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                      </p>
                      {comment.userId === currentUserId && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1"
                        >
                          <DeleteIcon style={{ fontSize: 14 }} />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-border bg-background">
            <div className="flex gap-3">
              <Avatar src={currentAvatar} alt={currentUsername} sx={{ width: 40, height: 40 }} />
              <div className="flex-1 flex gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="resize-none min-h-[44px] max-h-[120px]"
                  maxLength={280}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  size="icon"
                  className="flex-shrink-0"
                >
                  <SendIcon style={{ fontSize: 20 }} />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              {commentText.length}/280
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
