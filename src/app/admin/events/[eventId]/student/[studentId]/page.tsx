import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserSquare, Clock, ShieldCheck } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminStudentView({
  params
}: {
  params: Promise<{ eventId: string, studentId: string }>
}) {
  const { eventId, studentId } = await params;
  const session = await getServerSession(authOptions);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      medicalRecord: true,
      event: true
    }
  });

  if (!student) redirect(`/admin/events/${eventId}`);

  const recordData = (student.medicalRecord?.data as Record<string, any>) || {};
  const categoriesPresent = Object.keys(recordData).filter(k => !k.startsWith('_'));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar role={session?.user?.role || "ADMIN"} userName={session?.user?.name || "Admin"} />

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        <div className="mb-6 space-y-4">
          <Link href={`/admin/events/${eventId}`} className="text-sm font-medium text-slate-500 hover:text-slate-700 flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event Roster
          </Link>

          <div className="bg-white rounded-lg border p-6 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <UserSquare className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{student.firstName} {student.lastName}</h1>
                <div className="text-sm text-slate-500 flex gap-4 mt-1">
                  <span>Age: {student.age}</span>
                  <span>Class: {student.classSec}</span>
                  <span className="capitalize">Gender: {student.gender.toLowerCase()}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase font-medium text-slate-500 mb-1">Record Status</p>
              <Badge
                variant="outline"
                className={`text-sm px-3 py-1 ${student.medicalRecord?.status === "COMPLETED" ? "bg-green-50 text-green-700 border-green-200" :
                  student.medicalRecord?.status === "IN_PROGRESS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
              >
                {student.medicalRecord?.status?.replace('_', ' ') || "PENDING"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-800">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Read-Only Medical Logs
          </h2>

          {categoriesPresent.length === 0 ? (
            <Card className="p-12 text-center text-slate-500 border-dashed">
              <Clock className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p>No medical data has been logged for this student yet.</p>
            </Card>
          ) : (
            categoriesPresent.map(category => {
              const catData = recordData[category];
              return (
                <Card key={category} className="overflow-hidden">
                  <CardHeader className="bg-slate-50 border-b py-3">
                    <CardTitle className="text-base capitalize flex justify-between items-center">
                      {category === "demographics" ? "General Information" :
                        category === "communityMed" ? "Community Medicine" :
                          category.replace(/([A-Z])/g, ' $1').replace("-", " ").trim()}
                      {catData._lastUpdated && (
                        <span className="text-xs font-normal text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Updated {new Date(catData._lastUpdated).toLocaleString()}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(catData)
                      .filter(([key]) => !key.startsWith('_'))
                      .map(([key, value]) => (
                        <div key={key} className="bg-white p-3 rounded border">
                          <span className="block text-xs uppercase text-slate-500 mb-1 font-medium tracking-wide">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm font-medium text-slate-900">
                            {value === true ? "Yes / Normal" :
                              value === false ? "No / Abnormal" :
                                value ? (
                                  String(value) +
                                  (key.toLowerCase().includes('height') ? ' cms' :
                                    key.toLowerCase().includes('weight') ? ' kg' : '')
                                ) : "-"}
                          </span>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </main>
    </div>
  );
}
