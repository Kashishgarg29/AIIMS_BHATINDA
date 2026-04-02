import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { StaffEventsClient } from "@/components/staff/StaffEventsClient";
import { StaffDashboardHeader } from "@/components/staff/StaffDashboardHeader";
import { redirect } from "next/navigation";

export default async function StaffDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) return null;

  // Fetch events where user is assigned staff
  const events = await (prisma.event as any).findMany({
    where: {
      eventStaff: { some: { userId: session.user.id } }
    },
    include: {
      eventStaff: {
        include: { user: true }
      },
      _count: {
        select: { students: true }
      },
      students: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          classSec: true,
          medicalRecord: {
            select: { data: true }
          }
        }
      }
    },
    orderBy: {
      eventDate: "asc"
    }
  });

  // Map to the format expected by the UI
  const assignedEvents = (events as any[]).map(event => {
    // Calculate Dynamic Status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const evDate = new Date(event.eventDate);
    evDate.setHours(0, 0, 0, 0);

    let dynamicStatus = "UPCOMING";
    if (evDate.getTime() === today.getTime()) {
      dynamicStatus = "ACTIVE";
    } else if (evDate < today) {
      dynamicStatus = "PAST";
    }

    const DEPT_MAP: Record<string, string> = {
      ent: "ENT", dental: "Dental", optical: "Optical", skin: "Skin", communityMed: "Comm. Med"
    };

    const referredStudents = (event.students as any[]).filter(stud => {
      const data = stud.medicalRecord?.data as Record<string, any> | null;
      if (!data) return false;
      return Object.values(data).some((catData: any) => catData?.status_nor === 'R');
    }).map((stud: any) => {
      const data = stud.medicalRecord?.data as Record<string, any>;
      const depts = Object.entries(data || {})
        .filter(([, catData]: any) => catData?.status_nor === 'R')
        .map(([key]) => DEPT_MAP[key] || key);
      return {
        id: stud.id,
        name: `${stud.firstName} ${stud.lastName}`,
        classSec: stud.classSec,
        depts,
      };
    });

    const observationStudents = (event.students as any[]).filter(stud => {
      const data = stud.medicalRecord?.data as Record<string, any> | null;
      if (!data) return false;
      return Object.values(data).some((catData: any) => catData?.status_nor === 'O');
    }).map((stud: any) => {
      const data = stud.medicalRecord?.data as Record<string, any>;
      const depts = Object.entries(data || {})
        .filter(([, catData]: any) => catData?.status_nor === 'O')
        .map(([key]) => DEPT_MAP[key] || key);
      return {
        id: stud.id,
        name: `${stud.firstName} ${stud.lastName}`,
        classSec: stud.classSec,
        depts,
      };
    });

    const eventHeadId = (event.formConfig as any)?.eventHeadId;
    const eventHead = (event.eventStaff as any[]).find(s => s.user.id === eventHeadId)?.user?.fullName || "Not Assigned";
    const isHead = eventHeadId === session.user.id;

    return {
      id: event.id,
      schoolName: event.schoolDetails,
      date: event.eventDate,
      location: "Main Campus",
      status: dynamicStatus,
      studentCount: event._count.students,
      referredCount: referredStudents.length,
      referredStudents,
      observationCount: observationStudents.length,
      observationStudents,
      pocName: event.pocName,
      eventHeadName: eventHead,
      isHead,
    };
  }).sort((a, b) => {
    const statusOrder: Record<string, number> = { "ACTIVE": 1, "UPCOMING": 2, "PAST": 3 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return a.date.getTime() - b.date.getTime();
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar role={session?.user?.role || "MEDICAL_STAFF"} userName={session?.user?.name || "Dr. Staff"} />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <StaffDashboardHeader />

        <section>
          <StaffEventsClient events={assignedEvents} userRole={session?.user?.role} />
        </section>
      </main>
    </div>
  );
}
