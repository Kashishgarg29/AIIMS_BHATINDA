import { Navbar } from "@/components/layout/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { PocEventsClient } from "@/components/poc/PocEventsClient";

import { PocDashboardHeader } from "@/components/poc/PocDashboardHeader";

export default async function PocDashboard() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) return null;

    // Fetch events where user is the POC for the school
    const events = await (prisma.event as any).findMany({
        where: {
            pocEmail: session.user.email || "undefined",
            status: { not: "CANCELLED" }
        },
        include: {
            eventStaff: {
                include: { user: true }
            },
            medicalRecords: {
                include: { student: true },
                orderBy: { student: { firstName: 'asc' } }
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

        const students = (event.medicalRecords as any[]).map(mr => ({
            ...mr.student,
            medicalRecord: mr,
            classSec: (mr.data as any)?.general_examination_merged?.classSection || "N/A"
        }));

        const referredStudents = students.filter(stud => {
            const data = stud.medicalRecord?.data as Record<string, any> | null;
            if (!data) return false;
            return Object.values(data).some((catData: any) => catData?.status_nor === 'R');
        });

        const observationStudents = students.filter(stud => {
            const data = stud.medicalRecord?.data as Record<string, any> | null;
            if (!data) return false;
            return Object.values(data).some((catData: any) => catData?.status_nor === 'O');
        });

        const eventHeadId = (event.formConfig as any)?.eventHeadId;
        const eventHead = (event.eventStaff as any[]).find(s => s.user.id === eventHeadId)?.user?.fullName || "Not Assigned";

        return {
            id: event.id,
            schoolName: event.schoolDetails,
            date: event.eventDate,
            location: "Main Campus",
            status: dynamicStatus,
            studentCount: event.medicalRecords.length,
            referredCount: referredStudents.length,
            observationCount: observationStudents.length,
            pocName: event.pocName,
            eventHeadName: eventHead,
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
            <Navbar role={session?.user?.role || "SCHOOL_POC"} userName={session?.user?.name || "School Representative"} />

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
                <PocDashboardHeader />

                <section>
                    <PocEventsClient events={assignedEvents} />
                </section>
            </main>
        </div>
    );
}
