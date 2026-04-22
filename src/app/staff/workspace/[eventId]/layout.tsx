import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StudentSidebar } from "@/components/staff/StudentSidebar";

export default async function WorkspaceLayout(props: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) return redirect("/login");

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      schoolDetails: true,
      eventDate: true,
      pocName: true,
      formConfig: true,
      eventStaff: {
        select: {
          user: {
            select: { id: true, fullName: true, email: true }
          }
        }
      },
      medicalRecords: {
        include: {
          student: true
        },
        orderBy: { student: { firstName: "asc" } }
      }
    }
  });

  if (!event) return notFound();

  // Map medicalRecords to students format for the sidebar
  const sidebarStudents = event.medicalRecords.map(mr => ({
    ...mr.student,
    medicalRecord: {
      status: mr.status,
      updatedAt: mr.updatedAt,
      data: mr.data
    }
  }));

  const isStaff = event.eventStaff.some((s: any) => s.user.id === session?.user?.id);
  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin && !isStaff) {
    return redirect("/staff/dashboard");
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Navbar role={session?.user?.role || "MEDICAL_STAFF"} userName={session?.user?.name || "Dr. Staff"} />
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <StudentSidebar
          students={sidebarStudents as any}
          eventId={eventId}
          formConfig={event.formConfig}
          currentUserId={session?.user?.id || ""}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 scroll-smooth">
          {props.children}
        </main>
      </div>
    </div>
  );
}
