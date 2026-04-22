import { Navbar } from "@/components/layout/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import { AdminStudentCategoryGrid } from "@/components/admin/AdminStudentCategoryGrid";

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

export default async function AdminStudentView({
    params
}: {
    params: Promise<{ eventId: string, studentId: string }>
}) {
    const { eventId, studentId } = await params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EVENT_HEAD")) {
        redirect("/login");
    }

    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
            medicalRecords: {
                where: { eventId },
                include: { event: true },
                take: 1
            }
        }
    });

    if (!student || student.medicalRecords.length === 0) notFound();
    const currentMedicalRecord = student.medicalRecords[0];
    const event = currentMedicalRecord.event;

    const formConfig = (event.formConfig as any) || {};
    const recordData = (currentMedicalRecord.data as Record<string, any>) || {};

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
            const hasAllRequired = (requiredFields as string[]).every((fieldId: string) => {
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

        return {
            id: cat.id,
            title: cat.title,
            iconName: cat.iconName,
            status,
            data: dataForCat || null
        };
    });

    const completionPercentage = Math.round((completedCount / ALL_CATEGORY_DEFINITIONS.length) * 100);
    const globalStatus = currentMedicalRecord?.status || "PENDING";

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar role={session.user.role} userName={session.user.name || "Admin"} />
            
            <AdminStudentCategoryGrid
                categoriesStatus={categoriesStatus}
                eventId={eventId}
                studentId={studentId}
                student={student}
                backTo={`/admin/events/${eventId}`}
                completionPercentage={completionPercentage}
                globalStatus={globalStatus}
                userId={session.user.id}
                userName={session.user.name || "Admin"}
                formConfig={formConfig}
            />
        </div>
    );
}

