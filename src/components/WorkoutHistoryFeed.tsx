import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@mui/material";
import { listenToAllUsersWorkouts, WorkoutWithUser } from "@/services/workoutService";
import { getDisplayName } from "@/utils/anonymousName";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import { formatDistanceToNow } from "date-fns";
import { Activity } from "@/contexts/UserContext";

interface WorkoutHistoryFeedProps {
  currentUserId: string;
  selectedActivity: string; // "all" | "running" | "cycling" | "walking"
  timeframe: "week" | "month" | "all";
  useMetric: boolean;
  onWorkoutClick: (workout: WorkoutWithUser) => void;
}

export const WorkoutHistoryFeed = ({
  currentUserId,
  selectedActivity,
  timeframe,
  useMetric,
  onWorkoutClick,
}: WorkoutHistoryFeedProps) => {
  const [workouts, setWorkouts] = useState<WorkoutWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen to all users' workouts
  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToAllUsersWorkouts(currentUserId, (allWorkouts) => {
      setWorkouts(allWorkouts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Filter and sort workouts
  const filteredWorkouts = useMemo(() => {
    let filtered = [...workouts];

    // Filter by activity type
    if (selectedActivity !== "all") {
      filtered = filtered.filter(
        (item) => item.workout.activity === selectedActivity
      );
    }

    // Filter by timeframe
    const now = new Date();
    if (timeframe === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((item) => item.workout.date >= weekAgo);
    } else if (timeframe === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((item) => item.workout.date >= monthAgo);
    }
    // "all" doesn't filter by time

    // Sort by date (most recent first) - already sorted in service, but ensure it
    return filtered.sort(
      (a, b) => b.workout.date.getTime() - a.workout.date.getTime()
    );
  }, [workouts, selectedActivity, timeframe]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const convertDistance = (km: number) => {
    if (useMetric) return `${km.toFixed(1)} km`;
    return `${(km * 0.621371).toFixed(1)} mi`;
  };

  const convertSpeed = (kmh: number) => {
    if (useMetric) return `${kmh.toFixed(1)} km/h`;
    return `${(kmh * 0.621371).toFixed(1)} mph`;
  };

  const getActivityIcon = (activity: Activity) => {
    switch (activity) {
      case "running":
        return DirectionsRunIcon;
      case "cycling":
        return DirectionsBikeIcon;
      case "walking":
        return DirectionsWalkIcon;
      default:
        return FitnessCenterIcon;
    }
  };

  const getActivityColor = (activity: Activity) => {
    switch (activity) {
      case "running":
        return "text-success";
      case "cycling":
        return "text-primary";
      case "walking":
        return "text-warning";
      default:
        return "text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading workout history...</p>
      </Card>
    );
  }

  if (filteredWorkouts.length === 0) {
    return (
      <div className="text-center py-12">
        <FitnessCenterIcon className="mx-auto text-muted-foreground" style={{ fontSize: 48 }} />
        <p className="text-muted-foreground mt-4">No workouts found</p>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedActivity !== "all"
            ? `No ${selectedActivity} workouts in the selected timeframe`
            : "No workouts match your filters"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredWorkouts.map((item, index) => {
        const ActivityIcon = getActivityIcon(item.workout.activity);
        const activityColor = getActivityColor(item.workout.activity);
        const user = item.userData;
        const workout = item.workout;
        const username = user?.name || user?.username || null;
        const activity = user?.activity || workout.activity || null;
        const displayName = getDisplayName(username, item.userId, activity);

        return (
          <motion.div
            key={`${item.userId}-${workout.id}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4 p-4 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-card"
            onClick={() => onWorkoutClick(item)}
          >
            <div className="relative">
              <Avatar
                src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`}
                alt={displayName}
                sx={{ width: 56, height: 56 }}
              />
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-card flex items-center justify-center ${activityColor === "text-success" ? "bg-success/20" : activityColor === "text-primary" ? "bg-primary/20" : "bg-warning/20"}`}>
                <ActivityIcon className={activityColor} style={{ fontSize: 14 }} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">
                  {displayName}
                </h3>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <ActivityIcon className={activityColor} style={{ fontSize: 16 }} />
                <span className="text-xs text-muted-foreground capitalize">
                  {workout.activity}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(workout.date, { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="text-muted-foreground">
                  {formatTime(workout.duration)}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {convertDistance(workout.distance)}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {convertSpeed(workout.avgSpeed)}
                </span>
              </div>

              {workout.location && (
                <div className="flex items-center gap-1 mt-1">
                  <LocationOnIcon className="text-primary" style={{ fontSize: 14 }} />
                  <span className="text-xs text-muted-foreground truncate">
                    {workout.location}
                  </span>
                </div>
              )}
            </div>

            <div className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onWorkoutClick(item);
                }}
              >
                View
              </Button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

