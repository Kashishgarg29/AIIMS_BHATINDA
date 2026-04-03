import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, ArrowLeft, Activity, MapPin, ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AssignStaffButton } from "@/components/admin/directory/AssignStaffButton";
import { RemoveStaffButton } from "@/components/admin/directory/RemoveStaffButton";
import { SetEventHeadButton } from "@/components/admin/directory/SetEventHeadButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventFormConfigBuilder } from "@/components/admin/events/EventFormConfigBuilder";
import { EventManagementActions } from "@/components/admin/events/EventManagementActions";
import { EventDetailManagement } from "@/components/admin/events/EventDetailManagement";
export default async function AdminEventDetails({
  params
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);

  // Deep fetch Event, Assigned Staff, and all Students
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventStaff: {
        include: { user: true }
      },
      students: {
        include: { medicalRecord: true },
        orderBy: [{ classSec: 'asc' }, { lastName: 'asc' }]
      }
    }
  });

  if (!event) {
    redirect("/admin/dashboard");
  }

  // Calculate the same-day range for staff conflict check
  const eventDayStart = new Date(event.eventDate);
  eventDayStart.setHours(0, 0, 0, 0);
  const eventDayEnd = new Date(event.eventDate);
  eventDayEnd.setHours(23, 59, 59, 999);

  // Identify all staff IDs already assigned to other events on this same day
  const conflictingAssignments = await prisma.eventStaff.findMany({
    where: {
      event: {
        eventDate: {
          gte: eventDayStart,
          lte: eventDayEnd
        },
        id: { not: eventId }
      }
    },
    select: { userId: true }
  });
  const unavailableStaffIds = conflictingAssignments.map(s => s.userId);

  // Get all Medical Staff for assignment modal, excluding those already on a camp today
  const allMedicalStaff = await prisma.user.findMany({
    where: {
      role: "MEDICAL_STAFF",
      isActive: true,
      id: { notIn: unavailableStaffIds }
    },
    select: { id: true, fullName: true, email: true, department: true },
    orderBy: { fullName: 'asc' }
  });

  const assignedStaffIds = event.eventStaff.map(s => s.userId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentEventHeadId = (event.formConfig as any)?.eventHeadId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentSchoolContactId = (event.formConfig as any)?.schoolContactId;

  // Calculate statistics over the joined tables
  const totalStudents = event.students.length;
  // Count how many students have a medical record that is fully completed
  const completedRecords = event.students.filter(s => s.medicalRecord?.status === "COMPLETED").length;
  const progressPercent = totalStudents > 0 ? Math.round((completedRecords / totalStudents) * 100) : 0;

  // Compute Dynamic Status
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const evDate = new Date(event.eventDate);
  evDate.setHours(0, 0, 0, 0);

  let dynamicStatus = "UPCOMING";
  if (evDate.getTime() === today.getTime()) {
    dynamicStatus = "ACTIVE (TODAY)";
  } else if (evDate < today) {
    dynamicStatus = "PAST";
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
      <Navbar role={session?.user?.role || "ADMIN"} userName={session?.user?.name || "Admin"} />

      <EventDetailManagement
        event={event}
        allMedicalStaff={allMedicalStaff}
        assignedStaffIds={assignedStaffIds}
        currentEventHeadId={currentEventHeadId}
        totalStudents={totalStudents}
        completedRecords={completedRecords}
        progressPercent={progressPercent}
        dynamicStatus={dynamicStatus}
      />
    </div>
  );
}
