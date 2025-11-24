import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser, type WorkoutHistory } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { WorkoutDetailModal } from "@/components/WorkoutDetailModal";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import TimerIcon from "@mui/icons-material/Timer";
import SpeedIcon from "@mui/icons-material/Speed";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PeopleIcon from "@mui/icons-material/People";
import { format } from "date-fns";

const WorkoutHistoryPage = () => {
  const navigate = useNavigate();
  const { workoutHistory, useMetric } = useUser();
  const [activityFilter, setActivityFilter] = useState<"all" | "running" | "cycling" | "walking">("all");
  const [sortBy, setSortBy] = useState<"date" | "distance" | "duration" | "calories">("date");
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "90days" | "all">("30days");
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutHistory | null>(null);

  // Filter workouts by activity
  const filteredWorkouts = useMemo(() => {
    let filtered = [...workoutHistory];
    
    if (activityFilter !== "all") {
      filtered = filtered.filter(w => w.activity === activityFilter);
    }

    // Filter by time range
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeRange === "7days") {
      cutoffDate.setDate(now.getDate() - 7);
    } else if (timeRange === "30days") {
      cutoffDate.setDate(now.getDate() - 30);
    } else if (timeRange === "90days") {
      cutoffDate.setDate(now.getDate() - 90);
    }
    
    if (timeRange !== "all") {
      filtered = filtered.filter(w => new Date(w.date) >= cutoffDate);
    }

    return filtered;
  }, [workoutHistory, activityFilter, timeRange]);

  // Sort workouts
  const sortedWorkouts = useMemo(() => {
    const sorted = [...filteredWorkouts];
    
    switch (sortBy) {
      case "date":
        return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case "distance":
        return sorted.sort((a, b) => b.distance - a.distance);
      case "duration":
        return sorted.sort((a, b) => b.duration - a.duration);
      case "calories":
        return sorted.sort((a, b) => b.calories - a.calories);
      default:
        return sorted;
    }
  }, [filteredWorkouts, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredWorkouts.length === 0) {
      return {
        totalWorkouts: 0,
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0,
        avgDistance: 0,
        avgDuration: 0,
        avgSpeed: 0,
      };
    }

    const totalDistance = filteredWorkouts.reduce((sum, w) => sum + w.distance, 0);
    const totalDuration = filteredWorkouts.reduce((sum, w) => sum + w.duration, 0);
    const totalCalories = filteredWorkouts.reduce((sum, w) => sum + w.calories, 0);
    const avgSpeed = filteredWorkouts.reduce((sum, w) => sum + w.avgSpeed, 0) / filteredWorkouts.length;

    return {
      totalWorkouts: filteredWorkouts.length,
      totalDistance,
      totalDuration,
      totalCalories,
      avgDistance: totalDistance / filteredWorkouts.length,
      avgDuration: totalDuration / filteredWorkouts.length,
      avgSpeed,
    };
  }, [filteredWorkouts]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return sortedWorkouts
      .slice(0, 10)
      .reverse()
      .map(workout => ({
        date: format(new Date(workout.date), "MMM d"),
        distance: useMetric ? workout.distance : workout.distance * 0.621371,
        duration: workout.duration / 60, // Convert to minutes
        calories: workout.calories,
        speed: useMetric ? workout.avgSpeed : workout.avgSpeed * 0.621371,
      }));
  }, [sortedWorkouts, useMetric]);

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
                {stats.totalWorkouts} workout{stats.totalWorkouts !== 1 ? "s" : ""} recorded
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters & Sort */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Activity Filter */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Activity Type</label>
                <Select value={activityFilter} onValueChange={(v: any) => setActivityFilter(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="cycling">Cycling</SelectItem>
                    <SelectItem value="walking">Walking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Range */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Time Range</label>
                <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 Days</SelectItem>
                    <SelectItem value="30days">Last 30 Days</SelectItem>
                    <SelectItem value="90days">Last 90 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date (Newest)</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                    <SelectItem value="calories">Calories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Overview */}
        {filteredWorkouts.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">{stats.totalWorkouts}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Workouts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-success">
                  {convertDistance(stats.totalDistance).value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Total {convertDistance(stats.totalDistance).unit}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-warning">{formatTime(stats.totalDuration)}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Time</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-destructive">{stats.totalCalories}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Calories</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        {filteredWorkouts.length > 0 && (
          <Tabs defaultValue="distance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="distance">Distance</TabsTrigger>
              <TabsTrigger value="duration">Duration</TabsTrigger>
              <TabsTrigger value="calories">Calories</TabsTrigger>
            </TabsList>

            <TabsContent value="distance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUpIcon className="text-success" />
                    Distance Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="distance"
                        stroke="hsl(var(--success))"
                        strokeWidth={2}
                        name={`Distance (${useMetric ? "km" : "mi"})`}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="duration">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TimerIcon className="text-primary" />
                    Duration Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Legend />
                      <Bar dataKey="duration" fill="hsl(var(--primary))" name="Duration (min)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calories">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LocalFireDepartmentIcon className="text-warning" />
                    Calories Burned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Legend />
                      <Bar dataKey="calories" fill="hsl(var(--warning))" name="Calories" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

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
                            {/* Activity Icon */}
                            <div className={`p-3 rounded-xl ${config.bgClass}`}>
                              <Icon className={config.textClass} style={{ fontSize: 28 }} />
                            </div>

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

        {/* Average Stats */}
        {filteredWorkouts.length > 0 && (
          <Card className="bg-gradient-to-br from-primary/5 via-success/5 to-warning/5">
            <CardHeader>
              <CardTitle>Average Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-card rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Avg Distance</div>
                  <div className="text-2xl font-bold">
                    {convertDistance(stats.avgDistance).value}{" "}
                    <span className="text-sm">{convertDistance(stats.avgDistance).unit}</span>
                  </div>
                </div>
                <div className="text-center p-4 bg-card rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Avg Duration</div>
                  <div className="text-2xl font-bold">{formatTime(stats.avgDuration)}</div>
                </div>
                <div className="text-center p-4 bg-card rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Avg Speed</div>
                  <div className="text-2xl font-bold">
                    {convertSpeed(stats.avgSpeed).value}{" "}
                    <span className="text-sm">{convertSpeed(stats.avgSpeed).unit}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
    </div>
  );
};

export default WorkoutHistoryPage;
