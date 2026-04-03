import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StudentSidebar } from "@/components/staff/StudentSidebar";

export default async function PocWorkspaceLayout(props: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await props.params;
  const session = await getServerSession(authOptions);

  if (!session) return redirect("/login");

  const event = await (prisma.event as any).findUnique({
    where: { id: eventId },
    select: {
      id: true,
      schoolDetails: true,
      eventDate: true,
      pocName: true,
      pocEmail: true,
      formConfig: true,
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
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Navbar role={session?.user?.role || "SCHOOL_POC"} userName={session?.user?.name || "School Representative"} />
      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <StudentSidebar 
          students={event.students} 
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
