"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, FileCheck, Save, Loader2, ArrowLeft, Printer, FileText } from "lucide-react";
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
import { PrescriptionPrintOverlay } from "./PrescriptionPrintOverlay";

export function CategoryEditFormClient({
  eventId,
  eventDate,
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
  isEmbedded = false,
  onClose,
}: {
  eventId: string,
  eventDate?: Date | string,
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
  isEmbedded?: boolean,
  onClose?: () => void,
}) {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLockedBy, setIsLockedBy] = useState<string | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [showPrintOverlay, setShowPrintOverlay] = useState(false);
  const lastActivityTime = useRef(Date.now());

  // Lists for identifying field types based on ID
  const CHECKBOX_FIELDS = [
    "jaundice", "allergies", "bloodTransfusion", "dentalImplant", "braces", "spectacles",
    "typhoid", "earIssues", "noseIssues", "throatIssues", "mouthBreathing", "rottenTeeth",
    "cavities", "gumCondition", "badBreath", "cannotSeeBoard", "rubsEyes", "usesSpectacles",
    "skinCondition", "nailsHair", "whitePatches", "cracksMouth", "limpingGait", "abdomenIssues",
    "breathlessness", "cardioIssues", "cnsIssues", "scratchesHead", "headache", "cannotSeeBoardSymptoms",
    "pullsEars", "nailBiting", "frequentUrination", "diarrhoea", "vomiting", "stammering",
    "bloodInStool", "faintingEpisodes"
  ];

  const DATE_FIELDS = [
    "dob", "hepB1", "hepB2", "hepB3", "typhoidDate", "dptPolio", "tetanus"
  ];

  const NUMBER_FIELDS = [
    "age", "pinCode", "phone", "mobile", "physicianContact", "height", "weight", "bmi"
  ];

  const SELECT_FIELDS: Record<string, { label: string, value: string }[]> = {
    sex: [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" },
      { label: "Other", value: "Other" }
    ],
    bloodGroup: [
      { label: "A+", value: "A+" }, { label: "A-", value: "A-" },
      { label: "B+", value: "B+" }, { label: "B-", value: "B-" },
      { label: "O+", value: "O+" }, { label: "O-", value: "O-" },
      { label: "AB+", value: "AB+" }, { label: "AB-", value: "AB-" },
    ],
    anaemia: [
      { label: "Normal", value: "Normal" },
      { label: "Mild", value: "Mild" },
      { label: "Severe", value: "Severe" }
    ]
  };

  const TEXTAREA_FIELDS = [
    "address", "majorIllness", "generalRemarks", "earRemarks", "noseRemarks", "throatRemarks", "mouthRemarks",
    "entRemarks", "dentalRemarks", "eyeRemarks", "skinRemarks", "systemRemarks", "presentComplaint",
    "currentMedication", "otherInfo", "doctorRemarks"
  ];

  const FIELDS_WITH_DETAILS = [
    "allergies", "majorIllness", "earIssues", "noseIssues", "throatIssues",
    "skinCondition", "nailsHair", "anyOtherProblem"
  ];


  // Form State - Initialize with initialData and default "NO" for empty checkboxes
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const data = { ...(initialData || {}) };
    if (!data.firstName && student?.firstName) data.firstName = student.firstName;
    if (!data.lastName && student?.lastName) data.lastName = student.lastName;
    CHECKBOX_FIELDS.forEach(field => {
      if (data[field] === undefined) {
        data[field] = "NO";
      }
    });
    return data;
  });

  const lastCategoryKey = useRef<string>("");

  const otherPrescriptions = Object.entries((student?.medicalRecord?.data as Record<string, any>) || {})
    .filter(([key, val]) => key !== category && val?.prescription)
    .map(([key, val]) => ({
      category: key,
      text: val.prescription,
      managedBy: val._managedBy
    }));

  // SYNC DATA WHEN CATEGORY OR STUDENT CHANGES (CRITICAL FOR EMBEDDED MODE)
  // We only sync initialData when the category or student actually changes to avoid overwriting current edits
  useEffect(() => {
    const currentKey = `${studentId}_${category}`;
    if (lastCategoryKey.current !== currentKey) {
      setFormData(() => {
        const data = { ...(initialData || {}) };
        if (!data.firstName && student?.firstName) data.firstName = student.firstName;
        if (!data.lastName && student?.lastName) data.lastName = student.lastName;
        CHECKBOX_FIELDS.forEach(field => {
          if (data[field] === undefined) {
            data[field] = "NO";
          }
        });
        return data;
      });
      lastCategoryKey.current = currentKey;
      setError(null);
      setIsLockedBy(null);
      setHasTimedOut(false);
      setIsSaved(false); // Reset saved status on new tab
    }
  }, [category, studentId, initialData, student]);

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
    if (isSaved) setIsSaved(false);
    setFormData(prev => {
      // Validation for 10-digit phone/mobile numbers
      if (["mobile", "phone", "physicianContact"].includes(field)) {
        if (value && value.toString().length > 10) return prev;
      }

      const newData = { ...prev, [field]: value };

      // Age calculation
      if (field === "dob" && value) {
        try {
          const birthDate = new Date(value);
          const today = new Date();
          let calculatedAge = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
          }
          if (calculatedAge >= 0) newData.age = calculatedAge.toString();
        } catch (e) { /* ignore */ }
      }

      // BMI calculation
      if (category === "general_examination_merged" && (field === "height" || field === "weight")) {
        const h = parseFloat(field === "height" ? value : newData.height);
        const w = parseFloat(field === "weight" ? value : newData.weight);
        if (h > 0 && w > 0) {
          newData.bmi = (w / Math.pow(h / 100, 2)).toFixed(1);
        } else {
          newData.bmi = "";
        }
      }

      return newData;
    });
  };

  const req = (id: string) => requiredFields.includes(id) && <span className="text-red-500 ml-1" title="Required">*</span>;

  const handleExit = async () => {
    if (!isReadOnly && !hasTimedOut) {
      await releaseLock(studentId, eventId, category, userId);
    }
    if (onClose) {
      onClose();
    } else {
      router.push(`${basePath || '/staff'}/workspace/${eventId}/student/${studentId}`);
    }
  };

  const [isSaved, setIsSaved] = useState(false);

  // Initialize and sync 'isSaved' state based on initialData
  useEffect(() => {
    if (Object.keys(initialData || {}).length > 0) {
      // If there's already data, check completion
      const isComplete = requiredFields.length > 0
        ? requiredFields.every(field => {
          const val = initialData[field];
          return val !== undefined && val !== null && val !== "";
        })
        : true;

      if (isComplete) {
        setIsSaved(true);
      } else {
        setIsSaved(false);
      }
    } else {
      setIsSaved(false);
    }
  }, [category, initialData, requiredFields]);

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
      setIsSaved(true);
      if (!isReadOnly && !isLockedBy && !hasTimedOut) {
        await releaseLock(studentId, eventId, category, userId);
      }

      // If standalone, we still navigate away after a slight delay or immediately
      if (!isEmbedded) {
        setTimeout(() => {
          if (onClose) onClose();
          else router.push(`${basePath || '/staff'}/workspace/${eventId}/student/${studentId}`);
        }, 1500);
      } else {
        router.refresh();
      }
    } else {
      setError(result.error || "Failed to save category");
    }
  };

  const renderFormContent = () => {
    // Helper to render a field based on its common type or default to Input
    const renderField = (fieldId: string, label: string) => {
      const isRequired = requiredFields.includes(fieldId);
      const value = formData[fieldId];
      const isFieldReadOnly = isReadOnly || isLockedBy || hasTimedOut;

      // READ-ONLY VIEW: Show as an inline "Label: Value" entry
      if (isFieldReadOnly) {
        let displayValue = (value === undefined || value === "") ? "Not Recorded" : value;
        if (CHECKBOX_FIELDS.includes(fieldId)) {
          const isYes = value === true || value === "YES";
          const isNo = value === false || value === "NO";
          const details = formData[`${fieldId}_details`];

          if (isYes) {
            displayValue = (
              <div className="flex flex-col">
                <span className="text-emerald-700 font-extrabold">YES</span>
                {(FIELDS_WITH_DETAILS.includes(fieldId) && details) && (
                  <div className="text-[12px] text-slate-600 font-medium italic mt-1 bg-white p-2 rounded-md border border-emerald-100 shadow-sm leading-snug">
                    {details}
                  </div>
                )}
              </div>
            );
          } else if (isNo) {
            displayValue = <span className="text-red-500 font-extrabold uppercase">NO</span>;
          } else {
            displayValue = <span className="text-slate-300 italic">Not Recorded</span>;
          }
        } else if (typeof value === 'boolean') {
          displayValue = value ? "Yes" : "No";
        }

        return (
          <div key={fieldId} className={`flex items-baseline gap-2 py-2 border-b border-slate-50 last:border-0 ${TEXTAREA_FIELDS.includes(fieldId) ? "md:col-span-2" : ""}`}>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider shrink-0 min-w-[150px]">
              {label}{isRequired && <span className="text-red-500 ml-0.5">*</span>}:
            </span>
            <div className="flex-1 text-sm font-bold text-slate-800">
              {displayValue}
            </div>
          </div>
        );
      }

      // EDITABLE VIEW

      // 1. YES / NO Buttons with Details
      if (CHECKBOX_FIELDS.includes(fieldId)) {
        const isYes = formData[fieldId] === "YES" || formData[fieldId] === true;
        const isNo = formData[fieldId] === "NO" || formData[fieldId] === false;
        const hasDetailsBox = FIELDS_WITH_DETAILS.includes(fieldId);
        const detailsKey = `${fieldId}_details`;

        return (
          <div key={fieldId} className="flex flex-col p-3 bg-slate-50 border border-slate-100 rounded-xl md:col-span-1 shadow-sm transition-all hover:border-emerald-100">
            <div className="flex items-center justify-between gap-4">
              <Label className="text-[11px] font-black uppercase text-slate-600 tracking-tight leading-snug">
                {label} {isRequired && <span className="text-red-500">*</span>}
              </Label>
              <div className="flex border-2 border-slate-200 rounded-lg overflow-hidden h-9 bg-white shadow-sm shrink-0">
                <button
                  type="button"
                  onClick={() => handleFieldChange(fieldId, "YES")}
                  className={`px-5 text-[11px] font-black transition-all ${isYes ? 'bg-emerald-600 text-white shadow-inner translate-y-[1px]' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
                  YES
                </button>
                <button
                  type="button"
                  onClick={() => handleFieldChange(fieldId, "NO")}
                  className={`px-5 text-[11px] font-black border-l border-slate-200 transition-all ${isNo ? 'bg-red-500 text-white shadow-inner translate-y-[1px]' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
                  NO
                </button>
              </div>
            </div>

            {(isYes && hasDetailsBox) && (
              <div className="mt-3 animate-in slide-in-from-top-2 duration-300">
                <p className="text-[9px] font-black text-emerald-600 uppercase mb-2 tracking-widest pl-1">Clinical Observations / Remarks:</p>
                <Textarea
                  placeholder={`Mention specific ${label.toLowerCase()} details...`}
                  className="text-sm min-h-[70px] bg-white border-2 border-emerald-100 focus:border-emerald-400 ring-0 shadow-inner rounded-lg font-medium"
                  value={formData[detailsKey] || ""}
                  onChange={(e) => handleFieldChange(detailsKey, e.target.value)}
                />
              </div>
            )}
          </div>
        );
      }

      // 2. Dropdown
      if (SELECT_FIELDS[fieldId]) {
        return (
          <div key={fieldId} className="space-y-2">
            <Label className="text-[11px] font-black uppercase text-slate-500">{label} {isRequired && <span className="text-red-500">*</span>}</Label>
            <Select value={value || ""} onValueChange={(val) => handleFieldChange(fieldId, val)}>
              <SelectTrigger className="h-10 text-sm font-bold border-2 focus:ring-2 focus:ring-emerald-500">
                <SelectValue placeholder={`Select ${label}...`} />
              </SelectTrigger>
              <SelectContent>
                {SELECT_FIELDS[fieldId].map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="font-bold">{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }

      // 3. Textarea
      if (TEXTAREA_FIELDS.includes(fieldId)) {
        return (
          <div key={fieldId} className="space-y-2 md:col-span-2">
            <Label className="text-[11px] font-black uppercase text-slate-500">{label} {isRequired && <span className="text-red-500">*</span>}</Label>
            <Textarea
              className="text-sm min-h-[100px] border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 rounded-xl font-medium"
              value={formData[fieldId] || ""}
              onChange={e => handleFieldChange(fieldId, e.target.value)}
              placeholder={`Write detailed ${label.toLowerCase()} here...`}
            />
          </div>
        );
      }

      // 4. Inputs (Date / Number / Text)
      let inputType = "text";
      if (DATE_FIELDS.includes(fieldId)) inputType = "date";
      if (NUMBER_FIELDS.includes(fieldId)) inputType = "number";

      // Use tel for phone numbers to improve mobile entry and validation
      if (["mobile", "phone", "physicianContact"].includes(fieldId)) inputType = "tel";

      return (
        <div key={fieldId} className="space-y-2">
          <Label className="text-[11px] font-black uppercase text-slate-500">{label} {isRequired && <span className="text-red-500">*</span>}</Label>
          <Input
            type={inputType}
            maxLength={inputType === "tel" ? 10 : undefined}
            pattern={inputType === "tel" ? "[0-9]{10}" : undefined}
            className="h-10 text-sm font-bold border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 rounded-lg"
            value={formData[fieldId] || ""}
            onChange={e => handleFieldChange(fieldId, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}${inputType === "tel" ? " (10 digits)" : ""}`}
            onKeyPress={(e) => {
              if (inputType === "tel" && !/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
          />
        </div>
      );
    };

    // Reference definitions
    const CATEGORIES_REF = [
      {
        id: "general_examination_merged",
        title: "Demographics & Vitals",
        fields: [
          { id: "firstName", label: "First Name" },
          { id: "lastName", label: "Last Name" },
          { id: "dob", label: "Date of Birth" },
          { id: "age", label: "Age" },
          { id: "sex", label: "Gender" },
          { id: "classSection", label: "Class / Section" },
          { id: "bloodGroup", label: "Blood Group" },
          { id: "fatherName", label: "Father's Name" },
          { id: "fatherOccupation", label: "Father's Occupation" },
          { id: "motherName", label: "Mother's Name" },
          { id: "motherOccupation", label: "Mother's Occupation" },
          { id: "address", label: "Full Address" },
          { id: "pinCode", label: "Pin Code" },
          { id: "phone", label: "Phone (Home)" },
          { id: "mobile", label: "Mobile" },
          { id: "familyPhysicianName", label: "Family Physician Name" },
          { id: "physicianContact", label: "Physician Contact" },
          { id: "jaundice", label: "History of Jaundice" },
          { id: "allergies", label: "Known Allergies" },
          { id: "bloodTransfusion", label: "Blood Transfusion History" },
          { id: "majorIllness", label: "Any major illness/operation" },
          { id: "dentalImplant", label: "Dental Implant" },
          { id: "braces", label: "Dental Braces" },
          { id: "spectaclesRight", label: "Spectacles (Right Power)" },
          { id: "spectaclesLeft", label: "Spectacles (Left Power)" },
          { id: "height", label: "Height (cm)" },
          { id: "weight", label: "Weight (kg)" },
          { id: "bmi", label: "BMI" },
          { id: "anaemia", label: "Anaemia Assessment" },
          { id: "systemicExam", label: "General Remarks" },
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
          { id: "dptPolio", label: "DPT / Polio Booster" },
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
          { id: "currentMedication", label: "Current Medication" },
          { id: "otherInfo", label: "Other Information" },
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
          { id: "currentMedication", label: "Current Medication" },
          { id: "otherInfo", label: "Other Information" },
          { id: "doctorRemarks", label: "Doctor's Remarks" },
        ],
      },
      {
        id: "optical_examination",
        title: "Ophthalmology Examination",
        fields: [
          { id: "visionRight", label: "Vision (Right Eye)" },
          { id: "visionLeft", label: "Vision (Left Eye)" },
          { id: "spectacles", label: "Spectacles" },
          { id: "presentComplaint", label: "Present Complaint" },
          { id: "currentMedication", label: "Current Medication" },
          { id: "otherInfo", label: "Other Information" },
          { id: "doctorRemarks", label: "Doctor's Remarks" },
        ],
      },
      {
        id: "skin_examination",
        title: "Dermatology Examination",
        fields: [
          { id: "skinCondition", label: "Skin Condition" },
          { id: "nailsHair", label: "Nails & Hair Condition" },
          { id: "presentComplaint", label: "Present Complaint" },
          { id: "currentMedication", label: "Current Medication" },
          { id: "otherInfo", label: "Other Information" },
          { id: "doctorRemarks", label: "Doctor's Remarks" },
        ],
      },
      {
        id: "system_wise_examination",
        title: "Systemic Examination",
        fields: [
          { id: "abdomenIssues", label: "Abdomen: Issues" },
          { id: "cardioIssues", label: "Cardiovascular System: Issues" },
          { id: "cnsIssues", label: "Central Nervous System: Issues" },
          { id: "presentComplaint", label: "Present Complaint" },
          { id: "currentMedication", label: "Current Medication" },
          { id: "otherInfo", label: "Other Information" },
          { id: "doctorRemarks", label: "Doctor's Remarks" },
        ],
      },
      {
        id: "symptoms",
        title: "Clinical Presentation & Symptoms",
        fields: [
          { id: "scratchesHead", label: "Child constantly scratches the head" },
          { id: "rubsEyes", label: "Child rubs eyes" },
          { id: "headache", label: "Child complains of frequent headache" },
          { id: "cannotSeeBoard", label: "Child cannot see what is written on the board" },
          { id: "pullsEars", label: "Child constantly pokes fingers or pulls ear" },
          { id: "rottenTeeth", label: "Teeth look black or rotten" },
          { id: "badBreath", label: "Breath has a bad odour" },
          { id: "cracksMouth", label: "Cracks at corners of mouth" },
          { id: "mouthBreathing", label: "Child tends to breath through his mouth" },
          { id: "nailBiting", label: "Child bites nails" },
          { id: "whitePatches", label: "White Patches" },
          { id: "limpingGait", label: "Limping Gait" },
          { id: "breathlessness", label: "Child gets Attacks of breathlessness" },
          { id: "frequentUrination", label: "Frequent Urination" },
          { id: "diarrhoea", label: "Diarrhoea" },
          { id: "vomiting", label: "Vomiting" },
          { id: "stammering", label: "Child stammers & cannot speak properly" },
          { id: "bloodInStool", label: "Blood passed with stools" },
          { id: "faintingEpisodes", label: "Episodes of fainting esp. in summers" },
          { id: "anyOtherSymptoms", label: "Any other problem" },
        ],
      },
    ];

    const currentCatDef = CATEGORIES_REF.find(c => c.id === category);

    if (currentCatDef) {
      // Show ALL fields defined for this category in the reference
      const fieldsToRender = currentCatDef.fields;

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
    <div className={`flex flex-col ${isEmbedded ? '' : 'min-h-screen bg-slate-50 pb-12 pt-16'}`}>
      {!isEmbedded && <Navbar userName={userName} role={userRole || "MEDICAL_STAFF"} />}

      {/* Category Editor Header - Only show if NOT embedded to avoid duplicates */}
      {!isEmbedded && (
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
                        let bmi = "NA";
                        if (category === "general_examination_merged") {
                          const h = parseFloat(formData.height);
                          const w = parseFloat(formData.weight);
                          if (h && w) bmi = (w / Math.pow(h / 100, 2)).toFixed(1);
                        } else {
                          const recordData = (student?.medicalRecord?.data as Record<string, any>) || {};
                          const genData = recordData.general_examination_merged || {};
                          const height = parseFloat(genData.height);
                          const weight = parseFloat(genData.weight);
                          if (height && weight) bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
                        }
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
      )}

      <main className={`flex-1 w-full max-w-4xl mx-auto ${isEmbedded ? 'p-0' : 'p-3 sm:p-5 lg:p-6'} overflow-y-auto pb-24`}>
        {initialData?._managedBy && initialData._managedBy !== userName && !isReadOnly && (
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
          {(isLockedBy || hasTimedOut) && (
            <div className="absolute inset-0 z-10 bg-slate-50/40 cursor-not-allowed rounded-xl" title="Locked by another user" />
          )}
          <CardContent className="p-3">
            <fieldset disabled={!!isLockedBy || hasTimedOut}>
              {renderFormContent()}
            </fieldset>
          </CardContent>
        </Card>

        {category !== "general_examination_merged" && (
          <Card className="shadow-sm border-slate-200 relative mb-6">
            {(isLockedBy || hasTimedOut) && (
              <div className="absolute inset-0 z-10 bg-slate-50/40 cursor-not-allowed rounded-xl" title="Locked by another user" />
            )}
            <CardContent className="px-4 py-3 bg-slate-50 border-t-2 border-slate-700 rounded-b-xl">
              <div className="flex items-center gap-3">
                <Label className="text-xs font-black tracking-wide uppercase text-slate-700 shrink-0">Assessment <span className="text-red-500">*</span></Label>
                <div className="flex gap-2 flex-1 relative">
                  {/* Lock overlay for Assessment buttons if locked/timed out */}
                  {isReadOnly && <div className="absolute inset-0 z-10 cursor-default" />}
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

        <Card className="shadow-sm border-slate-200 relative mb-6">
          {(isLockedBy || hasTimedOut) && (
            <div className="absolute inset-0 z-10 bg-slate-50/40 cursor-not-allowed rounded-xl" title="Locked by another user" />
          )}
          <CardContent className="p-4 bg-white border-t-2 border-slate-700 rounded-b-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-700 tracking-wide uppercase">
                Clinical Prescription
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                onClick={(e) => { e.preventDefault(); setShowPrintOverlay(true); }}
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                Download PDF
              </Button>
            </div>

            {otherPrescriptions.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Prescriptions from other departments</p>
                {otherPrescriptions.map((p, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">
                      {p.category.replace(/_/g, " ").replace(/([A-Z])/g, ' $1').trim()}
                      <span className="text-slate-400 font-medium ml-1 lowercase">by {p.managedBy || "doctor"}</span>
                    </p>
                    <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap">{p.text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 relative">
              {isReadOnly && <div className="absolute inset-0 z-10 cursor-default" />}
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                {otherPrescriptions.length > 0 ? "Add your prescription" : "Prescription for this department"}
              </Label>
              <Textarea
                disabled={isReadOnly || !!isLockedBy}
                className="text-sm min-h-[100px] border-2 border-slate-200 focus:border-slate-400 focus:ring-0 rounded-xl font-medium resize-y"
                value={formData.prescription || ""}
                onChange={(e) => handleFieldChange("prescription", e.target.value)}
                placeholder="Write specific medical advice, medicines, or follow-up instructions here..."
              />
            </div>
          </CardContent>
        </Card>

      </main>

      {/* Floating Save Action Bar */}
      {(!isReadOnly && !isLockedBy) && (
        <div className={`${isEmbedded ? 'sticky bottom-0 rounded-b-2xl' : 'fixed bottom-0 left-0'} w-full bg-white border-t p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20`}>
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className={`hidden sm:flex text-sm text-slate-500 items-center gap-2`}>
              <FileCheck className="h-4 w-4" /> Editing {category.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              {!isEmbedded && <Button onClick={handleExit} variant="outline">Cancel</Button>}
              <Button onClick={handleSave} disabled={isSaving} className={`transition-all font-black uppercase text-xs tracking-widest px-8 ${isSaved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-slate-900'}`}>
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin text-white" /> Saving...</>
                ) : isSaved ? (
                  <><FileCheck className="mr-2 h-4 w-4 text-white" /> Edit Category</>
                ) : (
                  <><Save className="mr-2 h-4 w-4 text-white" /> Save Category</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPrintOverlay && (
        <PrescriptionPrintOverlay
          student={student}
          eventDate={eventDate}
          onClose={() => setShowPrintOverlay(false)}
        />
      )}
    </div>
  );
}

