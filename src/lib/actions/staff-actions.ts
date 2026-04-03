"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcryptjs from "bcryptjs";

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

    const event = await (prisma.event as any).findUnique({
      where: { id: data.eventId },
      select: { eventDate: true, pocEmail: true }
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

    const student = await prisma.student.create({
      data: {
        eventId: data.eventId,
        firstName: data.firstName,
        lastName: data.lastName,
        classSec: data.classSec,
        age: data.age,
        gender: data.gender,
      }
    });

    // Also initialize a medical record with demographic details
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
            _managedBy: "System (Initial Import)"
          }
        }
      }
    });

    revalidatePath(`/staff/workspace/${data.eventId}`);
    revalidatePath(`/admin/events/${data.eventId}`);

    return { success: true, studentId: student.id };
  } catch (error: any) {
    console.error("Failed to add student:", error);
    return { success: false, error: "Failed to add student. They may already exist." };
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
    const event = await (prisma.event as any).findUnique({
      where: { id: eventId },
      select: { eventDate: true, pocEmail: true }
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


    // Use a transaction to ensure all or nothing
    await prisma.$transaction(async (tx) => {
      // 1. Create all students and get their IDs back
      const createdStudents = await Promise.all(
        students.map(s => tx.student.create({
          data: {
            eventId,
            firstName: s.firstName,
            lastName: s.lastName,
            classSec: s.classSec,
            age: s.age,
            gender: s.gender,
          }
        }))
      );

      // 2. Create the associated medical records with demographic info
      const medicalRecordsData = createdStudents.map((student, index) => {
        const s = students[index];
        return {
          studentId: student.id,
          eventId,
          status: "PENDING" as const,
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
        };
      });

      await tx.medicalRecord.createMany({
        data: medicalRecordsData
      });
    });

    revalidatePath(`/staff/workspace/${eventId}`);
    revalidatePath(`/admin/events/${eventId}`);

    return { success: true, count: students.length };
  } catch (error: any) {
    console.error("Failed to bulk add students:", error);
    return { success: false, error: "Failed to bulk add students. Check for duplicates or invalid data." };
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

