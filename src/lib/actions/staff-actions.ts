"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcryptjs from "bcryptjs";
import { generateStudentUID, parseDOB } from "../utils/student-utils";

export async function addStudentToEvent(data: {
  eventId: string;
  firstName: string;
  lastName: string;
  classSec: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  dob?: string;
  height?: string;
  weight?: string;
  bloodGroup?: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      select: { eventDate: true, pocEmail: true, schoolDetails: true }
    });

    if (!event) throw new Error("Event not found");

    const isAdmin = session.user.role === "ADMIN";
    const isAssigned = await prisma.eventStaff.findFirst({
      where: { eventId: data.eventId, userId: session.user.id }
    });
    const isPOC = event.pocEmail?.toLowerCase() === session.user.email?.toLowerCase();

    if (!isAdmin && !isAssigned && !isPOC) {
      throw new Error("Unauthorized: You are not assigned to this event");
    }

    // Deadline Check for POC
    if (isPOC && !isAdmin) {
      const eventDate = new Date(event.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (today > eventDate) {
        throw new Error("Deadline passed: School representatives can only add students until the event ends.");
      }
    }

    const studentDob = data.dob ? parseDOB(data.dob) : null;
    
    // Find or Create Student using transaction to ensure UID sequentiality
    const student = await prisma.$transaction(async (tx) => {
      let existingStudent = await tx.student.findFirst({
        where: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: studentDob,
          schoolName: event.schoolDetails,
        }
      });

      if (existingStudent) return existingStudent;

      const studentUID = await generateStudentUID(studentDob || new Date(), tx);
      return await tx.student.create({
        data: {
          studentUID,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: studentDob,
          gender: data.gender,
          schoolName: event.schoolDetails,
        }
      });
    });

    // Create a medical record for this specific event
    await prisma.medicalRecord.create({
      data: {
        studentId: student.id,
        eventId: data.eventId,
        status: "PENDING",
        data: {
          general_examination_merged: {
            dob: data.dob || "",
            age: data.age?.toString() || "",
            sex: data.gender === "MALE" ? "Male" : data.gender === "FEMALE" ? "Female" : "Other",
            classSection: data.classSec || "",
            height: data.height || "",
            weight: data.weight || "",
            bloodGroup: data.bloodGroup || "",
            _lastUpdated: new Date().toISOString(),
            _managedBy: "System (Direct Add)"
          }
        }
      }
    });

    revalidatePath(`/staff/workspace/${data.eventId}`);
    revalidatePath(`/admin/events/${data.eventId}`);

    return { success: true, studentId: student.id };
  } catch (error: any) {
    console.error("Failed to add student:", error);
    return { success: false, error: "Failed to add student. Ensure data is valid." };
  }
}

export async function bulkAddStudentsToEvent(data: {
  eventId: string;
  students: {
    firstName: string;
    lastName: string;
    classSec: string;
    age: number;
    gender: "MALE" | "FEMALE" | "OTHER";
    dob?: string;
    height?: string;
    weight?: string;
    bloodGroup?: string;
  }[];
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { eventId, students } = data;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { eventDate: true, pocEmail: true, schoolDetails: true }
    });

    if (!event) throw new Error("Event not found");

    const isAdmin = session.user.role === "ADMIN";
    const isAssigned = await prisma.eventStaff.findFirst({
      where: { eventId, userId: session.user.id }
    });
    const isPOC = event.pocEmail?.toLowerCase() === session.user.email?.toLowerCase();

    if (!isAdmin && !isAssigned && !isPOC) {
      throw new Error("Unauthorized: You are not assigned to this event");
    }

    // Deadline Check for POC
    if (isPOC && !isAdmin) {
      const eventDate = new Date(event.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (today > eventDate) {
        throw new Error("Deadline passed: School representatives can only add students until the event ends.");
      }
    }

    // Use a transaction for bulk operation
    await prisma.$transaction(async (tx) => {
      for (const s of students) {
        const studentDob = s.dob ? parseDOB(s.dob) : null;
        
        // Match existing student
        let student = await tx.student.findFirst({
          where: {
            firstName: s.firstName,
            lastName: s.lastName,
            dateOfBirth: studentDob,
            schoolName: event.schoolDetails,
          }
        });

        if (!student) {
          const studentUID = await generateStudentUID(studentDob || new Date(), tx);
          student = await tx.student.create({
            data: {
              studentUID,
              firstName: s.firstName,
              lastName: s.lastName,
              dateOfBirth: studentDob,
              gender: s.gender,
              schoolName: event.schoolDetails,
            }
          });
        }

        // Create Medical Record (Skip if already exists for this event)
        const existingRecord = await tx.medicalRecord.findUnique({
          where: {
            studentId_eventId: {
              studentId: student.id,
              eventId: eventId
            }
          }
        });

        if (!existingRecord) {
          await tx.medicalRecord.create({
            data: {
              studentId: student.id,
              eventId: eventId,
              status: "PENDING",
              data: {
                general_examination_merged: {
                  dob: s.dob || "",
                  age: s.age?.toString() || "",
                  sex: s.gender === "MALE" ? "Male" : s.gender === "FEMALE" ? "Female" : "Other",
                  classSection: s.classSec || "",
                  height: s.height || "",
                  weight: s.weight || "",
                  bloodGroup: s.bloodGroup || "",
                  _lastUpdated: new Date().toISOString(),
                  _managedBy: "System (Bulk Import)"
                }
              }
            }
          });
        }
      }
    }, {
      timeout: 30000 // Increase timeout for bulk operations
    });

    revalidatePath(`/staff/workspace/${eventId}`);
    revalidatePath(`/admin/events/${eventId}`);

    return { success: true, count: students.length };
  } catch (error: any) {
    console.error("Failed to bulk add students:", error);
    return { success: false, error: "Failed to bulk add students. Ensure data is valid." };
  }
}

export async function updateStaffPassword(oldPassword: string, newPassword: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = (session.user as any).id;

    // 1. Get user from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // 2. Verify old password
    const isPasswordValid = await bcryptjs.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: "Incorrect current password" };
    }

    // 3. Hash new password
    const passwordHash = await bcryptjs.hash(newPassword, 10);

    // 4. Update database
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    revalidatePath("/staff/dashboard");
    revalidatePath("/poc/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to update password:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function assignSections(eventId: string, assignments: Record<string, string[]>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { formConfig: true }
    });

    if (!event) return { success: false, error: "Event not found" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentConfig = (event.formConfig as any) || {};

    // Only the Admin or the designated Event Head can manage section assignments
    const isAdmin = session.user.role === "ADMIN";
    const isEventHead = currentConfig.eventHeadId === session.user.id;
    if (!isAdmin && !isEventHead) {
      return { success: false, error: "Unauthorized section assignment attempt" };
    }

    currentConfig.sectionAssignments = assignments;

    await prisma.event.update({
      where: { id: eventId },
      data: { formConfig: currentConfig }
    });

    revalidatePath(`/staff/workspace/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to assign sections:", error);
    return { success: false, error: "Internal server error saving section assignments" };
  }
}

