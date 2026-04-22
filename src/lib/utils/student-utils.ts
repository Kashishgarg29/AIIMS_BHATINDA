import { prisma } from "@/lib/db/prisma";
import { format } from "date-fns";

/**
 * Generates a unique Student UID in the format DDMMYYYY-XXX
 * XXX is a sequential number unique per date of birth.
 */
export async function generateStudentUID(dateOfBirth: Date, tx?: any): Promise<string> {
  const dobStr = format(dateOfBirth, "ddMMyyyy");
  const client = tx || prisma;
  
  // Find the highest sequential number for students born on this day
  const studentsWithSameDob = await client.student.count({
    where: {
      dateOfBirth: {
        gte: new Date(new Date(dateOfBirth).setHours(0, 0, 0, 0)),
        lte: new Date(new Date(dateOfBirth).setHours(23, 59, 59, 999)),
      },
    }
  });

  const sequentialNumber = (studentsWithSameDob + 1).toString().padStart(3, "0");
  return `${dobStr}-${sequentialNumber}`;
}

/**
 * Helper to parse DOB strings from various formats to Date objects
 */
export function parseDOB(dobString: string): Date | null {
  if (!dobString) return null;
  const date = new Date(dobString);
  if (isNaN(date.getTime())) return null;
  // Normalize to midnight to ensure consistent matching
  date.setHours(0, 0, 0, 0);
  return date;
}
