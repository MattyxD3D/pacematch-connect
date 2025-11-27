import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

type EventType = "running" | "cycling" | "walking" | "others";

interface EventsTopBarProps {
  activityFilter: EventType | "all";
  onActivityFilterChange: (filter: EventType | "all") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const EventsTopBar = ({
  activityFilter,
  onActivityFilterChange,
  searchQuery,
  onSearchChange,
}: EventsTopBarProps) => {
  const getActivityIcon = (type: EventType | "all") => {
    switch (type) {
      case "running":
        return <DirectionsRunIcon style={{ fontSize: 20 }} className="text-success" />;
      case "cycling":
        return <DirectionsBikeIcon style={{ fontSize: 20 }} className="text-primary" />;
      case "walking":
        return <DirectionsWalkIcon style={{ fontSize: 20 }} className="text-warning" />;
      case "others":
        return <FitnessCenterIcon style={{ fontSize: 20 }} className="text-secondary" />;
      default:
        return <FitnessCenterIcon style={{ fontSize: 20 }} className="text-muted-foreground" />;
    }
  };

  const getActivityLabel = (type: EventType | "all") => {
    switch (type) {
      case "running":
        return "Running";
      case "cycling":
        return "Cycling";
      case "walking":
        return "Walking";
      case "others":
        return "Others";
      default:
        return "All Activities";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/80 backdrop-blur-md shadow-elevation-2 sticky top-0 z-20 border-b border-border/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Workout Dropdown - First Icon */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg bg-muted hover:bg-accent transition-colors touch-target min-h-[44px] min-w-[44px] sm:min-w-auto"
              >
                {getActivityIcon(activityFilter)}
                <span className="text-sm font-medium hidden sm:inline">
                  {getActivityLabel(activityFilter)}
                </span>
                <ArrowDropDownIcon style={{ fontSize: 18 }} className="text-muted-foreground flex-shrink-0" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => onActivityFilterChange("all")}
                className="flex items-center gap-2"
              >
                <FitnessCenterIcon style={{ fontSize: 18 }} className="text-muted-foreground" />
                <span>All Activities</span>
                {activityFilter === "all" && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onActivityFilterChange("running")}
                className="flex items-center gap-2"
              >
                <DirectionsRunIcon style={{ fontSize: 18 }} className="text-success" />
                <span>Running</span>
                {activityFilter === "running" && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onActivityFilterChange("cycling")}
                className="flex items-center gap-2"
              >
                <DirectionsBikeIcon style={{ fontSize: 18 }} className="text-primary" />
                <span>Cycling</span>
                {activityFilter === "cycling" && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onActivityFilterChange("walking")}
                className="flex items-center gap-2"
              >
                <DirectionsWalkIcon style={{ fontSize: 18 }} className="text-warning" />
                <span>Walking</span>
                {activityFilter === "walking" && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onActivityFilterChange("others")}
                className="flex items-center gap-2"
              >
                <FitnessCenterIcon style={{ fontSize: 18 }} className="text-secondary" />
                <span>Others</span>
                {activityFilter === "others" && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search Input */}
          <div className="flex-1 relative min-w-0">
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              style={{ fontSize: 20 }}
            />
            <Input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-8 sm:pr-10 h-10 sm:h-10 w-full bg-background min-h-[44px]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground touch-target min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

