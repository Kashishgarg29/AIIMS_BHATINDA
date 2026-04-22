"use server";

import { prisma } from "@/lib/db/prisma";
import { generateStudentUID, parseDOB } from "../utils/student-utils";

/**
 * Migration script to populate studentUID, dateOfBirth, and schoolName
 * for students created before the refactor.
 */
export async function migrateExistingStudents() {
  try {
    console.log("Starting student migration...");
    
    // We fetch students and their medical records/events.
    // Note: Since we removed eventId from the Student model in schema.prisma, 
    // we must rely on the MedicalRecord link to find the original event context.
    const students = await prisma.student.findMany({
      include: {
        medicalRecords: {
          include: {
            event: true
          }
        }
      }
    });

    let migratedCount = 0;
    let skippedCount = 0;

    for (const student of students) {
      // Skip if already migrated
      if (student.studentUID && student.dateOfBirth && student.schoolName) {
        skippedCount++;
        continue;
      }

      // Try to find original event and DOB from the first available medical record
      const primaryRecord = student.medicalRecords[0];
      if (!primaryRecord) {
        console.warn(`Student ${student.firstName} ${student.lastName} (${student.id}) has no medical records. Skipping.`);
        skippedCount++;
        continue;
      }

      const event = primaryRecord.event;
      const recordData = (primaryRecord.data as any) || {};
      const dobStr = recordData.general_examination_merged?.dob || "";
      const dateOfBirth = parseDOB(dobStr) || null;
      const schoolName = event.schoolDetails || "Unknown School";

      // If no DOB found, we might need a fallback or skip
      if (!dateOfBirth) {
        console.warn(`Could not extract DOB for student ${student.id}. Using default.`);
      }

      const studentUID = await generateStudentUID(dateOfBirth || new Date());

      await prisma.student.update({
        where: { id: student.id },
        data: {
          studentUID,
          dateOfBirth,
          schoolName,
        }
      });

      migratedCount++;
    }

    console.log(`Migration complete. Migrated: ${migratedCount}, Skipped/Already Migrated: ${skippedCount}`);
    return { success: true, migratedCount, skippedCount };
  } catch (error) {
    console.error("Migration failed:", error);
    return { success: false, error: String(error) };
  }
}
