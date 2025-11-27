import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ReportUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  onReport: (reason: string, details?: string) => Promise<void>;
}

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "spam", label: "Spam or scams" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "fake", label: "Fake profile" },
  { value: "other", label: "Other" },
];

export const ReportUserModal = ({
  open,
  onOpenChange,
  userName,
  onReport,
}: ReportUserModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await onReport(selectedReason, details.trim() || undefined);
      // Reset form
      setSelectedReason("");
      setDetails("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {userName}</DialogTitle>
          <DialogDescription>
            Help us keep PaceMatch safe. Your report will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">What's the reason for reporting?</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {REPORT_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="cursor-pointer font-normal">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason && (
            <div className="space-y-2">
              <Label htmlFor="details">Additional details (optional)</Label>
              <Textarea
                id="details"
                placeholder="Please provide any additional information that might help us understand the issue..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {details.length}/500
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

