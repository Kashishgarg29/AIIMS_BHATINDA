"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { acceptCampRequest, rejectCampRequest } from "@/lib/actions/admin-actions";
import { Input } from "@/components/ui/input";

type RequestType = {
  id: string;
  schoolName: string;
  pocName: string;
  pocEmail: string;
  pocPhone: string;
  tentativeDate: Date;
  tentativeStudents: number;
};

type StaffType = {
  id: string;
  fullName: string;
  email: string;
};

export function RequestsTabClient({
  requests,
  medicalStaff,
}: {
  requests: RequestType[];
  medicalStaff: StaffType[];
}) {
  const router = useRouter();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const [acceptRequest, setAcceptRequest] = useState<RequestType | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    setIsRejecting(true);
    await rejectCampRequest(rejectId, rejectReason);
    setIsRejecting(false);
    setRejectId(null);
    setRejectReason("");
  };

  const handleAccept = async () => {
    if (!acceptRequest) return;
    setIsAccepting(true);
    try {
      console.log("Submitting acceptance for:", acceptRequest.id);
      const result = await acceptCampRequest(acceptRequest.id, selectedStaff);
      console.log("Accept result:", result);

      if (result.success) {
        setAcceptRequest(null);
        setSelectedStaff([]);
        router.refresh();
      } else {
        alert(`FAIL: ${result.error}`);
      }
    } catch (error) {
      alert(`CRASH: ${(error as any).message}`);
    } finally {
      setIsAccepting(false);
    }
  };

  const toggleStaffSelection = (id: string) => {
    setSelectedStaff((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  // Defensively ensure requests is an array before filtering
  const safeRequests = Array.isArray(requests) ? requests : [];

  const filteredRequests = safeRequests.filter(req => {
    if (!searchQuery) return true;
    const sq = searchQuery.toLowerCase();
    const sName = req?.schoolName || "";
    const pName = req?.pocName || "";
    return sName.toLowerCase().includes(sq) || pName.toLowerCase().includes(sq);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Camp Requests</h2>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search schools or POC..."
              className="pl-10 w-full sm:w-64 bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {safeRequests.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border-dashed bg-slate-50/50 shadow-sm">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-300" />
          <h3 className="text-lg font-medium text-slate-900">No Pending Requests</h3>
          <p>All caught up! New school camp requests will appear here.</p>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 border-dashed bg-slate-50/50 shadow-sm">
          <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-medium text-slate-900">No Results Found</h3>
          <p>Try adjusting your search query.</p>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filteredRequests.map((req) => (
            <Card key={req.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2.5 bg-white shrink-0 shadow-sm transition-all hover:shadow-md border border-slate-100 hover:border-emerald-100 group">
            <div className="space-y-0.5 mb-3 sm:mb-0 text-left">
              <h3 className="font-bold text-lg text-slate-900 leading-tight">{req.schoolName}</h3>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500 font-medium">
                <span>Date: {req.tentativeDate ? new Date(req.tentativeDate).toLocaleDateString() : 'N/A'}</span>
                <span>Students: ~{req.tentativeStudents || 0}</span>
                <span>POC: {req.pocName}</span>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none h-9 px-4 border-red-100 text-red-600 hover:bg-red-50 text-sm font-bold"
                  onClick={() => setRejectId(req.id)}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="flex-1 sm:flex-none h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm"
                  onClick={() => setAcceptRequest(req)}
                >
                  Accept & Create
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reject Request</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason for rejecting this camp request. This will be emailed to the school POC.
            </p>
            <textarea
              className="w-full h-24 p-3 border rounded-md mb-4 focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Unfortunately, our schedule is fully booked for October..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRejectId(null)}>
                Cancel
              </Button>
              <Button onClick={handleReject} disabled={isRejecting || !rejectReason.trim()} className="bg-red-600 hover:bg-red-700">
                {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Accept & Create Event Modal */}
      {acceptRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Create Event</h3>
            <p className="text-sm text-gray-500 mb-6">Review details and assign medical staff.</p>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-md">
                <div>
                  <span className="block text-slate-500 text-xs uppercase">School</span>
                  <span className="font-semibold">{acceptRequest.schoolName}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs uppercase">Date</span>
                  <span className="font-semibold">{acceptRequest.tentativeDate ? new Date(acceptRequest.tentativeDate).toLocaleDateString() : 'N/A'}</span>
                  {acceptRequest.tentativeDate && new Date(acceptRequest.tentativeDate) < new Date(new Date().setHours(0, 0, 0, 0)) && (
                    <span className="block text-xs text-red-500 mt-1">Warning: Date is in the past!</span>
                  )}
                </div>
                <div>
                  <span className="block text-slate-500 text-xs uppercase">POC</span>
                  <span>{acceptRequest.pocName}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-xs uppercase">Phone</span>
                  <span>{acceptRequest.pocPhone}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-slate-900 mb-2">Assign Medical Staff</h4>
                {(!medicalStaff || medicalStaff.length === 0) ? (
                  <p className="text-sm text-red-500">No medical staff available. Create some in the directory first.</p>
                ) : (
                  <div className="space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                    {medicalStaff.map((staff) => (
                      <label key={staff.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-slate-50 rounded">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                          checked={selectedStaff.includes(staff.id)}
                          onChange={() => toggleStaffSelection(staff.id)}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{staff.fullName}</span>
                          <span className="text-xs text-gray-500">{staff.email}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setAcceptRequest(null)}>
                Cancel
              </Button>
              <Button onClick={handleAccept} disabled={isAccepting} className="bg-emerald-600 hover:bg-emerald-700">
                {isAccepting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Approve & Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
