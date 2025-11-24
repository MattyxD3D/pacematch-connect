import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import CloseIcon from "@mui/icons-material/Close";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import EventIcon from "@mui/icons-material/Event";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import DescriptionIcon from "@mui/icons-material/Description";
import { toast } from "sonner";
import { z } from "zod";

// Validation schema
const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(100, { message: "Title must be less than 100 characters" }),
  description: z
    .string()
    .trim()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(500, { message: "Description must be less than 500 characters" }),
  activityType: z.enum(["running", "cycling", "walking"], {
    required_error: "Please select an activity type",
  }),
  date: z
    .string()
    .min(1, { message: "Date is required" })
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: "Date must be today or in the future",
    }),
  time: z.string().min(1, { message: "Time is required" }),
  location: z
    .string()
    .trim()
    .min(3, { message: "Location must be at least 3 characters" })
    .max(200, { message: "Location must be less than 200 characters" }),
  maxParticipants: z
    .number()
    .int()
    .min(2, { message: "Must allow at least 2 participants" })
    .max(1000, { message: "Cannot exceed 1000 participants" })
    .optional(),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

interface CreateEventModalProps {
  onClose: () => void;
  onCreateEvent: (eventData: CreateEventFormData) => void;
}

export const CreateEventModal = ({ onClose, onCreateEvent }: CreateEventModalProps) => {
  const [formData, setFormData] = useState<Partial<CreateEventFormData>>({
    activityType: "running",
    maxParticipants: undefined,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateEventFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activities = [
    { id: "running", label: "Running", icon: DirectionsRunIcon, color: "success" },
    { id: "cycling", label: "Cycling", icon: DirectionsBikeIcon, color: "primary" },
    { id: "walking", label: "Walking", icon: DirectionsWalkIcon, color: "warning" },
  ] as const;

  const handleInputChange = (field: keyof CreateEventFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = createEventSchema.parse({
        ...formData,
        maxParticipants: formData.maxParticipants
          ? Number(formData.maxParticipants)
          : undefined,
      });

      // Call the create event handler
      onCreateEvent(validatedData);
      
      toast.success("Event created successfully!");
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof CreateEventFormData, string>> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof CreateEventFormData] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Please fix the form errors");
      } else {
        toast.error("Failed to create event");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl my-8"
        >
          <Card className="overflow-hidden shadow-elevation-4 border-2 border-border/50">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary/10 via-success/5 to-warning/10 p-6 border-b border-border">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-sm hover:bg-secondary rounded-full transition-colors z-10"
              >
                <CloseIcon fontSize="small" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-background/80 backdrop-blur-sm rounded-xl">
                  <EventIcon className="text-primary" style={{ fontSize: 28 }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Create New Event</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Share your activity with the community
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Event Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold flex items-center gap-2">
                  <EventIcon style={{ fontSize: 18 }} />
                  Event Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Morning Run in Central Park"
                  value={formData.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={`h-12 ${errors.title ? "border-destructive" : ""}`}
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold flex items-center gap-2">
                  <DescriptionIcon style={{ fontSize: 18 }} />
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your event, what to expect, any special requirements..."
                  value={formData.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className={`min-h-[100px] resize-none ${errors.description ? "border-destructive" : ""}`}
                  maxLength={500}
                />
                <div className="flex justify-between items-center">
                  {errors.description ? (
                    <p className="text-sm text-destructive">{errors.description}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {formData.description?.length || 0} / 500 characters
                    </p>
                  )}
                </div>
              </div>

              {/* Activity Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Activity Type *</Label>
                <div className="grid grid-cols-3 gap-3">
                  {activities.map((activity) => {
                    const Icon = activity.icon;
                    const isSelected = formData.activityType === activity.id;
                    return (
                      <motion.button
                        key={activity.id}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleInputChange("activityType", activity.id)}
                        className={`
                          flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300
                          ${
                            isSelected
                              ? activity.color === "success"
                                ? "border-success bg-success/10 shadow-elevation-2"
                                : activity.color === "primary"
                                ? "border-primary bg-primary/10 shadow-elevation-2"
                                : "border-warning bg-warning/10 shadow-elevation-2"
                              : "border-border bg-card hover:bg-secondary"
                          }
                        `}
                      >
                        <Icon
                          className={
                            isSelected
                              ? activity.color === "success"
                                ? "text-success"
                                : activity.color === "primary"
                                ? "text-primary"
                                : "text-warning"
                              : "text-muted-foreground"
                          }
                          style={{ fontSize: 32 }}
                        />
                        <span
                          className={`text-sm mt-2 font-semibold ${
                            isSelected ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {activity.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
                {errors.activityType && (
                  <p className="text-sm text-destructive">{errors.activityType}</p>
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-base font-semibold flex items-center gap-2">
                    <EventIcon style={{ fontSize: 18 }} />
                    Date *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    min={getTodayDate()}
                    value={formData.date || ""}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    className={`h-12 ${errors.date ? "border-destructive" : ""}`}
                  />
                  {errors.date && (
                    <p className="text-sm text-destructive">{errors.date}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="text-base font-semibold flex items-center gap-2">
                    <EventIcon style={{ fontSize: 18 }} />
                    Time *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time || ""}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                    className={`h-12 ${errors.time ? "border-destructive" : ""}`}
                  />
                  {errors.time && (
                    <p className="text-sm text-destructive">{errors.time}</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-base font-semibold flex items-center gap-2">
                  <LocationOnIcon style={{ fontSize: 18 }} />
                  Location *
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Central Park, New York"
                  value={formData.location || ""}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className={`h-12 ${errors.location ? "border-destructive" : ""}`}
                  maxLength={200}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location}</p>
                )}
              </div>

              {/* Max Participants */}
              <div className="space-y-2">
                <Label htmlFor="maxParticipants" className="text-base font-semibold flex items-center gap-2">
                  <PeopleIcon style={{ fontSize: 18 }} />
                  Maximum Participants (Optional)
                </Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  min="2"
                  max="1000"
                  value={formData.maxParticipants || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "maxParticipants",
                      e.target.value ? parseInt(e.target.value) : ""
                    )
                  }
                  className={`h-12 ${errors.maxParticipants ? "border-destructive" : ""}`}
                />
                {errors.maxParticipants && (
                  <p className="text-sm text-destructive">{errors.maxParticipants}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Set a limit on how many people can join this event
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-12"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
