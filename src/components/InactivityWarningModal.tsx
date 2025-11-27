import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import WarningIcon from "@mui/icons-material/Warning";
import PauseIcon from "@mui/icons-material/Pause";

interface InactivityWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss: () => void;
  onPause: () => void;
  /** Time in seconds until auto-pause */
  autoPauseSeconds?: number;
}

export const InactivityWarningModal = ({
  open,
  onOpenChange,
  onDismiss,
  onPause,
  autoPauseSeconds = 120, // 2 minutes default
}: InactivityWarningModalProps) => {
  const [countdown, setCountdown] = useState(autoPauseSeconds);

  // Reset countdown when modal opens
  useEffect(() => {
    if (open) {
      setCountdown(autoPauseSeconds);
    }
  }, [open, autoPauseSeconds]);

  // Countdown timer
  useEffect(() => {
    if (!open || countdown <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-pause when countdown reaches 0
          clearInterval(interval);
          onPause();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, countdown, onPause]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDismiss = () => {
    onDismiss();
    onOpenChange(false);
  };

  const handlePause = () => {
    onPause();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="inactivity-warning-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <WarningIcon className="text-warning" style={{ fontSize: 24 }} />
            No Movement Detected
          </DialogTitle>
        </DialogHeader>
        <div id="inactivity-warning-description" className="sr-only">
          No movement detected for 5 minutes. Your workout will be auto-paused in {formatTime(countdown)} if you don't respond.
        </div>
        
        <div className="space-y-4 py-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-2"
          >
            <p className="text-sm text-muted-foreground">
              We haven't detected any movement for 5 minutes. Are you still working out?
            </p>
            
            {countdown > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 mt-4"
              >
                <span className="text-xs text-muted-foreground">Auto-pause in:</span>
                <span className={`text-lg font-bold tabular-nums ${
                  countdown <= 30 ? "text-destructive" : "text-foreground"
                }`}>
                  {formatTime(countdown)}
                </span>
              </motion.div>
            )}
          </motion.div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1"
            >
              I'm Still Here
            </Button>
            <Button
              onClick={handlePause}
              variant="secondary"
              className="flex-1"
            >
              <PauseIcon className="mr-2" style={{ fontSize: 18 }} />
              Pause Workout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

