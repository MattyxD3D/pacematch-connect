import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StopIcon from "@mui/icons-material/Stop";

interface LocationSharingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDuration: 15 | 30 | 60 | null;
  onDurationSelect: (duration: 15 | 30 | 60) => void;
  onStartSharing: () => void;
  onStopSharing: () => void;
  isSharing: boolean;
  remainingSeconds: number;
  currentLocation: { lat: number; lng: number } | null;
}

const LocationSharingModal = ({
  open,
  onOpenChange,
  selectedDuration,
  onDurationSelect,
  onStartSharing,
  onStopSharing,
  isSharing,
  remainingSeconds,
  currentLocation,
}: LocationSharingModalProps) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing when sharing is active (user must stop sharing first)
    if (isSharing && !newOpen) {
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Location</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {!isSharing ? (
            <>
              {/* Duration Selection */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Select duration:</p>
                <div className="grid grid-cols-3 gap-3">
                  {([15, 30, 60] as const).map((duration) => (
                    <Button
                      key={duration}
                      variant={selectedDuration === duration ? "default" : "outline"}
                      onClick={() => onDurationSelect(duration)}
                      className="h-12"
                    >
                      {duration === 60 ? "1 hour" : `${duration} min`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <Button
                onClick={onStartSharing}
                disabled={!selectedDuration || !currentLocation}
                className="w-full h-12 text-base"
                size="lg"
              >
                <LocationOnIcon className="mr-2" style={{ fontSize: 20 }} />
                Start sharing location
              </Button>
            </>
          ) : (
            <>
              {/* Active Sharing Display */}
              <div className="text-center space-y-4">
                {/* Large Timer */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Sharing location...</p>
                  <div className="text-5xl font-bold text-primary">
                    {formatTime(remainingSeconds)}
                  </div>
                </div>

                {/* I'm Here Indicator */}
                <div className="flex items-center justify-center gap-2 py-2">
                  <LocationOnIcon className="text-success" style={{ fontSize: 24 }} />
                  <p className="text-lg font-semibold">I'm here</p>
                </div>

                {/* Coordinates */}
                {currentLocation && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}

                {/* Stop Button */}
                <Button
                  onClick={onStopSharing}
                  variant="destructive"
                  className="w-full h-12 mt-4"
                  size="lg"
                >
                  <StopIcon className="mr-2" style={{ fontSize: 20 }} />
                  Stop Sharing
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationSharingModal;

