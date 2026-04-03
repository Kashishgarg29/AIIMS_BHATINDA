"use server";

import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendRequestReceivedEmail } from "@/lib/email";

// 1. Action to Submit a New Health Camp Request (Public facing)
export async function submitHealthCampRequest(formData: FormData) {
  try {
    const schoolName = formData.get("schoolName") as string;
    const date = formData.get("date") as string;
    const students = formData.get("students") as string;
    const pocName = formData.get("pocName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    await prisma.healthCampRequest.create({
      data: {
        schoolName,
        pocName,
        pocEmail: email,
        pocPhone: phone,
        tentativeDate: new Date(date),
        tentativeStudents: parseInt(students, 10),
      },
    });

    // Send Confirmation Email
    await sendRequestReceivedEmail(email, pocName, schoolName, new Date(date));

    return { success: true, message: "Request submitted successfully!" };
  } catch (error) {
    console.error("Failed to submit request:", error);
    return { success: false, message: "Server error submitting request." };
  }
}

// 2. Action to Upsert Medical Record form Data (Staff facing)
// We merge the incoming payload deeply into the existing `data` JSONB.
export async function saveMedicalCategory(
  studentId: string,
  eventId: string,
  categoryName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categoryData: Record<string, any>
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    const userId = session.user.id;

    // 1. Fetch event and record
    const event = await (prisma.event as any).findUnique({
      where: { id: eventId }
    });

    if (!event) return { success: false, error: "Event not found." };

    let record = await prisma.medicalRecord.findUnique({
      where: { studentId },
    });

    if (!record) {
      record = await prisma.medicalRecord.create({
        data: {
          studentId,
          eventId,
          data: {},
        },
      });
    }

    // 2. Authorization Check
    const isAdmin = session.user.role === "ADMIN";
    const isPOC = event.pocEmail?.toLowerCase() === session.user.email?.toLowerCase();
    const isAssigned = await prisma.eventStaff.findFirst({
      where: { eventId, userId: userId }
    });

    if (!isAdmin && !isAssigned && !isPOC) {
      return { success: false, error: "Unauthorized access to this event." };
    }

    // POC specific restrictions
    if (isPOC && !isAdmin) {
      const validPOC_Categories = ["general_examination_merged", "vaccination_details", "symptoms"];
      if (!validPOC_Categories.includes(categoryName)) {
        return { success: false, error: "Unauthorized: School representatives can only update Demographics, Immunization, and Symptoms details." };
      }

      const eventDate = new Date(event.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // POC can edit while it's upcoming (today < eventDate) or active (today == eventDate)
      if (today > eventDate) {
        return { success: false, error: "Deadline passed: School representatives can only update details until the event ends."};
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formConfig = ((event as any)?.formConfig as Record<string, string[]>) || {};

    // 2. Merge JSON payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingData = (record.data as Record<string, any>) || {};
    const updatedData = {
      ...existingData,
      [categoryName]: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...((existingData[categoryName] as Record<string, any>) || {}),
        ...categoryData,
        _managedBy: session.user.name || session.user.email || userId,
        _lastUpdated: new Date().toISOString()
      },
    };

    // 3. Determine overall status by checking all predefined + custom categories
    const baseCategories = ["demographics", "ent", "communityMed", "dental", "optical", "skin"];
    const customCategoriesObj = formConfig.customCategories || [];
    const customCategoryIds = Array.isArray(customCategoriesObj) ? customCategoriesObj.map((c: any) => c.id) : [];
    const ALL_CATEGORIES = [...baseCategories, ...customCategoryIds];

    let completedCount = 0;

    ALL_CATEGORIES.forEach(catId => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataForCat = (updatedData as any)[catId];
      if (dataForCat) {
        const requiredFields = formConfig[catId] || [];
        const hasAllRequired = requiredFields.every(fieldId => {
          const val = dataForCat[fieldId];
          return val !== undefined && val !== null && val !== "" && val !== false;
        });

        // A category is COMPLETED if all required fields are filled AND (it's demographics OR has status_nor)
        const isAssessmentComplete = catId === "demographics" || !!dataForCat.status_nor;

        if ((requiredFields.length === 0 || hasAllRequired) && isAssessmentComplete) {
          completedCount++;
        }
      }
    });

    const overallStatus = completedCount === ALL_CATEGORIES.length ? "COMPLETED" : "IN_PROGRESS";

    const transactionOps: any[] = [
      prisma.medicalRecord.update({
        where: { id: record.id },
        data: {
          data: updatedData,
          status: overallStatus,
        },
      }),
      // Insert an Audit Log exactly mapped to this category change
      prisma.categoryAuditLog.create({
        data: {
          medicalRecordId: record.id,
          userId: userId, 
          categoryName: categoryName,
          action: "SAVED"
        }
      })
    ];

    // If we're updating demographics, sync name changes back to the Student record
    if (categoryName === "general_examination_merged") {
       const { firstName, lastName } = categoryData;
       if (firstName || lastName) {
         const studentUpdates: any = {};
         if (firstName) studentUpdates.firstName = firstName;
         if (lastName) studentUpdates.lastName = lastName;
         transactionOps.push(prisma.student.update({
           where: { id: studentId },
           data: studentUpdates
         }));
       }
    }

    // 4. Update the database within a transaction
    await prisma.$transaction(transactionOps);

    // Revalidate the workspace pages to show the new data instantly
    revalidatePath(`/staff/workspace/${eventId}`);
    revalidatePath(`/staff/workspace/${eventId}/student/${studentId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to save category:", error);
    return { success: false, error: "Failed to save data to database." };
  }
}

// 3. Action to Save Event Form Configuration (Admin facing)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveEventFormConfig(eventId: string, config: any) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    await prisma.event.update({
      where: { id: eventId },
      data: {
        formConfig: config
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
    });

    revalidatePath(`/admin/events/${eventId}`);
    revalidatePath(`/staff/workspace/${eventId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to save form config:", error);
    return { success: false, error: "Database error." };
  }
}