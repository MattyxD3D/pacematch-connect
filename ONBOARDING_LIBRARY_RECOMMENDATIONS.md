# 📚 Library Recommendations for Tooltips & Onboarding

## ✅ What You Already Have

### Tooltips: **@radix-ui/react-tooltip** ✅
- **Status:** Already installed and configured
- **Location:** `src/components/ui/tooltip.tsx`
- **Perfect for:** Contextual tooltips (hover/tap help text)
- **Why it's great:**
  - Accessible (ARIA support)
  - Mobile-friendly (touch support)
  - Works with your existing design system
  - Lightweight and performant

**You can use this RIGHT NOW for tooltips!** No additional installation needed.

---

## 🎯 Recommended Onboarding Libraries

### Option 1: **react-joyride** ⭐ (RECOMMENDED)

**Why it's the best choice:**
- ✅ Most popular (5M+ weekly downloads)
- ✅ Full TypeScript support
- ✅ Mobile-friendly (works great with Capacitor)
- ✅ Highly customizable
- ✅ Active maintenance
- ✅ Works with React 18
- ✅ Can integrate with your Tailwind CSS styling
- ✅ Supports custom components (can use your existing modals)

**Installation:**
```bash
npm install react-joyride
```

**Basic Example:**
```typescript
import Joyride, { Step, CallBackProps } from 'react-joyride';

const steps: Step[] = [
  {
    target: '.start-workout-button',
    content: 'Start a workout to see and interact with nearby users!',
    placement: 'bottom',
  },
  {
    target: '.poke-button',
    content: 'Poke someone to show interest - only works during workouts!',
    placement: 'top',
  },
];

<Joyride
  steps={steps}
  continuous={true}
  showProgress={true}
  showSkipButton={true}
  styles={{
    options: {
      primaryColor: '#your-brand-color',
    },
  }}
/>
```

**Pros:**
- Battle-tested in production apps
- Great documentation
- Can highlight multiple elements
- Supports custom tooltip components
- Can be controlled programmatically

**Cons:**
- Slightly larger bundle size (~50KB)
- More features = more complexity

---

### Option 2: **@reactour/tour** (Modern Alternative)

**Why consider it:**
- ✅ Modern, lightweight
- ✅ TypeScript-first
- ✅ Simple API
- ✅ Good mobile support
- ✅ Customizable styling

**Installation:**
```bash
npm install @reactour/tour
```

**Basic Example:**
```typescript
import { TourProvider, useTour } from '@reactour/tour';

const steps = [
  {
    selector: '.start-workout-button',
    content: 'Start a workout to see nearby users!',
  },
  {
    selector: '.poke-button',
    content: 'Poke feature only works during workouts!',
  },
];

<TourProvider steps={steps}>
  <YourComponent />
</TourProvider>
```

**Pros:**
- Simpler API than react-joyride
- Smaller bundle size
- Modern React patterns

**Cons:**
- Less mature (fewer examples online)
- Smaller community

---

### Option 3: **driver.js** (Framework-Agnostic)

**Why consider it:**
- ✅ Very lightweight (~10KB)
- ✅ Framework-agnostic (works with any framework)
- ✅ Simple API
- ✅ Good performance

**Installation:**
```bash
npm install driver.js
```

**Basic Example:**
```typescript
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const driverObj = driver({
  steps: [
    { element: '.start-workout-button', popover: { title: 'Start Workout', description: 'Begin tracking to see nearby users' } },
    { element: '.poke-button', popover: { title: 'Poke Feature', description: 'Only works during active workouts!' } },
  ]
});

driverObj.drive();
```

**Pros:**
- Smallest bundle size
- Fast and performant
- Simple API

**Cons:**
- Not React-specific (less React-friendly)
- Requires more manual integration
- Less TypeScript support

---

## 🎨 Custom Solution (Using Your Existing Stack)

**You could also build your own using:**
- ✅ **Framer Motion** (already installed) - for animations
- ✅ **Radix UI Dialog** (already installed) - for modal overlays
- ✅ **Tailwind CSS** (already configured) - for styling

**Pros:**
- Full control over design
- No additional dependencies
- Matches your existing patterns exactly
- Smaller bundle size

**Cons:**
- More development time
- Need to handle edge cases yourself
- More code to maintain

---

## 💡 My Recommendation

### For Tooltips: **Use what you have!**
- ✅ `@radix-ui/react-tooltip` is perfect
- ✅ Already installed and configured
- ✅ Just wrap your buttons/features with it

### For Onboarding: **react-joyride**
- ✅ Best balance of features and ease of use
- ✅ Great TypeScript support
- ✅ Mobile-friendly
- ✅ Can style to match your design system
- ✅ Most examples and community support

---

## 🚀 Quick Start with react-joyride

### 1. Install:
```bash
cd /Applications/q/pacematch-connect
npm install react-joyride
```

### 2. Create Onboarding Component:

**File:** `src/components/OnboardingFlow.tsx`

```typescript
import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useUser } from '@/contexts/UserContext';
import { updateUserProfile } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';

const onboardingSteps: Step[] = [
  {
    target: '.home-feed-section',
    content: 'This is your home feed - see workouts, stats, and active friends!',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.start-workout-button',
    content: 'Start a workout to see and interact with nearby users on the map!',
    placement: 'top',
  },
  {
    target: '.poke-button',
    content: 'Poke someone to show interest - but only works during active workouts!',
    placement: 'left',
  },
  {
    target: '.visibility-toggle',
    content: 'Control who can see you on the map with this toggle.',
    placement: 'right',
  },
];

export const OnboardingFlow = () => {
  const { userProfile, user } = useAuth();
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    if (userProfile && !userProfile.hasCompletedOnboarding) {
      // Small delay to ensure DOM is ready
      setTimeout(() => setRunTour(true), 500);
    }
  }, [userProfile]);

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    
    // If tour is finished or skipped, mark as complete
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as STATUS)) {
      if (user?.uid) {
        await updateUserProfile(user.uid, {
          hasCompletedOnboarding: true,
        });
      }
      setRunTour(false);
    }
  };

  if (!runTour) return null;

  return (
    <Joyride
      steps={onboardingSteps}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#8b5cf6', // Your purple brand color
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '12px',
        },
        buttonNext: {
          backgroundColor: '#8b5cf6',
          borderRadius: '8px',
        },
        buttonBack: {
          color: '#8b5cf6',
        },
      }}
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};
```

### 3. Add to App.tsx:

```typescript
import { OnboardingFlow } from '@/components/OnboardingFlow';

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <UserProvider>
            <NotificationProvider>
              <AppContent />
              <OnboardingFlow /> {/* Add here */}
            </NotificationProvider>
          </UserProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};
```

### 4. Add data attributes to elements you want to highlight:

```typescript
// In MapScreen.tsx
<Button
  className="start-workout-button" // Add this class
  onClick={handleStartWorkout}
>
  Start Workout
</Button>

// In MapScreen.tsx - Poke button
<Button
  className="poke-button" // Add this class
  disabled={!isActive}
>
  Poke
</Button>
```

---

## 📊 Comparison Table

| Feature | react-joyride | @reactour/tour | driver.js | Custom (Framer Motion) |
|---------|--------------|----------------|-----------|------------------------|
| **Bundle Size** | ~50KB | ~30KB | ~10KB | 0KB (uses existing) |
| **TypeScript** | ✅ Excellent | ✅ Good | ⚠️ Basic | ✅ Full control |
| **Mobile Support** | ✅ Great | ✅ Good | ✅ Good | ✅ Full control |
| **Customization** | ✅ High | ✅ Medium | ⚠️ Limited | ✅ Full control |
| **Documentation** | ✅ Excellent | ✅ Good | ✅ Good | N/A |
| **Community** | ✅ Large | ⚠️ Small | ✅ Medium | N/A |
| **Learning Curve** | Medium | Easy | Easy | Hard |
| **React Integration** | ✅ Native | ✅ Native | ⚠️ Manual | ✅ Native |

---

## 🎯 Final Recommendation

**For your PaceMatch app, I recommend:**

1. **Tooltips:** Use existing `@radix-ui/react-tooltip` ✅
2. **Onboarding:** Install `react-joyride` ⭐

**Why?**
- You already have tooltips covered
- react-joyride is the most mature and reliable
- Great TypeScript support (important for your codebase)
- Mobile-friendly (critical for Capacitor app)
- Can be styled to match your design system
- Lots of examples and community support

**Next Steps:**
1. Install react-joyride: `npm install react-joyride`
2. Create the OnboardingFlow component (I can help with this!)
3. Add data attributes/classes to elements you want to highlight
4. Test on mobile device

Would you like me to implement the onboarding flow with react-joyride? 🚀

