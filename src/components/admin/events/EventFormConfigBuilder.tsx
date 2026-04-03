"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { saveEventFormConfig } from "@/lib/actions/db-sync";
import { Loader2, Save, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FieldDefinition {
  id: string;
  label: string;
  isDefault?: boolean;
}

interface CustomCategory {
  id: string;
  title: string;
  fields: FieldDefinition[];
}

const CATEGORIES: { id: string; title: string; fields: FieldDefinition[] }[] = [
  {
    id: "general_examination_merged",
    title: "1. Demographics & Vitals",
    fields: [
      { id: "name", label: "Name", isDefault: true },
      { id: "dob", label: "Date of Birth", isDefault: true },
      { id: "age", label: "Age", isDefault: true },
      { id: "sex", label: "Sex", isDefault: true },
      { id: "classSection", label: "Class/Section", isDefault: true },
      { id: "bloodGroup", label: "Blood Group", isDefault: true },
      { id: "fatherName", label: "Father's Name" },
      { id: "fatherOccupation", label: "Father's Occupation" },
      { id: "motherName", label: "Mother's Name" },
      { id: "motherOccupation", label: "Mother's Occupation" },
      { id: "address", label: "Address" },
      { id: "pinCode", label: "Pin Code" },
      { id: "phone", label: "Phone" },
      { id: "mobile", label: "Mobile", isDefault: true },
      { id: "familyPhysicianName", label: "Family Physician Name" },
      { id: "physicianContact", label: "Physician Contact" },
      { id: "jaundice", label: "Jaundice" },
      { id: "allergies", label: "Allergies", isDefault: true },
      { id: "bloodTransfusion", label: "Blood Transfusion" },
      { id: "majorIllness", label: "Any major illness/operation", isDefault: true },
      { id: "dentalImplant", label: "Dental Implant" },
      { id: "braces", label: "Braces" },
      { id: "spectaclesRight", label: "Spectacles / Lens (Right Eye)" },
      { id: "spectaclesLeft", label: "Spectacles / Lens (Left Eye)" },
      { id: "height", label: "Height (cm)", isDefault: true },
      { id: "weight", label: "Weight (kg)", isDefault: true },
      { id: "anaemia", label: "Anaemia", isDefault: true },
      { id: "systemicExam", label: "Systemic Examination" },
    ],
  },
  {
    id: "vaccination_details",
    title: "2. Immunization Status",
    fields: [
      { id: "hepB1", label: "Hepatitis B (1st Dose)", isDefault: true },
      { id: "hepB2", label: "Hepatitis B (2nd Dose)" },
      { id: "hepB3", label: "Hepatitis B (3rd Dose)" },
      { id: "typhoid", label: "Typhoid", isDefault: true },
      { id: "dptPolio", label: "DPT / Polio Booster" },
      { id: "tetanus", label: "Tetanus", isDefault: true },
    ],
  },
  {
    id: "ent_examination",
    title: "3. ENT Examination",
    fields: [
      { id: "earIssues", label: "Ear Issues", isDefault: true },
      { id: "noseIssues", label: "Nose Issues", isDefault: true },
      { id: "throatIssues", label: "Throat Issues", isDefault: true },
      { id: "mouthBreathing", label: "Mouth Breathing" },
      { id: "presentComplaint", label: "Present Complaint", isDefault: true },
      { id: "currentMedication", label: "Current Medication" },
      { id: "otherInfo", label: "Other Information" },
      { id: "doctorRemarks", label: "Doctor's Remarks", isDefault: true },
    ],
  },
  {
    id: "dental_examination",
    title: "4. Dental Examination",
    fields: [
      { id: "rottenTeeth", label: "Rotten Teeth" },
      { id: "cavities", label: "Cavities", isDefault: true },
      { id: "gumCondition", label: "Gum Condition", isDefault: true },
      { id: "badBreath", label: "Bad Breath" },
      { id: "presentComplaint", label: "Present Complaint", isDefault: true },
      { id: "currentMedication", label: "Current Medication" },
      { id: "otherInfo", label: "Other Information" },
      { id: "doctorRemarks", label: "Doctor's Remarks", isDefault: true },
    ],
  },
  {
    id: "optical_examination",
    title: "5. Ophthalmology Examination",
    fields: [
      { id: "visionRight", label: "Vision (Right Eye)", isDefault: true },
      { id: "visionLeft", label: "Vision (Left Eye)", isDefault: true },
      { id: "cannotSeeBoard", label: "Cannot see board", isDefault: true },
      { id: "rubsEyes", label: "Rubs eyes frequently" },
      { id: "spectacles", label: "Spectacles", isDefault: true },
      { id: "presentComplaint", label: "Present Complaint", isDefault: true },
      { id: "currentMedication", label: "Current Medication" },
      { id: "otherInfo", label: "Other Information" },
      { id: "doctorRemarks", label: "Doctor's Remarks", isDefault: true },
    ],
  },
  {
    id: "skin_examination",
    title: "6. Dermatology Examination",
    fields: [
      { id: "skinCondition", label: "Skin Condition", isDefault: true },
      { id: "nailsHair", label: "Nails & Hair Condition" },
      { id: "whitePatches", label: "White Patches" },
      { id: "cracksMouth", label: "Cracks at mouth corner" },
      { id: "presentComplaint", label: "Present Complaint", isDefault: true },
      { id: "currentMedication", label: "Current Medication" },
      { id: "otherInfo", label: "Other Information" },
      { id: "doctorRemarks", label: "Doctor's Remarks", isDefault: true },
    ],
  },
  {
    id: "system_wise_examination",
    title: "7. Systemic Examination",
    fields: [
      { id: "limpingGait", label: "Locomotor System: Limping Gait" },
      { id: "abdomenIssues", label: "Abdomen: Issues" },
      { id: "breathlessness", label: "Respiratory System: Breathlessness" },
      { id: "cardioIssues", label: "Cardiovascular System: Issues" },
      { id: "cnsIssues", label: "Central Nervous System: Issues" },
      { id: "presentComplaint", label: "Present Complaint", isDefault: true },
      { id: "currentMedication", label: "Current Medication" },
      { id: "otherInfo", label: "Other Information" },
      { id: "doctorRemarks", label: "Doctor's Remarks", isDefault: true },
    ],
  },
  {
    id: "symptoms",
    title: "8. Clinical Presentation & Symptoms",
    fields: [
      { id: "scratchesHead", label: "Scratches head frequently" },
      { id: "headache", label: "Complains of headache", isDefault: true },
      { id: "cannotSeeBoardSymptoms", label: "Cannot see board", isDefault: true },
      { id: "pullsEars", label: "Pulls ears" },
      { id: "nailBiting", label: "Nail biting" },
      { id: "frequentUrination", label: "Frequent urination" },
      { id: "diarrhoea", label: "Diarrhoea", isDefault: true },
      { id: "vomiting", label: "Vomiting", isDefault: true },
      { id: "stammering", label: "Stammering" },
      { id: "faintingEpisodes", label: "Fainting episodes", isDefault: true },
      { id: "anyOtherSymptoms", label: "Any other" },
    ],
  },
];

const DEFAULT_NECESSARY_FIELDS = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat.fields.filter(f => f.isDefault).map(f => f.id);
  return acc;
}, {} as Record<string, string[]>);

const ALL_MAPPED_FIELDS = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat.fields.map(f => f.id);
  return acc;
}, {} as Record<string, string[]>);

export function EventFormConfigBuilder({
  eventId,
  initialConfig
}: {
  eventId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialConfig: any
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");

  // Custom sections
  const [customSections, setCustomSections] = useState<CustomCategory[]>(() => {
    if (initialConfig && initialConfig.customCategories) {
      return initialConfig.customCategories;
    }
    return [];
  });

  // State maps categoryId -> array of required field IDs
  const [config, setConfig] = useState<Record<string, string[]>>(() => {
    if (initialConfig && Object.keys(initialConfig).length > 0) {
      const pureConfig = { ...initialConfig };
      delete pureConfig.customCategories;

      // Ensure that if the database holds an old format (e.g. "demographics" instead of "general_examination_merged"),
      // we correctly fall back to the defaults instead of loading blank checklists.
      const hasValidNewCategories = CATEGORIES.some(c => Array.isArray(pureConfig[c.id]));

      if (!hasValidNewCategories) {
        return DEFAULT_NECESSARY_FIELDS;
      }

      return Object.keys(pureConfig).length > 0 ? pureConfig : DEFAULT_NECESSARY_FIELDS;
    }
    return DEFAULT_NECESSARY_FIELDS;
  });

  const selectAll = () => {
    const all = { ...ALL_MAPPED_FIELDS };
    customSections.forEach(c => {
      all[c.id] = c.fields.map(f => f.id);
    });
    setConfig(all);
  };

  const selectDefaults = () => {
    const defaults = { ...DEFAULT_NECESSARY_FIELDS };
    customSections.forEach(c => {
      defaults[c.id] = []; 
    });
    setConfig(defaults);
  };

  const clearAll = () => setConfig({});

  const toggleField = (categoryId: string, fieldId: string, checked: boolean) => {
    setConfig(prev => {
      const currentCatFields = prev[categoryId] || [];
      if (checked) {
        return { ...prev, [categoryId]: [...currentCatFields, fieldId] };
      } else {
        return { ...prev, [categoryId]: currentCatFields.filter(id => id !== fieldId) };
      }
    });
    setSaveStatus("IDLE");
  };

  const handleCreateCustomSection = () => {
    const newId = `custom_${Date.now()}`;
    setCustomSections(prev => [
      ...prev,
      { id: newId, title: "New Custom Section", fields: [] }
    ]);
  };

  const updateCustomSectionTitle = (id: string, title: string) => {
    setCustomSections(prev => prev.map(s => s.id === id ? { ...s, title } : s));
  };

  const removeCustomSection = (id: string) => {
    setCustomSections(prev => prev.filter(s => s.id !== id));
    setConfig(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const addFieldToCustomSection = (sectionId: string) => {
    const fieldId = `field_${Date.now()}`;
    setCustomSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        return { ...s, fields: [...s.fields, { id: fieldId, label: "New Field" }] };
      }
      return s;
    }));
  };

  const updateCustomFieldLabel = (sectionId: string, fieldId: string, label: string) => {
    setCustomSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          fields: s.fields.map(f => f.id === fieldId ? { ...f, label } : f)
        };
      }
      return s;
    }));
  };

  const removeCustomField = (sectionId: string, fieldId: string) => {
    setCustomSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        return { ...s, fields: s.fields.filter(f => f.id !== fieldId) };
      }
      return s;
    }));
    setConfig(prev => {
      if (!prev[sectionId]) return prev;
      return {
        ...prev,
        [sectionId]: prev[sectionId].filter(id => id !== fieldId)
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("IDLE");

    const payload = {
      ...config,
      customCategories: customSections
    };

    const result = await saveEventFormConfig(eventId, payload);

    setIsSaving(false);
    if (result.success) {
      setSaveStatus("SUCCESS");
      setTimeout(() => setSaveStatus("IDLE"), 3000);
    } else {
      setSaveStatus("ERROR");
    }
  };

  const allCategoriesToRender = [...CATEGORIES, ...customSections];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Form Configuration Builder</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Check the fields below that must be provided by the Medical Staff.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={selectDefaults}>Restore Defaults</Button>
          <Button variant="outline" onClick={selectAll}>Select All</Button>
          <Button variant="outline" onClick={clearAll}>Clear All</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Builder Settings
          </Button>
        </div>
      </div>

      {saveStatus === "SUCCESS" && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4 !text-green-600" />
          <AlertDescription>Form configuration saved successfully.</AlertDescription>
        </Alert>
      )}

      {saveStatus === "ERROR" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to save form configuration.</AlertDescription>
        </Alert>
      )}

      {/* @ts-expect-error shadcn ui type mismatch */}
      <Accordion type="multiple" className="w-full">
        {allCategoriesToRender.map((cat) => {
          const isCustom = cat.id.startsWith('custom_');

          return (
            <AccordionItem key={cat.id} value={cat.id} className="border bg-white rounded-lg px-4 mb-4 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex flex-1 justify-between items-center pr-4">
                  {isCustom ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Input
                        value={cat.title}
                        onChange={(e) => updateCustomSectionTitle(cat.id, e.target.value)}
                        className="h-8 shadow-none w-[250px] font-semibold text-slate-800"
                        placeholder="Section Title"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => removeCustomSection(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="font-semibold text-slate-800">{cat.title}</span>
                  )}
                  <span className="text-sm text-slate-500 font-normal">
                    {(config[cat.id] || []).length} required fields
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 mt-4">
                  {cat.fields.map(field => {
                    const isChecked = (config[cat.id] || []).includes(field.id);
                    return (
                      <div key={field.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`${cat.id}-${field.id}`}
                          checked={isChecked}
                          onCheckedChange={(c) => toggleField(cat.id, field.id, !!c)}
                        />
                        {isCustom ? (
                          <div className="flex items-center flex-1 gap-2">
                            <Input
                              value={field.label}
                              onChange={(e) => updateCustomFieldLabel(cat.id, field.id, e.target.value)}
                              className="h-7 text-sm shadow-none"
                              placeholder="Field Name"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeCustomField(cat.id, field.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <label
                            htmlFor={`${cat.id}-${field.id}`}
                            className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                          >
                            <span>{field.label}</span>
                            {field.isDefault && (
                              <span className="ml-1.5 text-[9px] text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50 px-1 py-0.5 rounded-sm">
                                Default
                              </span>
                            )}
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
                {isCustom && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-6 border-dashed"
                    onClick={() => addFieldToCustomSection(cat.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Field
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <Button
        variant="outline"
        onClick={handleCreateCustomSection}
        className="w-full mt-4 border-dashed border-black-300 text-black-600 hover:bg-black-100 hover:border-black-400 py-6"
      >
        <Plus className="mr-2 h-5 w-5" /> Add Custom Section
      </Button>
    </div>
  );
}
