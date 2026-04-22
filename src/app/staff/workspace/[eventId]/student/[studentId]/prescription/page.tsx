import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { PrintablePrescription } from "./PrintablePrescription";

export default async function PrescriptionPage({ params }: { params: Promise<{ eventId: string, studentId: string }> }) {
  const { eventId, studentId } = await params;

  const event = await (prisma.event as any).findUnique({
    where: { id: eventId },
  });
  if (!event) return notFound();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      medicalRecords: {
        where: { eventId: eventId }
      },
    }
  });

  if (!student) return notFound();

  // Create a combined object that matches what PrintablePrescription expects if necessary,
  // or just pass the first record as 'medicalRecord' if it expects that.
  const studentWithRecord = {
    ...student,
    medicalRecord: student.medicalRecords[0] || null
  };

  return <PrintablePrescription student={studentWithRecord} event={event} />;
}
