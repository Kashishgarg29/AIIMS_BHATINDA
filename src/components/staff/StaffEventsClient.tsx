"use client";

import { CalendarDays, ArrowRight, Activity } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RealTimeRefresher } from "@/components/shared/RealTimeRefresher";

type AssignedEventType = {
  id: string;
  schoolName: string;
  date: Date;
  location: string;
  status: string;
  studentCount: number;
  referredCount: number;
  referredStudents: { id: string; name: string; classSec: string; depts: string[] }[];
  observationCount: number;
  observationStudents: { id: string; name: string; classSec: string; depts: string[] }[];
  pocName: string;
  eventHeadName: string;
  isHead: boolean;
};

export function StaffEventsClient({
  events,
  userRole
}: {
  events: AssignedEventType[],
  userRole?: string
}) {
  const router = useRouter();
  const [showHeadOnly, setShowHeadOnly] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);

  const displayedEvents = showHeadOnly ? events.filter(e => e.isHead) : events;

  const currentEvents = displayedEvents.filter(e => e.status !== "PAST");
  const pastEvents = displayedEvents.filter(e => e.status === "PAST");

  const renderTable = (eventsList: AssignedEventType[]) => (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b">
            <tr>
              <th className="px-6 py-4 font-medium text-left">School / Event</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">POC</th>
              <th className="px-6 py-4 font-medium">Event Head</th>
              <th className="px-6 py-4 font-medium">Flags</th>
              <th className="px-6 py-4 font-medium">Students</th>
              <th className="px-6 py-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {eventsList.map(event => (
              <tr
                key={event.id}
                onClick={() => router.push(`/staff/workspace/${event.id}`)}
                className="transition-colors group cursor-pointer hover:bg-slate-50/80 hover:shadow-sm"
              >
                {/* School Name */}
                <td className="px-6 py-4 font-medium text-slate-900 text-left group-hover:text-emerald-700 transition-colors">
                  {event.schoolName}
                </td>

                {/* Date */}
                <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                  {new Date(event.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <Badge className={`px-2 py-0 text-[10px] font-semibold rounded-full border ${
                    event.status === "ACTIVE"
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : event.status === "PAST"
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {event.status}
                  </Badge>
                </td>

                {/* POC */}
                <td className="px-6 py-4 text-slate-600 max-w-[140px]">
                  <span className="truncate block">{event.pocName || "—"}</span>
                </td>

                {/* Event Head */}
                <td className="px-6 py-4 text-slate-600 max-w-[140px]">
                  <span className="truncate block">{event.eventHeadName || "—"}</span>
                </td>

                {/* Flags */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {event.referredCount > 0 && (
                      <span
                        onClick={e => { e.stopPropagation(); router.push(`/staff/workspace/${event.id}/referred`); }}
                        className="inline-flex items-center text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        {event.referredCount} Referred
                      </span>
                    )}
                    {event.observationCount > 0 && (
                      <span
                        onClick={e => { e.stopPropagation(); router.push(`/staff/workspace/${event.id}/observation`); }}
                        className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        {event.observationCount} Observe
                      </span>
                    )}
                    {event.referredCount === 0 && event.observationCount === 0 && (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </div>
                </td>

                {/* Student Count */}
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-slate-700">{event.studentCount}</span>
                </td>

                {/* Action */}
                <td className="px-6 py-4 text-center">
                  <span className="text-emerald-600 font-bold group-hover:text-emerald-700 transition flex items-center justify-center gap-1">
                    Open <Activity className="h-4 w-4" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <RealTimeRefresher />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Assigned Events</h2>

        {userRole !== "SCHOOL_POC" && (
          <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto w-full sm:w-auto mt-2 sm:mt-0">
            <button
              onClick={() => setShowHeadOnly(false)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all flex-1 sm:flex-none ${!showHeadOnly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              All Events
            </button>
            <button
              onClick={() => setShowHeadOnly(true)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all flex-1 sm:flex-none ${showHeadOnly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            >
              Assigned as Head
            </button>
          </div>
        )}
      </div>

      {displayedEvents.length === 0 ? (
        <div className="col-span-full text-center py-16 bg-white rounded-xl border border-dashed text-slate-500 bg-slate-50/50">
          <CalendarDays className="h-16 w-16 mx-auto mb-6 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Events Found</h3>
          <p className="text-slate-600 max-w-sm mx-auto">
            {showHeadOnly
              ? "You are not assigned as the head for any events."
              : "You currently have no health camp events assigned to you."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {currentEvents.length > 0 && renderTable(currentEvents)}
          {currentEvents.length === 0 && pastEvents.length > 0 && (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed text-slate-500">
              <p>No active or upcoming events found. Viewing past events below.</p>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div className="mt-10 w-full">
              <br />
              <div className="flex items-center gap-4 w-full mb-6">
                <div className="flex-1 h-px bg-slate-200" />
                <button
                  type="button"
                  onClick={() => setShowPastEvents(!showPastEvents)}
                  className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-6 py-2 rounded-full border border-slate-200 transition-all shadow-sm bg-white"
                >
                  <span>{showPastEvents ? "▼" : "▶"}</span>
                  <span>Past Events ({pastEvents.length})</span>
                </button>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {showPastEvents && (
                <div className="mt-6 w-full flex flex-col gap-2">
                  {renderTable(pastEvents)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
