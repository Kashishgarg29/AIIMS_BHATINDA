"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, Crown } from "lucide-react";
import { setEventHead } from "@/lib/actions/admin-actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SetEventHeadButton({
  eventId,
  assignedStaff
}: {
  eventId: string,
  assignedStaff: { id: string, fullName: string }[]
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const handleMakeHead = async () => {
    if (!selectedUserId) return;
    setIsUpdating(true);
    const result = await setEventHead(eventId, selectedUserId);
    setIsUpdating(false);

    if (!result.success) {
      alert(result.error || "Failed to make event head");
    } else {
      setOpen(false);
      setSelectedUserId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 hover:border-transparent transition-colors disabled:opacity-50 disabled:pointer-events-none"
        disabled={assignedStaff.length === 0}
      >
        <Crown className="mr-1 h-3 w-3" /> Make Head
      </DialogTrigger>
      <DialogContent showCloseButton={true}>
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-semibold">
            Assign Event Head
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choose one doctor from assigned staff to lead this event.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex justify-center">
          <Select value={selectedUserId} onValueChange={(val) => setSelectedUserId(val as string)}>
            <SelectTrigger className="w-[250px]">
              <div className="flex-1 text-left truncate">
                {selectedUserId 
                  ? assignedStaff.find(s => s.id === selectedUserId)?.fullName 
                  : "Select a doctor"}
              </div>
            </SelectTrigger>
            <SelectContent>
              {assignedStaff.map(staff => (
                <SelectItem key={staff.id} value={staff.id} className="cursor-pointer">
                  {staff.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter showCloseButton={true}>
          <Button
            onClick={handleMakeHead}
            disabled={isUpdating || !selectedUserId}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
