"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap } from "lucide-react";
import { setSchoolContact } from "@/lib/actions/admin-actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function SetSchoolContactButton({
  eventId,
  assignedStaff
}: {
  eventId: string;
  assignedStaff: { id: string; fullName: string; email: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetContact = async () => {
    if (!selectedUserId) return;
    
    setIsSubmitting(true);
    const result = await setSchoolContact(eventId, selectedUserId);
    setIsSubmitting(false);

    if (result.success) {
      setIsOpen(false);
    } else {
      alert(result.error || "Failed to assign School Contact");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-blue-50/50 px-4 py-2 text-sm font-medium shadow-sm hover:bg-blue-100 hover:text-blue-900 flex-1 sm:flex-none text-blue-700 transition-colors">
        <GraduationCap className="mr-2 h-4 w-4 text-blue-600" /> Assign School Contact
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign School Contact</DialogTitle>
          <DialogDescription>
            Select a staff member to act as the official School Contact. They will hold special viewing and pre-camp community medicine privileges.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label className="block mb-2 text-sm font-medium">Select Staff Member</Label>
          <Select value={selectedUserId} onValueChange={(val) => setSelectedUserId(val || "")}>
            <SelectTrigger>
              <div className="flex-1 text-left truncate">
                {selectedUserId 
                  ? assignedStaff.find(s => s.id === selectedUserId)?.fullName 
                  : "Identify School Representative"}
              </div>
            </SelectTrigger>
            <SelectContent>
              {assignedStaff.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.fullName} ({user.email})
                </SelectItem>
              ))}
              {assignedStaff.length === 0 && (
                <SelectItem value="none" disabled>
                  No staff members assigned yet
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSetContact} disabled={!selectedUserId || selectedUserId === "none" || isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
