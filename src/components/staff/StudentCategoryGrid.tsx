"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, ArrowLeft, Activity, FileText, Ear, Smile, Eye, Hand, ExternalLink, ShieldCheck, ClipboardList, Thermometer, UserSquare2, Syringe } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CategoryEditFormClient } from "@/components/staff/forms/CategoryEditForm";
import { ToothIcon as Tooth } from "@/components/shared/ToothIcon";

// Dynamic Icon Component
const CategoryIcon = ({ name, className }: { name: string, className?: string }) => {
    switch (name.toLowerCase()) {
        case "filetext": return <FileText className={className} />;
        case "activity": return <Activity className={className} />;
        case "alertcircle": return <AlertCircle className={className} />;
        case "ear": return <Ear className={className} />;
        case "smile": return <Smile className={className} />;
        case "eye": return <Eye className={className} />;
        case "hand": return <Hand className={className} />;
        case "shieldcheck": return <ShieldCheck className={className} />;
        case "clipboardlist": return <ClipboardList className={className} />;
        case "thermometer": return <Thermometer className={className} />;
        case "syringe": return <Syringe className={className} />;
        case "tooth": return <Tooth className={className} />;
        default: return <FileText className={className} />; // Fallback
    }
};

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

interface MedicalRecordHistory {
    id: string;
    eventId: string;
    status: string;
    data: any;
    createdAt: Date | string;
    event: {
        schoolDetails: string;
        eventDate: Date | string;
    };
}

export function StudentCategoryGrid({
    categoriesStatus,
    assignedCategoryIds,
    eventId,
    studentId,
    student,
    backTo,
    completionPercentage,
    globalStatus,
    dynamicStatus,
    bmi,
    userId,
    userName,
    userRole,
    formConfig,
    medicalHistory,
    isUpcoming = false,
    eventDate,
    schoolName
}: {
    categoriesStatus: CategoryStatus[];
    assignedCategoryIds: string[];
    eventId: string;
    studentId: string;
    student: any;
    backTo: string;
    completionPercentage: number;
    globalStatus: string;
    dynamicStatus: string;
    bmi?: string | null;
    userId: string;
    userName: string;
    userRole?: string;
    formConfig?: any;
    medicalHistory?: any[];
    isUpcoming?: boolean;
    eventDate?: string | Date;
    schoolName?: string;
}) {
    const [activeTab, setActiveTab] = useState<string>(categoriesStatus[0]?.id || "");
    const [showHistory, setShowHistory] = useState(false);
    const activeCat = categoriesStatus.find(c => c.id === activeTab) || categoriesStatus[0];

    const getStatusColors = (status: string, isAssigned: boolean) => {
        if (status === 'COMPLETED') return 'bg-green-100 text-green-700 border-green-300 ring-green-600';
        if (status === 'IN_PROGRESS') return 'bg-amber-100 text-amber-700 border-amber-300 ring-amber-600';
        if (isAssigned) return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500';
        return 'bg-slate-50 text-slate-400 border-slate-200 ring-slate-400';
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50/50">
            {/* STICKY COMPACT HEADER */}
            <div className="bg-white border-b sticky top-0 z-30 shadow-md backdrop-blur-md bg-white/95">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-start justify-between gap-6 mb-5">
                        <div className="flex items-center gap-4">
                            <Link href={backTo}>
                                <div className="h-10 w-10 flex items-center justify-center rounded-full border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 transition-all shadow-sm">
                                    <ArrowLeft className="h-5 w-5" />
                                </div>
                            </Link>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight flex flex-wrap items-center gap-3">
                                    {student.firstName} {student.lastName}
                                    <Badge variant="outline" className={
                                        globalStatus === "COMPLETED" ? "bg-green-50 text-green-700 border-green-200" :
                                            globalStatus === "IN_PROGRESS" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                "bg-slate-100 text-slate-700 border-slate-200"
                                    }>
                                        {globalStatus.replace('_', ' ')}
                                    </Badge>
                                    {student.studentUID && (
                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[10px] tracking-widest uppercase">
                                            UID: {student.studentUID}
                                        </Badge>
                                    )}
                                </h1>
                                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider flex flex-wrap gap-x-4">
                                    <span>Class: <span className="text-slate-900">{student.medicalRecords?.[0]?.data?.general_examination_merged?.classSection || "N/A"}</span></span>
                                    <span>Age: <span className="text-slate-900">{student.medicalRecords?.[0]?.data?.general_examination_merged?.age || "N/A"}</span></span>
                                    <span>Gender: <span className="text-slate-900 capitalize">{student.gender?.toLowerCase() || "N/A"}</span></span>
                                    {bmi && <span>BMI: <span className="text-emerald-600">{bmi}</span></span>}
                                </p>
                            </div>
                        </div>

                        <div className="hidden md:block w-1/4">
                            <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1 uppercase tracking-tighter">
                                <span>Record Health</span>
                                <span className={completionPercentage === 100 ? 'text-green-600' : 'text-emerald-600'}>{completionPercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner border border-slate-200">
                                <div className={`h-full rounded-full transition-all duration-1000 ${completionPercentage === 100 ? 'bg-green-600' : 'bg-emerald-600'}`} style={{ width: `${completionPercentage}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* CATEGORY ICON GRID */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
                        {categoriesStatus.map((cat) => {
                            const isAssigned = assignedCategoryIds.includes(cat.id);
                            const isActive = activeTab === cat.id && !showHistory;
                            const colors = getStatusColors(cat.status, isAssigned);

                            return (
                                <div
                                    key={cat.id}
                                    title={cat.title}
                                    onClick={() => {
                                        setActiveTab(cat.id);
                                        setShowHistory(false);
                                    }}
                                    className={`relative group h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center rounded-xl border-2 transition-all cursor-pointer shadow-sm
                                        ${(cat.data?.status_nor === 'R' || cat.data?.status_nor === 'O')
                                            ? 'bg-red-50 border-red-500 border-[3px] shadow-[0_0_12px_rgba(239,68,68,0.35)] text-red-600 animate-pulse-subtle'
                                            : colors}
                                        ${isActive ? 'ring-2 ring-offset-2 scale-110 z-10 border-indigo-500' : 'hover:scale-105 active:scale-95'}
                                        ${isUpcoming ? 'opacity-60 grayscale-[0.3]' : ''}
                                    `}
                                >
                                    <CategoryIcon name={cat.iconName} className={`h-6 w-6 sm:h-7 sm:w-7 ${(cat.data?.status_nor === 'R' || cat.data?.status_nor === 'O') ? 'text-red-600' :
                                            isActive ? 'text-indigo-600' : ''
                                        }`} />

                                    {/* R/O Badge for flagged sections */}
                                    {(cat.data?.status_nor === 'R' || cat.data?.status_nor === 'O') && (
                                        <div className={`absolute -top-1.5 -left-1.5 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm text-[7px] font-black text-white ${cat.data?.status_nor === 'R' ? 'bg-red-600' : 'bg-amber-500'
                                            }`}>
                                            {cat.data?.status_nor}
                                        </div>
                                    )}

                                    {/* Small Indicator Dots */}
                                    {isAssigned && (
                                        <div className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-emerald-600 rounded-full border-2 border-white flex items-center justify-center shadow-sm" title="Assigned to You">
                                            <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                                        </div>
                                    )}
                                    {cat.status === 'COMPLETED' ? (
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full border border-white p-0.5 shadow-sm">
                                            <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                                        </div>
                                    ) : cat.status === 'IN_PROGRESS' ? (
                                        <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full border border-white p-0.5 shadow-sm">
                                            <Clock className="h-2.5 w-2.5 text-white" />
                                        </div>
                                    ) : null}

                                    {/* Section Name Tooltip */}
                                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-black px-2 py-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-40 shadow-xl border border-white/10 uppercase tracking-tighter">
                                        {cat.title}
                                    </div>
                                </div>
                            );
                        })}

                        {/* HISTORY TAB */}
                        {medicalHistory && medicalHistory.length > 1 && (
                            <div className="w-px h-10 bg-slate-200 mx-2 hidden sm:block"></div>
                        )}
                        {medicalHistory && medicalHistory.length > 1 && (
                            <div
                                onClick={() => setShowHistory(true)}
                                className={`relative group h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center rounded-xl border-2 transition-all cursor-pointer shadow-sm
                                    ${showHistory ? 'ring-2 ring-offset-2 scale-110 z-10 border-amber-500 bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400 border-slate-200 ring-slate-400 hover:scale-105 active:scale-95'}
                                `}
                                title="Clinical History"
                            >
                                <ClipboardList className={`h-6 w-6 sm:h-7 sm:w-7 ${showHistory ? 'text-amber-600' : 'text-slate-400'}`} />
                                <div className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-amber-600 rounded-full border-2 border-white flex items-center justify-center shadow-sm text-[8px] font-black text-white">
                                    {medicalHistory.length}
                                </div>
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-black px-2 py-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-40 shadow-xl border border-white/10 uppercase tracking-tighter">
                                    Past Records
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA - SHOWING THE ACTIVE FORM OR HISTORY */}
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20">
                {showHistory ? (
                    <PastRecordsHistory 
                        history={medicalHistory || []} 
                        currentEventId={eventId}
                        studentName={`${student.firstName} ${student.lastName}`}
                    />
                ) : activeTab ? (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[400px]">
                        <CategoryEditFormClient
                            eventId={eventId}
                            eventDate={eventDate}
                            studentId={studentId}
                            category={activeTab}
                            initialData={activeCat?.data || {}}
                            isReadOnly={activeCat?.isReadOnly || !assignedCategoryIds.includes(activeTab)}
                            readOnlyReason={!assignedCategoryIds.includes(activeTab) ? "This medical section is not assigned to you." : ""}
                            userId={userId}
                            userName={userName}
                            userRole={userRole}
                            student={student}
                            isPOC={false}
                            isEmbedded={true}
                            requiredFields={formConfig?.[activeTab] || []}
                            schoolName={schoolName}
                            customCategoryBlock={(() => {
                                const customCategories = Array.isArray(formConfig?.customCategories) ? formConfig.customCategories : [];
                                return customCategories.find((c: any) => c.id === activeTab);
                            })()}
                        />
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200 flex flex-col items-center justify-center min-h-[400px]">
                        <Activity className="h-16 w-16 text-slate-200 mb-4" />
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest leading-none">Select a category</h3>
                        <p className="text-slate-400/60 font-bold mt-2">Choose a medical section from above to start recording or check history</p>
                    </div>
                )}
            </main>
        </div>
    );
}

function PastRecordsHistory({ history, currentEventId, studentName }: { 
    history: MedicalRecordHistory[], 
    currentEventId: string,
    studentName: string 
}) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-2 px-2">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Clinical History</h2>
                    <p className="text-sm text-slate-500 font-medium">All health camp records for {studentName}</p>
                </div>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 font-bold uppercase tracking-wider px-3 py-1">
                    {history.length} Records found
                </Badge>
            </div>

            <div className="space-y-4">
                {history.map((record, index) => {
                    const isCurrent = record.eventId === currentEventId;
                    const eventDate = new Date(record.event.eventDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    });
                    const data = (record.data as any) || {};

                    // Extract key findings
                    const findings = Object.entries(data)
                        .filter(([k, v]) => !k.startsWith('_') && v && typeof v === 'object' && (v as any).status_nor && (v as any).status_nor !== 'N')
                        .map(([k, v]) => ({
                            cat: k.replace(/_/g, ' ').toUpperCase(),
                            status: (v as any).status_nor,
                            remark: (v as any).remarks || (v as any).remarks_optical || (v as any).remarks_ent || ''
                        }));

                    return (
                        <div 
                            key={record.id} 
                            className={`group relative bg-white rounded-2xl border-2 transition-all p-5 shadow-sm hover:shadow-md
                                ${isCurrent ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 hover:border-slate-300'}
                            `}
                        >
                            {isCurrent && (
                                <div className="absolute -top-3 right-5 px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                    Current active Record
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-inner border
                                        ${isCurrent ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}
                                    `}>
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-base group-hover:text-emerald-700 transition-colors">
                                            {record.event.schoolDetails}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                                                <Clock className="h-3 w-3" /> {eventDate}
                                            </span>
                                            <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tighter
                                                ${record.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600'}
                                            `}>
                                                {record.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {findings.length > 0 ? (
                                        findings.map((f, i) => (
                                            <div key={i} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tight
                                                ${f.status === 'R' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}
                                            `}>
                                                <AlertCircle className="h-3 w-3" />
                                                <span>{f.cat.split(' ')[0]}: {f.status}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-400 italic">No major clinical findings flagged</span>
                                    )}
                                </div>
                            </div>

                            {/* Detailed findings summary */}
                            {findings.some(f => f.remark) && (
                                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {findings.filter(f => f.remark).map((f, i) => (
                                        <div key={i} className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">{f.cat}</p>
                                            <p className="text-xs text-slate-700 font-medium line-clamp-2 italic">"{f.remark}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

