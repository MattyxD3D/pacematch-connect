import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@mui/material";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import TimerIcon from "@mui/icons-material/Timer";
import SpeedIcon from "@mui/icons-material/Speed";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import CloseIcon from "@mui/icons-material/Close";
import { format } from "date-fns";
import type { WorkoutHistory } from "@/contexts/UserContext";

interface WorkoutDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: WorkoutHistory;
  useMetric: boolean;
}

export const WorkoutDetailModal = ({
  isOpen,
  onClose,
  workout,
  useMetric,
}: WorkoutDetailModalProps) => {
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

  const getActivityConfig = (activity: "running" | "cycling" | "walking") => {
    const configs = {
      running: { 
        icon: DirectionsRunIcon, 
        color: "success", 
        label: "Running",
        bgClass: "bg-success/10",
        textClass: "text-success",
        borderClass: "border-success/30"
      },
      cycling: { 
        icon: DirectionsBikeIcon, 
        color: "primary", 
        label: "Cycling",
        bgClass: "bg-primary/10",
        textClass: "text-primary",
        borderClass: "border-primary/30"
      },
      walking: { 
        icon: DirectionsWalkIcon, 
        color: "warning", 
        label: "Walking",
        bgClass: "bg-warning/10",
        textClass: "text-warning",
        borderClass: "border-warning/30"
      },
    };
    return configs[activity];
  };

  const config = getActivityConfig(workout.activity);
  const Icon = config.icon;
  const distanceData = convertDistance(workout.distance);
  const speedData = convertSpeed(workout.avgSpeed);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6 space-y-6">
            {/* Header */}
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${config.bgClass}`}>
                    <Icon className={config.textClass} style={{ fontSize: 32 }} />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">{config.label} Session</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(workout.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Location */}
            {workout.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <LocationOnIcon style={{ fontSize: 20 }} />
                <span className="text-sm">{workout.location}</span>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className={`${config.bgClass} border-2 ${config.borderClass}`}>
                <CardContent className="p-4 text-center">
                  <TimerIcon className={config.textClass} style={{ fontSize: 28 }} />
                  <div className="text-2xl font-bold mt-2">{formatTime(workout.duration)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Duration</div>
                </CardContent>
              </Card>

              <Card className={`${config.bgClass} border-2 ${config.borderClass}`}>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl">📍</div>
                  <div className="text-2xl font-bold mt-2">
                    {distanceData.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{distanceData.unit}</div>
                </CardContent>
              </Card>

              <Card className={`${config.bgClass} border-2 ${config.borderClass}`}>
                <CardContent className="p-4 text-center">
                  <SpeedIcon className={config.textClass} style={{ fontSize: 28 }} />
                  <div className="text-2xl font-bold mt-2">
                    {speedData.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{speedData.unit}</div>
                </CardContent>
              </Card>

              <Card className={`${config.bgClass} border-2 ${config.borderClass}`}>
                <CardContent className="p-4 text-center">
                  <LocalFireDepartmentIcon className="text-warning" style={{ fontSize: 28 }} />
                  <div className="text-2xl font-bold mt-2">{workout.calories}</div>
                  <div className="text-xs text-muted-foreground mt-1">Calories</div>
                </CardContent>
              </Card>
            </div>

            {/* Route Map Placeholder */}
            <Card>
              <CardContent className="p-0">
                <div className="bg-gradient-to-br from-primary/10 via-success/5 to-warning/10 rounded-lg h-48 flex items-center justify-center border border-border">
                  <div className="text-center">
                    <LocationOnIcon className="text-muted-foreground mx-auto mb-2" style={{ fontSize: 48 }} />
                    <p className="text-sm text-muted-foreground">Route map preview</p>
                    <p className="text-xs text-muted-foreground mt-1">GPS tracking feature coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nearby Users During Workout */}
            {workout.nearbyUsers && workout.nearbyUsers.length > 0 && (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <PeopleIcon className="text-primary" style={{ fontSize: 24 }} />
                    <h3 className="text-lg font-bold">
                      People Nearby During Workout
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {workout.nearbyUsers.length} {workout.nearbyUsers.length === 1 ? "person was" : "people were"} active nearby during your workout
                  </p>

                  <div className="space-y-3">
                    {workout.nearbyUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <Avatar
                          src={user.avatar}
                          alt={user.name}
                          sx={{ width: 48, height: 48 }}
                        />
                        <div className="flex-1">
                          <p className="font-semibold">{user.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {user.activity === "Running" && "🏃"}
                              {user.activity === "Cycling" && "🚴"}
                              {user.activity === "Walking" && "🚶"}
                            </span>
                            <span>{user.activity}</span>
                            <span>•</span>
                            <span>{user.distance} away</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Privacy Note:</span> These users could also see your activity in their nearby workouts feed during this time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No nearby users message */}
            {(!workout.nearbyUsers || workout.nearbyUsers.length === 0) && (
              <Card>
                <CardContent className="p-6 text-center">
                  <PeopleIcon className="text-muted-foreground/30 mx-auto mb-3" style={{ fontSize: 48 }} />
                  <p className="text-sm text-muted-foreground">
                    No other users were active nearby during this workout
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Close Button */}
            <Button onClick={onClose} className="w-full" size="lg">
              Close
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
