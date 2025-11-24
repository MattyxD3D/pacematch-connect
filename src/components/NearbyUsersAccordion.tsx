// Accordion component for displaying nearby matched users
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MatchResult } from "@/services/matchingService";
import { formatDistance } from "@/utils/distance";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import MessageIcon from "@mui/icons-material/Message";
import PersonIcon from "@mui/icons-material/Person";
import SpeedIcon from "@mui/icons-material/Speed";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";

interface NearbyUsersAccordionProps {
  matches: MatchResult[];
  onViewProfile: (userId: string) => void;
  onAddFriend: (userId: string) => void;
  onSendMessage: (userId: string) => void;
  loading?: boolean;
}

export const NearbyUsersAccordion = ({
  matches,
  onViewProfile,
  onAddFriend,
  onSendMessage,
  loading = false
}: NearbyUsersAccordionProps) => {
  const getActivityIcon = (activity: string) => {
    switch (activity.toLowerCase()) {
      case "running":
        return <DirectionsRunIcon className="text-success" style={{ fontSize: 20 }} />;
      case "cycling":
        return <DirectionsBikeIcon className="text-primary" style={{ fontSize: 20 }} />;
      case "walking":
        return <DirectionsWalkIcon className="text-warning" style={{ fontSize: 20 }} />;
      default:
        return null;
    }
  };

  const getFitnessLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-blue-500";
      case "intermediate":
        return "bg-yellow-500";
      case "pro":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "bg-success text-success-foreground";
    if (score >= 0.6) return "bg-primary text-primary-foreground";
    if (score >= 0.4) return "bg-warning text-warning-foreground";
    return "bg-muted text-muted-foreground";
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center text-muted-foreground">Loading matches...</div>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="p-6 text-center">
        <PeopleIcon style={{ fontSize: 48 }} className="text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No matches found nearby</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your preferences in settings</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="matches" className="border-0">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-2">
                <PeopleIcon style={{ fontSize: 20 }} />
                <span className="font-semibold">Nearby Matches</span>
                <Badge variant="secondary" className="ml-2">
                  {matches.length}
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-0">
            <div className="space-y-2 pb-2">
              {matches.map((match, index) => {
                const user = match.user;
                const distanceKm = match.distance / 1000;
                const score = match.score;

                return (
                  <motion.div
                    key={user.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12 border-2 border-primary">
                        <AvatarImage src={user.photoURL || `https://ui-avatars.com/api/?name=${user.name || 'User'}`} />
                        <AvatarFallback>
                          {user.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">
                            {user.name || "Unknown User"}
                          </h4>
                          <Badge className={`${getScoreColor(score)} text-xs px-1.5 py-0`}>
                            {Math.round(score * 100)}%
                          </Badge>
                        </div>

                        {/* Activity & Distance */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            {getActivityIcon(user.activity)}
                            <span className="capitalize">{user.activity}</span>
                          </div>
                          <span>•</span>
                          <span>{formatDistance(distanceKm)}</span>
                        </div>

                        {/* Fitness Level & Pace */}
                        <div className="flex items-center gap-3 text-xs mb-2">
                          <div className="flex items-center gap-1">
                            <FitnessCenterIcon style={{ fontSize: 14 }} />
                            <Badge
                              variant="outline"
                              className={`${getFitnessLevelColor(user.fitnessLevel)} text-white border-0 text-xs px-1.5 py-0`}
                            >
                              {user.fitnessLevel}
                            </Badge>
                          </div>
                          {user.pace > 0 && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <SpeedIcon style={{ fontSize: 14 }} />
                                <span>
                                  {user.activity === "cycling"
                                    ? `${user.pace.toFixed(1)} km/h`
                                    : `${user.pace.toFixed(1)} min/km`}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => onViewProfile(user.uid)}
                          >
                            <PersonIcon style={{ fontSize: 14 }} className="mr-1" />
                            Profile
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => onAddFriend(user.uid)}
                          >
                            <PersonAddIcon style={{ fontSize: 14 }} className="mr-1" />
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => onSendMessage(user.uid)}
                          >
                            <MessageIcon style={{ fontSize: 14 }} className="mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

