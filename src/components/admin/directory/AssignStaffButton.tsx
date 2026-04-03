"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Search } from "lucide-react";
import { assignStaffToEvent } from "@/lib/actions/admin-actions";

type StaffMember = {
  id: string;
  fullName: string;
  email: string;
  department?: string | null;
};

export function AssignStaffButton({
  eventId,
  availableStaff,
  assignedStaffIds
}: {
  eventId: string;
  availableStaff: StaffMember[];
  assignedStaffIds: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Filter out staff who are already assigned to the event
  const unassignedStaff = availableStaff.filter(s => !assignedStaffIds.includes(s.id));

  // Further filter by search term
  const filteredStaff = unassignedStaff.filter(s => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const dept = s.department?.replace("_", " ") || "";
    return s.fullName.toLowerCase().includes(q) || dept.toLowerCase().includes(q);
  });

  const toggleStaffSelection = (id: string) => {
    const nextChoices = new Set(selectedStaffIds);
    if (nextChoices.has(id)) {
      nextChoices.delete(id);
    } else {
      nextChoices.add(id);
    }
    setSelectedStaffIds(nextChoices);
  };

  const handleAssign = async () => {
    if (selectedStaffIds.size === 0) {
      setIsOpen(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await assignStaffToEvent(eventId, Array.from(selectedStaffIds));

    if (res.success) {
      setSelectedStaffIds(new Set());
      setIsOpen(false);
    } else {
      setError(res.error || "Failed to assign staff");
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8 font-medium"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="mr-1 h-3 w-3" /> Assign Staff
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Assign Medical Staff</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">Select doctors and nurses to assign them to this event.</p>

            {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>}

            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or department..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 border border-slate-100 rounded-md p-2 mb-6 bg-slate-50/10">
              {unassignedStaff.length === 0 ? (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center py-8">All staff are already assigned</p>
              ) : filteredStaff.length === 0 ? (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center py-8">No results for "{searchTerm}"</p>
              ) : (
                filteredStaff.map(staff => (
                  <label key={staff.id} className={`flex items-center gap-3 p-2 px-3 border rounded-md cursor-pointer transition-all ${selectedStaffIds.has(staff.id) ? 'bg-emerald-50 border-emerald-200 shadow-xs' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                      checked={selectedStaffIds.has(staff.id)}
                      onChange={() => toggleStaffSelection(staff.id)}
                    />
                    <div className="flex-1 flex justify-between items-center min-w-0">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate tracking-tight">{staff.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-normal truncate opacity-80">{staff.email}</p>
                      </div>
                      {staff.department && (
                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase ml-2">
                          {staff.department.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={isSubmitting || selectedStaffIds.size === 0}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Assign Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
