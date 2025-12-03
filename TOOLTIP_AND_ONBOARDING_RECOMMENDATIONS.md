# 🎯 Tooltip & Onboarding Recommendations for PaceMatch

## 📋 Executive Summary

**Recommendation: Implement a hybrid approach combining:**
1. **Progressive Onboarding Flow** - Interactive walkthrough for first-time users
2. **Contextual Tooltips** - Helpful hints that appear when users interact with features
3. **Feature Discovery Tooltips** - One-time tooltips that appear when users first encounter key features

---

## 🎓 Why This Approach?

PaceMatch has **complex features** that users need to understand:
- **Poke feature** only works during active workouts (critical to explain!)
- **Map markers** show different activity types (running/cycling/walking)
- **Visibility toggles** control who can see you
- **Friend requests** and matching system
- **Workout tracking** with start/stop/pause controls

**Without guidance, users might:**
- Try to poke when workout isn't active (frustrating!)
- Not understand why they can't see nearby users
- Miss important features like filters and settings
- Get confused by the map interface

---

## 🚀 Implementation Strategy

### Phase 1: Progressive Onboarding (First-Time Users)

**When:** After ProfileSetup is complete, before showing the main app

**What:** Interactive walkthrough with 4-5 key screens

#### Onboarding Flow:

1. **Welcome Screen**
   - "Welcome to PaceMatch! Let's show you around"
   - Skip button available

2. **Home Feed Tour**
   - Highlight: Activity Feed, Stats, Active Friends
   - "This is your home base - see what your friends are up to!"

3. **Map Screen Tour**
   - Highlight: Start Workout button, Nearby Users, Map markers
   - **Critical:** "You can only interact with others when your workout is active"
   - Show: How to start a workout

4. **Poke Feature Explanation**
   - "Poke someone to show interest - but only during workouts!"
   - Visual indicator showing when poke is available vs disabled

5. **Settings & Privacy**
   - Quick tour of visibility settings
   - "Control who can see you on the map"

**Implementation:**
- Store `hasCompletedOnboarding` in user profile (Firebase)
- Show onboarding modal/drawer on first app launch
- Use Framer Motion for smooth transitions
- Allow skip at any point

---

### Phase 2: Contextual Tooltips (Always Available)

**When:** Users hover/tap on features that might need explanation

**What:** Quick help text that appears on interaction

#### Key Tooltips to Add:

1. **Map Screen:**
   ```
   - Start Workout Button: "Start tracking your workout to see and interact with nearby users"
   - Poke Button (disabled): "Start a workout to poke other users"
   - Poke Button (enabled): "Send a poke to show interest in matching"
   - Visibility Toggle: "Turn off to hide from other users on the map"
   - Filter Button: "Filter nearby users by activity type and fitness level"
   - Nearby Users Count: "Users within your selected radius"
   ```

2. **Home Feed:**
   ```
   - Quick Check-In: "Share your location and activity preferences"
   - Active Friends: "Friends currently working out nearby"
   - Top Matches: "Users with similar fitness levels and activities"
   ```

3. **Profile/Events:**
   ```
   - Friend Request Button: "Send a friend request to connect"
   - Event Join Button: "Join this event to meet other participants"
   ```

**Implementation:**
- Use existing `Tooltip` component from `@/components/ui/tooltip.tsx`
- Wrap interactive elements with `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`
- Keep tooltips concise (1-2 sentences max)
- Show on hover (desktop) or long-press (mobile)

---

### Phase 3: Feature Discovery Tooltips (One-Time)

**When:** First time user encounters a feature

**What:** Tooltips that appear once, then never again

#### Features to Highlight:

1. **First Map Visit:**
   - "Tap 'Start Workout' to begin tracking and see nearby users"
   - Appears when user first opens Map screen

2. **First Workout Start:**
   - "Great! Now you're visible to others. Try poking someone nearby!"
   - Appears when user starts their first workout

3. **First Nearby User:**
   - "See that marker? That's another user! Tap to view their profile"
   - Appears when first nearby user appears on map

4. **First Poke Attempt (if workout inactive):**
   - "You need to start a workout first to poke other users"
   - Appears if user tries to poke without active workout

5. **First Friend Request:**
   - "Friend requests help you connect with compatible workout partners"
   - Appears when user receives/sends first request

**Implementation:**
- Store `seenTooltips` object in user profile:
  ```typescript
  seenTooltips: {
    mapFirstVisit: true,
    firstWorkoutStart: true,
    firstNearbyUser: true,
    // ... etc
  }
  ```
- Check before showing tooltip
- Dismissible with "Got it" button
- Auto-dismiss after 5 seconds

---

## 🛠️ Technical Implementation

### 1. Create Onboarding Component

**File:** `src/components/OnboardingFlow.tsx`

```typescript
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";

interface OnboardingStep {
  title: string;
  description: string;
  highlight?: string; // Element to highlight
  image?: string; // Screenshot or illustration
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: "Welcome to PaceMatch!",
    description: "Connect with fitness partners in Metro Manila",
  },
  {
    title: "Your Home Feed",
    description: "See workouts, stats, and active friends",
    highlight: "home-feed",
  },
  {
    title: "Start Your Workout",
    description: "Begin tracking to see and interact with nearby users",
    highlight: "start-workout-button",
  },
  {
    title: "Poke Feature",
    description: "Show interest in matching - only works during active workouts!",
    highlight: "poke-button",
  },
];

export const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { userProfile, setUserProfile } = useUser();
  
  // Check if user has completed onboarding
  if (userProfile?.hasCompletedOnboarding) {
    return null;
  }
  
  // ... implementation
};
```

### 2. Create Feature Discovery Hook

**File:** `src/hooks/useFeatureDiscovery.ts`

```typescript
import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { updateUserProfile } from "@/services/authService";

export const useFeatureDiscovery = (featureKey: string) => {
  const { userProfile, user } = useUser();
  const [shouldShow, setShouldShow] = useState(false);
  
  useEffect(() => {
    if (!userProfile || !user) return;
    
    const seenTooltips = userProfile.seenTooltips || {};
    if (!seenTooltips[featureKey]) {
      setShouldShow(true);
    }
  }, [userProfile, featureKey]);
  
  const markAsSeen = async () => {
    if (!user || !userProfile) return;
    
    const updatedTooltips = {
      ...(userProfile.seenTooltips || {}),
      [featureKey]: true,
    };
    
    await updateUserProfile(user.uid, {
      seenTooltips: updatedTooltips,
    });
    
    setShouldShow(false);
  };
  
  return { shouldShow, markAsSeen };
};
```

### 3. Add Tooltip to MapScreen Poke Button

**Example Implementation:**

```typescript
// In MapScreen.tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFeatureDiscovery } from "@/hooks/useFeatureDiscovery";

// Inside component:
const { shouldShow: showPokeTooltip, markAsSeen: markPokeSeen } = useFeatureDiscovery("pokeFeature");

// On Poke Button:
<TooltipProvider>
  <Tooltip open={showPokeTooltip && !isActive}>
    <TooltipTrigger asChild>
      <Button
        disabled={!isActive}
        onClick={() => {
          markPokeSeen();
          // ... poke logic
        }}
      >
        Poke
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Start a workout to poke other users</p>
      <Button size="sm" onClick={markPokeSeen}>Got it</Button>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## 📊 Priority Implementation Order

### High Priority (Do First):
1. ✅ **Poke Feature Tooltip** - Critical! Users get frustrated when poke doesn't work
2. ✅ **Start Workout Tooltip** - Core feature explanation
3. ✅ **First Map Visit Tooltip** - Helps users understand the map

### Medium Priority:
4. ⚠️ **Visibility Toggle Tooltip** - Privacy is important
5. ⚠️ **Filter Button Tooltip** - Helps users find matches
6. ⚠️ **Onboarding Flow** - Overall user experience

### Low Priority (Nice to Have):
7. 💡 **Friend Request Tooltip** - Self-explanatory but helpful
8. 💡 **Event Join Tooltip** - Additional feature
9. 💡 **Profile Edit Tooltip** - Less critical

---

## 🎨 Design Guidelines

### Tooltip Styling:
- **Background:** Dark with high contrast (matches your existing design)
- **Text:** White, 14px, max 2 lines
- **Position:** Above element on mobile, below on desktop
- **Animation:** Fade in/out (0.2s)
- **Max Width:** 250px on mobile, 300px on desktop

### Onboarding Flow:
- **Background:** Semi-transparent overlay (backdrop-blur)
- **Highlight:** Animated border around featured element
- **Navigation:** Previous/Next buttons + Skip option
- **Progress:** Dots indicator showing current step
- **Mobile-First:** Touch-friendly buttons (min 44x44px)

---

## ✅ Benefits of This Approach

1. **Reduces Support Questions:** Users understand features before asking
2. **Increases Engagement:** Users discover features they might miss
3. **Improves Retention:** Better first-time experience = more returning users
4. **Prevents Frustration:** Explains why features might be disabled (poke during workout)
5. **Non-Intrusive:** Tooltips only appear when needed, can be dismissed

---

## 🚦 Next Steps

1. **Start Small:** Implement the Poke button tooltip first (highest impact)
2. **Test with Users:** Get feedback on tooltip clarity and timing
3. **Iterate:** Add more tooltips based on user questions/confusion
4. **Measure:** Track which tooltips are most helpful (analytics)

---

## 📝 Example: Poke Button Tooltip Implementation

Here's a complete example you can copy-paste:

```typescript
// In MapScreen.tsx, around the Poke button
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFeatureDiscovery } from "@/hooks/useFeatureDiscovery";

// Add this hook call near other hooks:
const { shouldShow: showPokeTooltip, markAsSeen: markPokeSeen } = useFeatureDiscovery("pokeFeature");

// Wrap your Poke button:
<TooltipProvider>
  <Tooltip open={showPokeTooltip && !isActive}>
    <TooltipTrigger asChild>
      <span>
        <Button
          disabled={!isActive}
          onClick={handlePoke}
          className={cn(
            "relative",
            !isActive && "opacity-50"
          )}
        >
          <TouchAppIcon className="mr-2" />
          Poke
        </Button>
      </span>
    </TooltipTrigger>
    <TooltipContent 
      side="top" 
      className="max-w-[250px] bg-popover text-popover-foreground"
    >
      <div className="space-y-2">
        <p className="text-sm font-medium">
          Start a workout to poke other users
        </p>
        <p className="text-xs text-muted-foreground">
          The poke feature is only available during active workout sessions.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            markPokeSeen();
          }}
          className="w-full mt-2"
        >
          Got it
        </Button>
      </div>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## 🎯 Summary

**My Recommendation:** Start with **contextual tooltips** for critical features (especially the Poke button), then add a **progressive onboarding flow** for first-time users. This gives you:

- ✅ Quick wins (tooltips are easy to add)
- ✅ High impact (explains confusing features)
- ✅ Scalable (can add more tooltips over time)
- ✅ Non-intrusive (users can dismiss/ignore)

**Would you like me to implement any of these?** I can start with the Poke button tooltip or create the onboarding flow component! 🚀

