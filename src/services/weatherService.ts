/**
 * Weather Service
 * Fetches weather data from OpenWeatherMap API
 */

export interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
  location?: string;
  feelsLike?: number;
}

export interface ForecastData {
  high: number;
  low: number;
  condition: string;
  description: string;
  icon: string;
}

// Cache for weather data to reduce API calls
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const forecastCache = new Map<string, { data: ForecastData; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Get cache key from coordinates
 */
const getCacheKey = (lat: number, lng: number): string => {
  // Round to 2 decimal places for cache key (approx 1km precision)
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
};

/**
 * Get current weather conditions
 */
export const getCurrentWeather = async (
  lat: number,
  lng: number
): Promise<WeatherData> => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenWeatherMap API key is not configured");
  }

  // Check cache
  const cacheKey = getCacheKey(lat, lng);
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    console.log("🌤️ Fetching weather from OpenWeatherMap API...");
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Weather API error:", response.status, errorText);
      
      if (response.status === 401) {
        throw new Error("Invalid API key. Please check your OpenWeatherMap API key.");
      }
      if (response.status === 429) {
        throw new Error("API rate limit exceeded. Please try again later.");
      }
      throw new Error(`Weather API error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();

    const weatherData: WeatherData = {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind?.speed ? Math.round(data.wind.speed * 3.6) : undefined, // Convert m/s to km/h
      feelsLike: Math.round(data.main.feels_like),
    };

    // Cache the result
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now(),
    });

    return weatherData;
  } catch (error: any) {
    console.error("Error fetching current weather:", error);
    throw error;
  }
};

/**
 * Get today's weather forecast
 */
export const getTodayForecast = async (
  lat: number,
  lng: number
): Promise<ForecastData> => {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenWeatherMap API key is not configured");
  }

  // Check cache
  const cacheKey = getCacheKey(lat, lng);
  const cached = forecastCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&cnt=8`; // Get 8 forecasts (24 hours, 3-hour intervals)
    console.log("🌤️ Fetching weather forecast from OpenWeatherMap API...");
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Weather Forecast API error:", response.status, errorText);
      
      if (response.status === 401) {
        throw new Error("Invalid API key. Please check your OpenWeatherMap API key.");
      }
      if (response.status === 429) {
        throw new Error("API rate limit exceeded. Please try again later.");
      }
      throw new Error(`Weather API error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();

    // Get today's forecasts (next 24 hours)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayForecasts = data.list.filter((item: any) => {
      const forecastDate = new Date(item.dt * 1000);
      return forecastDate >= today && forecastDate < tomorrow;
    });

    if (todayForecasts.length === 0) {
      // Fallback to first forecast if no today forecasts
      const firstForecast = data.list[0];
      const forecastData: ForecastData = {
        high: Math.round(firstForecast.main.temp_max),
        low: Math.round(firstForecast.main.temp_min),
        condition: firstForecast.weather[0].main,
        description: firstForecast.weather[0].description,
        icon: firstForecast.weather[0].icon,
      };
      
      forecastCache.set(cacheKey, {
        data: forecastData,
        timestamp: Date.now(),
      });
      
      return forecastData;
    }

    // Calculate high and low from today's forecasts
    const temps = todayForecasts.map((item: any) => item.main.temp);
    const high = Math.round(Math.max(...temps));
    const low = Math.round(Math.min(...temps));

    // Use the most representative forecast (middle of day or most common condition)
    const midDayForecast = todayForecasts[Math.floor(todayForecasts.length / 2)] || todayForecasts[0];

    const forecastData: ForecastData = {
      high,
      low,
      condition: midDayForecast.weather[0].main,
      description: midDayForecast.weather[0].description,
      icon: midDayForecast.weather[0].icon,
    };

    // Cache the result
    forecastCache.set(cacheKey, {
      data: forecastData,
      timestamp: Date.now(),
    });

    return forecastData;
  } catch (error: any) {
    console.error("Error fetching weather forecast:", error);
    throw error;
  }
};

/**
 * Convert temperature based on unit preference
 */
export const convertTemperature = (celsius: number, useMetric: boolean): { value: number; unit: string } => {
  if (useMetric) {
    return { value: Math.round(celsius), unit: "°C" };
  }
  const fahrenheit = (celsius * 9) / 5 + 32;
  return { value: Math.round(fahrenheit), unit: "°F" };
};

/**
 * Get weather icon component name or emoji based on condition
 */
export const getWeatherIcon = (condition: string, iconCode?: string): string => {
  const conditionLower = condition.toLowerCase();
  
  // Use OpenWeatherMap icon codes if available
  if (iconCode) {
    // Icon codes: 01d/01n = clear, 02d/02n = few clouds, etc.
    if (iconCode.startsWith("01")) return "☀️"; // Clear sky
    if (iconCode.startsWith("02")) return "⛅"; // Few clouds
    if (iconCode.startsWith("03") || iconCode.startsWith("04")) return "☁️"; // Clouds
    if (iconCode.startsWith("09") || iconCode.startsWith("10")) return "🌧️"; // Rain
    if (iconCode.startsWith("11")) return "⛈️"; // Thunderstorm
    if (iconCode.startsWith("13")) return "❄️"; // Snow
    if (iconCode.startsWith("50")) return "🌫️"; // Mist
  }
  
  // Fallback to condition name
  if (conditionLower.includes("clear") || conditionLower.includes("sunny")) return "☀️";
  if (conditionLower.includes("cloud")) return "☁️";
  if (conditionLower.includes("rain") || conditionLower.includes("drizzle")) return "🌧️";
  if (conditionLower.includes("thunder") || conditionLower.includes("storm")) return "⛈️";
  if (conditionLower.includes("snow")) return "❄️";
  if (conditionLower.includes("mist") || conditionLower.includes("fog")) return "🌫️";
  
  return "🌤️"; // Default
};

