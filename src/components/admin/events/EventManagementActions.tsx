"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays, XCircle, Loader2 } from "lucide-react";
import { cancelEvent, rescheduleEvent } from "@/lib/actions/admin-actions";
import { useRouter } from "next/navigation";

export function EventManagementActions({
  eventId,
  currentDate,
  status,
  className = ""
}: {
  eventId: string;
  currentDate: Date;
  status: string;
  className?: string;
}) {
  const router = useRouter();
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [newDate, setNewDate] = useState(new Date(currentDate).toISOString().split('T')[0]);

  // Helper to check if event is UPCOMING
  const isUpcoming = status === "UPCOMING";

  if (!isUpcoming) return null;

  async function handleCancel() {
    setIsLoading(true);
    const res = await cancelEvent(eventId);
    if (res.success) {
      setIsCancelOpen(false);
      router.refresh();
    } else {
      alert(res.error || "Failed to cancel event");
    }
    setIsLoading(false);
  }

  async function handleReschedule() {
    setIsLoading(true);
    const res = await rescheduleEvent(eventId, new Date(newDate));
    if (res.success) {
      setIsRescheduleOpen(false);
      router.refresh();
    } else {
      alert(res.error || "Failed to reschedule event");
    }
    setIsLoading(false);
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsRescheduleOpen(true);
        }}
        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 h-8 font-semibold"
      >
        Reschedule
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsCancelOpen(true);
        }}
        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8 font-semibold"
      >
        Cancel
      </Button>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Event</DialogTitle>
            <DialogDescription>
              Change the scheduled date for this health camp. This will update the date across the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newDate">New Scheduled Date</Label>
              <Input
                id="newDate"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRescheduleOpen(false)}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleReschedule}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 font-bold">Cancel Health Camp?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this event? This action cannot be undone and the status will be marked as CANCELLED.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>No, Keep Event</Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Yes, Cancel Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
