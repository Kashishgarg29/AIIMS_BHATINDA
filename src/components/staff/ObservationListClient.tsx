"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Activity, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

type ObservationStudent = {
    id: string;
    name: string;
    classSec: string;
    depts: string[];
};

interface ObservationListClientProps {
    students: ObservationStudent[];
    eventId: string;
}

export function ObservationListClient({ students, eventId }: ObservationListClientProps) {
    const router = useRouter();
    const [selectedDept, setSelectedDept] = useState<string>("ALL");

    const DEPTS = ["ENT", "Dental", "Optical", "Skin", "Comm. Med"];

    const filteredStudents = students.filter((stud) => {
        if (selectedDept === "ALL") return true;
        return stud.depts.includes(selectedDept);
    });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto w-full sm:w-auto self-start">
                <button
                    onClick={() => setSelectedDept("ALL")}
                    className={`px-4 py-1.5 text-sm font-black rounded-md whitespace-nowrap transition-all flex-1 sm:flex-none uppercase tracking-widest ${selectedDept === "ALL"
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                >
                    All Sections
                </button>
                {DEPTS.map(dept => (
                    <button
                        key={dept}
                        onClick={() => setSelectedDept(dept)}
                        className={`px-4 py-1.5 text-sm font-black rounded-md whitespace-nowrap transition-all flex-1 sm:flex-none uppercase tracking-widest ${selectedDept === dept
                            ? 'bg-white text-amber-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        {dept}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                        <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium text-center">Student Name</th>
                                <th className="px-6 py-4 font-medium text-center">Class/Sec</th>
                                <th className="px-6 py-4 font-medium text-center">Observation Sections</th>
                                <th className="px-6 py-4 font-medium text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.length > 0 ? filteredStudents.map((stud) => (
                                <tr
                                    key={stud.id}
                                    onClick={() => router.push(`/staff/workspace/${eventId}/student/${stud.id}?from=observation`)}
                                    className="transition-colors group cursor-pointer hover:bg-slate-50/80 hover:shadow-sm"
                                >
                                    <td className="px-6 py-4 font-bold text-slate-900 text-center">
                                        {stud.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 font-bold text-center">
                                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest leading-none">
                                            {stud.classSec}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-wrap justify-center gap-1.5">
                                            {stud.depts.map((d) => (
                                                <span key={d} className="text-[9px] font-black bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-lg uppercase tracking-widest border border-amber-200/30">
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-emerald-600 font-bold group-hover:text-emerald-700 transition flex items-center justify-center gap-1.5 uppercase text-[10px] tracking-widest">
                                            Open <Activity className="h-3.5 w-3.5" />
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center">
                                            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-slate-50 text-slate-300 mb-4">
                                                <ArrowRight className="h-6 w-6" />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">No Observations</h3>
                                            <p className="text-[10px] text-slate-500 uppercase mt-1">No students found for this section.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
