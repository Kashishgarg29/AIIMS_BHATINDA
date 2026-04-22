import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";

const CATEGORIES_REF = [
    {
        id: "general_examination_merged",
        title: "Demographics & Vitals",
        fields: [
            { id: "firstName", label: "First Name" },
            { id: "lastName", label: "Last Name" },
            { id: "dob", label: "DOB" },
            { id: "age", label: "Age" },
            { id: "sex", label: "Gender" },
            { id: "classSection", label: "Class/Sec" },
            { id: "bloodGroup", label: "Bld Grp" },
            { id: "fatherName", label: "Father Name" },
            { id: "address", label: "Address" },
            { id: "phone", label: "Phone" },
            { id: "jaundice", label: "Jaundice" },
            { id: "allergies", label: "Allergies" },
            { id: "bloodTransfusion", label: "Bld Transf." },
            { id: "majorIllness", label: "Major Ill." },
            { id: "height", label: "Ht (cm)" },
            { id: "weight", label: "Wt (kg)" },
            { id: "bmi", label: "BMI" },
            { id: "anaemia", label: "Anaemia" },
            { id: "systemicExam", label: "Gen Remarks" },
        ],
    },
    {
        id: "vaccination_details",
        title: "Immunization",
        fields: [
            { id: "hepB1", label: "Hep B1" },
            { id: "hepB2", label: "Hep B2" },
            { id: "hepB3", label: "Hep B3" },
            { id: "typhoid", label: "Typhoid" },
            { id: "dptPolio", label: "DPT/Polio" },
            { id: "tetanus", label: "Tetanus" },
        ],
    },
    {
        id: "ent_examination",
        title: "ENT Exam",
        fields: [
            { id: "earIssues", label: "Ear" },
            { id: "noseIssues", label: "Nose" },
            { id: "throatIssues", label: "Throat" },
            { id: "mouthBreathing", label: "Mouth Br." },
            { id: "doctorRemarks", label: "Remarks" },
        ],
    },
    {
        id: "dental_examination",
        title: "Dental Exam",
        fields: [
            { id: "rottenTeeth", label: "Rotten" },
            { id: "cavities", label: "Cavities" },
            { id: "gumCondition", label: "Gums" },
            { id: "badBreath", label: "Breath" },
            { id: "doctorRemarks", label: "Remarks" },
        ],
    },
    {
        id: "optical_examination",
        title: "Optical Exam",
        fields: [
            { id: "visionRight", label: "Vis (R)" },
            { id: "visionLeft", label: "Vis (L)" },
            { id: "cannotSeeBoard", label: "Board" },
            { id: "spectacles", label: "Specs" },
            { id: "doctorRemarks", label: "Remarks" },
        ],
    },
    {
        id: "skin_examination",
        title: "Skin Exam",
        fields: [
            { id: "skinCondition", label: "Skin" },
            { id: "nailsHair", label: "Hair/Nails" },
            { id: "whitePatches", label: "Patches" },
            { id: "doctorRemarks", label: "Remarks" },
        ],
    },
    {
        id: "system_wise_examination",
        title: "Systemic Exam",
        fields: [
            { id: "limpingGait", label: "Limping" },
            { id: "abdomenIssues", label: "Abdomen" },
            { id: "breathlessness", label: "Resp" },
            { id: "cardioIssues", label: "CVS" },
            { id: "cnsIssues", label: "CNS" },
            { id: "doctorRemarks", label: "Remarks" },
        ],
    },
    {
        id: "symptoms",
        title: "Symptoms",
        fields: [
            { id: "scratchesHead", label: "Scratches" },
            { id: "headache", label: "Headache" },
            { id: "cannotSeeBoardSymptoms", label: "Board" },
            { id: "anyOtherSymptoms", label: "Other" },
        ],
    },
];

const CHECKBOX_FIELDS = [
    "jaundice", "allergies", "bloodTransfusion", "dentalImplant", "braces", "spectacles",
    "typhoid", "earIssues", "noseIssues", "throatIssues", "mouthBreathing", "rottenTeeth",
    "cavities", "gumCondition", "badBreath", "cannotSeeBoard", "rubsEyes", "usesSpectacles",
    "skinCondition", "nailsHair", "whitePatches", "cracksMouth", "limpingGait", "abdomenIssues",
    "breathlessness", "cardioIssues", "cnsIssues", "scratchesHead", "headache", "cannotSeeBoardSymptoms",
    "pullsEars", "nailBiting", "frequentUrination", "diarrhoea", "vomiting", "stammering",
    "bloodInStool", "faintingEpisodes", "anyOtherSymptoms"
];

export default async function PrintStudentPage(props: {
    params: Promise<{ studentId: string }>,
    searchParams: Promise<{ mode?: string, eventId?: string }>
}) {
    const { studentId } = await props.params;
    const { mode, eventId } = await props.searchParams;

    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
            medicalRecords: {
                where: eventId ? { eventId: eventId } : undefined,
                include: {
                    event: true
                },
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    if (!student || student.medicalRecords.length === 0) return notFound();

    const currentMedicalRecord = student.medicalRecords[0];
    const event = currentMedicalRecord.event;
    const recordData = (currentMedicalRecord.data as Record<string, any>) || {};
    const formConfig = (event.formConfig as any) || {};
    const customCategories = Array.isArray(formConfig.customCategories) ? formConfig.customCategories : [];

    // Merge standard and custom categories
    const ALL_CATEGORIES = [
        ...CATEGORIES_REF,
        ...customCategories.map((c: any) => ({
            id: c.id,
            title: c.title,
            fields: c.fields
        }))
    ];

    const sectionsToDisplay = ALL_CATEGORIES.filter(sec => {
        const data = recordData[sec.id];
        if (!data) return false;
        if (mode === 'referred') return data.status_nor === 'R';
        return true;
    });

    return (
        <div className="bg-white min-h-screen p-8 max-w-3xl mx-auto print:p-0 print:m-0 text-black font-mono">
            {/* Minimal Slip Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-4">
                <h1 className="text-xl font-bold uppercase underline">AIIMS BHATINDA - HEALTH SLIP</h1>
                <p className="text-xs mt-1">{event.schoolDetails}</p>
                <div className="flex justify-between text-[10px] mt-2 font-bold">
                    <span>Date: {new Date(event.eventDate).toLocaleDateString()}</span>
                    <span>Type: {mode === 'referred' ? 'REFERRAL SLIP' : 'HEALTH RECORD'}</span>
                </div>
            </div>

            {/* Basic Student Info Row - ID REMOVED */}
            <div className="border-b border-black pb-2 mb-4 text-xs">
                <div className="grid grid-cols-2 gap-y-1">
                    <p><strong>NAME:</strong> {student.firstName} {student.lastName}</p>
                    <p><strong>CLASS:</strong> {recordData.general_examination_merged?.classSection || "N/A"}</p>
                    <p><strong>AGE/SEX:</strong> {recordData.general_examination_merged?.age || "N/A"}Y / {student.gender}</p>
                    {/* ID Removed as requested */}
                </div>
            </div>

            {/* Sections Display */}
            <div className="space-y-6">
                {sectionsToDisplay.length > 0 ? sectionsToDisplay.map((sec) => {
                    const data = recordData[sec.id];
                    if (!data) return null;

                    const isNormal = data.status_nor === 'N';

                    return (
                        <div key={sec.id} className="break-inside-avoid">
                            {/* Simple Section Header */}
                            <div className="flex justify-between border-b border-black mb-2 pb-0.5">
                                <h2 className="text-xs font-bold uppercase">{sec.title}</h2>
                                <span className="text-[10px] font-bold">
                                    [{data.status_nor === 'R' ? 'REFERRED' : data.status_nor === 'O' ? 'OBSERVE' : 'NORMAL'}]
                                </span>
                            </div>
                            
                            {/* Conditional Display Logic */}
                            {isNormal ? (
                                <p className="text-[10px] italic">Status: ALL PARAMETERS ARE NORMAL</p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 text-[10px]">
                                        {sec.fields.map((f: { id: string, label: string }) => {
                                            const value = data[f.id];
                                            if (value === undefined || value === "") return null;

                                            let displayValue = value;
                                            let subDetails = null;

                                            if (CHECKBOX_FIELDS.includes(f.id)) {
                                                const isYes = value === "YES" || value === true;
                                                const isNo = value === "NO" || value === false;
                                                displayValue = isYes ? "YES" : isNo ? "NO" : value;
                                                if (isYes && data[`${f.id}_details`]) subDetails = data[`${f.id}_details`];
                                            }

                                            return (
                                                <div key={f.id} className="flex justify-between">
                                                    <span className="font-semibold">{f.label}:</span>
                                                    <span>{String(displayValue)}</span>
                                                    {subDetails && (
                                                        <span className="ml-1 italic text-[9px] block">- {subDetails}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Section Remarks */}
                                    {data.doctorRemarks && (
                                        <div className="mt-2 text-[9px] border-l-2 border-black pl-2">
                                            <strong>ADVISORY:</strong> {data.doctorRemarks}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                }) : (
                    <div className="text-center py-10 italic">
                        No flagged medical issues.
                    </div>
                )}
            </div>

            {/* Slip Footer */}
            <div className="mt-12 pt-4 border-t border-black text-center">
                <div className="flex justify-between items-end">
                    <p className="text-[8px] italic">Gen. by HealthCampPro</p>
                    <div className="w-32">
                        <div className="border-t border-black pt-1">
                            <p className="text-[10px] font-bold">Sign/Seal</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Auto Print Trigger */}
            <script dangerouslySetInnerHTML={{ __html: `window.print()` }} />

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { margin: 15mm; }
                    body { color: black !important; background: white !important; }
                }
            ` }} />
        </div>
    );
}
