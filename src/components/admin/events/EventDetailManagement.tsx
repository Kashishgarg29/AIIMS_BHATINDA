"use client";

import {
  Users,
  FileText,
  Settings,
  ArrowRight,
  Activity,
  ArrowLeft,
  Search
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredStudents = event.students.filter((s: any) => {
    const q = search.toLowerCase();
    const smatches = s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.classSec.toLowerCase().includes(q);

    if (!smatches) return false;
    if (statusFilter === "ALL") return true;

    const sStatus = s.medicalRecord?.status || "PENDING";
    return sStatus === statusFilter;
  });

  const inProgressRecords = event.students.filter((s: any) => s.medicalRecord?.status === "IN_PROGRESS").length;

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
                  <Badge className={`text-white border-none text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full ${dynamicStatus.includes("ACTIVE") ? 'bg-emerald-500' : dynamicStatus === "PAST" ? 'bg-slate-400' : 'bg-blue-400'}`}>
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

              {/* Stats Block moved to Header - Universal Visibility */}
              <div className="flex items-center gap-4 bg-slate-50/50 p-2 sm:p-3 rounded-lg border border-slate-100 shadow-3xs">
                <div className="text-center px-3 md:px-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</p>
                  <p className="text-xl font-bold text-slate-900 leading-none mt-1">{totalStudents}</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="text-center px-3 md:px-4">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Done</p>
                  <p className="text-xl font-bold text-emerald-700 leading-none mt-1">{completedRecords}</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="text-center px-3 md:px-4">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Prog</p>
                  <p className="text-xl font-bold text-amber-700 leading-none mt-1">{inProgressRecords}</p>
                </div>
              </div>

              <div className="flex-shrink-0">
                {(dynamicStatus === "UPCOMING" || dynamicStatus.includes("ACTIVE")) && (
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
                      medicalStaff={allMedicalStaff}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                      <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-bold tracking-wider border-b">
                        <tr>
                          <th className="px-6 py-4 text-left pl-10">Personnel</th>
                          <th className="px-6 py-4 text-left">Department</th>
                          <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {event.eventStaff.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-20 text-center text-slate-500 border-dashed border-2 border-slate-100 m-3 rounded-xl bg-slate-50/50">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No medical staff currently assigned</p>
                            </td>
                          </tr>
                        ) : (
                          [...event.eventStaff]
                            .sort((a, b) => {
                              if (a.user.id === currentEventHeadId) return -1;
                              if (b.user.id === currentEventHeadId) return 1;
                              return 0;
                            })
                            .map(({ user }: any) => (
                              <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 pl-10">
                                  <div className="flex flex-col items-start">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-semibold text-slate-900 leading-none group-hover:text-emerald-700 transition-colors">
                                        {user.fullName}
                                      </span>
                                      {currentEventHeadId === user.id && (
                                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[7px] font-bold uppercase px-1.5 py-0 rounded-full shrink-0">
                                          Head
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium opacity-70 italic tracking-tight">{user.email}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-left">
                                  {user.department ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-white text-slate-500 uppercase border border-slate-200 shadow-3xs tracking-wider">
                                      {user.department.replace("_", " ")}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-300 font-medium italic">Not Specified</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <RemoveStaffButton eventId={event.id} userId={user.id} staffName={user.fullName} />
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="roster" className="mt-0 outline-none">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                  <div>
                  </div>
                </div>

                {/* Filter and Search Bar - Mirroring Staff Side */}
                <div className="flex flex-col sm:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                  <div className="relative w-full sm:max-w-md lg:w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search student name or class..."
                      className="pl-10 w-full bg-white shadow-sm"
                    />
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto w-full sm:w-auto self-start">
                    {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all flex-1 sm:flex-none ${statusFilter === status
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                          }`}
                      >
                        {status === 'ALL' ? 'All' : status === 'IN_PROGRESS' ? 'In Progress' : status === 'PENDING' ? 'Pending' : 'Completed'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                      <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-bold tracking-wider border-b">
                        <tr>
                          <th className="px-6 py-4 font-bold text-center">Student Name</th>
                          <th className="px-6 py-4 font-bold text-center">Class/Sec</th>
                          <th className="px-6 py-4 font-bold text-center">Gender</th>
                          <th className="px-6 py-4 font-bold text-center">Status</th>
                          <th className="px-6 py-4 font-bold text-center hidden md:table-cell">Last Updated</th>
                          <th className="px-6 py-4 font-bold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-20 text-center text-slate-500 border-dashed border-2 border-slate-100 m-3 rounded-xl bg-slate-50/50">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No matching student records found</p>
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((student: any) => {
                            const status = student.medicalRecord?.status || "PENDING";
                            const lastUpdated = student.medicalRecord?.updatedAt
                              ? new Date(student.medicalRecord.updatedAt).toLocaleDateString()
                              : "Never";

                            return (
                              <tr
                                key={student.id}
                                className="transition-colors group cursor-pointer hover:bg-slate-50/80"
                                onClick={() => router.push(`/admin/events/${event.id}/student/${student.id}`)}
                              >
                                <td className="px-6 py-4 font-medium text-slate-900 text-center">
                                  {student.firstName} {student.lastName}
                                </td>
                                <td className="px-6 py-4 text-slate-600 text-center font-semibold">{student.classSec}</td>
                                <td className="px-6 py-4 text-slate-600 text-center capitalize font-medium">{student.gender?.toLowerCase() || "—"}</td>
                                <td className="px-6 py-4 text-center">
                                  {status === 'COMPLETED' && <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">Completed</Badge>}
                                  {status === 'IN_PROGRESS' && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">In Progress</Badge>}
                                  {status === 'PENDING' && <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full opacity-60">Pending</Badge>}
                                </td>
                                <td className="px-6 py-4 text-slate-500 text-center hidden md:table-cell font-medium">{lastUpdated}</td>
                                <td className="px-6 py-4 text-center">
                                  <Link
                                    href={`/admin/events/${event.id}/student/${student.id}`}
                                    className="text-emerald-600 font-bold group-hover:text-emerald-700 transition flex items-center justify-center gap-1"
                                  >
                                    Open <Activity className="h-4 w-4" />
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
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
