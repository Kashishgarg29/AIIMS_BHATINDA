"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintablePrescription({ student, event }: { student: any, event: any }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Inject print styles to hide everything except the print container
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        #print-container, #print-container * { visibility: visible !important; }
        #print-container { 
          position: absolute; 
          left: 0; 
          top: 0; 
          width: 100%; 
          margin: 0; 
          padding: 0; 
          background: white;
        }
        @page { size: A4; margin: 20mm; }
        
        /* Hide UI buttons during print */
        .no-print { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    
    setIsReady(true);
    
    // Auto trigger print after a brief delay for rendering
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => {
      document.head.removeChild(style);
      clearTimeout(timer);
    };
  }, []);

  // Compute stats
  const recordData = (student?.medicalRecord?.data as Record<string, any>) || {};
  const genData = recordData.general_examination_merged || {};
  const height = genData.height || "NA";
  const weight = genData.weight || "NA";

  // Extract prescriptions
  const prescriptions = Object.entries(recordData)
    .filter(([key, val]) => val?.prescription)
    .map(([key, val]) => ({
      category: key.replace(/_/g, " ").replace(/([A-Z])/g, ' $1').trim().toUpperCase(),
      text: val.prescription,
      doctor: val._managedBy
    }));

  if (!isReady) return null;

  return (
    <div id="print-container" className="fixed inset-0 z-[200] bg-white overflow-auto flex justify-center pb-24">
      {/* UI Controls (Hidden in Print) */}
      <div className="fixed top-4 right-4 flex gap-3 no-print z-10">
        <Button 
          variant="outline" 
          onClick={() => window.close()}
          className="bg-white hover:bg-slate-50 border-slate-300 shadow-sm text-slate-700 font-bold"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Close Tab
        </Button>
        <Button 
          onClick={() => window.print()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
        >
          <Printer className="w-4 h-4 mr-2" /> Print Again
        </Button>
      </div>

      {/* A4 Paper Container for Viewport */}
      <div className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-8 sm:p-12 sm:border sm:border-slate-200 sm:shadow-lg sm:my-8 print:border-none print:shadow-none print:m-0 print:p-0 relative flex flex-col">
        
        {/* Header Section */}
        <div className="text-center border-b-2 border-black pb-6 mb-6">
          <h1 className="text-2xl font-black uppercase tracking-widest text-black">
            AIIMS Bhatinda School Health Camp
          </h1>
          <p className="font-bold text-gray-700 mt-1 uppercase tracking-wider text-sm">
            Clinical Prescription Record
          </p>
        </div>

        {/* Patient Vitals Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 border border-gray-200 rounded-lg print:bg-white print:border-black print:rounded-none">
          <div>
            <span className="block text-[10px] uppercase font-black tracking-widest text-gray-500 print:text-black">Patient Name</span>
            <span className="font-bold text-base uppercase whitespace-nowrap overflow-hidden text-ellipsis">{student.firstName} {student.lastName}</span>
          </div>
          <div>
             <span className="block text-[10px] uppercase font-black tracking-widest text-gray-500 print:text-black">Age & Gender</span>
             <span className="font-bold text-base uppercase">{student.age} Y / {student.gender?.[0] || 'U'}</span>
          </div>
          <div>
             <span className="block text-[10px] uppercase font-black tracking-widest text-gray-500 print:text-black">Class / Section</span>
             <span className="font-bold text-base uppercase">{student.classSec}</span>
          </div>
          <div className="col-span-2 md:col-span-1 grid grid-cols-2 gap-2">
            <div>
               <span className="block text-[10px] uppercase font-black tracking-widest text-gray-500 print:text-black">Height</span>
               <span className="font-bold text-base uppercase">{height} {height !== "NA" && "CM"}</span>
            </div>
            <div>
               <span className="block text-[10px] uppercase font-black tracking-widest text-gray-500 print:text-black">Weight</span>
               <span className="font-bold text-base uppercase">{weight} {weight !== "NA" && "KG"}</span>
            </div>
          </div>
        </div>

        {/* Prescriptions Section */}
        <div className="flex-1">
          <h2 className="text-lg font-black border-b border-gray-300 pb-2 mb-4 uppercase tracking-wider flex items-center pr-2">
            Clinical Prescriptions
          </h2>

          {prescriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-bold italic">
              No prescriptions recorded for this patient.
            </div>
          ) : (
            <div className="space-y-6">
              {prescriptions.map((p, idx) => (
                <div key={idx} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-2 border-b border-dotted border-gray-300 pb-1">
                     <h3 className="font-black text-sm uppercase tracking-wide">{p.category}</h3>
                     <span className="text-[10px] font-bold text-gray-500 print:text-gray-800 uppercase">Consultant: {p.doctor || "Medical Officer"}</span>
                  </div>
                  <div className="text-sm font-medium whitespace-pre-wrap leading-relaxed py-2 pl-2 border-l-2 border-gray-200 print:border-black">
                     {p.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stamp Area */}
        <div className="mt-24 pt-8 border-t border-gray-300 flex justify-end break-inside-avoid">
           <div className="w-64 text-center">
             <div className="h-24 border-2 border-dashed border-gray-300 rounded mb-2 flex items-center justify-center print:border-gray-400">
               <span className="text-gray-300 font-black uppercase text-xs tracking-widest print:text-gray-400">Stamp Area</span>
             </div>
             <p className="text-xs font-black uppercase tracking-wider">Medical Officer Signature / Stamp</p>
           </div>
        </div>

      </div>
    </div>
  );
}
