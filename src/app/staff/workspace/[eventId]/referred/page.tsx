import { Navbar } from "@/components/layout/Navbar";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default async function ReferredStudentsPage({ params }: { params: Promise<{ eventId: string }> }) {
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

    const referredStudents = (event.students as any[]).filter(stud => {
        const data = stud.medicalRecord?.data as Record<string, any> | null;
        if (!data) return false;
        return Object.values(data).some((catData: any) => catData?.status_nor === 'R');
    }).map((stud: any) => {
        const data = stud.medicalRecord?.data as Record<string, any>;
        const depts = Object.entries(data || {})
            .filter(([, catData]: any) => catData?.status_nor === 'R')
            .map(([key]) => DEPT_MAP[key] || key);
        return {
            id: stud.id,
            name: `${stud.firstName} ${stud.lastName}`,
            classSec: stud.classSec,
            depts,
        };
    });

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar role={session?.user?.role || "MEDICAL_STAFF"} userName={session?.user?.name || "Dr. Staff"} />

            <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8">
                <div className="mb-6">
                    <Link href="/staff/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Referred Students</h1>
                    <p className="text-slate-500 mt-1">{event.schoolDetails} - {new Date(event.eventDate).toLocaleDateString()}</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                        <h2 className="text-lg font-semibold text-red-700">Total Referred:</h2>
                        <span className="bg-red-100 text-red-700 text-sm font-bold px-2.5 py-0.5 rounded-full">{referredStudents.length}</span>
                    </div>

                    {referredStudents.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            No students have been referred yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {referredStudents.map(stud => (
                                <Link href={`/staff/workspace/${event.id}/student/${stud.id}?from=referred`} key={stud.id} className="block">
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 hover:bg-red-100 hover:border-red-200 transition-all flex justify-between items-center group shadow-sm">
                                        <div>
                                            <p className="font-bold text-slate-900 text-lg">{stud.name}</p>
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">{stud.classSec}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {stud.depts.map((d: string) => (
                                                    <span key={d} className="text-[10px] font-bold bg-red-200 text-red-800 px-2 py-0.5 rounded-md uppercase tracking-wider">{d}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-white p-2 rounded-full shadow-sm group-hover:shadow group-hover:scale-110 transition-all">
                                            <ArrowRight className="h-5 w-5 text-red-500" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
