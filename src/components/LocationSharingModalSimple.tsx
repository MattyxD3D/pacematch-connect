import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LocationOnIcon from "@mui/icons-material/LocationOn";

interface LocationSharingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShareLocation: () => void;
  currentLocation: { lat: number; lng: number } | null;
  isGettingLocation: boolean;
}

const LocationSharingModal = ({
  open,
  onOpenChange,
  onShareLocation,
  currentLocation,
  isGettingLocation,
}: LocationSharingModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Location</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Location Status */}
          {isGettingLocation && (
            <div className="text-center text-sm text-muted-foreground animate-pulse">
              📍 Getting your location...
            </div>
          )}
          
          {!isGettingLocation && currentLocation && (
            <div className="text-center text-sm text-muted-foreground">
              📍 Location ready: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </div>
          )}

          {/* Share Button */}
          <Button
            onClick={onShareLocation}
            disabled={!currentLocation || isGettingLocation}
            className="w-full h-12 text-base"
            size="lg"
          >
            <LocationOnIcon className="mr-2" style={{ fontSize: 20 }} />
            {isGettingLocation ? "Getting location..." : "Share my location"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationSharingModal;

