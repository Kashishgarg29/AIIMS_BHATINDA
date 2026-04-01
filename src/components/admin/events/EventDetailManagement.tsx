"use client";

import {
  Users,
  FileText,
  Settings,
  ArrowRight,
  Activity,
  ArrowLeft
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AssignStaffButton } from "@/components/admin/directory/AssignStaffButton";
import { RemoveStaffButton } from "@/components/admin/directory/RemoveStaffButton";
import { SetEventHeadButton } from "@/components/admin/directory/SetEventHeadButton";
import { EventFormConfigBuilder } from "@/components/admin/events/EventFormConfigBuilder";
import { EventManagementActions } from "@/components/admin/events/EventManagementActions";

interface EventDetailManagementProps {
  event: any;
  allMedicalStaff: any[];
  assignedStaffIds: string[];
  currentEventHeadId?: string;
  totalStudents: number;
  completedRecords: number;
  progressPercent: number;
  dynamicStatus: string;
}

export function EventDetailManagement({
  event,
  allMedicalStaff,
  assignedStaffIds,
  currentEventHeadId,
  totalStudents,
  completedRecords,
  progressPercent,
  dynamicStatus
}: EventDetailManagementProps) {
  return (
    <Tabs defaultValue="roster" orientation="vertical" className="flex-1 flex flex-col md:flex-row overflow-hidden text-slate-900 font-sans">
      {/* Sidebar - IDentical to Dashboard */}
      <aside className="w-full md:w-64 bg-white border-r flex-shrink-0">
        <div className="py-4 md:py-6 h-full flex flex-col pr-4 md:pr-0">
          <div className="px-6 mb-4 hidden md:block">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Management</h2>
          </div>
          <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 justify-start items-stretch shrink-0 space-y-1">
            <TabsTrigger value="staff" className="w-full justify-start px-6 py-2.5 text-sm md:text-base font-medium data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 data-[state=active]:font-semibold flex gap-3 rounded-full md:rounded-l-none md:rounded-r-full transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-0">
              <Users className="h-5 w-5 shrink-0" /> <span className="truncate">Assign Staff</span>
            </TabsTrigger>
            <TabsTrigger value="roster" className="w-full justify-start px-6 py-2.5 text-sm md:text-base font-medium data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 data-[state=active]:font-semibold flex gap-3 rounded-full md:rounded-l-none md:rounded-r-full transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-0">
              <FileText className="h-5 w-5 shrink-0" /> <span className="truncate">Student Roster</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="w-full justify-start px-6 py-2.5 text-sm md:text-base font-medium data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 data-[state=active]:font-semibold flex gap-3 rounded-full md:rounded-l-none md:rounded-r-full transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-0">
              <Settings className="h-5 w-5 shrink-0" /> <span className="truncate">Form Setting</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </aside>

      {/* Main Content Area - DASHBOARD LIST FORMAT */}
      <main className="flex-1 w-full overflow-y-auto bg-slate-50/50">
        <div className="max-w-[1240px] mx-auto p-4 md:p-6 space-y-3 animate-in fade-in duration-500">

          {/* Breadcrumb - Super Simple */}
          <div className="flex items-center">
            <Link href="/admin/dashboard" className="group flex items-center gap-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full border border-slate-200 bg-white shadow-sm group-hover:border-emerald-500 group-hover:bg-emerald-50 transition-all">
                <ArrowLeft className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-600" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700 uppercase tracking-widest transition-all">All Events</span>
            </Link>
          </div>

          {/* COMPACT DASHBOARD HEADER */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">{event.schoolDetails}</h1>
                  <Badge className="bg-emerald-500 text-white border-none text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full">
                    {dynamicStatus}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-70">Date:</span>
                    <span className="text-xs font-semibold text-slate-600">{new Date(event.eventDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-70">POC:</span>
                    <span className="text-xs font-semibold text-slate-600 truncate">{event.pocName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-70">Phone:</span>
                    <span className="text-xs font-semibold text-slate-600 truncate">{event.pocPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-70">Email:</span>
                    <span className="text-xs font-semibold text-slate-600 truncate">{event.pocEmail}</span>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0">
                {dynamicStatus === "UPCOMING" && (
                  <div className="scale-90 origin-right">
                    <EventManagementActions
                      eventId={event.id}
                      currentDate={event.eventDate}
                      status={event.status}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TAB CONTENTS - DASHBOARD LIST FORMAT */}
          <div className="pb-20">
            <TabsContent value="staff" className="mt-0 outline-none">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff Assignment</h2>
                  </div>
                  <div className="flex gap-2">
                    <AssignStaffButton
                      eventId={event.id}
                      availableStaff={allMedicalStaff}
                      assignedStaffIds={assignedStaffIds}
                    />
                    <SetEventHeadButton
                      eventId={event.id}
                      assignedStaff={event.eventStaff.map((s: any) => s.user)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  {event.eventStaff.length === 0 ? (
                    <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No staff assigned</p>
                    </div>
                  ) : (
                    event.eventStaff.map(({ user }: any) => (
                      <div key={user.id} className="flex items-center justify-between p-2 px-4 bg-white border border-slate-100 rounded-lg hover:border-emerald-500 transition-all group">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{user.fullName}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-40">|</span>
                          <span className="text-[10px] font-bold text-slate-400 truncate opacity-80">{user.email}</span>
                          {currentEventHeadId === user.id && (
                            <Badge className="bg-amber-400 text-white border-none text-[7px] font-semibold uppercase px-1.5 py-0 rounded-md">Head</Badge>
                          )}
                        </div>
                        <RemoveStaffButton eventId={event.id} userId={user.id} staffName={user.fullName} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="roster" className="mt-0 outline-none">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Health Roster</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live records management</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{progressPercent}% DONE</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full bg-white border-slate-200">
                      {totalStudents} records
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {event.students.length === 0 ? (
                    <div className="py-20 text-center bg-white border-2 border-dashed border-slate-200 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No students registered</p>
                    </div>
                  ) : (
                    event.students.map((student: any) => {
                      const recordStatus = student.medicalRecord?.status || "PENDING";
                      return (
                        <div key={student.id} className="flex flex-col md:flex-row md:items-center justify-between p-2 px-4 bg-white border border-slate-100 rounded-lg hover:border-emerald-500 transition-all group gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{student.firstName} {student.lastName}</span>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class: {student.classSec}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 justify-between md:justify-end">
                            <Badge className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border transition-all ${recordStatus === "COMPLETED" ? "bg-emerald-500 text-white border-emerald-400 shadow-sm" :
                              recordStatus === "IN_PROGRESS" ? "bg-amber-100 text-amber-700 border-amber-200 shadow-sm" :
                                "bg-slate-100 text-slate-500 border-slate-200 shadow-none grayscale opacity-60"
                              }`}>
                              {recordStatus.replace('_', ' ')}
                            </Badge>

                            <Link
                              href={`/admin/events/${event.id}/student/${student.id}`}
                              className="inline-flex items-center bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm"
                            >
                              Open
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="config" className="mt-0 outline-none">
              <div className="space-y-4">
                <div className="mb-4">
                </div>
                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                  <EventFormConfigBuilder
                    eventId={event.id}
                    initialConfig={event.formConfig || {}}
                  />
                </div>
              </div>
            </TabsContent>
          </div>
        </div>
      </main>
    </Tabs>
  );
}
