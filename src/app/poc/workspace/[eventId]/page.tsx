import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { PocWorkspaceClient } from "@/components/poc/PocWorkspaceClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function PocEventWorkspace({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;
    const session = await getServerSession(authOptions);

    // Fetch event deep data
    const event = await (prisma.event as any).findUnique({
        where: { id: eventId },
        include: {
            medicalRecords: {
                include: { student: true },
                orderBy: { student: { firstName: 'asc' } }
            }
        }
    });

    if (!event) return notFound();

    const students = (event.medicalRecords as any[]).map(mr => ({
        ...mr.student,
        medicalRecord: mr,
        classSec: (mr.data as any)?.general_examination_merged?.classSection || "N/A"
    }));

    const isPOC = event.pocEmail?.toLowerCase() === session?.user?.email?.toLowerCase();
    const isAdmin = session?.user?.role === "ADMIN";

    if (!isAdmin && !isPOC) {
        return redirect("/poc/dashboard");
    }

    return (
        <PocWorkspaceClient
            eventId={event.id}
            schoolName={event.schoolDetails}
            eventDate={event.eventDate}
            location="Main Campus" // Fallback since it's not in schema currently
            students={students}
            pocEmail={event.pocEmail || "Not Assigned"}
        />
    );
}
