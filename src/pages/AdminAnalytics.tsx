// Admin Analytics Dashboard
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSystemStats, getAllUsers } from "@/services/adminService";
import { toast } from "sonner";
import BarChartIcon from "@mui/icons-material/BarChart";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import EventIcon from "@mui/icons-material/Event";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import DownloadIcon from "@mui/icons-material/Download";

const AdminAnalytics = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [activityDistribution, setActivityDistribution] = useState<any>({});

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const statsData = await getSystemStats();
      setStats(statsData);

      // Calculate user growth (simplified - by creation date)
      const users = await getAllUsers();
      const growthData: any = {};
      
      users.forEach((user: any) => {
        if (user.createdAt) {
          const date = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          growthData[date] = (growthData[date] || 0) + 1;
        }
      });

      const growthArray = Object.entries(growthData)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setUserGrowth(growthArray);

      // Calculate activity distribution
      const activities: any = {};
      users.forEach((user: any) => {
        const activity = user.activity || "unknown";
        activities[activity] = (activities[activity] || 0) + 1;
      });
      setActivityDistribution(activities);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      stats,
      userGrowth,
      activityDistribution,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pacematch-analytics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Analytics data exported");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            View app statistics and user insights
          </p>
        </div>
        <Button onClick={exportData} variant="outline">
          <DownloadIcon className="mr-2" style={{ fontSize: 18 }} />
          Export Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-3xl font-bold mt-2">{stats?.totalUsers || 0}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <PeopleIcon className="text-primary" style={{ fontSize: 28 }} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active (30d)</p>
              <p className="text-3xl font-bold mt-2">{stats?.activeUsers || 0}</p>
            </div>
            <div className="p-3 bg-success/10 rounded-lg">
              <PeopleIcon className="text-success" style={{ fontSize: 28 }} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Workouts</p>
              <p className="text-3xl font-bold mt-2">{stats?.totalWorkouts || 0}</p>
            </div>
            <div className="p-3 bg-warning/10 rounded-lg">
              <DirectionsRunIcon className="text-warning" style={{ fontSize: 28 }} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Events</p>
              <p className="text-3xl font-bold mt-2">{stats?.totalEvents || 0}</p>
            </div>
            <div className="p-3 bg-info/10 rounded-lg">
              <EventIcon className="text-info" style={{ fontSize: 28 }} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Reports</p>
              <p className="text-3xl font-bold mt-2">{stats?.pendingReports || 0}</p>
            </div>
            <div className="p-3 bg-destructive/10 rounded-lg">
              <ReportProblemIcon className="text-destructive" style={{ fontSize: 28 }} />
            </div>
          </div>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">User Growth</h3>
        {userGrowth.length === 0 ? (
          <p className="text-sm text-muted-foreground">No growth data available</p>
        ) : (
          <div className="space-y-2">
            {userGrowth.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-muted-foreground">{item.date}</div>
                <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(item.count / Math.max(...userGrowth.map(i => i.count))) * 100}%` }}
                  >
                    <span className="text-xs font-medium text-primary-foreground">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Activity Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Activity Distribution</h3>
        {Object.keys(activityDistribution).length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity data available</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(activityDistribution).map(([activity, count]: [string, any]) => {
              const total = Object.values(activityDistribution).reduce((sum: number, val: any) => sum + val, 0);
              const percentage = ((count / total) * 100).toFixed(1);
              
              return (
                <div key={activity} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{activity}</span>
                    <span className="text-sm text-muted-foreground">{count} users ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Active Rate (30d)</span>
              <span className="text-sm font-medium">
                {stats?.totalUsers > 0
                  ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Workouts per User</span>
              <span className="text-sm font-medium">
                {stats?.totalUsers > 0
                  ? (stats.totalWorkouts / stats.totalUsers).toFixed(1)
                  : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Events per User</span>
              <span className="text-sm font-medium">
                {stats?.totalUsers > 0
                  ? (stats.totalEvents / stats.totalUsers).toFixed(1)
                  : 0}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Report Rate</span>
              <span className="text-sm font-medium">
                {stats?.totalUsers > 0
                  ? ((stats.pendingReports / stats.totalUsers) * 100).toFixed(2)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Data Freshness</span>
              <span className="text-sm font-medium text-success">Up to date</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;

