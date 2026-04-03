"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

import { useSession } from "next-auth/react";
import { getStudentNavigationUrl } from "@/lib/utils/navigation";

type StudentData = {
  id: string;
  firstName: string;
  lastName: string;
  classSec: string;
  medicalRecord: { status: string; data?: any } | null;
};

interface StudentSidebarProps {
  students: StudentData[];
  eventId: string;
  formConfig?: any;
  currentUserId?: string;
}

export function StudentSidebar({ students, eventId, formConfig, currentUserId }: StudentSidebarProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const currentStudentId = params?.studentId as string;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const isReferredView = pathname.includes("/referred") || searchParams.get("from") === "referred";
  const isObservationView = pathname.includes("/observation") || searchParams.get("from") === "observation";
  const isPoc = pathname.startsWith("/poc");

  const getFilteredStudents = (flag: "R" | "O") => {
    return students.filter((stud) => {
      const data = stud.medicalRecord?.data as Record<string, any> | null;
      if (!data) return false;
      return Object.values(data).some((catData: any) => catData?.status_nor === flag);
    });
  };

  const baseList = isReferredView ? getFilteredStudents("R") : (isObservationView ? getFilteredStudents("O") : students);

  const filteredStudents = baseList.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch = (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.classSec.toLowerCase().includes(q)
    );
    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    const sStatus = s.medicalRecord?.status || "PENDING";
    return sStatus === statusFilter;
  });

  return (
    <div className="w-80 border-r bg-white flex flex-col h-[calc(100vh-64px)] sticky top-16 hidden lg:flex">
      <div className="p-4 border-b space-y-4 shadow-sm bg-white/50 backdrop-blur-sm z-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-lg text-slate-900 tracking-tight">
              {isReferredView ? "Review List" : isObservationView ? "Observation List" : "Student Roster"}
            </h2>
            <div className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredStudents.length} / {baseList.length}
            </div>
          </div>
          
          <div className="flex bg-slate-100 p-0.5 rounded-lg w-full">
            {[
              { id: "ALL", label: "All" },
              { id: "PENDING", label: "Pend" },
              { id: "IN_PROGRESS", label: "Prog" },
              { id: "COMPLETED", label: "Done" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={cn(
                  "flex-1 px-1 py-1.5 text-[10px] font-black rounded-md transition-all uppercase tracking-tight",
                  statusFilter === f.id
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isReferredView ? "Search referred..." : isObservationView ? "Search observation..." : "Search name or class..."}
            className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white focus:ring-emerald-500/20 transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
        {filteredStudents.length > 0 ? (
          <div className="divide-y divide-slate-100/50">
            {filteredStudents.map((student) => {
              const isActive = student.id === currentStudentId;
              const status = student.medicalRecord?.status || "PENDING";
              const isReferred = Object.values(student.medicalRecord?.data || {}).some((catData: any) => catData?.status_nor === "R");
              const isObservation = Object.values(student.medicalRecord?.data || {}).some((catData: any) => catData?.status_nor === "O");

              const effectiveUserId = currentUserId || (session?.user as any)?.id || "";
              const navUrl = getStudentNavigationUrl(student.id, eventId, effectiveUserId, formConfig, isAdmin || false, isReferredView, false, isPoc);
              const queryString = isReferredView ? '?from=referred' : isObservationView ? '?from=observation' : '';

              return (
                <Link
                  key={student.id}
                  href={`${navUrl}${queryString}`}
                  className={cn(
                    "flex flex-col px-4 py-3.5 transition-all relative group",
                    isActive 
                      ? isReferredView ? "bg-red-50/80 border-r-4 border-red-500 cursor-default" : isObservationView ? "bg-amber-50/80 border-r-4 border-amber-500 cursor-default" : "bg-emerald-50/80 border-r-4 border-emerald-500 cursor-default" 
                      : (isReferred && !isReferredView && !isObservationView) || (isObservation && !isObservationView && !isReferredView) ? "bg-slate-50/10 hover:bg-slate-50 cursor-pointer" : "hover:bg-slate-50 bg-transparent cursor-pointer"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn(
                      "font-bold text-sm truncate pr-2 tracking-tight",
                      isActive 
                        ? isReferredView ? "text-red-700" : isObservationView ? "text-amber-700" : "text-emerald-700"
                        : "text-slate-900 group-hover:text-emerald-600"
                    )}>
                      {student.firstName} {student.lastName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[9px] px-2 py-0 uppercase font-black tracking-wider shrink-0 transition-all",
                          status === "COMPLETED" ? "bg-green-100 text-green-700 border-green-200 shadow-[0_0_0_1px_rgba(34,197,94,0.1)]" :
                          status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700 border-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,0.1)]" :
                          "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {status === "IN_PROGRESS" ? "In Prog" : status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center text-[11px] font-bold">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded transition-colors uppercase tracking-tight",
                      isActive 
                        ? isReferredView ? "bg-red-100 text-red-700" : isObservationView ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600"
                    )}>
                      Class {student.classSec}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-2 opacity-50">
            <Search className="h-8 w-8 text-slate-300" />
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No Matches</p>
          </div>
        )}
      </div>
    </div>
  );
}
