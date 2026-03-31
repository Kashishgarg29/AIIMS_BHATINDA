"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { acceptCampRequest, rejectCampRequest } from "@/lib/actions/admin-actions";

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

  if (requests.length === 0) {
    return (
      <Card className="p-12 text-center text-slate-500 border-dashed">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-900">No Pending Requests</h3>
        <p>All caught up! New school camp requests will appear here.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {requests.map((req) => (
          <Card key={req.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white shrink-0">
            <div className="space-y-1 mb-4 sm:mb-0">
              <h3 className="font-semibold text-lg">{req.schoolName}</h3>
              <div className="flex gap-4 text-sm text-slate-500">
                <span>Date: {new Date(req.tentativeDate).toLocaleDateString()}</span>
                <span>~{req.tentativeStudents} Students</span>
                <span>POC: {req.pocName} ({req.pocEmail})</span>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setRejectId(req.id)}
              >
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
              <Button
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                onClick={() => setAcceptRequest(req)}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Accept & Create
              </Button>
            </div>
          </Card>
        ))}
      </div>

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
                  <span className="font-semibold">{new Date(acceptRequest.tentativeDate).toLocaleDateString()}</span>
                  {new Date(acceptRequest.tentativeDate) < new Date(new Date().setHours(0, 0, 0, 0)) && (
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
                {medicalStaff.length === 0 ? (
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
              <Button onClick={handleAccept} disabled={isAccepting} className="bg-green-600 hover:bg-green-700">
                {isAccepting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Approve & Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
