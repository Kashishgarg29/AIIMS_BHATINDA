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
import { useState, useEffect } from "react";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData: Record<string, any>,
  requiredFields?: string[],
  isReadOnly?: boolean,
  readOnlyReason?: string,
  userName?: string,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Form State - Initialize with initialData or empty defaults
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});

  useEffect(() => {
    if (isReadOnly) return; // Don't try to lock past events

    let intervalId: NodeJS.Timeout;

    const setupLock = async () => {
      const result = await acquireLock(studentId, eventId, category, userId, userName);
      if (!result.success && result.lockedBy) {
        setIsLockedBy(result.lockedBy);
      } else if (result.success) {
        setIsLockedBy(null);
        // Keep lock alive every 3 minutes
        intervalId = setInterval(() => {
          acquireLock(studentId, eventId, category, userId, userName);
        }, 3 * 60 * 1000);
      }
    };

    setupLock();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (!isLockedBy) {
        releaseLock(studentId, eventId, category, userId);
      }
    };
  }, [studentId, eventId, category, isReadOnly, isLockedBy, userId, userName]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const req = (id: string) => requiredFields.includes(id) && <span className="text-red-500 ml-1" title="Required">*</span>;

  const handleSave = async () => {
    if (category !== "demographics" && !formData.status_nor) {
      setError("Please select the Final Department Assessment (Normal, Observe, or Referred) before saving.");
      return;
    }

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
      router.push(`${basePath || '/staff'}/workspace/${eventId}/student/${studentId}`);
    } else {
      setError(result.error || "Failed to save category");
    }
  };

  const renderFormContent = () => {
    switch (category) {
      case "demographics":
        return (
          <div className="space-y-4">
            <section>
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2 mb-3">Personal & Medical Information</h2>

              {/* Read-only Student Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 bg-slate-50 p-3 rounded-md border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-[10px] uppercase tracking-wider text-slate-500">Student Name</Label>
                  <p className="font-bold text-slate-900 text-sm leading-tight">{student?.firstName} {student?.lastName}</p>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[10px] uppercase tracking-wider text-slate-500">Class / Section</Label>
                  <p className="font-bold text-slate-900 text-sm leading-tight">{student?.classSec}</p>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[10px] uppercase tracking-wider text-slate-500">Age / Gender</Label>
                  <p className="font-bold text-slate-900 text-sm leading-tight">{student?.age} yrs / {student?.gender}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date of Birth {req("dob")}</Label>
                  <Input
                    type="date"
                    value={formData.dob || ""}
                    onChange={e => handleFieldChange("dob", e.target.value)}
                    className="bg-white h-8 text-sm"
                  />
                </div>
              </div>

              {/* Editable Family Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="space-y-1">
                  <Label className="text-xs">Father's Name {req("fatherName")}</Label>
                  <Input className="h-8 text-sm" value={formData.fatherName || ""} onChange={e => handleFieldChange("fatherName", e.target.value)} placeholder="Enter father's name" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Father's Occupation {req("fatherOccupation")}</Label>
                  <Input className="h-8 text-sm" value={formData.fatherOccupation || ""} onChange={e => handleFieldChange("fatherOccupation", e.target.value)} placeholder="e.g. Business, Service" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mother's Name {req("motherName")}</Label>
                  <Input className="h-8 text-sm" value={formData.motherName || ""} onChange={e => handleFieldChange("motherName", e.target.value)} placeholder="Enter mother's name" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mother's Occupation {req("motherOccupation")}</Label>
                  <Input className="h-8 text-sm" value={formData.motherOccupation || ""} onChange={e => handleFieldChange("motherOccupation", e.target.value)} placeholder="e.g. Homemaker" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Mailing Address {req("mailingAddress")}</Label>
                  <Textarea className="min-h-[60px] text-sm" value={formData.mailingAddress || ""} onChange={e => handleFieldChange("mailingAddress", e.target.value)} placeholder="Full home address" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Pin Code {req("pinCode")}</Label>
                    <Input className="h-8 text-sm" value={formData.pinCode || ""} onChange={e => handleFieldChange("pinCode", e.target.value)} placeholder="6-digit PIN" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone (Landline) {req("phone")}</Label>
                    <Input className="h-8 text-sm" value={formData.phone || ""} onChange={e => handleFieldChange("phone", e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Mobile (Primary) {req("mobile")}</Label>
                    <Input className="h-8 text-sm" value={formData.mobile || ""} onChange={e => handleFieldChange("mobile", e.target.value)} placeholder="Primary contact" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        );

      case "ent":
        return (
          <div className="space-y-4">
            <section>
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2 mb-3">ENT Examination</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">Hearing {req("hearing")}</Label>
                  <Select value={formData.hearing || ""} onValueChange={(val) => handleFieldChange("hearing", val)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      {['Normal', 'Impaired Right', 'Impaired Left', 'Impaired Both'].map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">Ear Exam {req("earExam")}</Label>
                  <Select value={formData.earExam || ""} onValueChange={(val) => handleFieldChange("earExam", val)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      {['Normal', 'Wax', 'Discharge', 'Other'].map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">Nose Exam {req("noseExam")}</Label>
                  <Select value={formData.noseExam || ""} onValueChange={(val) => handleFieldChange("noseExam", val)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      {['Normal', 'Deviated Septum', 'Polyps', 'Other'].map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">Throat / Tonsils {req("throatExam")}</Label>
                  <Select value={formData.throatExam || ""} onValueChange={(val) => handleFieldChange("throatExam", val)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      {['Normal', 'Enlarged Tonsils', 'Inflammation', 'Other'].map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-slate-800">Observations / Remarks {req("entRemarks")}</Label>
                <Textarea className="min-h-[60px] text-sm" value={formData.entRemarks || ""} onChange={e => handleFieldChange("entRemarks", e.target.value)} placeholder="Any other ENT observations..." />
              </div>
            </section>
          </div>
        );

      case "communityMed":
        return (
          <div className="space-y-4">
            <section>
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2 mb-3">General Examination & Vitals</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div className="space-y-1">
                  <Label className="text-sm">Height (in cms) {req("height")}</Label>
                  <Input type="number" className="h-8 text-sm" value={formData.height || ""} onChange={e => handleFieldChange("height", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Weight (in kgs) {req("weight")}</Label>
                  <Input type="number" className="h-8 text-sm" value={formData.weight || ""} onChange={e => handleFieldChange("weight", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Blood Group {req("bloodGroup")}</Label>
                  <Select value={formData.bloodGroup || ""} onValueChange={(val) => handleFieldChange("bloodGroup", val)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Group" /></SelectTrigger>
                    <SelectContent>
                      {['O+', 'A+', 'B+', 'AB+', 'A-', 'B-', 'AB-', 'O-'].map(bg => (
                        <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">General Appearance</Label>
                  <Select
                    value={formData.generalAppearance || ""}
                    onValueChange={(val) => handleFieldChange("generalAppearance", val)}
                    disabled={isPOC}
                  >
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      {['Healthy', 'Undernourished', 'Overweight', 'Obese'].map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="space-y-1">
                  <Label className="text-sm">Any Major illness/operation {req("majorIllness")}</Label>
                  <Textarea
                    className="min-h-[60px] text-sm"
                    value={formData.majorIllness || ""}
                    onChange={e => handleFieldChange("majorIllness", e.target.value)}
                    disabled={isPOC}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Current Medication {req("currentMedication")}</Label>
                  <Textarea
                    className="min-h-[60px] text-sm"
                    value={formData.currentMedication || ""}
                    onChange={e => handleFieldChange("currentMedication", e.target.value)}
                    disabled={isPOC}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-slate-800">Doctor's Remarks {req("doctorRemarks")}</Label>
                <Textarea
                  className="min-h-[60px] text-sm"
                  value={formData.doctorRemarks || ""}
                  onChange={e => handleFieldChange("doctorRemarks", e.target.value)}
                  disabled={isPOC}
                />
              </div>
            </section>
          </div>
        );

      case "dental":
        return (
          <div className="space-y-4">
            <section>
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2 mb-3">Dental Examination</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">Oral Hygiene {req("oralHygiene")}</Label>
                  <Select value={formData.oralHygiene || ""} onValueChange={(val) => handleFieldChange("oralHygiene", val)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      {['Good', 'Fair', 'Poor'].map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">Gums Condition {req("gums")}</Label>
                  <Select value={formData.gums || ""} onValueChange={(val) => handleFieldChange("gums", val)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      {['Healthy', 'Bleeding', 'Swollen', 'Other'].map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">Cavities / Caries {req("cavities")}</Label>
                  <Input className="h-8 text-sm" value={formData.cavities || ""} onChange={e => handleFieldChange("cavities", e.target.value)} placeholder="e.g. None" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">Other findings {req("dentalFindings")}</Label>
                  <Input className="h-8 text-sm" value={formData.dentalFindings || ""} onChange={e => handleFieldChange("dentalFindings", e.target.value)} placeholder="Plaque/Calculus" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-slate-800">Remarks / Recommendations {req("dentalRemarks")}</Label>
                <Textarea className="min-h-[60px] text-sm" value={formData.dentalRemarks || ""} onChange={e => handleFieldChange("dentalRemarks", e.target.value)} placeholder="Any dental observations..." />
              </div>
            </section>
          </div>
        );

      case "optical":
        return (
          <div className="space-y-4">
            <section>
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2 mb-3">Optical Examination</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">Vision (Right) {req("visionRight")}</Label>
                  <Select value={formData.visionRight || ""} onValueChange={(val) => handleFieldChange("visionRight", val)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      {['6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60', 'Other'].map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">Vision (Left) {req("visionLeft")}</Label>
                  <Select value={formData.visionLeft || ""} onValueChange={(val) => handleFieldChange("visionLeft", val)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      {['6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60', 'Other'].map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">Color Vision {req("colorVision")}</Label>
                  <Select value={formData.colorVision || ""} onValueChange={(val) => handleFieldChange("colorVision", val)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      {['Normal', 'Deficient'].map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">Squint / Other {req("opticalIssues")}</Label>
                  <Input className="h-8 text-sm" value={formData.opticalIssues || ""} onChange={e => handleFieldChange("opticalIssues", e.target.value)} />
                </div>
              </div>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox id="spectacles" checked={formData.spectacles || false} onCheckedChange={(c) => handleFieldChange("spectacles", c)} />
                <label htmlFor="spectacles" className="text-sm font-medium leading-none">Uses Spectacles / Lenses</label>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-slate-800">Remarks / Recommendations {req("opticalRemarks")}</Label>
                <Textarea className="min-h-[60px] text-sm" value={formData.opticalRemarks || ""} onChange={e => handleFieldChange("opticalRemarks", e.target.value)} placeholder="Any optical observations..." />
              </div>
            </section>
          </div>
        );

      case "skin":
        return (
          <div className="space-y-4">
            <section>
              <h2 className="text-lg font-bold text-slate-900 border-b pb-2 mb-3">Skin Examination</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">General Skin Condition {req("skinCondition")}</Label>
                  <Select value={formData.skinCondition || ""} onValueChange={(val) => handleFieldChange("skinCondition", val)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      {['Normal', 'Dry', 'Oily', 'Lesions present'].map(op => (
                        <SelectItem key={op} value={op}>{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-slate-800">Infections / Rashes {req("infections")}</Label>
                  <Input className="h-8 text-sm" value={formData.infections || ""} onChange={e => handleFieldChange("infections", e.target.value)} placeholder="e.g. Scabies, Fungal, None" />
                </div>
              </div>
              <div className="flex gap-4 mb-4">
                {['Acne', 'Eczema', 'Warts', 'Lice'].map(item => (
                  <div key={item} className="flex items-center space-x-1.5">
                    <Checkbox id={`skin_${item}`} className="h-4 w-4" checked={formData[`skin_${item}`] || false} onCheckedChange={(c) => handleFieldChange(`skin_${item}`, c)} />
                    <label htmlFor={`skin_${item}`} className="text-xs font-medium leading-none">{item}</label>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-slate-800">Remarks / Recommendations {req("skinRemarks")}</Label>
                <Textarea className="min-h-[60px] text-sm" value={formData.skinRemarks || ""} onChange={e => handleFieldChange("skinRemarks", e.target.value)} placeholder="Any skin observations..." />
              </div>
            </section>
          </div>
        );

      default:
        if (customCategoryBlock) {
          return (
            <div className="space-y-4">
              <section>
                <div className="space-y-4 mb-4">
                  {customCategoryBlock.fields.map((field: any) => (
                    <div key={field.id} className="space-y-1">
                      <Label className="text-sm font-semibold text-slate-800">{field.label} {req(field.id)}</Label>
                      <Textarea
                        className="min-h-[60px] text-sm"
                        value={formData[field.id] || ""}
                        onChange={e => handleFieldChange(field.id, e.target.value)}
                        placeholder={`Enter ${field.label}...`}
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          );
        }
        return <div>Invalid Category</div>;
    }
  };

  return (
    <div className="flex flex-col pb-24">

      {/* Category Editor Header */}
      <div className="bg-white border-b shrink-0 z-20 shadow-sm sticky top-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 w-full">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <Link href={`${basePath || '/staff'}/workspace/${eventId}/student/${studentId}`}>
                <Button variant="ghost" size="icon" className="h-10 w-10 mt-1 sm:mt-0 rounded-full border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 transition-all shadow-sm">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
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

        {isLockedBy && !isReadOnly && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Record Locked</AlertTitle>
            <AlertDescription>This category is currently being edited by <strong>{isLockedBy}</strong>. You cannot make changes until they are finished.</AlertDescription>
          </Alert>
        )}

        {isReadOnly && (
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
          {(isReadOnly || isLockedBy) && (
            <div className="absolute inset-0 z-10 bg-slate-50/40 cursor-not-allowed rounded-xl" title="Read Only / Locked" />
          )}
          <CardContent className="p-3">
            <fieldset disabled={isReadOnly || !!isLockedBy}>
              {renderFormContent()}
            </fieldset>
          </CardContent>
        </Card>

        {category !== "demographics" && (
          <Card className="shadow-sm border-slate-200 relative mb-6">
            {(isReadOnly || isLockedBy) && (
              <div className="absolute inset-0 z-10 bg-slate-50/40 cursor-not-allowed rounded-xl" title="Read Only / Locked" />
            )}
            <CardContent className="px-4 py-3 bg-slate-50 border-t-2 border-slate-700 rounded-b-xl">
              <div className="flex items-center gap-3">
                <Label className="text-xs font-black tracking-wide uppercase text-slate-700 shrink-0">Assessment <span className="text-red-500">*</span></Label>
                <div className="flex gap-2 flex-1">
                  <div
                    onClick={() => !isReadOnly && !isLockedBy && setFormData((prev: any) => ({ ...prev, status_nor: 'N' }))}
                    className={`flex-1 cursor-pointer border-2 rounded-lg px-3 py-1.5 text-center transition-all ${formData.status_nor === 'N' ? 'bg-green-100 border-green-500 shadow-sm' : 'bg-white border-slate-200 hover:border-green-300'}`}>
                    <span className={`font-black text-base ${formData.status_nor === 'N' ? 'text-green-700' : 'text-slate-400'}`}>N</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ml-1 ${formData.status_nor === 'N' ? 'text-green-800' : 'text-slate-500'}`}>Normal</span>
                  </div>
                  <div
                    onClick={() => !isReadOnly && !isLockedBy && setFormData((prev: any) => ({ ...prev, status_nor: 'O' }))}
                    className={`flex-1 cursor-pointer border-2 rounded-lg px-3 py-1.5 text-center transition-all ${formData.status_nor === 'O' ? 'bg-amber-100 border-amber-500 shadow-sm' : 'bg-white border-slate-200 hover:border-amber-300'}`}>
                    <span className={`font-black text-base ${formData.status_nor === 'O' ? 'text-amber-700' : 'text-slate-400'}`}>O</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ml-1 ${formData.status_nor === 'O' ? 'text-amber-800' : 'text-slate-500'}`}>Observe</span>
                  </div>
                  <div
                    onClick={() => !isReadOnly && !isLockedBy && setFormData((prev: any) => ({ ...prev, status_nor: 'R' }))}
                    className={`flex-1 cursor-pointer border-2 rounded-lg px-3 py-1.5 text-center transition-all ${formData.status_nor === 'R' ? 'bg-red-100 border-red-500 shadow-sm' : 'bg-white border-slate-200 hover:border-red-300'}`}>
                    <span className={`font-black text-base ${formData.status_nor === 'R' ? 'text-red-700' : 'text-slate-400'}`}>R</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ml-1 ${formData.status_nor === 'R' ? 'text-red-800' : 'text-slate-500'}`}>Referred</span>
                  </div>
                </div>
                {!formData.status_nor && <p className="text-red-500 text-[10px] font-bold animate-pulse shrink-0">Required</p>}
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
            <div className="flex gap-3">
              <Link href={`${basePath || '/staff'}/workspace/${eventId}/student/${studentId}`}>
                <Button variant="outline">Cancel</Button>
              </Link>
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

