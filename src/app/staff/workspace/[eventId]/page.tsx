import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { WorkspaceClient } from "@/components/staff/WorkspaceClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function EventWorkspace({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const session = await getServerSession(authOptions);

  // Fetch event deep data
  const event = await (prisma.event as any).findUnique({
    where: { id: eventId },
    include: {
      eventStaff: {
        select: {
          user: {
            select: { id: true, fullName: true, email: true, department: true }
          }
        }
      },
      students: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          classSec: true,
          gender: true,
          age: true,
          medicalRecord: {
            select: { status: true, updatedAt: true, data: true }
          }
        },
        orderBy: { firstName: "asc" }
      }
    }
  });

  if (!event) return notFound();

  // Resolve event head info
  const eventHeadId = (event.formConfig as any)?.eventHeadId;
  const eventHeadUser = event.eventStaff.find((s: any) => s.user.id === eventHeadId)?.user;

  return (
    <div className="flex flex-col">
      <WorkspaceClient
        eventId={event.id}
        schoolName={event.schoolDetails}
        eventDate={event.eventDate}
        location="Main Campus"
        students={event.students}
        eventStaff={event.eventStaff.map((s: any) => s.user)}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formConfig={event.formConfig as any}
        currentUserId={session?.user?.id || ""}
        pocName={event.pocName}
        pocPhone={event.pocPhone}
        pocEmail={event.pocEmail}
        eventHeadName={eventHeadUser?.fullName || null}
        eventHeadDepartment={eventHeadUser?.department || null}
      />
    </div>
  );
}
