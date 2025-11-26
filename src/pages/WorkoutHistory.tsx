import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser, type WorkoutHistory } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutDetailModal } from "@/components/WorkoutDetailModal";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import { format } from "date-fns";
import BottomNavigation from "@/components/BottomNavigation";
import { generateDummyWorkoutHistory, ENABLE_DUMMY_DATA } from "@/lib/dummyData";

const WorkoutHistoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workoutHistory, useMetric } = useUser();
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutHistory | null>(null);

  // Sort workouts by date (most recent first)
  const sortedWorkouts = useMemo(() => {
    // Add dummy workout history if enabled and no real workouts exist
    let workouts = [...workoutHistory];
    if (ENABLE_DUMMY_DATA && workouts.length === 0) {
      workouts = generateDummyWorkoutHistory();
    }
    return workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workoutHistory]);

  // Auto-open workout detail modal if workoutId is provided in navigation state
  useEffect(() => {
    const workoutId = (location.state as { workoutId?: string })?.workoutId;
    if (workoutId && sortedWorkouts.length > 0) {
      const workout = sortedWorkouts.find(w => w.id === workoutId);
      if (workout) {
        setSelectedWorkout(workout);
        // Clear the state to prevent reopening on subsequent navigations
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, sortedWorkouts, navigate, location.pathname]);


  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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
      running: { icon: DirectionsRunIcon, color: "success", label: "Running", bgClass: "bg-success/10", textClass: "text-success" },
      cycling: { icon: DirectionsBikeIcon, color: "primary", label: "Cycling", bgClass: "bg-primary/10", textClass: "text-primary" },
      walking: { icon: DirectionsWalkIcon, color: "warning", label: "Walking", bgClass: "bg-warning/10", textClass: "text-warning" },
    };
    return configs[activity];
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowBackIcon />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Workout History</h1>
              <p className="text-sm text-muted-foreground">
                {sortedWorkouts.length} workout{sortedWorkouts.length !== 1 ? "s" : ""} recorded
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Workouts List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarTodayIcon />
              Recent Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedWorkouts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏃</div>
                <h3 className="text-lg font-semibold mb-2">No workouts yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Start tracking your activities to see them here
                </p>
                <Button onClick={() => navigate("/map")}>Start a Workout</Button>
              </div>
            ) : (
              <div className="space-y-3">
                  {sortedWorkouts.map((workout, index) => {
                  const config = getActivityConfig(workout.activity);
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className="hover:shadow-elevation-2 transition-shadow cursor-pointer"
                        onClick={() => setSelectedWorkout(workout)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Activity Icon or Photo Thumbnail */}
                            {(workout as any).photos && (workout as any).photos.length > 0 ? (
                              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                <img 
                                  src={(workout as any).photos[0]} 
                                  alt="Workout" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className={`p-3 rounded-xl ${config.bgClass} flex-shrink-0`}>
                                <Icon className={config.textClass} style={{ fontSize: 28 }} />
                              </div>
                            )}

                            {/* Workout Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-lg">{config.label}</h3>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(workout.date), "MMM d, yyyy")}
                                </span>
                              </div>

                              {/* Stats Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                                <div>
                                  <div className="text-xs text-muted-foreground">Distance</div>
                                  <div className="font-semibold">
                                    {convertDistance(workout.distance).value}{" "}
                                    <span className="text-xs">{convertDistance(workout.distance).unit}</span>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Duration</div>
                                  <div className="font-semibold">{formatTime(workout.duration)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Avg Speed</div>
                                  <div className="font-semibold">
                                    {convertSpeed(workout.avgSpeed).value}{" "}
                                    <span className="text-xs">{convertSpeed(workout.avgSpeed).unit}</span>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Calories</div>
                                  <div className="font-semibold">{workout.calories}</div>
                                </div>
                              </div>

                              {/* Nearby Users Indicator */}
                              {workout.nearbyUsers && workout.nearbyUsers.length > 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <PeopleIcon style={{ fontSize: 16 }} />
                                  <span>
                                    {workout.nearbyUsers.length} {workout.nearbyUsers.length === 1 ? "person" : "people"} nearby
                                  </span>
                                </div>
                              )}

                              {/* Caption */}
                              {(workout as any).caption && (
                                <p className="text-sm text-muted-foreground italic mt-2">
                                  "{(workout as any).caption}"
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <WorkoutDetailModal
          isOpen={!!selectedWorkout}
          onClose={() => setSelectedWorkout(null)}
          workout={selectedWorkout}
          useMetric={useMetric}
        />
      )}
      
      <BottomNavigation />
    </div>
  );
};

export default WorkoutHistoryPage;
