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

    const medicalRecord = await prisma.medicalRecord.findUnique({
        where: {
            studentId_eventId: {
                studentId,
                eventId
            }
        },
        include: {
            student: true,
            event: true
        }
    });

    if (!medicalRecord) return notFound();
    
    const student = medicalRecord.student;
    const event = medicalRecord.event;
    const currentMedicalRecord = medicalRecord;

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

    const recordData = (currentMedicalRecord?.data as Record<string, any>) || {};

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
    const globalStatus = currentMedicalRecord?.status || "PENDING";

    return (
        <>
            <RealTimeRefresher />
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
        </>
    );
}        
