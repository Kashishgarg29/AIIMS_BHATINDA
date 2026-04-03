"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, FileUp, Activity, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { bulkAddStudentsToEvent, addStudentToEvent } from "@/lib/actions/staff-actions";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ManageSectionsDialog } from "./ManageSectionsDialog";
import { RealTimeRefresher } from "@/components/shared/RealTimeRefresher";
import { useSession } from "next-auth/react";
import { getStudentNavigationUrl } from "@/lib/utils/navigation";
import Papa from "papaparse";
import { useRef } from "react";

type StudentData = {
  id: string;
  firstName: string;
  lastName: string;
  classSec: string;
  gender: string;
  medicalRecord: { status: string; updatedAt: Date; data?: any } | null;
};

export function WorkspaceClient({
  eventId,
  students,
  schoolName,
  eventDate,
  location,
  eventStaff,
  formConfig,
  currentUserId,
  pocName,
  pocPhone,
  pocEmail,
  eventHeadName,
  eventHeadDepartment,
}: {
  eventId: string;
  students: StudentData[];
  schoolName: string;
  eventDate: Date;
  location: string;
  eventStaff: { id: string; fullName: string; email: string; department?: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formConfig: any;
  currentUserId: string;
  pocName?: string | null;
  pocPhone?: string | null;
  pocEmail?: string | null;
  eventHeadName?: string | null;
  eventHeadDepartment?: string | null;
}) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [classSec, setClassSec] = useState("");
  const [dob, setDob] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const isMedicalIssue = (key: string, val: any) => {
    if (!val) return false;

    if (typeof val === 'boolean') {
      if (key.startsWith('skin_') || key === 'spectacles') return val === true;
      return false;
    }

    if (typeof val === 'string') {
      const lower = val.toLowerCase().trim();
      if (lower === 'none' || lower === 'nil' || lower === 'na' || lower === 'n/a' || lower === 'no') return false;
      const k = key.toLowerCase();
      const normalWords = ['normal', 'healthy', 'good', 'fair', '6/6', '6/9'];
      if (['hearing', 'earexam', 'noseexam', 'throatexam', 'generalappearance', 'oralhygiene', 'gums', 'visionright', 'visionleft', 'colorvision', 'skincondition'].includes(k)) {
        return !normalWords.includes(lower);
      }
      if (['cavities', 'dentalfindings', 'opticalissues', 'infections', 'majorillness', 'currentmedication'].includes(k)) {
        return true;
      }
    }
    return false;
  };

  const getCategoryStatusCounts = (catId: string) => {
    let N = 0; let O = 0; let R = 0;
    students.forEach(s => {
      const dataForCat = (s.medicalRecord as any)?.data?.[catId];
      if (!dataForCat) return;

      let hasIssue = false;
      let hasRemark = false;

      for (const [k, v] of Object.entries(dataForCat)) {
        if (k.startsWith('_')) continue;
        if (isMedicalIssue(k, v)) hasIssue = true;
        if (k.toLowerCase().includes('remark') && typeof v === 'string' && v.trim() !== '') hasRemark = true;
      }

      if (hasIssue) R++;
      else if (hasRemark) O++;
      else N++;
    });
    return { N, O, R };
  };

  const STAT_CATEGORIES = [
    { id: "ent_examination", title: "ENT" },
    { id: "dental_examination", title: "Dental" },
    { id: "optical_examination", title: "Optical" },
    { id: "skin_examination", title: "Skin" },
    { id: "system_wise_examination", title: "Systemic" },
  ];

  const getReferredDepartments = (s: StudentData) => {
    const referredDeptIds: string[] = [];
    if (!s.medicalRecord?.data) return [];

    STAT_CATEGORIES.forEach(cat => {
      const dataForCat = (s.medicalRecord as any).data[cat.id];
      if (!dataForCat) return;

      if (dataForCat.status_nor) {
        if (dataForCat.status_nor === 'R') referredDeptIds.push(cat.title);
        return;
      }

      // Legacy fallback
      let hasIssue = false;
      for (const [k, v] of Object.entries(dataForCat)) {
        if (k.startsWith('_')) continue;
        if (isMedicalIssue(k, v)) hasIssue = true;
      }
      if (hasIssue) referredDeptIds.push(cat.title);
    });
    return referredDeptIds;
  };

  // Dynamic status similar to dashboard
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const evDate = new Date(eventDate);
  evDate.setHours(0, 0, 0, 0);

  let dynamicStatus = "UPCOMING";
  if (evDate.getTime() === today.getTime()) {
    dynamicStatus = "ACTIVE";
  } else if (evDate < today) {
    dynamicStatus = "PAST";
  }

  const filteredStudents = students.filter(s => {
    // 1. Text Search Filter
    const q = search.toLowerCase();
    const matchesSearch = s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.classSec.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // 2. Status Filter
    if (statusFilter === "ALL") return true;

    const sStatus = s.medicalRecord?.status || "PENDING";
    return sStatus === statusFilter;
  });

  const total = students.length;
  const done = students.filter(s => s.medicalRecord?.status === "COMPLETED").length;
  const prog = students.filter(s => s.medicalRecord?.status === "IN_PROGRESS").length;

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !lastName || !classSec || !dob || !gender) return;

    setIsAdding(true);

    // Calculate age from dob
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    await addStudentToEvent({
      eventId,
      firstName,
      lastName,
      classSec,
      gender,
      age
    });

    setIsAdding(false);
    setIsAddOpen(false);

    // Reset form
    setFirstName("");
    setLastName("");
    setClassSec("");
    setDob("");
    setGender("MALE");

    router.refresh();
  }

  function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCSV(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedStudents = results.data.map((row: any) => {
            // Calculate age from dob
            let age = 0;
            if (row.dob) {
              const birthDate = new Date(row.dob);
              const today = new Date();
              age = today.getFullYear() - birthDate.getFullYear();
              const m = today.getMonth() - birthDate.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
              }
            }

            const gStr = (row.gender || "").toUpperCase();
            const mappedGender = gStr.startsWith('F') ? 'FEMALE' : gStr.startsWith('M') ? 'MALE' : 'OTHER';

            return {
              firstName: row.firstName || row["First Name"] || "Unknown",
              lastName: row.lastName || row["Last Name"] || "",
              classSec: row.classSec || row["Class/Sec"] || row["Class"] || "Unknown",
              gender: mappedGender as "MALE" | "FEMALE" | "OTHER",
              age: age || 5
            };
          });

          if (parsedStudents.length > 0) {
            await bulkAddStudentsToEvent({
              eventId,
              students: parsedStudents
            });
            router.refresh();
          }
        } catch (error) {
          console.error("CSV bulk import failed", error);
        } finally {
          setIsUploadingCSV(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        console.error("CSV Parsing Error:", error);
        setIsUploadingCSV(false);
      }
    });
  }

  return (
    <>
      <RealTimeRefresher />
      <div className="bg-white border-b sticky top-0 z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link href="/staff/dashboard">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 transition-all shadow-sm">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <Badge variant={dynamicStatus === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                  {dynamicStatus === "ACTIVE" ? "Active Event" : dynamicStatus === "PAST" ? "Past Event" : "Upcoming Event"}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{schoolName}</h1>
              <p className="text-sm text-slate-500">
                {new Date(eventDate).toLocaleDateString()} • {location}
              </p>

              {/* POC + Event Head info chips */}
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                {pocName && (
                  <span className="flex items-baseline gap-1.5 text-[11px] font-medium text-slate-500">
                    <span className="font-bold text-emerald-600 uppercase tracking-wide text-[10px]">POC:</span>
                    <span className="text-slate-700">{pocName}</span>
                    {pocPhone && (
                      <a
                        href={`tel:${pocPhone}`}
                        onClick={e => e.stopPropagation()}
                        className="ml-0.5 text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        {pocPhone}
                      </a>
                    )}
                  </span>
                )}
                {eventHeadName && (
                  <span className="flex items-baseline gap-1.5 text-[11px] font-medium text-slate-500">
                    <span className="font-bold text-amber-600 uppercase tracking-wide text-[10px]">Head:</span>
                    <span className="text-slate-700">{eventHeadName}</span>
                    {eventHeadDepartment && (
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                        {eventHeadDepartment.replace(/_/g, " ")}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-2 sm:p-3 rounded-lg border">
              <div className="text-center px-4">
                <p className="text-xs font-semibold text-slate-500 uppercase">Total</p>
                <p className="text-xl font-bold text-slate-900">{total}</p>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="text-center px-4">
                <p className="text-xs font-semibold text-green-600 uppercase">Done</p>
                <p className="text-xl font-bold text-green-700">{done}</p>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div className="text-center px-4">
                <p className="text-xs font-semibold text-amber-600 uppercase">Prog</p>
                <p className="text-xl font-bold text-amber-700">{prog}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:max-w-md lg:w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student name or class..."
                className="pl-10 w-full bg-white shadow-sm"
              />
            </div>

            {/* Deadline Logic for POC */}
            {(() => {
              const eventDay = new Date(eventDate);
              eventDay.setHours(0, 0, 0, 0);
              const now = new Date();
              now.setHours(0, 0, 0, 0);

              const canAdd = dynamicStatus !== "PAST";

              if (!canAdd) return null;

              return (
                <div className="flex ml-auto gap-2 w-full sm:w-auto">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleCSVUpload}
                  />
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingCSV}
                  >
                    {isUploadingCSV ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                    {isUploadingCSV ? "Uploading..." : "CSV Upload"}
                  </Button>

                  {formConfig?.eventHeadId === currentUserId && (
                    <ManageSectionsDialog
                      eventId={eventId}
                      formConfig={formConfig}
                      eventStaff={eventStaff}
                    />
                  )}

                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger
                      render={
                        <Button className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700">
                          <UserPlus className="mr-2 h-4 w-4" /> Quick Add
                        </Button>
                      }
                    />
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>
                          Add a student manually to the roster. They will immediately appear in the list.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddStudent} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" required value={lastName} onChange={e => setLastName(e.target.value)} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input id="dob" type="date" required value={dob} onChange={e => setDob(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select required value={gender} onValueChange={(val: any) => setGender(val)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MALE">Male</SelectItem>
                                <SelectItem value="FEMALE">Female</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="classSec">Class & Section</Label>
                          <Input id="classSec" placeholder="e.g. 10-A" required value={classSec} onChange={e => setClassSec(e.target.value)} />
                        </div>

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isAdding}>
                          {isAdding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : "Add Student"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              );
            })()}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto w-full sm:w-auto self-start">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all flex-1 sm:flex-none ${statusFilter === status
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
              >
                {status === 'ALL' ? 'All' : status === 'IN_PROGRESS' ? 'In Progress' : status === 'PENDING' ? 'Pending' : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center">
              <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b">
                <tr>
                  <th className="px-6 py-4 font-medium text-center">Student Name</th>
                  <th className="px-6 py-4 font-medium text-center">Class/Sec</th>
                  <th className="px-6 py-4 font-medium text-center">Gender</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-center hidden md:table-cell">Last Updated</th>
                  <th className="px-6 py-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? filteredStudents.map((student) => {
                  const status = student.medicalRecord?.status || "PENDING";
                  const lastUpdated = student.medicalRecord?.updatedAt
                    ? new Date(student.medicalRecord.updatedAt).toLocaleDateString()
                    : "Never";
                  const referredDepts = getReferredDepartments(student);

                  return (
                    <tr
                      key={student.id}
                      onClick={() => {
                        if (dynamicStatus === "UPCOMING") return;
                        const navUrl = getStudentNavigationUrl(student.id, eventId, currentUserId, formConfig, isAdmin, false, true);
                        router.push(navUrl);
                      }}
                      className={`transition-colors group ${dynamicStatus === "UPCOMING" ? 'opacity-60 bg-slate-50' : 'cursor-pointer hover:bg-slate-50/80 hover:shadow-sm'
                        }`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 text-center">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-center">{student.classSec}</td>
                      <td className="px-6 py-4 text-slate-600 text-center capitalize">{student.gender?.toLowerCase() || "—"}</td>
                      <td className="px-6 py-4 text-center">
                        {status === 'COMPLETED' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Completed</Badge>}
                        {status === 'IN_PROGRESS' && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">In Progress</Badge>}
                        {status === 'PENDING' && <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-slate-200">Pending</Badge>}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-center hidden md:table-cell">{lastUpdated}</td>
                      <td className="px-6 py-4 text-center">
                        {dynamicStatus === "UPCOMING" ? (
                          <span className="text-slate-400 italic text-sm">Not Started</span>
                        ) : (
                          <span className="text-emerald-600 font-bold group-hover:text-emerald-700 transition flex items-center justify-center gap-1">
                            {dynamicStatus === "PAST" ? "View" : "Open"} <Activity className="h-4 w-4" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
