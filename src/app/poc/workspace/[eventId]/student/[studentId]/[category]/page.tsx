import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { CategoryEditFormClient } from "@/components/staff/forms/CategoryEditForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function PocCategoryEditForm({ params }: { params: Promise<{ eventId: string, studentId: string, category: string }> }) {
    const { eventId, studentId, category } = await params;
    const session = await getServerSession(authOptions);

    const event = await (prisma.event as any).findUnique({
        where: { id: eventId },
        select: { eventDate: true, pocEmail: true, formConfig: true }
    });
    if (!event) return notFound();

    const isPOC = event.pocEmail?.toLowerCase() === session?.user?.email?.toLowerCase();
    const isAdmin = session?.user?.role === "ADMIN";

    if (!isAdmin && !isPOC) {
        return redirect("/poc/dashboard");
    }

    const formConfig = ((event as any)?.formConfig as Record<string, any>) || {};
    const customCategories = Array.isArray(formConfig.customCategories) ? formConfig.customCategories : [];

    // Verify valid category - POC only allowed in strict subsets
    const validPOC_Categories = ["general_examination_merged", "vaccination_details", "symptoms"];
    if (!validPOC_Categories.includes(category) && !isAdmin) {
        // Other categories exist but POC shouldn't access the edit form directly
        // Let's allow view, but it's completely locked out.
    }

    const student = await prisma.student.findUnique({
        where: { id: studentId, eventId },
        include: { medicalRecord: true }
    });

    if (!student) return notFound();

    const recordData = (student.medicalRecord?.data as Record<string, any>) || {};
    const categoryData = recordData[category] || {};

    const requiredFields = formConfig[category] || [];
    const customCategoryConfig = customCategories.find((c: any) => c.id === category) || null;

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

    let isSectionLockedForUser = false;
    let readOnlyReason = "";

    if (!validPOC_Categories.includes(category)) {
        isSectionLockedForUser = true;
        readOnlyReason = "School representatives can only edit the Demographics, Immunization, and Symptoms sections.";
    } else if (dynamicStatus !== "UPCOMING") {
        // For communityMed & demographics, POC can edit till day before the event
        isSectionLockedForUser = true;
        readOnlyReason = "The editing window for school representatives has closed (deadline was 1 day prior to the event).";
    }

    const isReadOnly = dynamicStatus === "PAST" || isSectionLockedForUser;

    if (dynamicStatus === "PAST") {
        readOnlyReason = "This event has already passed. The medical record is frozen and cannot be edited.";
    }

    return (
        <CategoryEditFormClient
            eventId={eventId}
            studentId={studentId}
            category={category}
            initialData={categoryData}
            requiredFields={requiredFields}
            isReadOnly={isReadOnly}
            readOnlyReason={readOnlyReason}
            userName={session?.user?.name || "School Representative"}
            userId={session?.user?.id || ""}
            customCategoryBlock={customCategoryConfig}
            student={student}
            isPOC={isPOC}
            basePath="/poc"
            userRole="SCHOOL_POC"
        />
    );
}
