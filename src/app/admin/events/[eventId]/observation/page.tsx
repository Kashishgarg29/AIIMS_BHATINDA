import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ObservationListClient } from "@/components/staff/ObservationListClient";

export default async function AdminObservationStudentsPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== "ADMIN") {
        return redirect("/");
    }

    const event = await (prisma.event as any).findUnique({
        where: { id: eventId },
        include: {
            medicalRecords: {
                include: {
                    student: true
                },
                orderBy: { student: { firstName: "asc" } }
            }
        }
    });

    if (!event) return notFound();

    const DEPT_MAP: Record<string, string> = {
        ent_examination: "ENT Examination",
        dental_examination: "Dental Examination",
        optical_examination: "Ophthalmology Examination",
        skin_examination: "Dermatology Examination",
        system_wise_examination: "Systemic Examination",
        general_examination_merged: "General"
    };

    const observationStudents = (event.medicalRecords as any[]).filter(mr => {
        const data = mr.data as Record<string, any> | null;
        if (!data) return false;
        return Object.values(data).some((catData: any) => catData?.status_nor === 'O');
    }).map((mr: any) => {
        const data = mr.data as Record<string, any>;
        const depts = Object.entries(data || {})
            .filter(([, catData]: any) => catData?.status_nor === 'O')
            .map(([key]) => DEPT_MAP[key] || key);
        return {
            id: mr.student.id,
            name: `${mr.student.firstName} ${mr.student.lastName}`,
            classSec: data?.general_examination_merged?.classSection || "N/A",
            depts,
        };
    });

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50">
            <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
                {/* Sticky Header Section */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm pt-2 pb-6 mb-4 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-3 mb-2">
                        <Link href={`/admin/dashboard`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 transition-all shadow-sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600/60">Admin Portal</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Observation Students</h1>
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase font-bold px-3">
                                    {observationStudents.length} Students
                                </Badge>
                            </div>
                            <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-tight">
                                {event.schoolDetails} — {new Date(event.eventDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </p>
                        </div>
                    </div>
                </div>

                <ObservationListClient students={observationStudents} eventId={eventId} />
            </main>
        </div>
    );
}
