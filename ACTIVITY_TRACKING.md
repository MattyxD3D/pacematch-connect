# Activity Tracking Flow

## How It Works

### 1. **User Selects Activity Type**
- User chooses activity (Running, Cycling, Walking) during **Profile Setup**
- Activity is saved to Firebase: `users/{userId}/activity`
- This is a **user preference**, not auto-detected

### 2. **GPS Tracking Only Starts When User Starts Activity**
- User clicks **"Start Activity"** button on MapScreen
- `isActivityActive` becomes `true`
- GPS tracking begins via `useLocation` hook
- Location updates sent to Firebase every 5-10 seconds

### 3. **Activity Tracking Flow**

```
User clicks "Start Activity"
  ↓
isActivityActive = true
  ↓
useLocation hook receives isTracking = true
  ↓
GPS permission requested (if not granted)
  ↓
watchPosition() starts tracking
  ↓
Location updates every 5-10 seconds
  ↓
Location saved to Firebase: users/{userId}/lat, lng, timestamp
  ↓
Activity trail drawn on map (blue polyline)
  ↓
Other users see your location (if visible = true)
```

### 4. **When User Stops Activity**
- User clicks **"Stop Activity"** button
- `isActivityActive` becomes `false`
- GPS tracking stops (`watchPosition` cleared)
- Activity trail cleared
- Location history reset

## Key Points

✅ **GPS tracking ONLY happens when activity is active**
- No background tracking
- Saves battery
- Privacy-friendly

✅ **Activity type is user-selected, not auto-detected**
- User chooses during profile setup
- Can be changed in Settings
- Stored in Firebase: `users/{userId}/activity`

✅ **Location updates only during active tracking**
- Updates every 5-10 seconds when active
- No updates when activity stopped
- Last location remains visible (if visible = true)

## Code Flow

### MapScreen.tsx
```typescript
const [isActivityActive, setIsActivityActive] = useState(false);

// GPS tracking controlled by activity state
const { location } = useLocation(
  user?.uid || null,
  isActivityActive,  // ← Only tracks when true
  visible
);

// Start/Stop button
onClick={() => setIsActivityActive(!isActivityActive)}
```

### useLocation.ts
```typescript
useEffect(() => {
  // Only track if isTracking is true
  if (!userId || !isTracking) {
    // Stop tracking
    navigator.geolocation.clearWatch(...);
    return;
  }
  
  // Start GPS tracking
  navigator.geolocation.watchPosition(...);
}, [userId, isTracking, visible]);
```

## Firebase Structure

```
users/
  {userId}/
    activity: "running" | "cycling" | "walking"  ← User-selected
    lat: 14.5995                                   ← Only updated when active
    lng: 120.9842                                  ← Only updated when active
    visible: true
    timestamp: 1234567890                          ← Last update time
```

## Summary

- ✅ GPS tracking = **ONLY when activity is active**
- ✅ Activity type = **User-selected** (not auto-detected)
- ✅ No background tracking
- ✅ Privacy-friendly
- ✅ Battery-efficient

