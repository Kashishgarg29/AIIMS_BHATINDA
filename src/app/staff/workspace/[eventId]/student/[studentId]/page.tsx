import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StudentCategoryGrid } from "@/components/staff/StudentCategoryGrid";
import { RealTimeRefresher } from "@/components/shared/RealTimeRefresher";

const CATEGORY_DEFINITIONS = [
  { id: "general_examination_merged", title: "Demographics & Vitals", iconName: "FileText" },
  { id: "vaccination_details", title: "Immunization Status", iconName: "Syringe" },
  { id: "ent_examination", title: "ENT Examination", iconName: "Ear" },
  { id: "dental_examination", title: "Dental Examination", iconName: "Tooth" },
  { id: "optical_examination", title: "Ophthalmology Examination", iconName: "Eye" },
  { id: "skin_examination", title: "Dermatology Examination", iconName: "Hand" },
  { id: "system_wise_examination", title: "Systemic Examination", iconName: "Activity" },
  { id: "symptoms", title: "Clinical Presentation & Symptoms", iconName: "AlertCircle" },
];

export default async function StudentRecordMasterView(props: {
  params: Promise<{ eventId: string, studentId: string }>,
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { eventId, studentId } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const backTo = searchParams.from === "referred"
    ? `/staff/workspace/${eventId}/referred`
    : searchParams.from === "observation"
      ? `/staff/workspace/${eventId}/observation`
      : `/staff/workspace/${eventId}`;
  const session = await getServerSession(authOptions);

  // Fetch full student and medical record from DB
  const student = await prisma.student.findFirst({
    where: { id: studentId },
    include: {
      medicalRecord: true,
    }
  });

  const event = await (prisma.event as any).findUnique({
    where: { id: eventId },
    select: { eventDate: true, pocEmail: true, formConfig: true, schoolDetails: true }
  });

  if (!student) return notFound();

  // Extract Form Config to know what is compulsory
  const formConfig = ((event as any)?.formConfig as Record<string, string[]>) || {};

  // Dynamic status check
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


  // Determine completions from JSONB data and Config
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
      // Check if all required fields are present and truthy
      const requiredFields = formConfig[cat.id] || [];
      const hasAllRequired = requiredFields.every(fieldId => {
        const val = dataForCat[fieldId];
        return val !== undefined && val !== null && val !== "" && val !== false;
      });

      // A section is COMPLETED only if all required fields are filled AND it has a status_nor (if not demographics)
      const isAssessmentComplete = cat.id === "demographics" || !!dataForCat.status_nor;

      if ((requiredFields.length === 0 || hasAllRequired) && isAssessmentComplete) {
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

    // Staff read-only logic
    let catIsReadOnly = dynamicStatus === "PAST";

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

  const isAdmin = session?.user?.role === "ADMIN";
  const assignmentsByTag = (formConfig as any).sectionAssignments || {};
  const isEventHead = (formConfig as any).eventHeadId === session?.user?.id;

  // Calculate assigned categories
  const assignedCategoryIds = isAdmin
    ? ALL_CATEGORY_DEFINITIONS.map(c => c.id) // Admins see all
    : ALL_CATEGORY_DEFINITIONS
      .filter(cat => (assignmentsByTag[cat.id] || []).includes(session?.user?.id || ""))
      .map(cat => cat.id);

  const completionPercentage = Math.round((completedCount / ALL_CATEGORY_DEFINITIONS.length) * 100);
  const globalStatus = student.medicalRecord?.status || "PENDING";

  return (
    <div className="flex flex-col">
      <RealTimeRefresher />
      <StudentCategoryGrid
          categoriesStatus={categoriesStatus}
          assignedCategoryIds={assignedCategoryIds}
          eventId={eventId}
          eventDate={event?.eventDate?.toISOString()}
          schoolName={event?.schoolDetails}
          studentId={studentId}
          student={student}
          backTo={backTo}
          completionPercentage={completionPercentage}
          globalStatus={globalStatus}
          dynamicStatus={dynamicStatus}
          bmi={bmi}
          isUpcoming={dynamicStatus === "UPCOMING" && !isAdmin}
          userId={session?.user?.id || ""}
          userName={session?.user?.name || "Medical Staff"}
          userRole={session?.user?.role}
          formConfig={formConfig}
      />
    </div>
  );
}
