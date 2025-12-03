import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CircularProgress } from "@mui/material";
import { 
  getCurrentWeather, 
  getTodayForecast, 
  convertTemperature, 
  getWeatherIcon,
  type WeatherData,
  type ForecastData 
} from "@/services/weatherService";
import { toast } from "sonner";
import CloudIcon from "@mui/icons-material/Cloud";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AirIcon from "@mui/icons-material/Air";

interface WeatherWidgetProps {
  location: { lat: number; lng: number } | null;
  useMetric?: boolean;
}

export const WeatherWidget = ({ location, useMetric = true }: WeatherWidgetProps) => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [current, todayForecast] = await Promise.all([
          getCurrentWeather(location.lat, location.lng),
          getTodayForecast(location.lat, location.lng),
        ]);
        
        setCurrentWeather(current);
        setForecast(todayForecast);
      } catch (err: any) {
        console.error("Error fetching weather:", err);
        const errorMessage = err.message || "Unable to fetch weather data";
        setError(errorMessage);
        
        // Show more specific error messages
        if (errorMessage.includes("API key")) {
          console.warn("⚠️ OpenWeatherMap API key not configured. Add VITE_OPENWEATHER_API_KEY to your .env file.");
          // Don't show toast for missing API key
        } else if (errorMessage.includes("401") || errorMessage.includes("Invalid API key")) {
          toast.error("Invalid weather API key. Please check your configuration.");
        } else if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
          toast.error("Weather API rate limit exceeded. Please try again later.");
        } else {
          toast.error(`Failed to load weather: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [location?.lat, location?.lng]);

  if (!location) {
    return null;
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-center gap-3">
            <CircularProgress size={20} />
            <span className="text-sm text-muted-foreground">Loading weather...</span>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (error) {
    // Show helpful error message for invalid API key
    if (error.includes("Invalid API key") || error.includes("401")) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <Card className="p-4 bg-warning/10 backdrop-blur-sm border-warning/30">
            <div className="flex items-center gap-2 text-sm">
              <CloudIcon className="text-warning" style={{ fontSize: 16 }} />
              <div>
                <span className="font-medium text-warning">Weather API key invalid</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Please check your OpenWeatherMap API key. It may need activation.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      );
    }
    
    // Don't show error state if API key is missing (silent fail)
    if (error.includes("API key is not configured")) {
      return null;
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CloudIcon style={{ fontSize: 16 }} />
            <span>Weather unavailable: {error}</span>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (!currentWeather || !forecast) {
    return null;
  }

  const currentTemp = convertTemperature(currentWeather.temperature, useMetric);
  const feelsLikeTemp = currentWeather.feelsLike 
    ? convertTemperature(currentWeather.feelsLike, useMetric)
    : null;
  const highTemp = convertTemperature(forecast.high, useMetric);
  const lowTemp = convertTemperature(forecast.low, useMetric);
  const weatherEmoji = getWeatherIcon(currentWeather.condition, currentWeather.icon);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-4"
    >
      <Card className="p-4 bg-gradient-to-r from-primary/10 via-card/50 to-success/10 backdrop-blur-sm border-border/50 hover:border-border transition-colors">
        <div className="flex items-center justify-between gap-4">
          {/* Current Weather */}
          <div className="flex items-center gap-3 flex-1">
            <div className="text-4xl">{weatherEmoji}</div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {currentTemp.value}
                </span>
                <span className="text-lg text-muted-foreground">
                  {currentTemp.unit}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground capitalize">
                  {currentWeather.description}
                </span>
                {feelsLikeTemp && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      Feels like {feelsLikeTemp.value}{feelsLikeTemp.unit}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Today's Forecast */}
          <div className="flex items-center gap-4 border-l border-border/50 pl-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">High</span>
                <span className="font-semibold text-foreground">
                  {highTemp.value}{highTemp.unit}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="text-muted-foreground">Low</span>
                <span className="font-semibold text-foreground">
                  {lowTemp.value}{lowTemp.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground border-l border-border/50 pl-4">
            {currentWeather.humidity !== undefined && (
              <div className="flex items-center gap-1">
                <WaterDropIcon style={{ fontSize: 16 }} />
                <span>{currentWeather.humidity}%</span>
              </div>
            )}
            {currentWeather.windSpeed !== undefined && (
              <div className="flex items-center gap-1">
                <AirIcon style={{ fontSize: 16 }} />
                <span>{currentWeather.windSpeed} km/h</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

