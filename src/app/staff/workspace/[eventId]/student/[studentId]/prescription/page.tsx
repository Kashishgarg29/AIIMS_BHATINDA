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
      medicalRecord: true,
    }
  });

  if (!student) return notFound();

  return <PrintablePrescription student={student} event={event} />;
}
