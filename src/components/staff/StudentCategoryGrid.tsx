"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

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
    const normalWords = ['normal', 'healthy', 'good', 'fair', '6/6', '6/9']; // Treating 6/9 as borderline normal for simplicity
    if (['hearing', 'earexam', 'noseexam', 'throatexam', 'generalappearance', 'oralhygiene', 'gums', 'visionright', 'visionleft', 'colorvision', 'skincondition'].includes(k)) {
      return !normalWords.includes(lower);
    }

    if (['cavities', 'dentalfindings', 'opticalissues', 'infections', 'majorillness', 'currentmedication'].includes(k)) {
      return true;
    }
  }
  return false;
};

interface CategoryStatus {
  id: string;
  title: string;
  iconName: string;
  status: string;
  lastEditedBy: string | null;
  lastEditedAt: string | null;
  isLockedBy: string | null;
  isReadOnly: boolean;
  data: any;
}

export function StudentCategoryGrid({
  categoriesStatus,
  assignedCategoryIds,
  eventId,
  studentId,
  isUpcoming = false,
}: {
  categoriesStatus: CategoryStatus[];
  assignedCategoryIds: string[];
  eventId: string;
  studentId: string;
  isUpcoming?: boolean;
}) {
  // Removed extra state

  // Determine severity for sorting (1 is highest priority)
  const getSeverity = (cat: CategoryStatus) => {
    if (cat.data?.status_nor === 'R') return 1;
    if (cat.data?.status_nor === 'O') return 2;
    
    // Fallback for older data without status_nor explicit label
    if (cat.data) {
      const hasIssue = Object.entries(cat.data).some(([k, v]) => !k.startsWith('_') && k !== 'status_nor' && isMedicalIssue(k, v));
      if (hasIssue) return 1;
    }

    if (cat.data?.status_nor === 'N' || cat.status === 'COMPLETED') return 3;
    if (cat.status === 'IN_PROGRESS') return 4;
    return 5; // PENDING
  };

  // Split categories into assigned and others, sorted by severity
  const assignedCategories = categoriesStatus
    .filter(cat => assignedCategoryIds.includes(cat.id))
    .sort((a, b) => getSeverity(a) - getSeverity(b));
    
  const otherCategories = categoriesStatus
    .filter(cat => !assignedCategoryIds.includes(cat.id))
    .sort((a, b) => getSeverity(a) - getSeverity(b));

  const renderCategoryCard = (cat: CategoryStatus, isAssigned: boolean) => {
    const CardContentWrapper = ({ children }: { children: React.ReactNode }) => {
      if (isUpcoming) {
        return <div className="block opacity-75">{children}</div>;
      }
      return <Link href={`/staff/workspace/${eventId}/student/${studentId}/${cat.id}`} className="block transition-opacity">{children}</Link>;
    };

    return (
      <CardContentWrapper key={cat.id}>
        <div className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition-colors shadow-sm ${
            isUpcoming ? 'bg-slate-50 border-slate-200 grayscale-[0.5] cursor-not-allowed' :
            cat.status === 'COMPLETED' ? 'bg-green-50 border-green-300' :
            cat.status === 'IN_PROGRESS' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200 hover:border-emerald-400 cursor-pointer group'
          }`}>
          {/* Left side: Title */}
          <div className="flex flex-col justify-center sm:w-1/5 shrink-0">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h3 className={`font-bold leading-tight ${cat.status === 'COMPLETED' ? 'text-green-900' : 'text-slate-900'} text-lg group-hover:text-emerald-700 transition-colors`}>{cat.title}</h3>
                {cat.data?.status_nor && (
                  <Badge className={`px-1.5 py-0 h-[18px] text-[9px] uppercase tracking-widest border ${cat.data.status_nor === 'N' ? 'bg-green-50 text-green-700 border-green-200' :
                      cat.data.status_nor === 'O' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                    }`}>
                    {cat.data.status_nor === 'N' ? 'Normal' : cat.data.status_nor === 'O' ? 'Observe' : 'Referred'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Middle: Data preview */}
          <div className="flex-1 border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-3 sm:pt-0 sm:pl-4 flex flex-col justify-center">
            {cat.data && Object.keys(cat.data).filter(k => !k.startsWith('_')).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(cat.data)
                  .filter(([k, v]) => !k.startsWith('_') && k !== 'status_nor' && v !== '' && v !== null && v !== false)
                  .slice(0, 4)
                  .map(([k, v]) => {
                    const issue = isMedicalIssue(k, v);
                    return (
                      <div key={k} className={`truncate p-2 rounded-md ${issue ? 'bg-red-50 border border-red-200' : 'bg-transparent border border-transparent'}`} title={`${k}: ${v}`}>
                        <span className={`font-semibold block text-[10px] uppercase tracking-wider truncate flex items-center gap-1 ${issue ? 'text-red-700' : 'text-slate-500'}`}>
                          {issue && <AlertCircle className="h-3 w-3 shrink-0" />}
                          {k.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className={`text-sm font-medium truncate block mt-0.5 ${issue ? 'text-red-900 font-bold' : 'text-slate-900'}`}>{(v as string).toString()}</span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">No data recorded yet.</div>
            )}
          </div>

          {/* Right side: Action */}
          <div className="flex items-center justify-between sm:justify-end gap-3 min-w-[120px] shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-3 sm:pt-0 sm:pl-4">
            <div className="flex items-center gap-2">
              {cat.status === 'COMPLETED' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : cat.status === 'IN_PROGRESS' ? (
                <Clock className="h-5 w-5 text-amber-600" />
              ) : null}
            </div>
            <div className="font-bold text-xs text-slate-500 group-hover:text-emerald-600 flex items-center gap-1 transition-colors">
              {isUpcoming ? 'Not Started' :
                cat.isReadOnly ? 'View' :
                  cat.isLockedBy ? 'Locked' :
                    cat.status === 'COMPLETED' ? 'Edit' :
                      cat.status === 'IN_PROGRESS' ? 'Resume' : 'Start'}
              {!isUpcoming && <span className="text-emerald-500 transition-transform group-hover:translate-x-1">&rarr;</span>}
            </div>
          </div>
        </div>
      </CardContentWrapper>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Assigned Categories */}
      {assignedCategories.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-3 border-b border-emerald-100 pb-2">Assigned to You</h3>
          <div className="space-y-3">
            {assignedCategories.map(cat => renderCategoryCard(cat, true))}
          </div>
        </div>
      )}

      {/* Other Categories */}
      {otherCategories.length > 0 && (
        <div className={assignedCategories.length > 0 ? "mt-8" : ""}>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b pb-2">Other Departments</h3>
          <div className="space-y-3">
            {otherCategories.map(cat => renderCategoryCard(cat, false))}
          </div>
        </div>
      )}
    </div>
  );
}
