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
    isUpcoming = false,
    eventDate
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
    isUpcoming?: boolean;
    eventDate?: string | Date;
}) {
    const [activeTab, setActiveTab] = useState<string>(categoriesStatus[0]?.id || "");
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
                                </h1>
                                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider flex flex-wrap gap-x-4">
                                    <span>Class: <span className="text-slate-900">{student.classSec}</span></span>
                                    <span>Age: <span className="text-slate-900">{student.age}</span></span>
                                    <span>Gender: <span className="text-slate-900">{student.gender}</span></span>
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
                            const isActive = activeTab === cat.id;
                            const colors = getStatusColors(cat.status, isAssigned);

                            return (
                                <div
                                    key={cat.id}
                                    title={cat.title}
                                    onClick={() => setActiveTab(cat.id)}
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
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA - SHOWING THE ACTIVE FORM */}
            <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20">
                {activeTab ? (
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
                        <p className="text-slate-400/60 font-bold mt-2">Choose a medical section from above to start recording</p>
                    </div>
                )}
            </main>
        </div>
    );
}
