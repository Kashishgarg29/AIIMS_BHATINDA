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
            students: {
                include: {
                    medicalRecord: {
                        select: { status: true, updatedAt: true, data: true }
                    }
                },
                orderBy: { firstName: "asc" }
            }
        }
    });

    if (!event) return notFound();

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
            students={event.students}
            pocEmail={event.pocEmail || "Not Assigned"}
        />
    );
}
