import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FitnessLevel } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import "@/styles/animations.css";

interface FitnessLevelAvatarProps {
  photoURL?: string | null;
  name?: string;
  fitnessLevel?: FitnessLevel | string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showGlow?: boolean;
}

/**
 * Avatar component with fitness level glow effect
 * 
 * This component wraps the standard Avatar and adds a colored glow
 * around the avatar based on the user's fitness level:
 * - Beginner: Blue glow
 * - Intermediate: Green glow  
 * - Pro: Purple glow
 * 
 * The glow effect uses CSS box-shadow to create a soft, animated
 * border that pulses slightly to draw attention to the fitness level.
 */
export const FitnessLevelAvatar = React.forwardRef<
  HTMLDivElement,
  FitnessLevelAvatarProps
>(({ photoURL, name, fitnessLevel, size = "md", className, showGlow = true, ...props }, ref) => {
  // Get fitness level colors and styles
  const getFitnessLevelStyles = (level?: FitnessLevel | string) => {
    if (!level) return { glow: "", border: "", ring: "", pulse: "" };
    
    const normalizedLevel = (level as string).toLowerCase();
    
    switch (normalizedLevel) {
      case "beginner":
        return {
          glow: "shadow-[0_0_12px_rgba(59,130,246,0.6),0_0_24px_rgba(59,130,246,0.3)]",
          border: "border-blue-500",
          ring: "ring-2 ring-blue-400/50",
          pulse: "animate-glow-pulse-blue"
        };
      case "intermediate":
        return {
          glow: "shadow-[0_0_12px_rgba(34,197,94,0.6),0_0_24px_rgba(34,197,94,0.3)]",
          border: "border-green-500",
          ring: "ring-2 ring-green-400/50",
          pulse: "animate-glow-pulse-green"
        };
      case "pro":
        return {
          glow: "shadow-[0_0_12px_rgba(168,85,247,0.6),0_0_24px_rgba(168,85,247,0.3)]",
          border: "border-purple-500",
          ring: "ring-2 ring-purple-400/50",
          pulse: "animate-glow-pulse-purple"
        };
      default:
        return { glow: "", border: "border-border", ring: "", pulse: "" };
    }
  };

  // Size classes
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20"
  };

  const styles = getFitnessLevelStyles(fitnessLevel);
  const sizeClass = sizeClasses[size];

  return (
    <div
      ref={ref}
      className={cn(
        "relative inline-block",
        showGlow && styles.glow,
        showGlow && styles.pulse,
        className
      )}
      {...props}
    >
      <Avatar
        className={cn(
          sizeClass,
          "border-2 transition-all duration-300 rounded-full overflow-hidden",
          showGlow ? styles.border : "border-border",
          showGlow && styles.ring
        )}
      >
        <AvatarImage 
          src={photoURL || `https://ui-avatars.com/api/?name=${name || 'User'}&background=random`}
          className="rounded-full object-cover"
        />
        <AvatarFallback className="rounded-full">
          {name?.charAt(0)?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      
      {/* Optional: Add a small badge indicator */}
      {fitnessLevel && showGlow && (
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
            fitnessLevel.toLowerCase() === "beginner" && "bg-blue-500",
            fitnessLevel.toLowerCase() === "intermediate" && "bg-green-500",
            fitnessLevel.toLowerCase() === "pro" && "bg-purple-500"
          )}
          title={fitnessLevel.charAt(0).toUpperCase() + fitnessLevel.slice(1)}
        />
      )}
    </div>
  );
});

FitnessLevelAvatar.displayName = "FitnessLevelAvatar";

