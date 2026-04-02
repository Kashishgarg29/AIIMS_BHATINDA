import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ObservationListClient } from "@/components/staff/ObservationListClient";

export default async function ObservationStudentsPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = await params;
    const session = await getServerSession(authOptions);

    const event = await (prisma.event as any).findUnique({
        where: { id: eventId },
        include: {
            eventStaff: {
                select: {
                    user: {
                        select: { id: true }
                    }
                }
            },
            students: {
                include: {
                    medicalRecord: {
                        select: { status: true, data: true }
                    }
                },
                orderBy: { firstName: "asc" }
            }
        }
    });

    if (!event) return notFound();

    const isStaff = event.eventStaff.some((s: any) => s.user.id === session?.user?.id);
    const isPOC = event.pocEmail?.toLowerCase() === session?.user?.email?.toLowerCase();
    const isAdmin = session?.user?.role === "ADMIN";

    if (!isAdmin && !isStaff && !isPOC) {
        return redirect("/staff/dashboard");
    }

    const DEPT_MAP: Record<string, string> = {
        ent: "ENT", dental: "Dental", optical: "Optical", skin: "Skin", communityMed: "Comm. Med"
    };

    const observationStudents = (event.students as any[]).filter(stud => {
        const data = stud.medicalRecord?.data as Record<string, any> | null;
        if (!data) return false;
        return Object.values(data).some((catData: any) => catData?.status_nor === 'O');
    }).map((stud: any) => {
        const data = stud.medicalRecord?.data as Record<string, any>;
        const depts = Object.entries(data || {})
            .filter(([, catData]: any) => catData?.status_nor === 'O')
            .map(([key]) => DEPT_MAP[key] || key);
        return {
            id: stud.id,
            name: `${stud.firstName} ${stud.lastName}`,
            classSec: stud.classSec,
            depts,
        };
    });

    return (
        <div className="flex flex-col">
            <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Sticky Header Section */}
                <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm pt-2 pb-6 mb-4 z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-3 mb-2">
                        <Link href={`/staff/workspace/${eventId}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 transition-all shadow-sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600/60">Event Workspace</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Observation Students</h1>
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase font-bold px-3">
                                    {observationStudents.length} Flagged
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
