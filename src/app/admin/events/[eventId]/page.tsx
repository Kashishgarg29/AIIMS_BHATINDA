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

  // Get all Medical Staff for assignment modal
  const allMedicalStaff = await prisma.user.findMany({
    where: {
      role: "MEDICAL_STAFF",
      isActive: true
    },
    select: { id: true, fullName: true, email: true },
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar role={session?.user?.role || "ADMIN"} userName={session?.user?.name || "Admin"} />

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-6 space-y-4">
          <Link href="/admin/dashboard" className="text-base font-medium text-slate-500 hover:text-slate-700 flex items-center">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex gap-4 items-center mb-2">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">{event.schoolDetails}</h1>
                <Badge variant={dynamicStatus.includes("ACTIVE") ? "default" : dynamicStatus === "PAST" ? "secondary" : "outline"} className="text-sm px-3 py-1">
                  {dynamicStatus}
                </Badge>
                {dynamicStatus === "UPCOMING" && (
                  <EventManagementActions
                    eventId={event.id}
                    currentDate={event.eventDate}
                    status={event.status}
                  />
                )}
              </div>
              <p className="text-lg text-slate-500 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-slate-400" /> {new Date(event.eventDate).toLocaleDateString()}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex gap-4">
              <div className="bg-white rounded-lg shadow-sm border px-6 py-4 min-w-[150px]">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Total Assigned</p>
                <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border px-6 py-4 min-w-[160px]">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Completed</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-green-600">{completedRecords}</p>
                  <span className="text-sm text-slate-400 font-medium">({progressPercent}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation for Event Sections */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6 bg-white border shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-100">Event Overview</TabsTrigger>
            <TabsTrigger value="formConfig" className="data-[state=active]:bg-slate-100">Dynamic Form Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Sidebar: Staff Details */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-emerald-600" />
                        Assigned Medical Staff
                      </CardTitle>
                      <div className="flex flex-col gap-2 items-end">
                        <AssignStaffButton
                          eventId={event.id}
                          availableStaff={allMedicalStaff}
                          assignedStaffIds={assignedStaffIds}
                        />
                        <SetEventHeadButton
                          eventId={event.id}
                          assignedStaff={event.eventStaff.map(s => s.user)}
                        />
                      </div>
                    </div>
                    <CardDescription className="mt-2 text-sm">
                      <span>{event.eventStaff.length} members assigned</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {event.eventStaff.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No staff assigned.</p>
                    ) : (
                      <ul className="space-y-3">
                        {event.eventStaff.map(({ user }) => (
                          <li key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-md group border border-transparent hover:border-slate-100 transition-colors">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-medium text-slate-900">{user.fullName}</span>
                                {currentEventHeadId === user.id && (
                                  <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] py-0 h-5">Event Head</Badge>
                                )}
                              </div>
                              <span className="text-sm text-slate-500">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <RemoveStaffButton
                                eventId={event.id}
                                userId={user.id}
                                staffName={user.fullName}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Point of Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Name</span>
                        <span className="text-base text-slate-900">{event.pocName}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Phone</span>
                        <span className="text-base text-slate-900">{event.pocPhone}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email</span>
                        <span className="text-base text-slate-900">{event.pocEmail}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Area: Student Roster Grid */}
              <div className="lg:col-span-3">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-slate-400" /> Student Roster
                </h2>

                {event.students.length === 0 ? (
                  <div className="bg-white border-2 border-dashed rounded-lg p-16 text-center text-slate-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg">No students have been registered for this event yet.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <table className="w-full text-base text-center">
                      <thead className="bg-slate-50 text-slate-600 border-b">
                        <tr>
                          <th className="px-6 py-4 font-semibold text-center">Student Name</th>
                          <th className="px-6 py-4 font-semibold text-center">Class / Sec</th>
                          <th className="px-6 py-4 font-semibold text-center">Status</th>
                          <th className="px-6 py-4 font-semibold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {event.students.map((student) => {
                          const recordStatus = student.medicalRecord?.status || "PENDING";
                          return (
                            <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-6 font-medium text-slate-900 text-base text-center">
                                {student.firstName} {student.lastName}
                              </td>
                              <td className="px-6 py-6 text-slate-500 text-center">{student.classSec}</td>
                              <td className="px-6 py-6 text-center">
                                <Badge
                                  variant="outline"
                                  className={
                                    recordStatus === "COMPLETED" ? "bg-green-50 text-green-700 border-green-200 px-3 py-1" :
                                      recordStatus === "IN_PROGRESS" ? "bg-amber-50 text-amber-700 border-amber-200 px-3 py-1" :
                                        "bg-slate-100 text-slate-600 border-slate-200 px-3 py-1"
                                  }
                                >
                                  {recordStatus.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="px-6 py-6 text-center">
                                <Link href={`/admin/events/${event.id}/student/${student.id}`}>
                                  <span className="text-emerald-600 hover:text-emerald-800 font-semibold flex items-center justify-center gap-1">
                                    View Logs <ArrowRight className="h-4 w-4" />
                                  </span>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="formConfig">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <EventFormConfigBuilder
                eventId={event.id}
                initialConfig={((event as any).formConfig as Record<string, string[]>) || {}}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
