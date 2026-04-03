"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarPlus, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { EventManagementActions } from "@/components/admin/events/EventManagementActions";

type EventType = {
  id: string;
  schoolDetails: string;
  eventDate: Date;
  status: string;
  pocName: string;
  eventHeadName: string;
  _count: { eventStaff: number; students: number; }
};

export function EventsTabClient({ events, actionButton }: { events: EventType[], actionButton?: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UPCOMING" | "ACTIVE (TODAY)" | "PAST">("ALL");
  const [showPastEvents, setShowPastEvents] = useState(false);
  const router = useRouter();

  const getDynamicStatus = (date: Date) => {
    const evDate = new Date(date);
    evDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (evDate.getTime() === today.getTime()) {
      return "ACTIVE (TODAY)";
    } else if (evDate < today) {
      return "PAST";
    }
    return "UPCOMING";
  };

  // Filter and Sort logic
  const filteredEvents = events.filter(event => {
    const evDate = new Date(event.eventDate);
    evDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dynamicStatus = "UPCOMING";
    if (evDate.getTime() === today.getTime()) {
      dynamicStatus = "ACTIVE (TODAY)";
    } else if (evDate < today) {
      dynamicStatus = "PAST";
    }

    // Status matching
    if (statusFilter !== "ALL" && dynamicStatus !== statusFilter) return false;

    // Search matching
    const srch = searchQuery.toLowerCase();
    if (srch && !event.schoolDetails.toLowerCase().includes(srch)) return false;

    return true;
  }).sort((a, b) => {
    const statusA = getDynamicStatus(a.eventDate);
    const statusB = getDynamicStatus(b.eventDate);

    const priority = { "ACTIVE (TODAY)": 0, "UPCOMING": 1, "PAST": 2 };

    // First by status priority
    if (priority[statusA as keyof typeof priority] !== priority[statusB as keyof typeof priority]) {
      return priority[statusA as keyof typeof priority] - priority[statusB as keyof typeof priority];
    }

    // Then by date within the same status
    if (statusA === "PAST") {
      return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(); // Newest past first
    }
    return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(); // Closest upcoming first
  });

  const activeAndUpcomingEvents = filteredEvents.filter(e => getDynamicStatus(e.eventDate) !== "PAST");
  const pastEvents = filteredEvents.filter(e => getDynamicStatus(e.eventDate) === "PAST");

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">All Events</h2>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search schools..."
              className="pl-10 w-full sm:w-64 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-px h-8 bg-slate-200 hidden sm:block mx-1"></div>

          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto justify-start">
            {["ALL", "ACTIVE (TODAY)", "UPCOMING", "PAST"].map(f => (
              <Button
                key={f}
                variant={statusFilter === f ? "default" : "outline"}
                size="sm"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => setStatusFilter(f as any)}
                className={`whitespace-nowrap transition-all rounded-full ${statusFilter === f ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                {f === "ACTIVE (TODAY)" ? "Active" : f.charAt(0) + f.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>

          {actionButton && (
            <>
              <div className="w-px h-8 bg-slate-200 hidden sm:block mx-1"></div>
              <div className="w-full sm:w-auto flex justify-start lg:justify-end shrink-0">
                {actionButton}
              </div>
            </>
          )}

        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="p-16 text-center text-slate-500 border-dashed border-2 bg-slate-50/50">
          <CalendarPlus className="h-16 w-16 mx-auto mb-6 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Events Found</h3>
          <p className="text-slate-600 max-w-sm mx-auto">We couldn&apos;t find any events matching your current filters. Try adjusting your search or clearing the status filter.</p>
        </Card>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-bold tracking-wider border-b">
                <tr>
                  <th className="px-6 py-4 font-bold border-r border-slate-100 last:border-r-0">School / Event</th>
                  <th className="px-6 py-4 font-bold border-r border-slate-100 last:border-r-0">Date</th>
                  <th className="px-6 py-4 font-bold text-center border-r border-slate-100 last:border-r-0">Status</th>
                  <th className="px-6 py-4 font-bold border-r border-slate-100 last:border-r-0">POC & Event Head</th>
                  <th className="px-4 py-4 font-bold text-center border-r border-slate-100 last:border-r-0">Students</th>
                  <th className="px-4 py-4 font-bold text-center border-r border-slate-100 last:border-r-0">Staff</th>
                  <th className="px-6 py-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeAndUpcomingEvents.map(event => {
                  const dynamicStatus = getDynamicStatus(event.eventDate);

                  return (
                    <tr
                      key={event.id}
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="block">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors block leading-tight">
                            {event.schoolDetails}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-600">
                          {new Date(event.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${dynamicStatus.includes("ACTIVE")
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-blue-400 text-white border-blue-500'
                          }`}>
                          {dynamicStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-emerald-600 font-extrabold uppercase tracking-tighter w-8">POC:</span>
                            <span className="text-slate-700 font-bold truncate max-w-[120px]">{event.pocName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-amber-600 font-extrabold uppercase tracking-tighter w-8">Head:</span>
                            <span className="text-slate-700 font-bold truncate max-w-[120px]">{event.eventHeadName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-extrabold text-slate-700">{event._count.students}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-extrabold text-slate-700">{event._count.eventStaff}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {(dynamicStatus === "UPCOMING" || dynamicStatus.includes("ACTIVE")) && (
                            <EventManagementActions
                              eventId={event.id}
                              currentDate={event.eventDate}
                              status={event.status}
                            />
                          )}
                          <div className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* Past Events Separator Row */}
                {pastEvents.length > 0 && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={7} className="px-6 py-3">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-slate-200" />
                        <button
                          type="button"
                          onClick={() => setShowPastEvents(!showPastEvents)}
                          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-white px-4 py-1.5 rounded-full border border-slate-200 transition-all bg-white shadow-xs"
                        >
                          <span>{showPastEvents ? "▼" : "▶"}</span>
                          <span>Past Events ({pastEvents.length})</span>
                        </button>
                        <div className="flex-1 h-px bg-slate-200" />
                      </div>
                    </td>
                  </tr>
                )}

                {/* Past Event Rows */}
                {showPastEvents && pastEvents.map(event => {
                  const dynamicStatus = getDynamicStatus(event.eventDate);

                  return (
                    <tr
                      key={event.id}
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                      className="hover:bg-slate-50/50 transition-colors group opacity-85 grayscale-[0.2] cursor-pointer"
                    >
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="block">
                          <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors block leading-tight">
                            {event.schoolDetails}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-500">
                          {new Date(event.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge className="px-2 py-0.5 text-[9px] font-bold rounded-full border bg-slate-100 text-slate-600 border-slate-200">
                          {dynamicStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 opacity-70">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-500 font-extrabold uppercase tracking-tighter w-8">POC:</span>
                            <span className="text-slate-600 font-bold truncate max-w-[120px]">{event.pocName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-500 font-extrabold uppercase tracking-tighter w-8">Head:</span>
                            <span className="text-slate-600 font-bold truncate max-w-[120px]">{event.eventHeadName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-bold text-slate-600">{event._count.students}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-bold text-slate-600">{event._count.eventStaff}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <div className="p-1 px-3 text-[10px] font-extrabold text-slate-400 hover:text-emerald-600 border border-slate-100 hover:border-emerald-100 rounded-md transition-all bg-white">
                            View Details
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
