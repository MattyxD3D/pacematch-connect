import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import TimerIcon from "@mui/icons-material/Timer";
import SpeedIcon from "@mui/icons-material/Speed";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import ShareIcon from "@mui/icons-material/Share";
import CloseIcon from "@mui/icons-material/Close";

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDiscard: () => void;
  activity: "running" | "cycling" | "walking";
  duration: number; // in seconds
  distance: number; // in km
  avgSpeed: number; // in km/h
  calories: number;
  useMetric: boolean;
}

export const WorkoutSummaryModal = ({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  activity,
  duration,
  distance,
  avgSpeed,
  calories,
  useMetric,
}: WorkoutSummaryModalProps) => {
  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const convertDistance = (km: number) => {
    if (useMetric) return { value: km.toFixed(2), unit: "km" };
    return { value: (km * 0.621371).toFixed(2), unit: "mi" };
  };

  const convertSpeed = (kmh: number) => {
    if (useMetric) return { value: kmh.toFixed(1), unit: "km/h" };
    return { value: (kmh * 0.621371).toFixed(1), unit: "mph" };
  };

  const activityConfig = {
    running: { icon: DirectionsRunIcon, color: "success", label: "Running" },
    cycling: { icon: DirectionsBikeIcon, color: "primary", label: "Cycling" },
    walking: { icon: DirectionsWalkIcon, color: "warning", label: "Walking" },
  };

  const config = activityConfig[activity];
  const Icon = config.icon;
  const distanceData = convertDistance(distance);
  const speedData = convertSpeed(avgSpeed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md"
      >
        <Card className="p-6 space-y-6 shadow-elevation-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-full ${
                  config.color === "success"
                    ? "bg-success/15"
                    : config.color === "primary"
                    ? "bg-primary/15"
                    : "bg-warning/15"
                }`}
              >
                <Icon
                  className={
                    config.color === "success"
                      ? "text-success"
                      : config.color === "primary"
                      ? "text-primary"
                      : "text-warning"
                  }
                  style={{ fontSize: 32 }}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Workout Complete!</h2>
                <p className="text-sm text-muted-foreground">{config.label} Session</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <CloseIcon className="text-muted-foreground" />
            </button>
          </div>

          {/* Achievement Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="text-center py-4"
          >
            <div className="text-6xl mb-2">🎉</div>
            <p className="text-lg font-semibold">Great workout!</p>
          </motion.div>

          {/* Primary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <TimerIcon className="text-primary mx-auto mb-2" style={{ fontSize: 32 }} />
              <div className="text-2xl font-bold">{formatTime(duration)}</div>
              <div className="text-xs text-muted-foreground mt-1">Duration</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="text-4xl mb-2">📍</div>
              <div className="text-2xl font-bold">
                {distanceData.value}
                <span className="text-sm ml-1">{distanceData.unit}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Distance</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <SpeedIcon className="text-primary mx-auto mb-2" style={{ fontSize: 32 }} />
              <div className="text-2xl font-bold">
                {speedData.value}
                <span className="text-sm ml-1">{speedData.unit}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Avg Speed</div>
            </motion.div>
          </div>

          {/* Secondary Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-muted/50 rounded-lg p-4"
          >
            <div className="flex items-center justify-center gap-2">
              <LocalFireDepartmentIcon className="text-warning" style={{ fontSize: 24 }} />
              <span className="text-lg font-bold">{calories}</span>
              <span className="text-sm text-muted-foreground">calories burned</span>
            </div>
          </motion.div>

          {/* Map Preview Placeholder */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-primary/10 via-success/5 to-warning/10 rounded-lg h-32 flex items-center justify-center border border-border"
          >
            <p className="text-sm text-muted-foreground">Route map preview</p>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={onSave}
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
            >
              Save Workout
            </Button>
            <div className="flex gap-3">
              <Button onClick={onDiscard} variant="outline" className="flex-1 h-11">
                Discard
              </Button>
              <Button variant="secondary" className="flex-1 h-11">
                <ShareIcon className="mr-2" style={{ fontSize: 20 }} />
                Share
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
