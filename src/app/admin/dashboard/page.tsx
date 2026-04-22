import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, CalendarPlus, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPendingRequests, getMedicalStaff } from "@/lib/actions/admin-actions";
import { getAdminAnalyticsData } from "@/lib/actions/analytics-actions";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

import { RequestsTabClient } from "@/components/admin/RequestsTabClient";
import { EventsTabClient } from "@/components/admin/EventsTabClient";
import { CreateEventButton } from "@/components/admin/CreateEventButton";
import { StaffDirectoryClient } from "@/components/admin/directory/StaffDirectoryClient";
import { RealTimeRefresher } from "@/components/shared/RealTimeRefresher";
import { AdminChangePasswordButton } from "@/components/admin/AdminChangePasswordButton";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";
import { BarChart3 } from "lucide-react";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  // Fetch real data from PostgreSQL
  const pendingRequests = await getPendingRequests();
  const medicalStaff = await getMedicalStaff();
  const analyticsResult = await getAdminAnalyticsData();

  // Fetch active events for the All Events tab
  const allEvents = await prisma.event.findMany({
    where: {
      status: {
        not: "CANCELLED" as any
      }
    },
    orderBy: { eventDate: "asc" },
    include: {
      eventStaff: {
        include: { user: true }
      },
      medicalRecords: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      },
      _count: {
        select: { eventStaff: true, medicalRecords: true }
      }
    }
  });

  const DEPT_MAP: Record<string, string> = {
    ent_examination: "ENT Examination",
    dental_examination: "Dental Examination",
    optical_examination: "Ophthalmology Examination",
    skin_examination: "Dermatology Examination",
    system_wise_examination: "Systemic Examination",
    general_examination_merged: "General"
  };

  // Map and Enrich
  const enrichedEvents = allEvents.map((event: any) => {
    const eventHeadId = (event.formConfig as any)?.eventHeadId;
    const eventHead = (event.eventStaff as any[]).find((s: any) => s.user.id === eventHeadId)?.user?.fullName || "Not Assigned";

    const referredCount = (event.medicalRecords as any[]).filter((mr: any) => {
      const data = mr.data as Record<string, any> | null;
      if (!data) return false;
      return Object.values(data).some((catData: any) => catData?.status_nor === 'R');
    }).length;

    const observationCount = (event.medicalRecords as any[]).filter((mr: any) => {
      const data = mr.data as Record<string, any> | null;
      if (!data) return false;
      return Object.values(data).some((catData: any) => catData?.status_nor === 'O');
    }).length;

    return {
      ...event,
      studentsCount: event._count.medicalRecords,
      pocName: event.pocName,
      eventHeadName: eventHead,
      referredCount,
      observationCount
    };
  });

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      <RealTimeRefresher />
      <Navbar role={session?.user?.role || "ADMIN"} userName={session?.user?.name || "Admin User"} />

      <Tabs defaultValue="analytics" orientation="vertical" className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Full Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r flex-shrink-0">
          <div className="py-4 md:py-6 h-full flex flex-col pr-4 md:pr-0">
            <div className="px-6 mb-4 hidden md:block">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin Portal</h2>
            </div>
            <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 justify-start items-stretch shrink-0 space-y-1">
              <TabsTrigger value="analytics" className="w-full justify-start px-6 py-2.5 text-sm md:text-base font-medium data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 data-[state=active]:font-semibold flex gap-3 rounded-full md:rounded-l-none md:rounded-r-full transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-0">
                <BarChart3 className="h-5 w-5 shrink-0" /> <span className="truncate">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="requests" className="w-full justify-start px-6 py-2.5 text-sm md:text-base font-medium data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 data-[state=active]:font-semibold flex gap-3 rounded-full md:rounded-l-none md:rounded-r-full transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-0">
                <FileText className="h-5 w-5 shrink-0" /> <span className="truncate">Camp Requests</span>
                {pendingRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-auto rounded-full px-1.5 h-5 bg-emerald-600 hover:bg-emerald-700 text-white border-0 flex-shrink-0">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="events" className="w-full justify-start px-6 py-2.5 text-sm md:text-base font-medium data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 data-[state=active]:font-semibold flex gap-3 rounded-full md:rounded-l-none md:rounded-r-full transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-0">
                <CalendarPlus className="h-5 w-5 shrink-0" /> <span className="truncate">All Events</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="w-full justify-start px-6 py-2.5 text-sm md:text-base font-medium data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 data-[state=active]:font-semibold flex gap-3 rounded-full md:rounded-l-none md:rounded-r-full transition-all text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-0">
                <Users className="h-5 w-5 shrink-0" /> <span className="truncate">Directory</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-auto px-6 pt-4 border-t border-slate-100 hidden md:block">
              <AdminChangePasswordButton />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="w-full pb-12">
              <TabsContent value="analytics" className="mt-0 outline-none">
                {analyticsResult.success && analyticsResult.data ? (
                  <AnalyticsDashboard data={analyticsResult.data} />
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl shadow-sm">
                    <p className="text-slate-500">Failed to load analytics data.</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="requests" className="mt-0 space-y-4 outline-none">
                <RequestsTabClient
                  requests={pendingRequests}
                  medicalStaff={medicalStaff}
                />
              </TabsContent>

              <TabsContent value="events" className="mt-0 outline-none">
                <EventsTabClient
                  events={enrichedEvents as any}
                  actionButton={<CreateEventButton medicalStaff={medicalStaff} />}
                />
              </TabsContent>

              <TabsContent value="users" className="mt-0 outline-none">
                <StaffDirectoryClient
                  medicalStaff={medicalStaff as any}
                />
              </TabsContent>
            </div>
          </div>
        </main>
      </Tabs>
    </div>
  );
}
