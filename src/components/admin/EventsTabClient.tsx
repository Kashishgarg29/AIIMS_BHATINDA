"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarPlus, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

export function EventsTabClient({ events }: { events: EventType[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UPCOMING" | "ACTIVE (TODAY)" | "PAST">("ALL");

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Platform Events</h2>

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

        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <Card className="p-16 text-center text-slate-500 border-dashed border-2 bg-slate-50/50">
          <CalendarPlus className="h-16 w-16 mx-auto mb-6 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Events Found</h3>
          <p className="text-slate-600 max-w-sm mx-auto">We couldn&apos;t find any events matching your current filters. Try adjusting your search or clearing the status filter.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredEvents.map(event => {
            const dynamicStatus = getDynamicStatus(event.eventDate);

            return (
              <Link href={`/admin/events/${event.id}`} key={event.id} className="group">
                <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 sm:p-2 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 bg-white rounded-xl overflow-hidden relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${dynamicStatus.includes("ACTIVE") ? 'bg-emerald-500' : dynamicStatus === "PAST" ? 'bg-slate-300' : 'bg-emerald-500'}`} />

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1 pl-3 w-full">
                    <div className="min-w-[140px]">
                      <Badge className={`px-2 py-0 text-[10px] font-semibold rounded-full border ${dynamicStatus.includes("ACTIVE")
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                        : dynamicStatus === "PAST"
                          ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                        }`}>
                        {dynamicStatus}
                      </Badge>
                      <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                        {new Date(event.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {event.schoolDetails}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5 font-medium uppercase tracking-tighter text-[11px]">
                        <div className="flex items-center gap-1 text-slate-500">
                          <span className="text-emerald-600">POC:</span>
                          <span className="text-slate-700 truncate max-w-[120px]">{event.pocName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <span className="text-amber-600">Head:</span>
                          <span className="text-slate-700 truncate max-w-[120px]">{event.eventHeadName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {dynamicStatus === "UPCOMING" && (
                        <EventManagementActions
                          eventId={event.id}
                          currentDate={event.eventDate}
                          status={event.status}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-6 mt-3 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">Students:</span>
                          <span className="text-sm font-bold text-slate-700">{event._count.students}</span>
                        </div>
                      </div>

                      <div className="w-px h-4 sm:h-6 bg-slate-200 hidden sm:block"></div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] sm:text-xs text-slate-400 font-medium uppercase tracking-wider">Staff:</span>
                          <span className="text-sm font-bold text-slate-700">{event._count.eventStaff}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center justify-center p-2">
                    <div className="bg-slate-50 p-2 rounded-full group-hover:bg-emerald-50 group-hover:text-emerald-600 text-slate-300 transition-colors">
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
