"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, FileCheck, Save, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef, useCallback } from "react";
import { saveMedicalCategory } from "@/lib/actions/db-sync";
import { acquireLock, releaseLock } from "@/lib/actions/locks";
import { useRouter } from "next/navigation";

export function CategoryEditFormClient({
  eventId,
  studentId,
  category,
  initialData,
  requiredFields = [],
  isReadOnly = false,
  readOnlyReason = "",
  userName = "Staff",
  userId,
  customCategoryBlock,
  student,
  isPOC = false,
  basePath,
  userRole,
}: {
  eventId: string,
  studentId: string,
  category: string,
  initialData: Record<string, any>,
  requiredFields?: string[],
  isReadOnly?: boolean,
  readOnlyReason?: string,
  userName?: string,
  userId: string,
  customCategoryBlock?: any,
  student?: any,
  isPOC?: boolean,
  basePath?: string,
  userRole?: string,
}) {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLockedBy, setIsLockedBy] = useState<string | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const lastActivityTime = useRef(Date.now());

  // Form State - Initialize with initialData or empty defaults
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});

  // Track user activity
  useEffect(() => {
    if (isReadOnly || hasTimedOut) return;

    const updateActivity = () => {
      lastActivityTime.current = Date.now();
    };

    window.addEventListener("mousemove", updateActivity);
    window.addEventListener("keydown", updateActivity);
    window.addEventListener("click", updateActivity);
    window.addEventListener("scroll", updateActivity);

    // Release lock if browser tab/window is closed
    const handleBeforeUnload = () => {
      if (!hasTimedOut) {
        releaseLock(studentId, eventId, category, userId);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("mousemove", updateActivity);
      window.removeEventListener("keydown", updateActivity);
      window.removeEventListener("click", updateActivity);
      window.removeEventListener("scroll", updateActivity);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isReadOnly, hasTimedOut, studentId, eventId, category, userId]);

  useEffect(() => {
    if (isReadOnly || hasTimedOut) return; // Don't try to lock past events or timed out sessions

    let intervalId: NodeJS.Timeout;
    let lockAcquired = false;

    const setupLock = async () => {
      const result = await acquireLock(studentId, eventId, category, userId, userName);
      if (!result.success && result.lockedBy) {
        setIsLockedBy(result.lockedBy);
      } else if (result.success) {
        setIsLockedBy(null);
        lockAcquired = true;
        // Keep lock alive every 1 minute to allow responsive timeout checking
        intervalId = setInterval(() => {
          if (Date.now() - lastActivityTime.current > 5 * 60 * 1000) {
            releaseLock(studentId, eventId, category, userId);
            setHasTimedOut(true);
            setIsLockedBy(null);
            lockAcquired = false;
            clearInterval(intervalId);
          } else {
            acquireLock(studentId, eventId, category, userId, userName);
          }
        }, 60 * 1000);
      }
    };

    setupLock();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (lockAcquired) {
        releaseLock(studentId, eventId, category, userId);
      }
    };
  }, [studentId, eventId, category, isReadOnly, hasTimedOut, userId, userName]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const req = (id: string) => requiredFields.includes(id) && <span className="text-red-500 ml-1" title="Required">*</span>;

  const handleExit = async () => {
    if (!isReadOnly && !hasTimedOut) {
      await releaseLock(studentId, eventId, category, userId);
    }
    router.push(`${basePath || '/staff'}/workspace/${eventId}/student/${studentId}`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const result = await saveMedicalCategory(
      studentId,
      eventId,
      category,
      formData
    );

    setIsSaving(false);

    if (result.success) {
      if (!isReadOnly && !isLockedBy && !hasTimedOut) {
        await releaseLock(studentId, eventId, category, userId);
      }
      router.push(`${basePath || '/staff'}/workspace/${eventId}/student/${studentId}`);
    } else {
      setError(result.error || "Failed to save category");
    }
  };

  const renderFormContent = () => {
    // Helper to render a field based on its common type or default to Input
    const renderField = (fieldId: string, label: string) => {
      const isRequired = requiredFields.includes(fieldId);
      const value = formData[fieldId];
      const isFieldReadOnly = isReadOnly || isLockedBy;

      // READ-ONLY VIEW: Show as an inline "Label: Value" entry
      if (isFieldReadOnly) {
        return (
          <div key={fieldId} className={`flex items-baseline gap-2 py-1.5 border-b border-slate-100 last:border-0 ${(fieldId === "doctorRemarks" || fieldId === "presentComplaint" || fieldId === "otherInfo" || fieldId === "address" || fieldId === "anyOtherSymptoms") ? "md:col-span-2" : ""}`}>
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-tight shrink-0 min-w-[140px]">
              {label}{isRequired && <span className="text-red-500 ml-0.5">*</span>}:
            </span>
            <span className={`text-sm ${value ? 'text-slate-900 font-black' : 'text-slate-300 italic font-medium'}`}>
              {value || "Not Recorded"}
            </span>
          </div>
        );
      }

      // EDITABLE VIEW: Standard form controls
      if (fieldId === "doctorRemarks" || fieldId === "presentComplaint" || fieldId === "otherInfo" || fieldId === "address" || fieldId === "anyOtherSymptoms") {
        return (
          <div key={fieldId} className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-bold text-slate-700">{label} {isRequired && <span className="text-red-500">*</span>}</Label>
            <Textarea
              className="text-sm min-h-[80px]"
              value={formData[fieldId] || ""}
              onChange={e => handleFieldChange(fieldId, e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}...`}
            />
          </div>
        );
      }

      // Default to standard Input
      return (
        <div key={fieldId} className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-700">{label} {isRequired && <span className="text-red-500">*</span>}</Label>
          <Input
            className="h-9 text-sm"
            value={formData[fieldId] || ""}
            onChange={e => handleFieldChange(fieldId, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        </div>
      );
    };

    // Find the category definition from our list of 8
    const CATEGORIES_REF = [
      {
        id: "general_examination_merged",
        title: "Demographics & Vitals",
        fields: [
          { id: "dob", label: "Date of Birth" },
          { id: "age", label: "Age" },
          { id: "sex", label: "Sex" },
          { id: "bloodGroup", label: "Blood Group" },
          { id: "fatherName", label: "Father's Name" },
          { id: "fatherOccupation", label: "Father's Occupation" },
          { id: "motherName", label: "Mother's Name" },
          { id: "motherOccupation", label: "Mother's Occupation" },
          { id: "address", label: "Address" },
          { id: "pinCode", label: "Pin Code" },
          { id: "phone", label: "Phone" },
          { id: "mobile", label: "Mobile" },
          { id: "allergies", label: "Allergies" },
          { id: "majorIllness", label: "Any major illness/operation" },
          { id: "height", label: "Height (cm)" },
          { id: "weight", label: "Weight (kg)" },
          { id: "anaemia", label: "Anaemia" },
        ],
      },
      {
        id: "vaccination_details",
        title: "Immunization Status",
        fields: [
          { id: "hepB1", label: "Hepatitis B (1st Dose)" },
          { id: "hepB2", label: "Hepatitis B (2nd Dose)" },
          { id: "hepB3", label: "Hepatitis B (3rd Dose)" },
          { id: "typhoid", label: "Typhoid" },
          { id: "tetanus", label: "Tetanus" },
        ],
      },
      {
        id: "ent_examination",
        title: "ENT Examination",
        fields: [
          { id: "earIssues", label: "Ear Issues" },
          { id: "noseIssues", label: "Nose Issues" },
          { id: "throatIssues", label: "Throat Issues" },
          { id: "presentComplaint", label: "Present Complaint" },
          { id: "doctorRemarks", label: "Doctor's Remarks" },
        ],
      },
      {
        id: "dental_examination",
        title: "Dental Examination",
        fields: [
          { id: "cavities", label: "Cavities" },
          { id: "gumCondition", label: "Gum Condition" },
          { id: "presentComplaint", label: "Present Complaint" },
          { id: "doctorRemarks", label: "Doctor's Remarks" },
        ],
      },
      {
        id: "optical_examination",
        title: "Ophthalmology Examination",
        fields: [
          { id: "visionRight", label: "Vision (Right Eye)" },
          { id: "visionLeft", label: "Vision (Left Eye)" },
          { id: "cannotSeeBoard", label: "Cannot see board" },
          { id: "spectacles", label: "Spectacles" },
          { id: "presentComplaint", label: "Present Complaint" },
          { id: "doctorRemarks", label: "Doctor's Remarks" },
        ],
      },
      {
        id: "skin_examination",
        title: "Dermatology Examination",
        fields: [
          { id: "skinCondition", label: "Skin Condition" },
          { id: "whitePatches", label: "White Patches" },
          { id: "presentComplaint", label: "Present Complaint" },
          { id: "doctorRemarks", label: "Doctor's Remarks" },
        ],
      },
      {
        id: "system_wise_examination",
        title: "Systemic Examination",
        fields: [
          { id: "limpingGait", label: "Limping Gait" },
          { id: "abdomenIssues", label: "Abdomen Issues" },
          { id: "presentComplaint", label: "Present Complaint" },
          { id: "doctorRemarks", label: "Doctor's Remarks" },
        ],
      },
      {
        id: "symptoms",
        title: "Clinical Presentation & Symptoms",
        fields: [
          { id: "headache", label: "Complains of headache" },
          { id: "cannotSeeBoardSymptoms", label: "Cannot see board" },
          { id: "diarrhoea", label: "Diarrhoea" },
          { id: "vomiting", label: "Vomiting" },
          { id: "faintingEpisodes", label: "Fainting episodes" },
          { id: "anyOtherSymptoms", label: "Any other symptoms" },
        ],
      },
    ];

    const currentCatDef = CATEGORIES_REF.find(c => c.id === category);

    if (currentCatDef) {
      // Only render fields that are either required OR were explicitly defined in the config for this event
      // However, to ensure visibility, we render all fields from the definition that match the config
      const fieldsToRender = currentCatDef.fields.filter(f => requiredFields.includes(f.id));

      return (
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-black text-slate-800 border-b pb-2 mb-5 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              {currentCatDef.title}
            </h2>

            {fieldsToRender.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
                <p className="text-sm text-slate-500 font-medium italic">No fields were marked as required for this section in the configuration.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {fieldsToRender.map(f => renderField(f.id, f.label))}
              </div>
            )}
          </section>
        </div>
      );
    }

    // Custom Category Fallback
    if (customCategoryBlock) {
      return (
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-black text-slate-800 border-b pb-2 mb-5 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              {customCategoryBlock.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {customCategoryBlock.fields.map((field: any) => renderField(field.id, field.label))}
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200">
        <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Section not configured correctly</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col pb-24">

      {/* Category Editor Header */}
      <div className="bg-white border-b shrink-0 z-20 shadow-sm sticky top-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 w-full">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <Button onClick={handleExit} variant="ghost" size="icon" className="h-10 w-10 mt-1 sm:mt-0 rounded-full border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 transition-all shadow-sm">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">
                  {student?.firstName} {student?.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 uppercase tracking-widest shrink-0">
                    {customCategoryBlock ? customCategoryBlock.title : (
                      category === "ent" ? "ENT Examination" :
                        category === "communityMed" ? "Community Medicine" :
                          category === "dental" ? "Dental Examination" :
                            category === "optical" ? "Optical Examination" :
                              category === "skin" ? "Skin Examination" :
                                category.replace(/([A-Z])/g, ' $1').trim()
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                    <span className="flex items-center gap-1"><span className="opacity-40">Class:</span> {student?.classSec}</span>
                    <span className="flex items-center gap-1"><span className="opacity-40">Age:</span> {student?.age}</span>
                    {(() => {
                      const recordData = (student?.medicalRecord?.data as Record<string, any>) || {};
                      const commMedData = recordData.communityMed || {};
                      const height = parseFloat(commMedData.height);
                      const weight = parseFloat(commMedData.weight);
                      const bmi = (height && weight) ? (weight / Math.pow(height / 100, 2)).toFixed(1) : "NA";
                      return (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <span className="opacity-60 text-slate-500 font-bold">BMI:</span> {bmi}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-4xl mx-auto p-3 sm:p-5 lg:p-6 overflow-y-auto pb-24">
        {initialData?._managedBy && initialData._managedBy !== userName && (
          <Alert className="mb-4 border-amber-300 bg-amber-50 shadow-sm">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 font-bold text-sm">Previously Filled by Another Doctor</AlertTitle>
            <AlertDescription className="text-amber-800/80 text-xs">
              This section contains data recorded by <strong>{
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(initialData._managedBy)
                  ? "another staff member"
                  : initialData._managedBy
              }</strong>. Please review carefully.
            </AlertDescription>
          </Alert>
        )}

        {hasTimedOut && (
          <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Session Expired</AlertTitle>
            <AlertDescription>Your session has been inactive for 5 minutes. The lock has been released to allow others to edit. Please refresh the page if you wish to continue editing.</AlertDescription>
          </Alert>
        )}

        {isLockedBy && !isReadOnly && !hasTimedOut && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Record Locked</AlertTitle>
            <AlertDescription>This category is currently being edited by <strong>{isLockedBy}</strong>. You cannot make changes until they are finished.</AlertDescription>
          </Alert>
        )}

        {isReadOnly && !hasTimedOut && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Read-Only Record</AlertTitle>
            <AlertDescription>
              {readOnlyReason || "The medical record is frozen and cannot be edited."}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Saving</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-sm border-slate-200 relative mb-6">
          {(isReadOnly || isLockedBy || hasTimedOut) && (
            <div className="absolute inset-0 z-10 bg-slate-50/40 cursor-not-allowed rounded-xl" title="Read Only / Locked" />
          )}
          <CardContent className="p-3">
            <fieldset disabled={isReadOnly || !!isLockedBy || hasTimedOut}>
              {renderFormContent()}
            </fieldset>
          </CardContent>
        </Card>

        {category !== "general_examination_merged" && (
          <Card className="shadow-sm border-slate-200 relative mb-6">
            {(isReadOnly || isLockedBy || hasTimedOut) && (
              <div className="absolute inset-0 z-10 bg-slate-50/40 cursor-not-allowed rounded-xl" title="Read Only / Locked" />
            )}
            <CardContent className="px-4 py-3 bg-slate-50 border-t-2 border-slate-700 rounded-b-xl">
              <div className="flex items-center gap-3">
                <Label className="text-xs font-black tracking-wide uppercase text-slate-700 shrink-0">Assessment <span className="text-red-500">*</span></Label>
                <div className="flex gap-2 flex-1">
                  {/* Normal Option */}
                  {(!isReadOnly || formData.status_nor === 'N') && (
                    <div
                      onClick={() => !isReadOnly && !isLockedBy && setFormData((prev: any) => ({ ...prev, status_nor: 'N' }))}
                      className={`flex-1 cursor-pointer border-2 rounded-lg px-3 py-1.5 text-center transition-all ${formData.status_nor === 'N' ? 'bg-green-100 border-green-500 shadow-sm' : 'bg-white border-slate-200 hover:border-green-300'}`}>
                      <span className={`font-black text-base ${formData.status_nor === 'N' ? 'text-green-700' : 'text-slate-400'}`}>N</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest ml-1 ${formData.status_nor === 'N' ? 'text-green-800' : 'text-slate-500'}`}>Normal</span>
                    </div>
                  )}
                  {/* Observe Option */}
                  {(!isReadOnly || formData.status_nor === 'O') && (
                    <div
                      onClick={() => !isReadOnly && !isLockedBy && setFormData((prev: any) => ({ ...prev, status_nor: 'O' }))}
                      className={`flex-1 cursor-pointer border-2 rounded-lg px-3 py-1.5 text-center transition-all ${formData.status_nor === 'O' ? 'bg-amber-100 border-amber-500 shadow-sm' : 'bg-white border-slate-200 hover:border-amber-300'}`}>
                      <span className={`font-black text-base ${formData.status_nor === 'O' ? 'text-amber-700' : 'text-slate-400'}`}>O</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest ml-1 ${formData.status_nor === 'O' ? 'text-amber-800' : 'text-slate-500'}`}>Observe</span>
                    </div>
                  )}
                  {/* Referred Option */}
                  {(!isReadOnly || formData.status_nor === 'R') && (
                    <div
                      onClick={() => !isReadOnly && !isLockedBy && setFormData((prev: any) => ({ ...prev, status_nor: 'R' }))}
                      className={`flex-1 cursor-pointer border-2 rounded-lg px-3 py-1.5 text-center transition-all ${formData.status_nor === 'R' ? 'bg-red-100 border-red-500 shadow-sm' : 'bg-white border-slate-200 hover:border-red-300'}`}>
                      <span className={`font-black text-base ${formData.status_nor === 'R' ? 'text-red-700' : 'text-slate-400'}`}>R</span>
                      <span className={`text-[9px] font-bold uppercase tracking-widest ml-1 ${formData.status_nor === 'R' ? 'text-red-800' : 'text-slate-500'}`}>Referred</span>
                    </div>
                  )}
                </div>
                {(!formData.status_nor && !isReadOnly) && <p className="text-red-500 text-[10px] font-bold animate-pulse shrink-0">Required</p>}
                {(formData.status_nor && isReadOnly) && <div className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Official Diagnosis</div>}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Floating Save Action Bar */}
      {(!isReadOnly && !isLockedBy) && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="text-sm text-slate-500 flex items-center gap-2">
              <FileCheck className="h-4 w-4" /> Editing
            </div>
            <div className="flex items-center gap-3">
              {initialData?._managedBy && (
                <div className="text-xs text-slate-500 mr-2 border-r border-slate-200 pr-4">
                  <span className="font-semibold">Last Saved By:</span>{" "}
                  {/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(initialData._managedBy)
                    ? "Staff Member"
                    : initialData._managedBy}
                </div>
              )}
              <Button onClick={handleExit} variant="outline">Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save Category</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

