"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { sendRequestAcceptedEmail, sendRequestRejectedEmail, sendEventCanceledEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcryptjs from "bcryptjs";

// All form fields — every new event starts with all of them as compulsory
const DEFAULT_FORM_CONFIG = {
  ent: ["hearing", "earExam", "noseExam", "throatExam", "entRemarks"],
  communityMed: ["height", "weight", "bloodGroup", "generalAppearance", "majorIllness", "currentMedication", "doctorRemarks"],
  dental: ["oralHygiene", "gums", "cavities", "dentalFindings", "dentalRemarks"],
  optical: ["visionRight", "visionLeft", "colorVision", "opticalIssues", "opticalRemarks"],
  skin: ["skinCondition", "infections", "skinRemarks"]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Fetch pending requests
export async function getPendingRequests() {
  return await prisma.healthCampRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" }
  });
}

// Fetch all medical staff users
export async function getMedicalStaff() {
  return await prisma.user.findMany({
    where: {
      role: "MEDICAL_STAFF",
      isActive: true
    },
    select: { id: true, fullName: true, email: true },
    orderBy: { fullName: "asc" }
  });
}

// Reject Request
export async function rejectCampRequest(requestId: string, reason: string) {
  try {
    const request = await prisma.healthCampRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectionReason: reason
      }
    });

    // Send Rejection Email
    await sendRequestRejectedEmail(request.pocEmail, request.pocName, request.schoolName, reason);

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to reject request:", error);
    return { success: false, error: "Failed to update request" };
  }
}

// Accept Request & Create Event
export async function acceptCampRequest(
  requestId: string,
  staffIds: string[]
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: Only admins can accept camp requests");
    }
    // Resilient admin lookup (handles DB resets where UUID might change but email stays same)
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      console.error("Unauthorized admin attempt:", session.user.email);
      throw new Error(`Your session is invalid or you lack permissions. Please log out and back in.`);
    }

    const adminUserId = adminUser.id;

    // 1. Get request
    const request = await prisma.healthCampRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error("Request not found");
    }

    // Pre-hash password outside transaction for performance
    const pocPasswordHash = await bcryptjs.hash("School@123", 10);

    let newEventId = "";
    // 2. Create Event and Assign Staff in a single transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create the Event
      const newEvent = await tx.event.create({
        data: {
          schoolDetails: request.schoolName,
          eventDate: request.tentativeDate,
          pocName: request.pocName,
          pocEmail: request.pocEmail,
          pocPhone: request.pocPhone,
          status: "UPCOMING",
          createdBy: adminUserId,
          formConfig: { ...(DEFAULT_FORM_CONFIG as any) }
        } as any
      });
      newEventId = newEvent.id;

      // 2. Auto-Provision School POC Account
      let pocUser = await tx.user.findUnique({
        where: { email: request.pocEmail }
      });

      if (!pocUser) {
        pocUser = await tx.user.create({
          data: {
            email: request.pocEmail,
            fullName: request.pocName,
            passwordHash: pocPasswordHash,
            role: "SCHOOL_POC" as any
          }
        });
      }

      // 3. Assign Staff (including POC) to the Event
      const finalStaffIds = Array.from(new Set([...(staffIds || []), pocUser.id]));
      await tx.eventStaff.createMany({
        data: finalStaffIds.map(userId => ({
          eventId: newEventId,
          userId: userId
        }))
      });

      // 4. Mark Request as Accepted
      await tx.healthCampRequest.update({
        where: { id: requestId },
        data: { status: "ACCEPTED" }
      });
    });

    // Send Acceptance Email (safely bound to prevent UI silent-failures if SMTP is down)
    try {
      await sendRequestAcceptedEmail(request.pocEmail, request.pocName, request.schoolName, request.tentativeDate);
    } catch (e) {
      console.error("Non-fatal: Email dispatch failed after acceptance.", e);
    }

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("acceptCampRequest failed:", error);
    return { success: false, error: error.message || "Failed to accept request" };
  }
}

// Manually Create Event
export async function createEvent(
  data: {
    schoolDetails: string,
    eventDate: Date,
    pocName: string,
    pocEmail: string,
    pocPhone: string,
    staffIds: string[]
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: Only admins can manually create events");
    }
    // Resilient admin lookup (handles DB resets where UUID might change but email stays same)
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email as string }
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      console.error("Unauthorized admin attempt:", session.user.email);
      throw new Error(`Your session is invalid or you lack permissions. Please log out and back in.`);
    }

    const adminUserId = adminUser.id;

    // Pre-hash password outside transaction
    const pocPasswordHash = await bcryptjs.hash("School@123", 10);

    await prisma.$transaction(async (tx) => {
      const newEvent = await tx.event.create({
        data: {
          schoolDetails: data.schoolDetails,
          eventDate: data.eventDate,
          pocName: data.pocName,
          pocEmail: data.pocEmail,
          pocPhone: data.pocPhone,
          status: "UPCOMING",
          createdBy: adminUserId,
          formConfig: { ...DEFAULT_FORM_CONFIG }
        } as any
      });

      // Auto-Provision School POC Account
      let pocUser = await tx.user.findUnique({
        where: { email: data.pocEmail }
      });

      if (!pocUser) {
        pocUser = await tx.user.create({
          data: {
            email: data.pocEmail,
            fullName: data.pocName,
            passwordHash: pocPasswordHash,
            role: "SCHOOL_POC" as any
          }
        });
      }

      if (data.staffIds && data.staffIds.length > 0) {
        await tx.eventStaff.createMany({
          data: data.staffIds.map(userId => ({
            eventId: newEvent.id,
            userId: userId
          }))
        });
      }
    });

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("createEvent failed:", error);
    return { success: false, error: error.message || "Failed to manually create event" };
  }
}

// Add new Medical Staff user
export async function addMedicalStaff(
  fullName: string,
  email: string,
  rawPassword: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: Only admins can add medical staff");
    }

    // 1. Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "Email already registered" };
    }

    // 2. Hash password and insert
    const passwordHash = await bcryptjs.hash(rawPassword, 10);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: "MEDICAL_STAFF"
      }
    });

    revalidatePath("/admin/dashboard");
    return { success: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Failed to add staff:", error);
    return { success: false, error: "Internal server error" };
  }
}

// Assign Staff to Existing Event
export async function assignStaffToEvent(eventId: string, staffIds: string[]) {
  try {
    if (staffIds.length === 0) return { success: true };

    // Check which ones are already assigned to avoid unique constraint errors
    const existing = await prisma.eventStaff.findMany({
      where: {
        eventId,
        userId: { in: staffIds }
      }
    });

    const existingIds = new Set(existing.map(e => e.userId));
    const newStaffIds = staffIds.filter(id => !existingIds.has(id));

    if (newStaffIds.length > 0) {
      await prisma.eventStaff.createMany({
        data: newStaffIds.map(userId => ({
          eventId,
          userId
        }))
      });
    }

    revalidatePath(`/admin/events/${eventId}`);
    return { success: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Failed to assign staff:", error);
    return { success: false, error: "Failed to assign staff to the event" };
  }
}

export async function removeStaffFromEvent(eventId: string, userId: string) {
  try {
    await prisma.eventStaff.deleteMany({
      where: {
        eventId,
        userId
      }
    });
    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove staff from event:", error);
    return { success: false, error: "Failed to remove staff from event" };
  }
}

// Check if staff has upcoming events
export async function checkStaffDeletion(userId: string) {
  try {
    const upcomingAssignments = await prisma.eventStaff.findMany({
      where: {
        userId,
        event: {
          status: {
            in: ["UPCOMING", "ACTIVE"]
          }
        }
      },
      include: {
        event: {
          select: { schoolDetails: true, eventDate: true }
        }
      }
    });

    return {
      success: true,
      hasUpcoming: upcomingAssignments.length > 0,
      upcomingEvents: upcomingAssignments.map(a => a.event),
      upcomingCount: upcomingAssignments.length
    };
  } catch (error) {
    console.error("Failed checking staff deletion:", error);
    return { success: false, error: "Failed to verify staff status." };
  }
}

// Soft Delete Medical Staff and unassign from upcoming events
export async function deleteMedicalStaff(userId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Remove from all UPCOMING or ACTIVE events
      const upcomingEvents = await tx.event.findMany({
        where: {
          status: { in: ["UPCOMING", "ACTIVE"] },
          eventStaff: { some: { userId } }
        },
        select: { id: true }
      });

      const upcomingEventIds = upcomingEvents.map(e => e.id);

      if (upcomingEventIds.length > 0) {
        await tx.eventStaff.deleteMany({
          where: {
            userId,
            eventId: { in: upcomingEventIds }
          }
        });
      }

      // 2. Soft delete the user
      await tx.user.update({
        where: { id: userId },
        data: { isActive: false }
      });
    });

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to soft-delete staff:", error);
    return { success: false, error: "Failed to delete user." };
  }
}

export async function setEventHead(eventId: string, userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) return { success: false, error: "Event not found" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentConfig = (event.formConfig as any) || {};
    currentConfig.eventHeadId = userId;

    await prisma.event.update({
      where: { id: eventId },
      data: { formConfig: currentConfig }
    });

    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/staff/workspace/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Database error" };
  }
}

export async function cancelEvent(eventId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) return { success: false, error: "Event not found" };
    if (event.status !== "UPCOMING") {
      return { success: false, error: "Only upcoming events can be cancelled" };
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { status: "CANCELLED" as any }
    });

    // Send Event Cancelled Email
    try {
      if (event.pocEmail && event.pocName && event.schoolDetails) {
        await sendEventCanceledEmail(event.pocEmail, event.pocName, event.schoolDetails, event.eventDate);
      }
    } catch (e) {
      console.error("Non-fatal: Email dispatch failed after event cancellation.", e);
    }

    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel event:", error);
    return { success: false, error: "Database error" };
  }
}

export async function rescheduleEvent(eventId: string, newDate: Date) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) return { success: false, error: "Event not found" };
    if (event.status !== "UPCOMING") {
      return { success: false, error: "Only upcoming events can be rescheduled" };
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { eventDate: newDate }
    });

    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to reschedule event:", error);
    return { success: false, error: "Database error" };
  }
}

export async function setSchoolContact(eventId: string, userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) return { success: false, error: "Event not found" };

    const contactUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!contactUser) return { success: false, error: "User not found" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentConfig = (event.formConfig as any) || {};
    currentConfig.schoolContactId = userId;
    currentConfig.pocEmail = contactUser.email;

    await prisma.event.update({
      where: { id: eventId },
      data: { formConfig: currentConfig }
    });

    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/staff/workspace/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Database error" };
  }
}