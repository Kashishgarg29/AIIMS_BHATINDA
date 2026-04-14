"use client";

import { useEffect, useState } from "react";
import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrescriptionPrintOverlay({ 
  student, 
  eventDate, 
  onClose 
}: { 
  student: any, 
  eventDate?: Date | string, 
  onClose: () => void 
}) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Prevent background scrolling while modal is open
    document.body.style.overflow = "hidden";
    setIsReady(true);
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handlePrint = () => {
    const printContent = document.getElementById('print-container');
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Get Tailwind CSS from main document
    const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                           .map(el => el.outerHTML)
                           .join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          ${styleTags}
          <style>
             @page { size: A4; margin: 0; }
             body { margin: 10mm 15mm; padding: 0; background: white; -webkit-print-color-adjust: exact; font-family: sans-serif; }
             .no-print { display: none !important; }
             #print-wrapper { width: 100%; max-width: 210mm; margin: 0 auto; color: black; padding-top: 10mm; }
             
             /* Remove styling specifically for the overlay mode so it looks like raw paper */
             #print-wrapper > div { 
               border: none !important; 
               box-shadow: none !important; 
             }
          </style>
        </head>
        <body>
          <div id="print-wrapper">
             ${printContent.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Small timeout to allow css to apply inside iframe
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Cleanup after print dialog opens 
      setTimeout(() => {
         if (document.body.contains(iframe)) {
             document.body.removeChild(iframe);
         }
      }, 2000);
    }, 500);
  };

  // Compute stats
  const recordData = (student?.medicalRecord?.data as Record<string, any>) || {};
  const genData = recordData.general_examination_merged || {};
  const height = genData.height || "NA";
  const weight = genData.weight || "NA";

  // Format Date
  let dateStr = "NA";
  if (eventDate) {
    const d = new Date(eventDate);
    dateStr = d.toLocaleDateString("en-IN", {
      day: "2-digit", month: "long", year: "numeric"
    });
  }

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
    <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex justify-center items-start overflow-y-auto w-full pt-10 pb-24 no-print sm:px-4">
      {/* Container that IS the printable area */}
      <div id="print-container" className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black p-8 sm:p-12 sm:border sm:border-slate-300 sm:shadow-2xl relative flex flex-col mx-auto shrink-0 print:border-none print:shadow-none print:m-0 print:p-0">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="absolute top-4 right-4 flex gap-3 no-print z-10">
          <Button 
            onClick={handlePrint}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm h-8 px-3 rounded-md"
          >
            <Printer className="w-4 h-4 mr-2" /> Print PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-white hover:bg-red-50 hover:text-red-600 border-slate-300 shadow-sm text-slate-700 font-bold h-8 w-8 p-0 rounded-md"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Header Section */}
        <div className="text-center border-b-2 border-black pb-4 mb-5 pt-8 print:pt-0">
          <h1 className="text-2xl font-black uppercase tracking-widest text-black">
            AIIMS Bhatinda School Health Camp
          </h1>
        </div>

        {/* Patient Vitals Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 bg-gray-50 p-4 border border-gray-200 rounded-lg print:bg-white print:border-black print:rounded-none">
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
          <div>
             <span className="block text-[10px] uppercase font-black tracking-widest text-gray-500 print:text-black">Date</span>
             <span className="font-bold text-base uppercase">{dateStr}</span>
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
          {prescriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-bold italic">
              No prescriptions recorded for this patient.
            </div>
          ) : (
             <div className="space-y-6">
              {prescriptions.map((p, idx) => (
                <div key={idx} className="break-inside-avoid shadow-sm p-4 rounded-lg bg-gray-50 border border-gray-100 print:bg-white print:border-none print:p-0 print:shadow-none">
                  <div className="flex justify-between items-baseline mb-2 border-b border-dotted border-gray-300 pb-1">
                     <h3 className="font-black text-sm uppercase tracking-wide print:text-base">{p.category}</h3>
                     <span className="text-[10px] font-bold text-gray-500 print:text-gray-800 uppercase">Consultant: {p.doctor || "Medical Officer"}</span>
                  </div>
                  <div className="text-base font-medium whitespace-pre-wrap leading-relaxed py-2">
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
