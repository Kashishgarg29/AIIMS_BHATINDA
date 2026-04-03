"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Settings2, Search, ChevronDown, Check, X } from "lucide-react";
import { assignSections } from "@/lib/actions/staff-actions";

type StaffMember = {
  id: string;
  fullName: string;
  email: string;
  department?: string;
};

const BASE_CATEGORIES: Record<string, string> = {
  general_examination_merged: "Demographics & Vitals",
  vaccination_details: "Immunization Status",
  ent_examination: "ENT Examination",
  dental_examination: "Dental Examination",
  optical_examination: "Ophthalmology Examination",
  skin_examination: "Dermatology Examination",
  system_wise_examination: "Systemic Examination",
};

export function ManageSectionsDialog({
  eventId,
  formConfig,
  eventStaff,
}: {
  eventId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formConfig: any;
  eventStaff: StaffMember[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searches, setSearches] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(false);

  // Initialize a local state map matching category -> array of assigned doctor IDs
  const existingAssignments: Record<string, string[]> = formConfig.sectionAssignments || {};
  const customCategories = formConfig.customCategories || [];

  const allCategories = [
    ...Object.keys(BASE_CATEGORIES).map(k => ({ id: k, name: BASE_CATEGORIES[k] })),
    ...customCategories.map((c: any) => ({ id: c.slug, name: c.name }))
  ];

  const [assignments, setAssignments] = useState<Record<string, string[]>>(existingAssignments);

  const toggleDoctorForSection = (categorySlug: string, doctorId: string) => {
    setAssignments((prev) => {
      const activeForCategory = prev[categorySlug] || [];
      const updated = activeForCategory.includes(doctorId)
        ? activeForCategory.filter(id => id !== doctorId)
        : [...activeForCategory, doctorId];

      return { ...prev, [categorySlug]: updated };
    });
  };

  const handleSearchChange = (catId: string, val: string) => {
    setSearches(prev => ({ ...prev, [catId]: val }));
  };

  const handleSave = async () => {
    const missingMedAssignments = allCategories
      .filter(cat => ['ent_examination', 'dental_examination', 'optical_examination', 'skin_examination', 'system_wise_examination'].includes(cat.id))
      .filter(cat => !assignments[cat.id] || assignments[cat.id].length === 0);

    if (missingMedAssignments.length > 0) {
      setShowErrors(true);
      return;
    }

    setIsSubmitting(true);
    const res = await assignSections(eventId, assignments);
    setIsSubmitting(false);

    if (res.success) {
      setIsOpen(false);
    } else {
      alert(res.error || "Failed to save section assignments");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-100 text-slate-700 flex-1 sm:flex-none transition-colors">
        <Settings2 className="mr-2 h-4 w-4 text-emerald-600" /> Manage Sections
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[600px] md:max-w-[700px] max-h-[85vh] flex flex-col rounded-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl">Form Section Assignments</DialogTitle>
          <DialogDescription>
            Assign specific medical staff to different sections of the digital form. Doctors not assigned to a section will only have <strong>Read-Only</strong> access to that section.
            <span className="text-sm mt-2 block text-slate-600 border-t pt-2 max-w-max">Categories marked with <span className="text-red-500 font-bold">*</span> require assignment to Medical Staff. The School Representative inherently has access to unmarked categories.</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 py-4">
          {eventStaff.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No medical staff have been assigned to this event yet.</p>
          ) : (
            allCategories.map((category) => {
              const activeDoctors = assignments[category.id] || [];
              const requiresDoctor = ['ent_examination', 'dental_examination', 'optical_examination', 'skin_examination', 'system_wise_examination'].includes(category.id);
              const searchQuery = (searches[category.id] || "").toLowerCase();
              
              const filteredStaff = eventStaff.filter(staff => 
                staff.fullName.toLowerCase().includes(searchQuery) ||
                (staff.department && staff.department.toLowerCase().includes(searchQuery))
              );

              return (
                <div key={category.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
                  <div className="mb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center shrink-0">
                      {category.name}
                      {requiresDoctor && <span className="text-red-500 ml-1" title="Requires Medical Staff Assignment">*</span>}
                    </h4>

                    {/* Integrated Search Bar side-by-side with header */}
                    <div className="relative w-full md:w-72">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input 
                          type="text"
                          className="w-full text-xs font-medium pl-9 pr-8 py-2 rounded-md border bg-white shadow-sm transition-all focus:outline-none focus:ring-1 border-slate-200 hover:border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                          placeholder="Search doctor name or department..."
                          value={searchQuery}
                          onClick={() => setOpenDropdown(category.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setOpenDropdown(null);
                            }
                          }}
                          onChange={e => {
                            handleSearchChange(category.id, e.target.value);
                            if (openDropdown !== category.id) setOpenDropdown(category.id);
                          }}
                        />
                        <ChevronDown 
                          className={`absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-transform cursor-pointer ${openDropdown === category.id ? "rotate-180" : ""}`} 
                          onClick={() => setOpenDropdown(openDropdown === category.id ? null : category.id)}
                        />
                      </div>

                      {openDropdown === category.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-md z-50 overflow-hidden max-h-64 flex flex-col">
                            <div className="overflow-y-auto p-1.5 max-h-60 space-y-1">
                              {filteredStaff.length === 0 ? (
                                <div className="p-3 text-center text-xs text-slate-500">No medical staff found.</div>
                              ) : filteredStaff.map(staff => {
                                const isAssigned = activeDoctors.includes(staff.id);
                                return (
                                  <div 
                                    key={staff.id}
                                    onClick={() => {
                                      toggleDoctorForSection(category.id, staff.id);
                                      setOpenDropdown(null);
                                    }}
                                    className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${isAssigned ? 'bg-emerald-50/70 border border-emerald-100' : 'hover:bg-slate-100 border border-transparent'}`}
                                  >
                                    <div className="flex flex-col min-w-0">
                                      <span className={`text-sm truncate ${isAssigned ? 'font-semibold text-emerald-800' : 'text-slate-700 font-medium'}`}>{staff.fullName}</span>
                                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mt-0.5 truncate">
                                        {staff.department ? staff.department.replace(/_/g, ' ') : 'GENERAL'}
                                      </span>
                                    </div>
                                    {isAssigned && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {activeDoctors.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {activeDoctors.map(docId => {
                        const doc = eventStaff.find(s => s.id === docId);
                        if (!doc) return null;
                        return (
                          <div key={docId} className="flex items-center gap-1.5 bg-emerald-100 border border-emerald-200 text-emerald-800 pl-2 pr-1 py-1 rounded-md text-xs font-semibold shadow-sm">
                            {doc.fullName}
                            <div 
                              className="bg-emerald-200 hover:bg-emerald-300 rounded-sm p-0.5 cursor-pointer ml-1 transition-colors" 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDoctorForSection(category.id, docId);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="pt-4 border-t flex justify-between items-center bg-white">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <div className="flex flex-col items-end gap-1">
            {(() => {
              const anyMissing = allCategories
                .filter(cat => ['ent_examination', 'dental_examination', 'optical_examination', 'skin_examination', 'system_wise_examination'].includes(cat.id))
                .some(cat => !assignments[cat.id] || assignments[cat.id].length === 0);

              return (
                <Button 
                  onClick={handleSave} 
                  disabled={isSubmitting || anyMissing} 
                  className={`${anyMissing ? 'bg-slate-300' : 'bg-emerald-600 hover:bg-emerald-700'} text-white min-w-[120px] shadow-sm transition-colors`}
                  title={anyMissing ? "Please assign doctors to all required medical sections" : "Save Changes"}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save Assignments
                </Button>
              );
            })()}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
