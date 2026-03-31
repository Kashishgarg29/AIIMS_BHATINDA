"use client";

import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  pocName: string;
  eventHeadName: string;
  isHead: boolean;
};

export function StaffEventsClient({ events }: { events: AssignedEventType[] }) {
  const [showHeadOnly, setShowHeadOnly] = useState(false);

  const displayedEvents = showHeadOnly ? events.filter(e => e.isHead) : events;

  return (
    <div className="space-y-6">
      <RealTimeRefresher />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-800">Assigned Events</h2>
        
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
        <div className="flex flex-col gap-3">
          {displayedEvents.map(event => (
            <Link href={`/staff/workspace/${event.id}`} key={event.id} className="group">
              <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 bg-white rounded-xl overflow-hidden relative">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${event.status === "ACTIVE" ? 'bg-emerald-500' : event.status === "PAST" ? 'bg-slate-400' : 'bg-emerald-500'}`} />

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 flex-1 pl-3 w-full">
                  <div className="min-w-[140px]">
                    <Badge className={`px-2.5 py-1 text-xs font-semibold rounded-full mb-1 border ${event.status === "ACTIVE"
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                      : event.status === "PAST"
                        ? 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                      }`}>
                      {event.status}
                    </Badge>
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      {event.date.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                      {event.schoolName}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 font-bold uppercase tracking-tighter text-[10px]">
                        <div className="flex items-center gap-1 text-slate-500">
                          <span className="text-emerald-600">POC:</span>
                          <span className="text-slate-700 truncate max-w-[120px]">{event.pocName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <span className="text-amber-600">Head:</span>
                          <span className="text-slate-700 truncate max-w-[120px]">{event.eventHeadName}</span>
                        </div>
                      </div>
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {event.location}
                    </p>
                  </div>

                  <div className="flex items-center mt-3 sm:mt-0 w-full sm:w-auto mt-2 gap-2">
                    {event.referredCount > 0 && (
                      <div onClick={e => e.stopPropagation()}>
                        <Dialog>
                          <DialogTrigger onClick={e => e.preventDefault()} className="cursor-pointer text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1.5 rounded-full border border-red-200 hover:bg-red-100 transition-colors animate-pulse">
                            {event.referredCount} Referred
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col pt-6 pb-2 px-1 rounded-xl">
                            <DialogHeader className="px-5">
                              <DialogTitle className="text-xl font-bold text-red-700">Referred Students — {event.schoolName}</DialogTitle>
                              <DialogDescription>Students with at least one Referred (R) department assessment.</DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 mt-2">
                              {event.referredStudents.map(stud => (
                                <Link href={`/staff/workspace/${event.id}/student/${stud.id}`} key={stud.id} className="block">
                                  <div className="bg-red-50 p-3 rounded-xl border border-red-100 hover:bg-red-100 flex justify-between items-center group shadow-sm">
                                    <div>
                                      <p className="font-bold text-slate-900">{stud.name}</p>
                                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-1">{stud.classSec}</p>
                                      <div className="flex flex-wrap gap-1">
                                        {stud.depts.map((d: string) => (
                                          <span key={d} className="text-[9px] font-bold bg-red-200 text-red-800 px-1.5 py-0.5 rounded-md uppercase tracking-wider">{d}</span>
                                        ))}
                                      </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-red-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                      {event.studentCount} Students
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center justify-center p-2 ml-4">
                  <div className="bg-slate-50 p-2 rounded-full group-hover:bg-emerald-50 group-hover:text-emerald-600 text-slate-300 transition-colors">
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
