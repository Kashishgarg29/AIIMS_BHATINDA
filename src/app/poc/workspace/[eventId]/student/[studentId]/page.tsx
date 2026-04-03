import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PocStudentCategoryGrid } from "@/components/poc/PocStudentCategoryGrid";
import { RealTimeRefresher } from "@/components/shared/RealTimeRefresher";

const CATEGORY_DEFINITIONS = [
    { id: "general_examination_merged", title: "Demographics & Vitals", iconName: "FileText" },
    { id: "vaccination_details", title: "Immunization Status", iconName: "Syringe" },
    { id: "symptoms", title: "Clinical Presentation & Symptoms", iconName: "AlertCircle" },
    { id: "ent_examination", title: "ENT Examination", iconName: "Ear" },
    { id: "dental_examination", title: "Dental Examination", iconName: "Tooth" },
    { id: "optical_examination", title: "Ophthalmology Examination", iconName: "Eye" },
    { id: "skin_examination", title: "Dermatology Examination", iconName: "Hand" },
    { id: "system_wise_examination", title: "Systemic Examination", iconName: "Activity" },
];

export default async function PocStudentRecordMasterView(props: {
    params: Promise<{ eventId: string, studentId: string }>,
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { eventId, studentId } = await props.params;
    const searchParams = props.searchParams ? await props.searchParams : {};
    const backTo = searchParams.from === "referred"
        ? `/poc/workspace/${eventId}/referred`
        : `/poc/workspace/${eventId}`;
    const session = await getServerSession(authOptions);

    const student = await prisma.student.findUnique({
        where: { id: studentId, eventId },
        include: { medicalRecord: true }
    });

    const event = await (prisma.event as any).findUnique({
        where: { id: eventId },
        select: { eventDate: true, formConfig: true }
    });

    if (!student) return notFound();

    const formConfig = ((event as any)?.formConfig as Record<string, string[]>) || {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const evDate = new Date(event?.eventDate || new Date());
    evDate.setHours(0, 0, 0, 0);

    let dynamicStatus = "UPCOMING";
    if (evDate.getTime() === today.getTime()) {
        dynamicStatus = "ACTIVE";
    } else if (evDate < today) {
        dynamicStatus = "PAST";
    }

    const recordData = (student.medicalRecord?.data as Record<string, any>) || {};
    
    // Extract BMI data
    const genExamData = recordData.general_examination_merged || {};
    const height = parseFloat(genExamData.height);
    const weight = parseFloat(genExamData.weight);
    let bmi = null;
    if (height && weight) {
        const heightInMeters = height / 100;
        bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    let completedCount = 0;

    const customCategories = Array.isArray(formConfig.customCategories) ? formConfig.customCategories : [];
    const ALL_CATEGORY_DEFINITIONS = [
        ...CATEGORY_DEFINITIONS,
        ...customCategories.map((c: any) => ({
            id: c.id,
            title: c.title,
            iconName: "FileText"
        }))
    ];

    const categoriesStatus = ALL_CATEGORY_DEFINITIONS.map(cat => {
        const dataForCat = recordData[cat.id];
        const hasAnyData = !!dataForCat;

        let status = "PENDING";

        if (hasAnyData) {
            const requiredFields = formConfig[cat.id] || [];
            const hasAllRequired = requiredFields.every(fieldId => {
                const val = dataForCat[fieldId];
                return val !== undefined && val !== null && val !== "" && val !== false;
            });

            if (requiredFields.length === 0 || hasAllRequired) {
                status = "COMPLETED";
                completedCount++;
            } else {
                status = "IN_PROGRESS";
            }
        }

        // Check lock status
        const currentLock = dataForCat?._lock;
        let isLockedBy = null;
        if (currentLock) {
            const lockTime = new Date(currentLock.lockedAt);
            const diffMinutes = (new Date().getTime() - lockTime.getTime()) / (1000 * 60);
            if (diffMinutes < 5 && currentLock.userId !== session?.user?.id) {
                isLockedBy = currentLock.userName;
            }
        }

        // POC read-only logic
        let catIsReadOnly = dynamicStatus === "PAST";
        const isAssignedToPoc = ['general_examination_merged', 'vaccination_details', 'symptoms'].includes(cat.id);
        if (!isAssignedToPoc || dynamicStatus === 'PAST') {
            catIsReadOnly = true;
        }

        return {
            id: cat.id,
            title: cat.title,
            iconName: cat.iconName,
            status,
            lastEditedBy: hasAnyData && dataForCat._managedBy ? dataForCat._managedBy : null,
            lastEditedAt: hasAnyData && dataForCat._lastUpdated ? new Date(dataForCat._lastUpdated).toLocaleString() : null,
            isLockedBy,
            isReadOnly: catIsReadOnly,
            data: dataForCat || null
        };
    });

    const isEventHead = (formConfig as any).eventHeadId === session?.user?.id;
    const isAdmin = session?.user?.role === "ADMIN";
    const assignedCategoryIds = (isAdmin || isEventHead)
        ? ALL_CATEGORY_DEFINITIONS.map(c => c.id)
        : ["general_examination_merged", "vaccination_details", "symptoms"];
    const completionPercentage = Math.round((completedCount / ALL_CATEGORY_DEFINITIONS.length) * 100);
    const globalStatus = student.medicalRecord?.status || "PENDING";

    return (
        <>
            <RealTimeRefresher />
<<<<<<< HEAD

            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Link href={backTo}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 transition-all shadow-sm">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-extrabold text-slate-900 leading-tight">{student.firstName} {student.lastName}</h1>
                                <Badge variant="outline" className={
                                    globalStatus === "COMPLETED" ? "bg-green-50 text-green-700 border-green-200" :
                                        globalStatus === "IN_PROGRESS" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                            "bg-slate-100 text-slate-700 border-slate-200"
                                }>
                                    {globalStatus.replace('_', ' ')}
                                </Badge>
                            </div>
                            <p className="text-base font-semibold text-slate-600 mt-2 flex flex-wrap gap-4">
                                <span className="flex items-center gap-1.5"><span className="opacity-40">Class:</span> {student.classSec}</span>
                                <span className="flex items-center gap-1.5"><span className="opacity-40">Age:</span> {student.age}</span>
                                <span className="flex items-center gap-1.5"><span className="opacity-40">Gender:</span> {student.gender}</span>
                                <span className="flex items-center gap-1.5 text-emerald-600">
                                    <span className="opacity-60 text-slate-500">BMI:</span> {bmi || 'NA'}
                                </span>
                            </p>
                        </div>

                        <div className="w-full md:w-1/3">
                            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                                <span>Completion Status</span>
                                <span>{completionPercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div className={`h-2.5 rounded-full ${completionPercentage === 100 ? 'bg-green-600' : 'bg-emerald-600'}`} style={{ width: `${completionPercentage}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col mb-6 gap-2">
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Medical Record Categories</h2>
                    <p className="text-slate-600 text-base font-medium">Select a category below to edit the student's information.</p>
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-4">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Activity className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-emerald-900 font-bold text-sm uppercase tracking-wider mb-1">School Representative Access</p>
                            <p className="text-emerald-700 text-sm leading-relaxed">
                                You are authorized to update <strong>Demographics & Vitals, Immunization Status, and Clinical Presentation</strong> details for this student.
                                {dynamicStatus !== "PAST" ? (
                                    <span> Please complete all entries for the event. Complete individual records as students arrive.</span>
                                ) : (
                                    <span className="text-amber-700 font-bold italic block mt-1">
                                        <AlertCircle className="inline h-4 w-4 mr-1" />
                                        The event has completed. Editing window is now closed.
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <PocStudentCategoryGrid
                    categoriesStatus={categoriesStatus}
                    assignedCategoryIds={assignedCategoryIds}
                    eventId={eventId}
                    studentId={studentId}
                />
            </main>
=======
            <PocStudentCategoryGrid
                categoriesStatus={categoriesStatus}
                assignedCategoryIds={assignedCategoryIds}
                eventId={eventId}
                studentId={studentId}
                student={student}
                backTo={backTo}
                completionPercentage={completionPercentage}
                globalStatus={globalStatus}
                dynamicStatus={dynamicStatus}
                userId={session?.user?.id || ""}
                userName={session?.user?.name || "School POC"}
                formConfig={formConfig}
            />
>>>>>>> d47ba5f ( last edited by prerna)
        </>
    );
}
