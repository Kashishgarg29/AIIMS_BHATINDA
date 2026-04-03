"use client";

import { useState } from "react";
import { Users, Mail, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddUserButton } from "@/components/admin/directory/AddUserButton";
import { DeleteUserButton } from "@/components/admin/directory/DeleteUserButton";

type StaffType = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string | null;
};

export function StaffDirectoryClient({
  medicalStaff
}: {
  medicalStaff: StaffType[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStaff = medicalStaff.filter(staff => {
    const srch = searchQuery.toLowerCase();
    if (!srch) return true;
    return (
      staff.fullName.toLowerCase().includes(srch) ||
      staff.email.toLowerCase().includes(srch) ||
      (staff.department && staff.department.toLowerCase().includes(srch))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-600" /> Medical Staff Directory
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or department..."
              className="pl-10 w-full sm:w-72 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-px h-8 bg-slate-200 hidden sm:block mx-1"></div>

          <AddUserButton />
        </div>
      </div>

      {filteredStaff.length === 0 ? (
        <Card className="p-16 text-center text-slate-500 border-dashed border-2 bg-slate-50/50">
          <Users className="h-16 w-16 mx-auto mb-6 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {medicalStaff.length === 0 ? "Directory Empty" : "No Staff Found"}
          </h3>
          <p className="text-slate-600 max-w-sm mx-auto">
            {medicalStaff.length === 0
              ? "No medical staff available. Add users so you can assign them to events."
              : "We couldn't find any staff members matching your search."}
          </p>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[minmax(250px,1fr)_minmax(200px,1fr)_minmax(150px,1fr)_160px] items-center px-6 py-4 bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <div>Staff Member</div>
            <div>Email Address</div>
            <div>Department</div>
            <div className="text-center">Actions</div>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredStaff.map(staff => (
              <div key={staff.id} className="grid grid-cols-[minmax(250px,1fr)_minmax(200px,1fr)_minmax(150px,1fr)_160px] items-center px-6 py-4 hover:bg-slate-50/80 transition-colors group">
                <div>
                  <span className="text-[15px] font-semibold tracking-wide text-slate-800 group-hover:text-emerald-600 transition-colors block">
                    {staff.fullName}
                  </span>
                </div>
                <div className="flex items-center text-slate-600">
                  <span className="truncate">{staff.email}</span>
                </div>
                <div className="flex items-center">
                  {staff.department ? (
                    <span className="text-sm font-medium text-slate-700 capitalize">
                      {staff.department.toLowerCase().replace("_", " ")}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400 italic">Unassigned</span>
                  )}
                </div>
                <div className="flex items-center justify-center">
                  <DeleteUserButton userId={staff.id} userName={staff.fullName} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
